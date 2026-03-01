import * as vscode from "vscode";
import { SidebarProvider } from "./sidebar/SidebarProvider";
import { DiagnosticsManager } from "./diagnostics/DiagnosticsManager";
import { detectClaims } from "./analysis/ClaimDetector";
import { ResearchCodeActionProvider } from "./codeActions/ResearchCodeActionProvider";

const ASSISTANT_TRIGGER = /^@assistant\s+(.+\?)\s*$/i;
let lastHandledSignature: string | null = null;
let debounceTimer: NodeJS.Timeout | null = null;

class CiteCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (
        diagnostic.source === "Research Assistant" &&
        diagnostic.message.toLowerCase().includes("cite")
      ) {
        const action = new vscode.CodeAction(
          "Add \\cite{TODO}",
          vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const edit = new vscode.WorkspaceEdit();

        const line = diagnostic.range.start.line;
        const lineText = document.lineAt(line);

       const text = lineText.text;

        // Capture trailing punctuation group (.,;:!?) possibly with whitespace
        const m = text.match(/([.,;:!?]+)\s*$/);

        let insertPosition: vscode.Position;
        let insertText = " \\cite{TODO}";

        if (m && typeof m.index === "number") {
          // Insert BEFORE the punctuation group, do NOT duplicate punctuation
          insertPosition = new vscode.Position(line, m.index);
        } else {
          // No trailing punctuation -> append
          insertPosition = new vscode.Position(line, text.length);
        }

        edit.insert(document.uri, insertPosition, insertText);

        action.edit = edit;
        actions.push(action);
      }
    }

    return actions;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log("[Research Assistant] activated");

  const sidebar = new SidebarProvider(context);
  const diags = new DiagnosticsManager();
  context.subscriptions.push(diags);

  context.subscriptions.push(
  vscode.languages.registerCodeActionsProvider(
    ["markdown", "latex"],
    new CiteCodeActionProvider(),
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
    }
  )
  );

  // Register the sidebar webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar)
  );

  // Register Code Actions provider (lightbulb actions on our diagnostics)
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      ["markdown", "latex", "python", "cpp"],
      new ResearchCodeActionProvider(),
      { providedCodeActionKinds: ResearchCodeActionProvider.providedCodeActionKinds }
    )
  );

  context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const doc = event.document;

        if (doc.languageId !== "markdown") return;
        if (!event.contentChanges.length) return;

        const change = event.contentChanges[0];
        const line = doc.lineAt(change.range.end.line);
        const text = line.text.trim();

        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
          handleAssistantTrigger(doc, line.lineNumber, text);
        }, 2000);
      })
    );

  async function handleAssistantTrigger(
  doc: vscode.TextDocument,
  lineNumber: number,
  text: string) {
    const match = text.match(ASSISTANT_TRIGGER);
    if (!match) return;

    const question = match[1];

    const signature = `${lineNumber}:${question}`;
    if (lastHandledSignature === signature) return;

    lastHandledSignature = signature;

    // show loading
    sidebar.postMessage({ type: "assistantLoading", question });

    // ensure loading is visible at least 300ms
    const minDelayMs = 300;
    const t0 = Date.now();

    const answer = await callLLM(question);

    if (answer === "__MISSING_KEY__") {
      showAssistantResponse(question, "Missing API key.");
      return;
    }

    const elapsed = Date.now() - t0;
    if (elapsed < minDelayMs) {
      await new Promise((r) => setTimeout(r, minDelayMs - elapsed));
    }

    showAssistantResponse(question, answer);
    }
  

  async function refreshAll() {
    await sidebar.refresh();

    const cfg = vscode.workspace.getConfiguration("researchAssistant");
    const enabled = cfg.get<boolean>("enableDiagnostics", false);

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;

    if (!enabled) {
      diags.clear(doc);
      return;
    }

    // Visible-only diagnostics (gentle + non-intrusive)
    const allClaims: ReturnType<typeof detectClaims> = [];

    for (const vr of editor.visibleRanges) {
      const start = vr.start.line;
      const end = vr.end.line;

      const lines: string[] = [];
      for (let i = start; i <= end; i++) lines.push(doc.lineAt(i).text);

      const claims = detectClaims(lines).map((c) => ({
        ...c,
        startLine: c.startLine + start,
        endLine: c.endLine + start
      }));

      allClaims.push(...claims);
    }

    diags.apply(doc, allClaims);
  }

  // Refresh triggers
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => void refreshAll())
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => void refreshAll())
  );
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges(() => void refreshAll())
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("researchAssistant.analyzeVisible", async () => {
      await refreshAll();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("researchAssistant.toggleDiagnostics", async () => {
      const cfg = vscode.workspace.getConfiguration("researchAssistant");
      const current = cfg.get<boolean>("enableDiagnostics", false);
      await cfg.update("enableDiagnostics", !current, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage(
        `Research Assistant diagnostics: ${!current ? "enabled" : "disabled"} (workspace)`
      );
      await refreshAll();
    })
  );

  // Code Action commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "researchAssistant.suggestCitationQuery",
      async (document: vscode.TextDocument, range: vscode.Range) => {
        const text = document.getText(range).trim();
        const query = text
          .replace(/[^\w\s%.<>=-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);

        await vscode.env.clipboard.writeText(query);
        vscode.window.showInformationMessage("Citation search query copied to clipboard.");
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "researchAssistant.insertCitationPlaceholder",
      async (document: vscode.TextDocument, range: vscode.Range) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== document.uri.toString()) return;

        const isTex = document.languageId === "latex" || document.fileName.endsWith(".tex");
        const placeholder = isTex ? " \\cite{}" : " [citation needed]";

        await editor.edit((eb) => {
          eb.insert(range.end, placeholder);
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "researchAssistant.rewriteHedged",
      async (document: vscode.TextDocument, range: vscode.Range) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== document.uri.toString()) return;

        const original = document.getText(range);

        // Simple local heuristic (LLM later)
        const hedged = original
          .replace(/\balways\b/gi, "often")
          .replace(/\bnever\b/gi, "rarely")
          .replace(/\bproves?\b/gi, "suggests")
          .replace(/\bguarantee\b/gi, "may indicate");

        const pick = await vscode.window.showQuickPick(
          [
            { label: "Replace selection with hedged version", description: hedged },
            { label: "Copy hedged version to clipboard", description: hedged }
          ],
          { placeHolder: "Choose how to apply the rewrite" }
        );
        if (!pick) return;

        if (pick.label.startsWith("Replace")) {
          await editor.edit((eb) => eb.replace(range, hedged));
        } else {
          await vscode.env.clipboard.writeText(hedged);
          vscode.window.showInformationMessage("Hedged rewrite copied to clipboard.");
        }
      }
    )
  );
  function showAssistantResponse(question: string, answer: string) {
    sidebar.postMessage({ type: "assistantResponse", question, answer });
  }
}


async function callLLM(question: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "Missing API key.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a concise research brainstorming assistant. Be brief."
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 200
    })
  });
  const data = (await response.json()) as any;
  return data?.choices?.[0]?.message?.content ?? "No response.";
}

export function deactivate() {}
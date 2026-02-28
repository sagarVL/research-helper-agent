import * as vscode from "vscode";
import { SidebarProvider } from "./sidebar/SidebarProvider";
import { DiagnosticsManager } from "./diagnostics/DiagnosticsManager";
import { detectClaims } from "./analysis/ClaimDetector";
import { ResearchCodeActionProvider } from "./codeActions/ResearchCodeActionProvider";

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

        edit.insert(
          document.uri,
          new vscode.Position(line, lineText.text.length),
          " \\cite{TODO}"
        );

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
}

export function deactivate() {}
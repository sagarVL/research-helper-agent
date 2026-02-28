import * as vscode from "vscode";
import { SidebarProvider } from "./sidebar/SidebarProvider";
import { DiagnosticsManager } from "./diagnostics/DiagnosticsManager";
import { detectClaims } from "./analysis/ClaimDetector";

export function activate(context: vscode.ExtensionContext) {
  console.log("[Research Assistant] activated");

  const sidebar = new SidebarProvider(context);
  const diags = new DiagnosticsManager();
  context.subscriptions.push(diags);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar)
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

    // Visible-only to match the "gentle" behavior
    const visible = editor.visibleRanges?.[0];
    const start = visible ? visible.start.line : 0;
    const end = visible ? visible.end.line : Math.min(doc.lineCount - 1, 200);

    const lines: string[] = [];
    for (let i = start; i <= end; i++) lines.push(doc.lineAt(i).text);

    const claims = detectClaims(lines).map((c) => ({
      ...c,
      startLine: c.startLine + start,
      endLine: c.endLine + start
    }));

    diags.apply(doc, claims);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => void refreshAll())
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => void refreshAll())
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges(() => void refreshAll())
  );

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
}

export function deactivate() {}
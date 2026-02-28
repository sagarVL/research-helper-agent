import * as vscode from "vscode";
import { SidebarProvider } from "./sidebar/SidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const sidebar = new SidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar)
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => void sidebar.refresh())
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => void sidebar.refresh())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("researchAssistant.analyzeVisible", async () => {
      await sidebar.refresh();
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
    })
  );
}

export function deactivate() {}
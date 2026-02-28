import * as vscode from "vscode";

export class ResearchCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.RefactorRewrite
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const relevant = context.diagnostics.filter((d) => d.source === "Research Assistant");
    if (relevant.length === 0) return [];

    const diag = relevant[0];
    const actions: vscode.CodeAction[] = [];

    // 1) Suggest citation search query (copies to clipboard)
    const suggest = new vscode.CodeAction(
      "Research Assistant: Suggest citation search query",
      vscode.CodeActionKind.QuickFix
    );
    suggest.command = {
      command: "researchAssistant.suggestCitationQuery",
      title: "Suggest citation search query",
      arguments: [document, diag.range]
    };
    suggest.diagnostics = [diag];
    actions.push(suggest);

    // 2) Insert placeholder citation marker
    const insert = new vscode.CodeAction(
      "Research Assistant: Insert citation placeholder",
      vscode.CodeActionKind.QuickFix
    );
    insert.command = {
      command: "researchAssistant.insertCitationPlaceholder",
      title: "Insert citation placeholder",
      arguments: [document, diag.range]
    };
    insert.diagnostics = [diag];
    actions.push(insert);

    // 3) Rewrite as hedged statement (shows suggested rewrite)
    const hedge = new vscode.CodeAction(
      "Research Assistant: Rewrite more cautiously",
      vscode.CodeActionKind.RefactorRewrite
    );
    hedge.command = {
      command: "researchAssistant.rewriteHedged",
      title: "Rewrite more cautiously",
      arguments: [document, diag.range]
    };
    hedge.diagnostics = [diag];
    actions.push(hedge);

    return actions;
  }
}
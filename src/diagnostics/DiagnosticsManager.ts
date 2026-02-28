import * as vscode from "vscode";
import type { ClaimItem } from "../analysis/ClaimDetector";

export class DiagnosticsManager {
  private readonly collection: vscode.DiagnosticCollection;

  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection("researchAssistant");
  }

  dispose() {
    this.collection.dispose();
  }

  clear(doc?: vscode.TextDocument) {
    if (doc) this.collection.delete(doc.uri);
    else this.collection.clear();
  }

  apply(doc: vscode.TextDocument, items: ClaimItem[]) {
    const diagnostics: vscode.Diagnostic[] = [];

    for (const it of items) {
      const start = new vscode.Position(it.startLine, 0);
      const end = new vscode.Position(it.endLine, doc.lineAt(it.endLine).text.length);
      const range = new vscode.Range(start, end);

      const severity =
        it.kind === "verify-derivation"
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information;

      const d = new vscode.Diagnostic(range, it.message, severity);
      d.source = "Research Assistant";
      diagnostics.push(d);
    }

    this.collection.set(doc.uri, diagnostics);
  }
}
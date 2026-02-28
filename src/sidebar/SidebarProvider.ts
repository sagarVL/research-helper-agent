import * as vscode from "vscode";
import { detectClaims } from "../analysis/ClaimDetector";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "researchAssistant.sidebarView";
  private view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === "jump" && typeof msg?.line === "number") {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const pos = new vscode.Position(msg.line, 0);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
      }

      if (msg?.type === "analyze") {
        await this.refresh();
      }
    });

    void this.refresh();
  }

  public async refresh(): Promise<void> {
    if (!this.view) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.view.webview.postMessage({ type: "data", items: [], note: "Open a file to analyze." });
      return;
    }

    const doc = editor.document;
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

    this.view.webview.postMessage({
      type: "data",
      meta: {
        languageId: doc.languageId,
        analyzedLines: `${start + 1}-${end + 1}`
      },
      items: claims
    });
  }

  private getHtml(): string {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; padding: 10px; }
    .row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    button { padding: 6px 10px; cursor:pointer; }
    .meta { opacity:0.75; font-size: 12px; margin: 8px 0 12px; }
    .item { border: 1px solid rgba(127,127,127,0.35); border-radius: 10px; padding: 10px; margin: 8px 0; }
    .pill { display:inline-block; padding: 2px 8px; border-radius: 999px; border:1px solid rgba(127,127,127,0.35); font-size:12px; opacity:0.85; }
    .msg { margin-top: 6px; }
    .line { margin-top: 8px; font-size: 12px; opacity:0.8; }
  </style>
</head>
<body>
  <div class="row">
    <div><strong>Research Assistant</strong></div>
    <button id="analyze">Analyze visible</button>
  </div>
  <div class="meta" id="meta">—</div>
  <div id="list"></div>

  <script>
    const vscode = acquireVsCodeApi();
    const metaEl = document.getElementById('meta');
    const listEl = document.getElementById('list');

    document.getElementById('analyze').addEventListener('click', () => {
      vscode.postMessage({ type: 'analyze' });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type !== 'data') return;

      if (msg.note) metaEl.textContent = msg.note;
      else metaEl.textContent = msg.meta.languageId + ' • ' + msg.meta.analyzedLines;

      listEl.innerHTML = '';
      const items = msg.items || [];
      if (items.length === 0) {
        listEl.innerHTML = '<div class="meta">No suggestions in the visible region.</div>';
        return;
      }

      for (const it of items) {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = \`
          <div class="row">
            <div><span class="pill">\${it.kind}</span></div>
            <button data-line="\${it.startLine}">Go</button>
          </div>
          <div class="msg">\${escapeHtml(it.message)}</div>
          <div class="line">Line \${it.startLine + 1} • confidence \${Math.round(it.confidence * 100)}%</div>
        \`;
        div.querySelector('button').addEventListener('click', (e) => {
          const line = Number(e.target.getAttribute('data-line'));
          vscode.postMessage({ type: 'jump', line });
        });
        listEl.appendChild(div);
      }
    });

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  </script>
</body>
</html>`;
  }
}
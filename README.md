# Research Assistant

A quiet, opt-in VS Code extension for research writing and verification.

Research Assistant detects unsupported claims, highlights reasoning issues, provides actionable quick fixes, and integrates LLM-powered verification — without intrusive autocomplete or constant interruptions.

Designed for research workflows in:
- Robotics
- AI / Machine Learning
- Scientific & Technical Writing (LaTeX / Markdown)

---

## Philosophy

This extension is intentionally non-intrusive:
- No inline ghost text
- No automatic rewrites
- No constant popups
- No background indexing
- No forced suggestions

You choose when to analyze. You choose when to act.

---

## Current Features

### 1) Sidebar: Research Assistant
- Activity Bar icon
- Webview panel
- Manual **Analyze visible** button
- Lists detected issues with:
  - Line number
  - Confidence score
  - Issue type
- Click to jump to location
- Analyzes the **visible region** by default

### 2) Heuristic Claim Detection
Detects:

**Numeric / Statistical Claims**
- `20%`
- `p < 0.05`
- `10 ms`
- `3x improvement`

Handles punctuation correctly:
- `20%.`
- `20%!`
- `20%?`

**Absolute Language**
- always
- never
- proves
- guarantees
- certainly

**Causal Language**
- therefore
- thus
- leads to
- results in

**Derivation / Proof Language**
- we prove
- derivation
- it follows
- by induction

### 3) LaTeX-Aware Detection
Avoids false positives in `.tex` files:
- Skips lines containing citations:
  - `\cite{}`
  - `\citet{}`
  - `\citep{}`
- Inserts new citations correctly **before trailing punctuation**

Example:
```tex
This improves accuracy by 20%.

Quick Fix → becomes:

```tex
This improves accuracy by 20% \cite{TODO}.
```

### 4) Optional Diagnostics (Squiggles)

Diagnostics can be toggled via:

**Research Assistant: Toggle Diagnostics**

When enabled:

- Gentle squiggles appear under flagged claims  
- Integrated with the VS Code Problems panel  
- Still analyzes only the visible region  
- Disabled by default  

### 5) Domain-Specific Analysis

Set domain via **Research Assistant: Select Domain**:
- `robotics` (default)
- `ai`
- `general`

Enables context-aware claim detection based on your research area.

### 6) LLM-Powered Verification (@assistant Q&A)

Integrated LLM support for claim verification and reasoning analysis.

**Supported Providers:**
- OpenAI (default: `gpt-4o-mini`)
- Google Gemini (default: `gemini-2.0-flash`)

**Usage:**
1. Set API key: **Research Assistant: Set OpenAI API Key** or **Set Gemini API Key**
2. Select provider: **Research Assistant: Select LLM Provider**
3. Use `@assistant` prefix in analysis queries

**Features:**
- Verifies claim plausibility
- Analyzes reasoning chains
- Suggests improvements to causal claims
- Generates refined citation queries

### 7) Quick Fix: Insert Citation

When a claim is flagged:

Press: `Ctrl + .`

Available action: `Add \cite{TODO}`

Smart insertion logic:
- `20%.` → `20% \cite{TODO}.`
- `20%!` → `20% \cite{TODO}!`
- `20%` → `20% \cite{TODO}`

### 8) Quick Fix: Rewrite More Cautiously

Provides hedged alternatives for strong claims.

Examples:
- always → often  
- never → rarely  
- proves → suggests  
- guarantees → may indicate  

User can choose to:
- Replace inline  
- Copy to clipboard  

### 9) Citation Search Query

Generates a cleaned search query from the flagged sentence and copies it to clipboard.

Useful for:
- Google Scholar  
- Semantic Scholar  
- arXiv  
- IEEE Xplore  

### 10) Proto File Generation

Generate prototype code for claims with **@assistant proto**:
- Generates proof-of-concept implementations
- Optionally writes to workspace (toggle via **Research Assistant: Toggle Proto File Writing**)

---

## Supported File Types

- Markdown (`.md`)
- LaTeX (`.tex`)
- Python (basic heuristic support)
- C++ (basic heuristic support)

---

## How It Works

1. Analyze visible editor region  
2. Run heuristic claim detection  
3. Generate diagnostics  
4. Provide Code Actions via VS Code lightbulb  
5. Let the user choose actions  

No document content is sent anywhere.  
No remote services are used (current version).  
Fully local.

---

## Installation (Development Mode)

### Prerequisites
- Node.js 16+ and npm
- VS Code 1.85.0+

### Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd research-helper-agent
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Launch the Extension Development Host:
   - Open the project in VS Code
   - Press `F5` to start debugging
   - A new VS Code window opens with the extension enabled

### Development

Watch mode (auto-rebuild on changes):
```bash
npm run watch
```

Then press `F5` to launch/reload the extension.

---

## Configuration

Available settings (VS Code `settings.json`):

```json
{
  "researchAssistant.enableDiagnostics": false,
  "researchAssistant.analysisMode": "visibleOnly",
  "researchAssistant.domain": "robotics",
  "researchAssistant.provider": "openai",
  "researchAssistant.openaiModel": "gpt-4o-mini",
  "researchAssistant.geminiModel": "gemini-2.0-flash",
  "researchAssistant.protoWriteFiles": false
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enableDiagnostics` | boolean | `false` | Show squiggle diagnostics for detected claims |
| `analysisMode` | string | `visibleOnly` | Analyze visible region only or full document |
| `domain` | string | `robotics` | Domain preset: `robotics`, `ai`, or `general` |
| `provider` | string | `openai` | LLM provider: `openai` or `gemini` |
| `openaiModel` | string | `gpt-4o-mini` | OpenAI model for LLM queries |
| `geminiModel` | string | `gemini-2.0-flash` | Google Gemini model for LLM queries |
| `protoWriteFiles` | boolean | `false` | Write generated prototypes to disk |

---

## Tech Stack

- **Framework**: VS Code Extension API
- **Language**: TypeScript
- **Build Tool**: TypeScript Compiler (tsc)
- **LLM Support**: OpenAI & Google Gemini APIs
- **UI**: VS Code Webview for sidebar

---

## Roadmap

Implemented:
- ✅ Heuristic claim detection
- ✅ Domain-specific analysis modes
- ✅ LLM-powered verification (@assistant)
- ✅ Prototype generation

---

## Why This Exists

Research writing often contains:
- Implicit assumptions without support
- Overstated claims lacking evidence
- Missing or incorrect citations
- Weakly supported reasoning chains

This extension acts as a structured second reader — detecting, flagging, and helping improve claims and reasoning directly in your editor, without leaving your workflow.

---
# Research Assistant

A quiet, opt-in VS Code extension for research writing.

Research Assistant detects unsupported claims, highlights reasoning issues, and provides actionable quick fixes — without intrusive autocomplete or constant interruptions.

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

---

### 5. Quick Fix: Insert Citation

When a claim is flagged:

Press:

`Ctrl + .`

Available action:

`Add \cite{TODO}`

Smart insertion logic:

- `20%.` → `20% \cite{TODO}.`
- `20%!` → `20% \cite{TODO}!`
- `20%` → `20% \cite{TODO}`

---

### 6. Quick Fix: Rewrite More Cautiously

Provides hedged alternatives for strong claims.

Examples:

- always → often  
- never → rarely  
- proves → suggests  
- guarantees → may indicate  

User can choose to:

- Replace inline  
- Copy to clipboard  

---

### 7. Citation Search Query

Generates a cleaned search query from the flagged sentence and copies it to clipboard.

Useful for:

- Google Scholar  
- Semantic Scholar  
- arXiv  
- IEEE Xplore  

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

Clone the repository:

```bash
git clone <repository-url>
cd research-helper-agent
```

Install dependencies:

```bash
npm install
```

Build the extension:

```bash
npm run build
```

Launch Extension Development Host:

Open the project in VS Code

Press F5

---

## Configuration

Available settings:

- `researchAssistant.enableDiagnostics`
- `researchAssistant.analysisMode`
- `researchAssistant.domain` (reserved for future domain-specific modes)

Diagnostics are disabled by default.

---

## Roadmap

Planned improvements:

- Domain-specific detection modes (Robotics / AI / Pharma)
- Smarter citation query generation
- Section-aware detection (e.g., Related Work)
- Mathematical derivation consistency checks
- Optional LLM-backed reasoning validation
- Claim clustering and grouping

---

## Why This Exists

Research writing often contains:

- Implicit assumptions
- Overstated claims
- Missing citations
- Weakly supported reasoning

This extension acts as a structured second reader — not a writer
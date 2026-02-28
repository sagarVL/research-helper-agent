Research Assistant

A quiet, opt-in VS Code extension for research writing.

Research Assistant detects unsupported claims, highlights reasoning issues, and provides actionable quick fixes — without intrusive autocomplete or constant interruptions.

Designed for research workflows in:

Robotics

AI / Machine Learning

Scientific & Technical Writing (LaTeX / Markdown)

Philosophy

This extension is intentionally non-intrusive.

No inline ghost text

No automatic rewrites

No constant popups

No background indexing

No forced suggestions

You choose when to analyze.
You choose when to act.

Current Features
1. Sidebar: Research Assistant

Activity Bar icon

Webview panel

Manual “Analyze visible” button

Lists detected issues with:

Line number

Confidence score

Issue type

Click to jump to location

Only analyzes the visible region by default.

2. Heuristic Claim Detection

Detects:

Numeric / Statistical Claims

20%

p < 0.05

10 ms

3x improvement

Correctly handles punctuation:

20%.

20%!

20%?

Absolute Language

always

never

proves

guarantees

certainly

Causal Language

therefore

thus

leads to

results in

Derivation / Proof Language

we prove

derivation

it follows

by induction

3. LaTeX-Aware Detection

Avoids false positives in .tex files:

Skips lines containing:

\cite{}

\citet{}

\citep{}

Recognizes existing citations

Inserts new citations correctly before punctuation

Example:

This improves accuracy by 20%.

Quick Fix → becomes:

This improves accuracy by 20% \cite{TODO}.

No duplicate punctuation.

4. Optional Diagnostics (Squiggles)

Toggle via:

Research Assistant: Toggle Diagnostics

When enabled:

Gentle squiggles under flagged lines

Integrated with VS Code Problems panel

Still only analyzes visible region

Disabled by default (non-intrusive)

5. Quick Fix: Insert Citation

When a claim is flagged:

Press:

Ctrl + .

Available action:

Add \cite{TODO}

Smart insertion behavior:

20%. → 20% \cite{TODO}.

20%! → 20% \cite{TODO}!

20% → 20% \cite{TODO}

6. Quick Fix: Rewrite More Cautiously

Transforms strong claims into hedged versions:

always → often

never → rarely

proves → suggests

guarantee → may indicate

User chooses:

Replace in place

Copy to clipboard

7. Citation Search Query

Generates a cleaned search query from the flagged sentence and copies it to clipboard.

Useful for:

Google Scholar

Semantic Scholar

arXiv

IEEE Xplore

Supported File Types

Markdown (.md)

LaTeX (.tex)

Python (basic heuristic support)

C++ (basic heuristic support)

How It Works

Analyze visible editor region

Run heuristic claim detection

Generate diagnostics

Provide Code Actions via lightbulb

Allow user-controlled fixes

No document content is sent anywhere.
No remote services are used (current version).
Fully local.

Installation (Development Mode)

Clone the repository

Install dependencies:

npm install

Build:

npm run build

Press F5 in VS Code
This launches the Extension Development Host.

Configuration

Available settings:

researchAssistant.enableDiagnostics

researchAssistant.analysisMode

researchAssistant.domain (scaffolded for future expansion)

Diagnostics are disabled by default.

Roadmap

Planned improvements:

Domain-specific modes:

Robotics

AI / ML

Pharma

Smarter citation query generation

Section-aware detection (e.g., Related Work)

Math / derivation consistency checks

LLM-backed reasoning validation (optional online mode)

Claim clustering and grouping

Why This Exists

Research writing often contains:

Implicit assumptions

Overstated claims

Missing citations

Weakly supported reasoning

This extension acts as a quiet second reader —
not a writer, not an autocomplete engine.
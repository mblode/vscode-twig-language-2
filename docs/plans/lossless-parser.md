# Shared lossless parser

## Outcome

Malformed Twig block structure currently reaches the indentation engine: an unmatched end tag or misplaced branch can change the indentation of an unrelated block. Unknown paired tags also have their bodies reformatted despite having no known grammar. Parse structure before producing edits. Preserve malformed documents and unknown tag bodies. Keep conditional HTML wrappers working across separate Twig blocks.

This file is the authoritative implementation plan for the parser follow-up to the released formatter.

## Decision and evidence

Evaluate Ludtwig before building. At upstream commit `d845944ae4e327da8f06522b5a60a5bbfc7c0398`, its Rust parser preserved all 265 corpus inputs byte for byte, but emitted diagnostics for 89. The corpus includes deliberately incomplete samples and duplicate historical excerpts, so this count is not an accuracy score. A separate valid conditional wrapper produced six diagnostics. The project's documented requirement that HTML elements close within the same Twig block conflicts with this extension's required behavior. Keep the existing lossless lexer and build the required structural layer in JavaScript, without introducing a Rust/WASM runtime.

Reproduction and per-case results: `docs/research/ludtwig-parser-evaluation.json` and `scripts/evaluate-ludtwig.py`. The evaluation uses the 61 named regressions, 203 historical excerpts and one independent conditional-wrapper example.

## Implementation

1. Parse source-order leaves into a Twig block/branch tree with exact UTF-16 offsets. HTML remains independent because Twig generates text and may conditionally generate either half of an element. Retain source leaves even on lexical failure.
2. Validate block matching, branch ownership, terminal branches and nesting limits. Formatting returns no edits for structural errors; existing lexical errors retain their provider error behavior. Layout consumes parser-assigned roles instead of inferring block relationships again.
3. Preserve unknown standalone tags and whole unknown paired regions, including their original indentation. Use merged intervals and binary search to avoid quadratic protection checks. Format supported surrounding syntax normally.
4. Synchronize the same parser and regression tests into Twig Language 1 and Pretty Formatter, with the existing source hash manifest. Keep extension identities, configuration namespaces and language modes.
5. Test the source and packaged providers, then publish patch releases only after all gates pass.

## Boundaries

This is a lossless structural parser, not a complete Twig expression compiler or language server. Expression atoms and Twig islands inside HTML attributes still use the existing lexer. The native Twig oracle checks representative rendered results and lexical equivalence; it does not establish universal render equivalence. HTML fragments and conditional wrappers are deliberately not rejected for failing DOM nesting rules. Unsupported custom syntax is preserved rather than interpreted.

## Verification and recovery

- `npm test`: exact leaf coverage across the entire corpus, branch ownership, malformed nesting produces no edits, unknown bodies unchanged, Unicode/CRLF offsets, bounded depth, repeated-format stability.
- `npm run test:oracle`: official Twig lexical and representative render equivalence, including conditional branches.
- Run the same tests and builds in all three distributions; source manifests must match.
- Package each VSIX and run `test:extension` against the extracted artifact on the minimum supported VS Code and current stable.
- Confirm CI and registry artifact hashes before reporting a release complete. Do not resume bulk issue/review replies.
- If a regression appears, publish a corrective patch; never replace a published version or rewrite release history.

## Release status, 8 September 2026

Version 0.12.1 is published on [GitHub](https://github.com/mblode/vscode-twig-language-2/releases/tag/v0.12.1). [Linux CI](https://github.com/mblode/vscode-twig-language-2/actions/runs/34177694981) passed. Across the three distributions, 962 unit/regression tests passed with no skips; the native Twig checks passed and all six extracted-package runs passed on VS Code 1.85.2 and stable 1.136.1. Every CI-packaged file matches the locally tested artifact. Local VSIX SHA-256: `4226d97dc0db64f6774ee9299f6b0716e9fc61133ac47f996ea6efdf077519cc`.

Published on [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2) and [Open VSX](https://open-vsx.org/extension/mblode/twig-language-2) on 8 September 2026. Both registries list this patch as the current version. Public VSIX downloads from Marketplace, Open VSX and GitHub match the tested local package byte for byte (SHA-256 above). All nine artifact checks are recorded in [the release verification report](../research/parser-release-verification.json). Bulk issue and review replies remain stopped.

# Twig formatter replacement

This is the authoritative implementation and release plan. Evidence snapshot: 8 September 2026, starting at `d75fda8` on `master` (clean and equal to origin).

## Outcome

Formatting a Twig document or selection must preserve its code, literal values, attribute spelling, comments, whitespace controls, and raw content. Repeated formatting must produce identical output. Nested Twig and HTML must receive stable indentation, including templates that conditionally open and close HTML elements. Settings must follow the current document without restarting VS Code, and cancellation or malformed input must never replace a document with partial output.

Initial release target: `mblode.twig-language-2`, the local repository and the successor with a separate `twig` language identity. The user was asked about the two listings; work proceeded with Twig Language 2 after no correction was received. Research covers both Twig listings and Pretty Formatter; the initial implementation covered Twig Language 2. The expanded scope section below governs the follow-up work.

## Decisions

The existing wrapper mutates PrettyDiff's global options, identifies Twig as HTML, reads configuration once, and returns an unconditional whole-range replacement. There are no automated tests or release checks. This boundary explains integration bugs separately from engine bugs.

Use a purpose-built, lossless Twig/HTML token stream with source spans and independent indentation state. Twig is a text-generating language: an HTML element may start inside one Twig conditional and end inside another. Requiring one shared DOM/Twig tree excludes actual reported templates. Unknown template syntax remains source text, never an inferred repair.

Do not fork PrettyDiff's multi-language engine. Its current dependency is `101.2.6`; the task only needs Twig. The maintained `@zackad/prettier-plugin-twig@0.17.0` was tested with Prettier `3.9.6`: it rejects a conditional within an HTML attribute, rejects a conditional wrapper, and changes literal `verbatim` content. Those are release blockers, not cosmetic differences. Ludtwig documents the same shared-tree limitation for crossing HTML/Twig. djLint recommends its Nunjucks profile for Twig. Twig CS Fixer supplies useful native Twig validation but requires PHP and is not an HTML layout engine.

Borrow the useful design principles: source-preserving syntax and recoverable boundaries from Biome/Tree-sitter, deterministic formatting and small configuration from gofmt, and regression conformance rather than speed claims from Oxfmt. Reuse pinned Prettier parsers/printers for embedded code only when the body is valid in that language and its Twig literal spans remain preserved. Do not execute project Prettier configuration or load workspace plugins.

## Approach

1. Audit every issue/PR, discussion comment, PR review, and public Marketplace rating/review from the three repositories/listings. Record an indexed disposition report; distinguish reproducible formatting failures from grammar, snippets, editor conflicts, unrelated languages, and reports lacking source. Preserve provenance for regression cases.
2. Add a standalone formatter under `src/formatter/`. Tokenize Twig before HTML quote handling, retain raw spans and delimiters, format safe expression whitespace and attributes, and calculate indentation in document context. Preserve inline text boundaries and raw regions; never add/drop/reorder code to repair malformed input. Support ignore regions. Build issue-derived regression fixtures and explicit expected output cases before replacing the provider.
3. Replace the PrettyDiff call with isolated worker execution, bounded time/input, cancellation, per-document live settings, and small source edits. Range formatting uses the whole source for indentation and applies only edits within selected complete lines. Verify no out-of-range or stale-document edits.
4. Remove PrettyDiff and obsolete build dependencies. Bundle the extension and formatter worker, keep syntax/snippet/hover assets, update the supported VS Code floor for the worker/runtime, and document deprecated settings and new defaults. Preserve useful indent, wrap, attribute, and final-newline settings; retire unsafe transformations explicitly.
5. Run unit, corpus, property/idempotence, embedded-language, and real VS Code extension-host tests. Validate representative template renders with official Twig PHP, including both outcomes of conditional wrappers. Inspect the packaged VSIX and test its installed formatter. Commit and publish the new version only after these gates pass. Verify the actual registry version and downloadable artifact.

## Boundaries

This is a formatter release, not a Twig language server or an IntelliSense rewrite. Existing highlighting/snippets remain packaged. Grammar complaints and unavailable image-only inputs remain explicitly identified in the audit rather than declared fixed. Arbitrary generated JavaScript/CSS and unknown custom template constructs may be retained unchanged where parsing is ambiguous. No claim of universal semantic equivalence for arbitrary templates or CSS-driven HTML whitespace is possible; literal/inline whitespace preservation and render tests define the tested contract.

## Verification

- Destructive reports: `<` comparisons and literal attributes, nested quotes, attribute-generated Twig, SVG/custom camel case, shorthand blocks, duplicated `=` and tag names, and full historical templates retain all syntax and payloads.
- Stability: format every regression repeatedly with tabs and spaces, LF and CRLF; assert `format(format(x)) === format(x)` and expected source invariants. Fuzz delimiter/quote combinations and bounded incomplete inputs.
- Layout: expected output for if/elseif/else, for/else, set capture versus assignment, block shorthand, custom multi-tags, conditional wrappers, void tags, multiline attributes, comments, and paragraphs.
- Embedded content: verify script nesting and CSS media queries; preserve Twig strings, raw/verbatim/pre/textarea and unsupported mixed bodies. Test official Twig render equivalence on meaningful representative contexts.
- Provider: format-document, format-selection, format-on-save, immediate settings changes, resource-specific tabs/spaces, unchanged results, cancellation, timeout, stale version, and error behavior in unit and extension-host tests.
- Release: `npm ci`, `npm test`, build, extension-host tests, VSIX inventory/runtime smoke test, dependency audit, and Marketplace readback. Record actual results and remaining limits here before shipping.

## Recovery

Keep the old release/tag available. A failing format returns no edits and a concise diagnostic; it never retries through PrettyDiff. Users can disable formatting or install an earlier Marketplace version. If post-release evidence reveals a regression, publish a corrective version or revert the implementation in a new version; never overwrite a published artifact or rewrite public history.

## Status

Research completed for all 190 issues, 31 PRs, 526 issue/PR comments and 45 Marketplace ratings/reviews. All PR review endpoints returned empty review lists. Implementation completed. Local verification: 287 tests passed, including 203 historical samples (199 preserved/idempotent, four intentionally rejected incomplete samples), 61 named regressions, native Twig lexer and render oracles, embedded runtime/string checks, worker cancellation/timeout, and stale-document guards. `npm ci`, build and VSIX packaging passed. Real VS Code integration passed on 1.85.2 (minimum) and 1.136.1 (current stable); the extracted VSIX passed the same minimum-version suite. Production and development dependency audits report zero vulnerabilities after updating transitive minimist. A 380,000-byte / 10,000-element worker probe completed in 141 ms on this machine; this is a local observation, not a cross-platform performance guarantee.

The VSIX contains 13 files, including both bundles, grammar/configuration/snippets and third-party license notices, with no test or node_modules payload. Marketplace owner access is confirmed. Remote [CI](https://github.com/mblode/vscode-twig-language-2/actions/runs/34164220987) passed on Linux, including the packaged-extension tests. Every file in the CI-built VSIX matches the local VSIX. The [GitHub release](https://github.com/mblode/vscode-twig-language-2/releases/tag/v0.11.0) is published at commit `3e8ce8881ac71c09c62919d0cecefe64dc46cfd7`. [Marketplace](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2) now serves version 0.11.0. The publicly downloaded VSIX is byte-identical to the tested local package and GitHub release asset (SHA-256 `fdcfa3a5b5589752203727bae6b4805b8cd3521c8fa7ecad0ab51cc01cb6f12b`). All release gates are complete.


## Expanded scope, 8 September 2026

The user requested Twig Language 1 fixes, consolidation, current VS Code practices and Pretty Formatter fixes. This extends the initial formatter-only boundary above. Twig Language 2 is the canonical implementation; Twig Language retains its `html` identity and namespace as a compatibility distribution. Neither listing is deleted or deprecated. Migration of existing installations is a separate Marketplace action: Microsoft documents an opt-in migration prompt, not an automatic merge of extension IDs or statistics.

Both Twig distributions share identical formatter code, HTML service adapter, grammar, snippets and language configuration. The separate Twig language now receives HTML completions and closing tags through Microsoft's bundled language service, using an offset-preserving projection that masks Twig regions. Legacy HTML mode continues using the native HTML service.

Acceptance: all formatter/oracle tests remain green; new TextMate tests use actual VS Code 1.85.2 embedded grammars; packaged extension tests cover HTML completion, closing tags, existing language identity, settings and format/save behavior. All published VSIX files must be tested in minimum and stable VS Code, built in CI and verified by public Marketplace download. Ambiguous reports without source and broader feature requests remain recorded as such in the audit. Browser-only hosting and arbitrary workspace plugins remain outside this release.

Current VS Code references: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#deprecating-extensions ; https://code.visualstudio.com/api/extension-guides/workspace-trust ; https://code.visualstudio.com/api/extension-guides/virtual-workspaces ; https://code.visualstudio.com/api/language-extensions/embedded-languages .

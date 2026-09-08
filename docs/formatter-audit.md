# Twig formatter audit

Evidence read on 8 September 2026. Implementation target: **mblode.twig-language-2 0.11.0**. This section records the initial 0.11.0 release. The follow-up releases below extend implementation to Twig Language 1 and Pretty Formatter.

## Decision

Build a small Twig/HTML formatter that retains source spans, with Prettier used only for independently parseable embedded JavaScript/CSS. Twig produces text, so one conditional can open an HTML element that a later conditional closes. A shared HTML/Twig tree cannot represent all the templates in these reports.

The engine retains unknown syntax and raw regions, makes localized whitespace edits, then verifies source-bearing tokens before returning edits. Worker isolation bounds failures. This is a conservative formatter, not a complete Twig compiler, HTML repair engine, or language server.

| Candidate / reference | Evidence and implication |
|---|---|
| [PrettyDiff 3](https://prettydiff.com/3/) and [historical overview](https://en.wikipedia.org/wiki/Pretty_Diff) | Multi-language formatter/parser/minifier with many mutation options. The extension used version 101.2.6 and identified Twig as HTML. Forking this entire engine adds unrelated ownership. |
| [Original Melody plugin](https://github.com/trivago/prettier-plugin-twig-melody) | Archived on 3 February 2026. Evaluated the maintained fork rather than assuming the old Prettier 2 plugin was the only alternative. |
| [Maintained Twig plugin](https://github.com/zackad/prettier-plugin-twig) | Tested 0.17.0 with Prettier 3.9.6. It rejects a Twig conditional inside a quoted HTML attribute and a conditional HTML wrapper. It rewrites a verbatim literal and inserts an HTML closing tag into it. These disqualify it for this release. |
| [Ludtwig](https://github.com/MalteJanz/ludtwig) | Its documented hierarchical syntax model does not allow HTML tags to be cut by Twig control structures. A useful Rust implementation, but it does not remove this release's central constraint. |
| [djLint Twig profile](https://djlint.com/docs/languages/twig/) | Recommends the Nunjucks profile. It is not an independent Twig grammar or a reason to assume compatibility with every Twig extension. |
| [Twig playground](https://twig.symfony.com/play), [Twig standards](https://twig.symfony.com/doc/3.x/coding_standards.html), [Twig CS Fixer](https://github.com/VincentLanglet/Twig-CS-Fixer) | Use official Twig 3.28.0 as a development-time lexer/render oracle. PHP is not required by the shipped extension. |
| [Prettier](https://prettier.io/docs/plugins) | Reuse its established language parsers/printers for safe script/style bodies. Do not run workspace plugins or configuration. |
| [Biome](https://biomejs.dev/internals/architecture/) and [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) | Borrow source-preserving syntax boundaries and resilient parsing principles. Tree-sitter supplies parser infrastructure, not a Twig formatting policy. Neither is claimed as this implementation's parser. |
| [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) and [gofmt](https://go.dev/blog/gofmt) | Borrow regression conformance and deterministic output with few meaningful settings. Their JavaScript/Go scope does not itself solve Twig parsing. |
| [Tailwind discussion 11731](https://github.com/tailwindlabs/tailwindcss/discussions/11731) | Read the full discussion and replies. Class sorting and formatter correctness are separate concerns; this release does not claim Tailwind plugin compatibility or sort class strings. |
| [Neovim discussion](https://www.reddit.com/r/neovim/comments/1ihd2uv/twig_formatter_using_neovim/) | Useful discovery of formatter alternatives, not correctness evidence. |
| [Ultimate Twig](https://marketplace.visualstudio.com/items?itemName=TGOSystems.ultimate-twig), [Twig Formatter](https://marketplace.visualstudio.com/items?itemName=serhatkaya.twig-formatter) | Reviewed their published listings. No comparable regression evidence for the destructive cases was available from those pages; no compatibility claim is inferred. |

To reproduce the decisive plugin comparison, install `prettier@3.9.6` and `@zackad/prettier-plugin-twig@0.17.0` in a temporary directory and run `node scripts/compare-plugin.mjs /path/to/temporary/directory`. The three counterexamples are also covered by the replacement's regression fixtures.

## Coverage and limits

Read all GitHub issue/PR bodies, issue/PR conversation comments, submitted reviews and review-comment endpoints for the three repositories, plus every public Marketplace review/rating and reply. Pagination was exhausted. Dependency PR versions and changed-file patches were inspected; generated lockfile changes and repeated bot release notes were treated as mechanical supporting data.

| Repository / listing | Issues | PRs | Conversation comments | Marketplace ratings/reviews |
|---|---:|---:|---:|---:|
| vscode-twig-language-2 | 107 | 15 | 322 | 22 |
| vscode-twig-language | 57 | 12 | 172 | 10 |
| vscode-pretty-formatter | 26 | 4 | 32 | 13 |
| Total | 190 | 31 | 526 | 45 |

There were no submitted PR reviews or diff review comments. The 203 historical source samples include original inputs, reporters' expected/incorrect outputs, and whitespace variants. They are evidence of stability and preservation, not 203 independent bug fixes. Four incomplete samples are expected to reject without edits. The 199 accepted historical samples also retain identical official Twig lexer tokens. Named regressions add exact layout expectations and explicit malformed, literal, embedded and integration cases.

`test/fixtures/history.json` retains report URLs and code samples; `test/fixtures/regressions.json` retains named source references. Repeated formatting and source preservation run for both tabs and spaces; named fixtures additionally run LF/CRLF. Official Twig render fixtures cover both conditional outcomes, inline boundaries, quotes, trim controls, modern expressions and raw content. They do not prove semantic equivalence for arbitrary CSS whitespace rules, template captures, or custom Twig extensions.

Disposition legend:

- **Formatter**: addressed by the new token/layout/preservation boundary; linked fixtures identify checked source. This does not imply every style preference in the discussion is implemented.
- **Integration**: current document options, settings, range/save commands, cancellation or worker isolation have focused tests. Reports tied to another extension/environment are not reproduced universally.
- **Preserve**: ambiguous embedded/custom bodies or multiline expressions remain unchanged rather than receiving speculative formatting.
- **Language**: highlighting, IntelliSense, snippets, Emmet, file associations or editing behavior; outside this formatter release.
- **Needs source**: insufficient reproducible source/environment; reviewed, but no individual fix is claimed.
- **Release**, **Dependency**, **Other**: repository/release maintenance, replaced dependency, or unrelated language/product request.


## vscode-twig-language-2

| Item | Disposition | Source fixtures |
|---|---|---|
| [#1: Highlights all tags of the same type rather than just closing/opening tag](https://github.com/mblode/vscode-twig-language-2/issues/1) | Language | No source fixture; see disposition |
| [#2: Difference from vscode-twig-language](https://github.com/mblode/vscode-twig-language-2/issues/2) | Language | No source fixture; see disposition |
| [#3: Wrong filter formatting](https://github.com/mblode/vscode-twig-language-2/issues/3) | Formatter | `filters` |
| [#4: Better Intellisense](https://github.com/mblode/vscode-twig-language-2/issues/4) | Language | No source fixture; see disposition |
| [#5: confusing vscode-twig-language-2](https://github.com/mblode/vscode-twig-language-2/issues/5) | Language | No source fixture; see disposition |
| [#6: Add option to pad braces](https://github.com/mblode/vscode-twig-language-2/issues/6) | Formatter | Historical corpus (2 samples) |
| [#7: Use single quotes in Craft "switch" snippet ](https://github.com/mblode/vscode-twig-language-2/issues/7) | Language | No source fixture; see disposition |
| [#8: Format not respecting my indentation settings](https://github.com/mblode/vscode-twig-language-2/issues/8) | Integration | No source fixture; see disposition |
| [#9: Extension adds extra markup when document is formatted](https://github.com/mblode/vscode-twig-language-2/issues/9) | Formatter | `nested-quotes`, `script-twig-quote`, `unclosed-attribute` |
| [#10: Craft {% switch %} statements will not be formatted correctly](https://github.com/mblode/vscode-twig-language-2/issues/10) | Formatter | `switch-cases`, `custom-paired-tags` |
| [#11: Exstension add extra Linebreak before {{ and after }}](https://github.com/mblode/vscode-twig-language-2/issues/11) | Formatter | `inline-text`, `pre-textarea` |
| [#12: Indentation guides?](https://github.com/mblode/vscode-twig-language-2/issues/12) | Language | No source fixture; see disposition |
| [#13: Does not allow all HTML intellisense to pass through](https://github.com/mblode/vscode-twig-language-2/issues/13) | Language | No source fixture; see disposition |
| [#14: {% do %} Tag always with newline](https://github.com/mblode/vscode-twig-language-2/issues/14) | Formatter | `do-tag` |
| [#15: 'Format Document' command doesn't work](https://github.com/mblode/vscode-twig-language-2/issues/15) | Integration | No source fixture; see disposition |
| [#16: Format on paste doesn't adhere to current tab depth](https://github.com/mblode/vscode-twig-language-2/issues/16) | Integration | No source fixture; see disposition |
| [#17: Unexpected token after formatting using in array](https://github.com/mblode/vscode-twig-language-2/issues/17) | Formatter | `for-array` |
| [#18: Format document adds spaces around pipes (Twig filters)](https://github.com/mblode/vscode-twig-language-2/issues/18) | Formatter | `filters` |
| [#19: Twig default filter highlighting](https://github.com/mblode/vscode-twig-language-2/issues/19) | Language | Historical corpus (2 samples) |
| [#20: Formatter collapses multi-line include CSS and JS blocks into single line](https://github.com/mblode/vscode-twig-language-2/issues/20) | Preserve | No source fixture; see disposition |
| [#21: Formatter removes space after "and" in some cases](https://github.com/mblode/vscode-twig-language-2/issues/21) | Formatter | `and-parentheses` |
| [#22: Setting files.associations breaks file icons for HTML files](https://github.com/mblode/vscode-twig-language-2/issues/22) | Language | No source fixture; see disposition |
| [#23: \| - "filter symbol" must be without spaces around it](https://github.com/mblode/vscode-twig-language-2/issues/23) | Formatter | `filters` |
| [#24: Option to disable formatter](https://github.com/mblode/vscode-twig-language-2/issues/24) | Integration | No source fixture; see disposition |
| [#25: {% set %} with inline if statement broken after formatting - at least sometimes](https://github.com/mblode/vscode-twig-language-2/issues/25) | Formatter | Historical corpus (4 samples) |
| [#26: Twig Language 2 lowercase / CamelCase](https://github.com/mblode/vscode-twig-language-2/issues/26) | Formatter | `svg-case` |
| [#27: Disable attributes chaining](https://github.com/mblode/vscode-twig-language-2/issues/27) | Formatter | `multiline-attributes` |
| [#28: Line spaces taken out](https://github.com/mblode/vscode-twig-language-2/issues/28) | Preserve | No source fixture; see disposition |
| [#29: Just so broken...](https://github.com/mblode/vscode-twig-language-2/issues/29) | Formatter | `script-generated-code`, `legacy-ignore-region` |
| [#30: Twig suggestions takes over html suggestions](https://github.com/mblode/vscode-twig-language-2/issues/30) | Language | No source fixture; see disposition |
| [#31: Formatting messes up code when not using self-closing tags (HTML5) for <br> or <img>](https://github.com/mblode/vscode-twig-language-2/issues/31) | Formatter | `void-tags` |
| [PR 32: Autosurround support](https://github.com/mblode/vscode-twig-language-2/pull/32) | Language: autosurround | No source fixture; see disposition |
| [#33: Extra line breaks added in empty script tags](https://github.com/mblode/vscode-twig-language-2/issues/33) | Formatter | `empty-script` |
| [#34: Strange format behavior](https://github.com/mblode/vscode-twig-language-2/issues/34) | Needs source | `conditional-wrapper`, `alternative-wrappers` |
| [#35: Formatting issues after vscode March 2019 update](https://github.com/mblode/vscode-twig-language-2/issues/35) | Integration | Historical corpus (5 samples) |
| [#36: Javascript / CSS language support in {% js/css %} blocks?](https://github.com/mblode/vscode-twig-language-2/issues/36) | Language | Historical corpus (2 samples) |
| [#37: editor.tabsize and extension tab size not correct](https://github.com/mblode/vscode-twig-language-2/issues/37) | Integration | No source fixture; see disposition |
| [#38: HTML comments shift](https://github.com/mblode/vscode-twig-language-2/issues/38) | Formatter | `comment-stability` |
| [#39: Twig Block Short Tag Duplicated](https://github.com/mblode/vscode-twig-language-2/issues/39) | Formatter | `block-shorthand` |
| [#40: [Formatting] Stop replace tabs into spaces](https://github.com/mblode/vscode-twig-language-2/issues/40) | Integration | No source fixture; see disposition |
| [#41: Doctype doesn't respect preceding new line if previous line contains {% %}](https://github.com/mblode/vscode-twig-language-2/issues/41) | Formatter | Historical corpus (3 samples) |
| [#42: Anchor tag containing twig href broken in <li> parent](https://github.com/mblode/vscode-twig-language-2/issues/42) | Formatter | `list-href` |
| [#43: Block statements become inline](https://github.com/mblode/vscode-twig-language-2/issues/43) | Formatter | `set-assignment-capture` |
| [#44: {% endjs %} leaks syntax out of tag pair when it isn't at the start of a line](https://github.com/mblode/vscode-twig-language-2/issues/44) | Language | No source fixture; see disposition |
| [#45: Support for `{{ include(...) }}` function (add to existing `{% include '...' %}` tag support)](https://github.com/mblode/vscode-twig-language-2/issues/45) | Language | No source fixture; see disposition |
| [#46: Formatter collapses long inputs to single line when the tag contains {{ }}](https://github.com/mblode/vscode-twig-language-2/issues/46) | Preserve | `multiline-attributes` |
| [#47: Format Document affecting Twig replace() within HTML tag](https://github.com/mblode/vscode-twig-language-2/issues/47) | Formatter | `literal-spaces`, `multiline-value` |
| [PR 48: Bump js-yaml from 3.13.0 to 3.13.1](https://github.com/mblode/vscode-twig-language-2/pull/48) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [PR 49: Bump lodash from 4.17.11 to 4.17.14](https://github.com/mblode/vscode-twig-language-2/pull/49) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [#50: Adds infinite space before text](https://github.com/mblode/vscode-twig-language-2/issues/50) | Formatter | `paragraph-stability` |
| [#51: Broken format: {%%} get inline if the parent tags has class attribute](https://github.com/mblode/vscode-twig-language-2/issues/51) | Formatter | `first-child-block` |
| [PR 52: Bump eslint-utils from 1.3.1 to 1.4.2](https://github.com/mblode/vscode-twig-language-2/pull/52) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [#53: Syntax highlighting breaks when escaping quotes inside strings](https://github.com/mblode/vscode-twig-language-2/issues/53) | Language | Historical corpus (1 samples) |
| [PR 54: Bump eslint-utils from 1.3.1 to 1.4.3](https://github.com/mblode/vscode-twig-language-2/pull/54) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [PR 55: Bump mixin-deep from 1.3.1 to 1.3.2](https://github.com/mblode/vscode-twig-language-2/pull/55) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [#56: Formatter pushes comments to the right](https://github.com/mblode/vscode-twig-language-2/issues/56) | Formatter | `comment-stability` |
| [#57: CSS @media breaks classes](https://github.com/mblode/vscode-twig-language-2/issues/57) | Formatter | `css-media` |
| [#58: Wrapping html tag attributes](https://github.com/mblode/vscode-twig-language-2/issues/58) | Formatter | `multiline-attributes` |
| [#59: Auto-indent](https://github.com/mblode/vscode-twig-language-2/issues/59) | Language | No source fixture; see disposition |
| [PR 60: Add {% trans %} for symfony](https://github.com/mblode/vscode-twig-language-2/pull/60) | Language: trans snippet | No source fixture; see disposition |
| [#61: intellisense vscode 1.44](https://github.com/mblode/vscode-twig-language-2/issues/61) | Language | No source fixture; see disposition |
| [#62: viewBox attribute is changed to viewbox](https://github.com/mblode/vscode-twig-language-2/issues/62) | Formatter | `svg-case`, `component-case` |
| [#63: No option to change snippets to use single quotes](https://github.com/mblode/vscode-twig-language-2/issues/63) | Language | No source fixture; see disposition |
| [#64: Formatting with attributes like data-glide-dir="<" deletes everything](https://github.com/mblode/vscode-twig-language-2/issues/64) | Formatter | `literal-less-than` |
| [#65: Formatting issue when using comments](https://github.com/mblode/vscode-twig-language-2/issues/65) | Needs source | `comment-stability` |
| [#66: Syntax broken when using variable inside <style> tag](https://github.com/mblode/vscode-twig-language-2/issues/66) | Language | No source fixture; see disposition |
| [#67: with tag not appearing in intellisense](https://github.com/mblode/vscode-twig-language-2/issues/67) | Language | No source fixture; see disposition |
| [#68: where is "path" command trigger?](https://github.com/mblode/vscode-twig-language-2/issues/68) | Language | No source fixture; see disposition |
| [#69: Formatting in inline script tags does not keep indents](https://github.com/mblode/vscode-twig-language-2/issues/69) | Formatter | `script-indent` |
| [PR 70: Add support for {% scss %} tags](https://github.com/mblode/vscode-twig-language-2/pull/70) | Language: SCSS grammar | No source fixture; see disposition |
| [#71: 'Format Document With..' resulted in an error](https://github.com/mblode/vscode-twig-language-2/issues/71) | Integration | `unclosed-twig`, `unclosed-script`, `mismatched-expression` |
| [#72: Snippet trans: missing endtrans](https://github.com/mblode/vscode-twig-language-2/issues/72) | Language | Historical corpus (2 samples) |
| [PR 73: Fix trans snippet](https://github.com/mblode/vscode-twig-language-2/pull/73) | Language: trans snippet | No source fixture; see disposition |
| [#74: Can you please remove the complete formatting functionality](https://github.com/mblode/vscode-twig-language-2/issues/74) | Integration | Historical corpus (4 samples) |
| [#75: snippet : prefix trans](https://github.com/mblode/vscode-twig-language-2/issues/75) | Language | No source fixture; see disposition |
| [#76: Verbatim block doesn't work](https://github.com/mblode/vscode-twig-language-2/issues/76) | Language | `raw-verbatim`, `unclosed-verbatim` |
| [#77: Same codebase different results between 2 developers](https://github.com/mblode/vscode-twig-language-2/issues/77) | Integration | No source fixture; see disposition |
| [#78: Highlight doesn't work for 'is not empty' and 'is not defined'](https://github.com/mblode/vscode-twig-language-2/issues/78) | Language | Historical corpus (2 samples) |
| [#79: Support highlight for custom templates.](https://github.com/mblode/vscode-twig-language-2/issues/79) | Language | `custom-standalone` |
| [#80: A ability to turn off unstandard snippets like a 'switch'](https://github.com/mblode/vscode-twig-language-2/issues/80) | Language | No source fixture; see disposition |
| [#81: The formatter does not recognize some unclosed tags](https://github.com/mblode/vscode-twig-language-2/issues/81) | Formatter | No source fixture; see disposition |
| [#82: Formatter breaks escape filter parameters ](https://github.com/mblode/vscode-twig-language-2/issues/82) | Preserve | `literal-spaces` |
| [#83: Snippets for `elseif` and `apply`/`endapply`](https://github.com/mblode/vscode-twig-language-2/issues/83) | Language | No source fixture; see disposition |
| [PR 84: Add snippets for `elseif` and `apply`/`endapply`](https://github.com/mblode/vscode-twig-language-2/pull/84) | Language: elseif/apply snippets | No source fixture; see disposition |
| [#85: Ignore emmet inside conditional statement](https://github.com/mblode/vscode-twig-language-2/issues/85) | Language | No source fixture; see disposition |
| [#86: Format document: comment  block  shift right every time](https://github.com/mblode/vscode-twig-language-2/issues/86) | Formatter | `comment-stability` |
| [#87: Formatting is unusable](https://github.com/mblode/vscode-twig-language-2/issues/87) | Needs source | No source fixture; see disposition |
| [#88: Auto add space for `{{` and `{%`](https://github.com/mblode/vscode-twig-language-2/issues/88) | Language | No source fixture; see disposition |
| [#89: Bundle the package](https://github.com/mblode/vscode-twig-language-2/issues/89) | Release | No source fixture; see disposition |
| [#90: Incorrect indenting of comments](https://github.com/mblode/vscode-twig-language-2/issues/90) | Formatter | `comment-stability` |
| [#91: Weird emmet for a lot of twig codes](https://github.com/mblode/vscode-twig-language-2/issues/91) | Language | No source fixture; see disposition |
| [#92: Extension causes high cpu load](https://github.com/mblode/vscode-twig-language-2/issues/92) | Integration | No source fixture; see disposition |
| [PR 93: Help text suggestions for indentation settings](https://github.com/mblode/vscode-twig-language-2/pull/93) | Integration: indentation help replaced by editor default | No source fixture; see disposition |
| [#94: Indentation settings help text](https://github.com/mblode/vscode-twig-language-2/issues/94) | Integration | No source fixture; see disposition |
| [#95: Formatter adding new lines](https://github.com/mblode/vscode-twig-language-2/issues/95) | Formatter | `attribute-comment` |
| [#96: FR: autoCreateQuotes](https://github.com/mblode/vscode-twig-language-2/issues/96) | Language | No source fixture; see disposition |
| [#97: Auto closing tags not working with Twig](https://github.com/mblode/vscode-twig-language-2/issues/97) | Language | No source fixture; see disposition |
| [PR 98: Add logic operators highlight inside arrays and hashes](https://github.com/mblode/vscode-twig-language-2/pull/98) | Language: expression highlighting | No source fixture; see disposition |
| [#99: Formmating infinite "="](https://github.com/mblode/vscode-twig-language-2/issues/99) | Formatter | `no-infinite-equals` |
| [#100: Anchor tag containing href is broken after format](https://github.com/mblode/vscode-twig-language-2/issues/100) | Formatter | `list-href`, `generated-attribute` |
| [#101: ELSEIF Autocomplete not working](https://github.com/mblode/vscode-twig-language-2/issues/101) | Language | No source fixture; see disposition |
| [#102: Use Twig-CS-Fixer for formatting](https://github.com/mblode/vscode-twig-language-2/issues/102) | Release | No source fixture; see disposition |
| [#103: New version 0.9.3 is broken](https://github.com/mblode/vscode-twig-language-2/issues/103) | Integration | Historical corpus (4 samples) |
| [#104: Wrong setting](https://github.com/mblode/vscode-twig-language-2/issues/104) | Integration | No source fixture; see disposition |
| [#105: "Space close" typo](https://github.com/mblode/vscode-twig-language-2/issues/105) | Integration | No source fixture; see disposition |
| [#106: multiline paragraph get extra tabulation in formating](https://github.com/mblode/vscode-twig-language-2/issues/106) | Formatter | `paragraph-stability`, `unclosed-comment` |
| [#107: BUG: css gets mangled with :root](https://github.com/mblode/vscode-twig-language-2/issues/107) | Preserve | `css-twig-root` |
| [#108: How to open include file with [CTRL-click]?](https://github.com/mblode/vscode-twig-language-2/issues/108) | Language | No source fixture; see disposition |
| [#109: Project status check](https://github.com/mblode/vscode-twig-language-2/issues/109) | Release | No source fixture; see disposition |
| [#110: Even "indent Style" is "space" but indent is always use tab](https://github.com/mblode/vscode-twig-language-2/issues/110) | Integration | No source fixture; see disposition |
| [#111: Source formatting is broken](https://github.com/mblode/vscode-twig-language-2/issues/111) | Integration | No source fixture; see disposition |
| [#112: Incompatibility with Baptiste Darthenay's Django extension](https://github.com/mblode/vscode-twig-language-2/issues/112) | Integration | No source fixture; see disposition |
| [#113: "Format document" does not work when file begins with Twig comment {#](https://github.com/mblode/vscode-twig-language-2/issues/113) | Integration | `comment-first` |
| [#114: Wrong indentation inside <script type="text/javascript">](https://github.com/mblode/vscode-twig-language-2/issues/114) | Formatter | `script-indent`, `script-multiline-literal` |
| [#115: Support for Twig `{% types %}` blocks](https://github.com/mblode/vscode-twig-language-2/issues/115) | Preserve | `twig3-modern` |
| [#116: CSS grammar leaks into <script> blocks when <style> contains Twig expressions](https://github.com/mblode/vscode-twig-language-2/issues/116) | Language | `css-twig-root` |
| [#117: Formatter rewrite: migrate off the abandoned prettydiff engine](https://github.com/mblode/vscode-twig-language-2/issues/117) | Release | No source fixture; see disposition |
| [#118: Indent increase with every save inside Twig comments](https://github.com/mblode/vscode-twig-language-2/issues/118) | Formatter | `comment-stability` |
| [#119: Publish a new version based on `main`](https://github.com/mblode/vscode-twig-language-2/issues/119) | Release | No source fixture; see disposition |
| [PR 120: Bump the npm_and_yarn group across 1 directory with 5 updates](https://github.com/mblode/vscode-twig-language-2/pull/120) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [PR 121: Bump lodash](https://github.com/mblode/vscode-twig-language-2/pull/121) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [PR 122: Bump decode-uri-component from 0.2.0 to 0.2.2](https://github.com/mblode/vscode-twig-language-2/pull/122) | Dependency: old dependency removed/replaced | No source fixture; see disposition |

## vscode-twig-language

| Item | Disposition | Source fixtures |
|---|---|---|
| [#1: At last a good Twig plugin for Vscode: This is awesome!!!](https://github.com/mblode/vscode-twig-language/issues/1) | Other | No source fixture; see disposition |
| [#2: add option to enable/disable function](https://github.com/mblode/vscode-twig-language/issues/2) | Integration | No source fixture; see disposition |
| [#3: Formatting issue](https://github.com/mblode/vscode-twig-language/issues/3) | Formatter | `inline-text` |
| [#4: HTML Autocomplete Not Working](https://github.com/mblode/vscode-twig-language/issues/4) | Language | No source fixture; see disposition |
| [#5: twig are consider HTML5](https://github.com/mblode/vscode-twig-language/issues/5) | Language | No source fixture; see disposition |
| [#6: Formatting issues...](https://github.com/mblode/vscode-twig-language/issues/6) | Formatter | `nested-quotes`, `switch-cases` |
| [#7: No twig language installed](https://github.com/mblode/vscode-twig-language/issues/7) | Integration | No source fixture; see disposition |
| [#8: Tab triggers for expressions](https://github.com/mblode/vscode-twig-language/issues/8) | Language | Historical corpus (2 samples) |
| [#9: Tab size](https://github.com/mblode/vscode-twig-language/issues/9) | Integration | No source fixture; see disposition |
| [#10: PrettyDiff config ignores editor tab settings](https://github.com/mblode/vscode-twig-language/issues/10) | Integration | No source fixture; see disposition |
| [#11: Sorry, but there is no formatter for 'twig'-files installed?](https://github.com/mblode/vscode-twig-language/issues/11) | Integration | No source fixture; see disposition |
| [#12: Whitespace removed when formatting](https://github.com/mblode/vscode-twig-language/issues/12) | Formatter | `for-array` |
| [#13: Built in formatter appears to be interfering with .html files, as well as .twig](https://github.com/mblode/vscode-twig-language/issues/13) | Integration | No source fixture; see disposition |
| [#14: Auto-changes on save - image](https://github.com/mblode/vscode-twig-language/issues/14) | Needs source | No source fixture; see disposition |
| [#15: Issues formatting block shortcuts](https://github.com/mblode/vscode-twig-language/issues/15) | Formatter | `block-shorthand` |
| [#16: Respect editorconfig indentation settings](https://github.com/mblode/vscode-twig-language/issues/16) | Integration | No source fixture; see disposition |
| [#17: Auto indent not working](https://github.com/mblode/vscode-twig-language/issues/17) | Language | No source fixture; see disposition |
| [PR 18: Removed .DS_Store file and fixed gitignore](https://github.com/mblode/vscode-twig-language/pull/18) | Other: repository hygiene | No source fixture; see disposition |
| [#19: Disable Craft CMS snippets](https://github.com/mblode/vscode-twig-language/issues/19) | Language | No source fixture; see disposition |
| [#20: Add "trans" block snippet](https://github.com/mblode/vscode-twig-language/issues/20) | Language | No source fixture; see disposition |
| [#21: Possible to change comment syntax based on .html vs .twig file extension](https://github.com/mblode/vscode-twig-language/issues/21) | Language | No source fixture; see disposition |
| [PR 22: Added do css/js to replace include css/js](https://github.com/mblode/vscode-twig-language/pull/22) | Language: Craft snippets | No source fixture; see disposition |
| [#23: Deletes entire files on save](https://github.com/mblode/vscode-twig-language/issues/23) | Formatter | `alternative-wrappers`, `script-generated-code` |
| [#24: Add support for the elvis operator](https://github.com/mblode/vscode-twig-language/issues/24) | Language | No source fixture; see disposition |
| [#25: formatting script inside custom block went wrong](https://github.com/mblode/vscode-twig-language/issues/25) | Preserve | No source fixture; see disposition |
| [#26: highlight should not affect native and custom element](https://github.com/mblode/vscode-twig-language/issues/26) | Language | Historical corpus (2 samples) |
| [#27: Formatting wrap text will result in infinite indentation and auto-add double quotes for value](https://github.com/mblode/vscode-twig-language/issues/27) | Formatter | `paragraph-stability` |
| [#28: Formatting json incorrectly](https://github.com/mblode/vscode-twig-language/issues/28) | Preserve | No source fixture; see disposition |
| [#29: I cannot get the formatter to respect the 2 spaces indent setting](https://github.com/mblode/vscode-twig-language/issues/29) | Integration | No source fixture; see disposition |
| [#30: Block Short Tag Duplicating](https://github.com/mblode/vscode-twig-language/issues/30) | Formatter | `block-shorthand`, `named-endblock` |
| [#31: Twig Block Shorthand Synatx Indentation](https://github.com/mblode/vscode-twig-language/issues/31) | Formatter | `block-shorthand` |
| [PR 32: Bump sshpk from 1.13.1 to 1.16.1](https://github.com/mblode/vscode-twig-language/pull/32) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [PR 33: Bump js-yaml from 3.13.0 to 3.13.1](https://github.com/mblode/vscode-twig-language/pull/33) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [#34: Statement Tags do not close](https://github.com/mblode/vscode-twig-language/issues/34) | Language | No source fixture; see disposition |
| [PR 35: removing single bracket from twig config, adding twig brackets](https://github.com/mblode/vscode-twig-language/pull/35) | Language: bracket pairs | No source fixture; see disposition |
| [PR 36: Bump lodash from 4.17.11 to 4.17.14](https://github.com/mblode/vscode-twig-language/pull/36) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [#37: Html autoComplete Not Working](https://github.com/mblode/vscode-twig-language/issues/37) | Language | No source fixture; see disposition |
| [#38: Override html comments ](https://github.com/mblode/vscode-twig-language/issues/38) | Language | No source fixture; see disposition |
| [#39: Problem using "-" like in {%- block 'X' -%} ](https://github.com/mblode/vscode-twig-language/issues/39) | Language | `trim-markers` |
| [PR 40: Bump eslint-utils from 1.3.1 to 1.4.2](https://github.com/mblode/vscode-twig-language/pull/40) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [#41: Formatting indented block comments pushes them out to infinity](https://github.com/mblode/vscode-twig-language/issues/41) | Formatter | `comment-stability`, `ignore-region` |
| [PR 42: Bump mixin-deep from 1.3.1 to 1.3.2](https://github.com/mblode/vscode-twig-language/pull/42) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [PR 43: Bump eslint-utils from 1.3.1 to 1.4.3](https://github.com/mblode/vscode-twig-language/pull/43) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [#44: Problems with javascript in twig](https://github.com/mblode/vscode-twig-language/issues/44) | Preserve | `javascript-attribute` |
| [#45: Add support for embedded MJML](https://github.com/mblode/vscode-twig-language/issues/45) | Language | No source fixture; see disposition |
| [#46: Javascript  won't be formatted](https://github.com/mblode/vscode-twig-language/issues/46) | Preserve | `script-indent` |
| [#47: Spacing in variables](https://github.com/mblode/vscode-twig-language/issues/47) | Formatter | Historical corpus (2 samples) |
| [#48: Block inside tag wrong format](https://github.com/mblode/vscode-twig-language/issues/48) | Formatter | `first-child-block` |
| [#49: Adds infinite space before variable inside js code](https://github.com/mblode/vscode-twig-language/issues/49) | Formatter | `script-string-spaces` |
| [#50: Please make single/double quotes configurable + Quotes in README don't reflect snippets](https://github.com/mblode/vscode-twig-language/issues/50) | Language | No source fixture; see disposition |
| [#51: Please publish the extension to Open VSX](https://github.com/mblode/vscode-twig-language/issues/51) | Release | No source fixture; see disposition |
| [#52: Javascript Format](https://github.com/mblode/vscode-twig-language/issues/52) | Preserve | `script-indent` |
| [#53: Is there a way to change formatting options?](https://github.com/mblode/vscode-twig-language/issues/53) | Integration | No source fixture; see disposition |
| [#54: FR: Add color to filters](https://github.com/mblode/vscode-twig-language/issues/54) | Language | No source fixture; see disposition |
| [#55: FR: add "elseif" trigger](https://github.com/mblode/vscode-twig-language/issues/55) | Language | No source fixture; see disposition |
| [#56: endcss tag does not end css styling](https://github.com/mblode/vscode-twig-language/issues/56) | Language | No source fixture; see disposition |
| [#57: The href attribute of the anchor element sticks to the previous word..](https://github.com/mblode/vscode-twig-language/issues/57) | Formatter | `list-href` |
| [#58: formatting - linebreaks in html tags (on attributes) will be removed](https://github.com/mblode/vscode-twig-language/issues/58) | Preserve | `multiline-attributes` |
| [#59: There is no formatter for 'twig' files installed.](https://github.com/mblode/vscode-twig-language/issues/59) | Integration | No source fixture; see disposition |
| [#60: Feature request: Open base template on click](https://github.com/mblode/vscode-twig-language/issues/60) | Language | Historical corpus (2 samples) |
| [#61: Closing brackets inside html tags](https://github.com/mblode/vscode-twig-language/issues/61) | Language | Historical corpus (2 samples) |
| [#62: Emmets not working](https://github.com/mblode/vscode-twig-language/issues/62) | Language | No source fixture; see disposition |
| [#63: Code changed to gray after latest update](https://github.com/mblode/vscode-twig-language/issues/63) | Language | No source fixture; see disposition |
| [#64: Nested control structures are hard to read](https://github.com/mblode/vscode-twig-language/issues/64) | Language | No source fixture; see disposition |
| [#65: Quotes style](https://github.com/mblode/vscode-twig-language/issues/65) | Language | No source fixture; see disposition |
| [#66: Tracking: PrettyDiff formatter bugs (whitespace, indentation, JS-in-Twig)](https://github.com/mblode/vscode-twig-language/issues/66) | Release | No source fixture; see disposition |
| [PR 67: Fix Twig CSS block end highlighting](https://github.com/mblode/vscode-twig-language/pull/67) | Language: CSS block grammar | No source fixture; see disposition |
| [PR 68: Bump the npm_and_yarn group across 1 directory with 6 updates](https://github.com/mblode/vscode-twig-language/pull/68) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [PR 69: Bump lodash](https://github.com/mblode/vscode-twig-language/pull/69) | Dependency: old dependency removed/replaced | No source fixture; see disposition |

## vscode-pretty-formatter

| Item | Disposition | Source fixtures |
|---|---|---|
| [#1: Pretty formatter](https://github.com/mblode/vscode-pretty-formatter/issues/1) | Other | No source fixture; see disposition |
| [#2: Support for SQL](https://github.com/mblode/vscode-pretty-formatter/issues/2) | Other | No source fixture; see disposition |
| [#3: HTML in-line tags treated the same as layout tags](https://github.com/mblode/vscode-pretty-formatter/issues/3) | Formatter | `inline-text`, `inline-boundary` |
| [#4: use config file instead of separate configuration](https://github.com/mblode/vscode-pretty-formatter/issues/4) | Integration | No source fixture; see disposition |
| [#5: Python f-strings](https://github.com/mblode/vscode-pretty-formatter/issues/5) | Other | No source fixture; see disposition |
| [#6: Wrong Tag in VS Marketplace](https://github.com/mblode/vscode-pretty-formatter/issues/6) | Other | No source fixture; see disposition |
| [#7: Breaks c# code ](https://github.com/mblode/vscode-pretty-formatter/issues/7) | Other | No source fixture; see disposition |
| [#8: Freemarker formatting not working](https://github.com/mblode/vscode-pretty-formatter/issues/8) | Other | Historical corpus (2 samples) |
| [#9: EEX Elixir Templates support?](https://github.com/mblode/vscode-pretty-formatter/issues/9) | Other | No source fixture; see disposition |
| [#10: Extension description does not mention that it autoformats](https://github.com/mblode/vscode-pretty-formatter/issues/10) | Integration | No source fixture; see disposition |
| [PR 11: Fix two cases of camelCase where snake_case expected](https://github.com/mblode/vscode-pretty-formatter/pull/11) | Integration: old option-name fixes superseded | No source fixture; see disposition |
| [#12: Smaller than character breaks formatting in a twig file](https://github.com/mblode/vscode-pretty-formatter/issues/12) | Formatter | `comparison-in-attribute` |
| [#13: Formatting QML](https://github.com/mblode/vscode-pretty-formatter/issues/13) | Other | No source fixture; see disposition |
| [#14: vscode-pretty-formatter  coldfusion](https://github.com/mblode/vscode-pretty-formatter/issues/14) | Other | No source fixture; see disposition |
| [#15: Causes breaking code changes at worst, ugly code at best for TypeScript without semicolons](https://github.com/mblode/vscode-pretty-formatter/issues/15) | Other | No source fixture; see disposition |
| [#16: Open VSX Listing: Signing the Publisher Agreement](https://github.com/mblode/vscode-pretty-formatter/issues/16) | Release | No source fixture; see disposition |
| [#17: twig markup breaks nested blocks](https://github.com/mblode/vscode-pretty-formatter/issues/17) | Formatter | `nested-block-in-attribute` |
| [#18: CSS media queries get formatted incorrectly.](https://github.com/mblode/vscode-pretty-formatter/issues/18) | Formatter | `css-media` |
| [#19: Bad formatting in Typescript when 2 template parameters in a class def](https://github.com/mblode/vscode-pretty-formatter/issues/19) | Other | No source fixture; see disposition |
| [PR 20: fix: Titanium TSS selector](https://github.com/mblode/vscode-pretty-formatter/pull/20) | Other: Titanium language | No source fixture; see disposition |
| [#21: Extension causes high cpu load](https://github.com/mblode/vscode-pretty-formatter/issues/21) | Integration | No source fixture; see disposition |
| [#22: Doesn't Work With Frontmatter](https://github.com/mblode/vscode-pretty-formatter/issues/22) | Other | Historical corpus (2 samples) |
| [#23: Indent with tabs?](https://github.com/mblode/vscode-pretty-formatter/issues/23) | Integration | No source fixture; see disposition |
| [#24: XML not see](https://github.com/mblode/vscode-pretty-formatter/issues/24) | Other | No source fixture; see disposition |
| [#25: Where is v2 Repo, Marketplace entry and settings?](https://github.com/mblode/vscode-pretty-formatter/issues/25) | Other | No source fixture; see disposition |
| [#26: Can not change indentation size, always 4 spaces](https://github.com/mblode/vscode-pretty-formatter/issues/26) | Integration | No source fixture; see disposition |
| [#27: Disable formatting](https://github.com/mblode/vscode-pretty-formatter/issues/27) | Integration | No source fixture; see disposition |
| [#28: Formatter rewrite: migrate off the abandoned prettydiff engine](https://github.com/mblode/vscode-pretty-formatter/issues/28) | Release | No source fixture; see disposition |
| [PR 29: Bump the npm_and_yarn group across 1 directory with 9 updates](https://github.com/mblode/vscode-pretty-formatter/pull/29) | Dependency: old dependency removed/replaced | No source fixture; see disposition |
| [PR 30: Bump braces from 3.0.2 to 3.0.3](https://github.com/mblode/vscode-pretty-formatter/pull/30) | Dependency: old dependency removed/replaced | No source fixture; see disposition |

## Marketplace review index

Ratings-only entries are included. Short descriptions below are dispositions, not verbatim quotations. No reviewer identities are needed for this audit.

| Listing | Review ID | Rating | Disposition |
|---|---:|---:|---|
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 342988 | 2/5 | Formatter: full conditional-wrapper regression |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 288391 | 5/5 | Rating only |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 266964 | 1/5 | Needs source: intermittent availability |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 262552 | 1/5 | Formatter: CSS media query regression |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 259548 | 5/5 | Positive feedback |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 256540 | 1/5 | Formatter: equals and indentation stability |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 220084 | 1/5 | Language; embedded CSS coverage |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 208983 | 5/5 | Rating only |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 197181 | 1/5 | Needs source: no reproduction |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 192855 | 4/5 | Formatter: conditional wrappers; no original source |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 170940 | 5/5 | Positive feedback |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 162080 | 5/5 | Rating only |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 146820 | 1/5 | Integration toggle; first-child layout |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 142649 | 3/5 | Preserve: conditional HTML comments |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 141461 | 5/5 | Rating only |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 136334 | 3/5 | Needs source: unspecified breakage |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 130733 | 5/5 | Positive feedback |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 126670 | 5/5 | Positive feedback |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 125610 | 5/5 | Rating only |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 123508 | 4/5 | Language: HTML IntelliSense |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 123046 | 3/5 | Language: HTML IntelliSense |
| [twig-language-2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2&ssr=false#review-details) | 121430 | 5/5 | Rating only |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 290518 | 5/5 | Rating only |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 220979 | 5/5 | Positive feedback |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 220083 | 1/5 | Language; embedded CSS coverage |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 176992 | 5/5 | Positive formatting/comment feedback |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 172647 | 2/5 | Formatter: JavaScript and comment stability |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 154813 | 5/5 | Rating only |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 153285 | 4/5 | Language: HTML comments and associations |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 150056 | 4/5 | Formatter: duplicated option/output regression |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 119151 | 5/5 | Rating only |
| [twig-language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language&ssr=false#review-details) | 118389 | 5/5 | Rating only |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 232318 | 5/5 | Positive feedback |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 230705 | 1/5 | Needs source: reported deletion |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 221969 | 5/5 | Positive feedback |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 216363 | 1/5 | Other: Jinja2; preservation tests relevant |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 188012 | 3/5 | Formatter: CSS media query; style preferences |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 167125 | 5/5 | Positive feedback |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 166565 | 5/5 | Positive feedback |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 164398 | 5/5 | Positive feedback |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 159974 | 5/5 | Positive feedback |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 157004 | 2/5 | Other: XML depth |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 142121 | 5/5 | Positive feedback |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 141841 | 1/5 | Needs source: reported HTML deletion |
| [pretty-formatter](https://marketplace.visualstudio.com/items?itemName=mblode.pretty-formatter&ssr=false#review-details) | 141637 | 5/5 | Rating only |

## Release verification

The implementation at `3e8ce8881ac71c09c62919d0cecefe64dc46cfd7` passed 287 tests with no skipped tests, including the independent official Twig oracle. The real VS Code integration suite passed on macOS with VS Code 1.85.2 and 1.136.1, and on Linux in [CI](https://github.com/mblode/vscode-twig-language-2/actions/runs/34164220987). Both local and CI tests exercised the extracted release VSIX. Their 13 packaged files are byte-identical. Production and development npm audits report zero vulnerabilities.

[Release and VSIX](https://github.com/mblode/vscode-twig-language-2/releases/tag/v0.11.0). SHA-256: `fdcfa3a5b5589752203727bae6b4805b8cd3521c8fa7ecad0ab51cc01cb6f12b`.

[Marketplace](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2) reports version 0.11.0, updated 2026-09-07T21:53:18.703Z. The publicly downloaded package, after HTTP gzip decompression, is byte-identical to the tested local VSIX and GitHub release asset. Its version manifest is 0.11.0 and its SHA-256 matches the value above.


## Follow-up release coverage

Twig Language 2 0.12.0 and Twig Language 0.10.0 share the formatter and language assets. `test/language.test.js` adds executed TextMate regressions for Twig 1 #24/#26/#56 and Twig 2 #19/#44/#45/#53/#116, plus raw blocks and SCSS whitespace controls. Packaged Twig 2 tests cover HTML completion and #97 automatic closing tags. Snippet scopes and the malformed assets query are fixed; `<` is permitted after automatic Twig delimiter completion for Twig 1 #61.

Pretty Formatter 0.3.0 replaces PrettyDiff with this Twig core and explicitly selected bundled parsers. Its `test/multiformat.test.js` covers #8/#9/#13/#14/#15/#18/#19/#22/#23/#24/#26; the packaged suite checks activation and live `disableLanguages`/formatting controls (#27). Worker limits address #21. Twig issue sources #12/#17 and inline HTML #3 are in the shared corpus. The old unverified claim of 38 fully formatted languages is removed; see Pretty Formatter README for current language-specific guarantees. Source-less or image-only reports still do not establish exact-case reproduction. No claim of every possible bug being eliminated is made.

## Expanded release verification, 8 September 2026

All three releases are published on GitHub and Marketplace. Each public Marketplace download is byte-identical to its tested local VSIX and GitHub release asset. All CI-built packaged file contents match the local packages. The tests below include shared cases executed in each distribution, not 908 distinct regressions.

| Extension | Version | Passing tests | CI | VSIX SHA-256 |
|---|---|---:|---|---|
| twig-language-2 | [0.12.0](https://github.com/mblode/vscode-twig-language-2/releases/tag/v0.12.0) | 301 | [Passed](https://github.com/mblode/vscode-twig-language-2/actions/runs/34167358166) | `86e5cb868721ae65b47f1cc3b9dfeb86dfd77ff6a725c3ad45df9bb2dedf5edc` |
| twig-language | [0.10.0](https://github.com/mblode/vscode-twig-language/releases/tag/v0.10.0) | 301 | [Passed](https://github.com/mblode/vscode-twig-language/actions/runs/34167526575) | `66e8b1f60bbe6fa3a313f0d2f8aae722a78c3c8e28bb58389b5fdcee84f6bffc` |
| pretty-formatter | [0.3.0](https://github.com/mblode/vscode-pretty-formatter/releases/tag/v0.3.0) | 306 | [Passed](https://github.com/mblode/vscode-pretty-formatter/actions/runs/34167346063) | `2887270703883cbaa5460e7f6378564a476b1e50dec839e70be381490d8cfa07` |

Each packaged runtime passed real VS Code 1.85.2 and 1.136.1 on macOS and stable VS Code on Linux. Test profiles are isolated. Official Twig lexer/render checks are required in CI and passed with no skips. Dependency audits report zero vulnerabilities in all three repositories. Shared source hashes are checked by `.twig-core.json` and `test/core-provenance.test.js`; the canonical synchronization script is `scripts/sync-core.mjs`. The language adapter also has a regression for delayed cursor updates and empty dirty-state notifications during automatic HTML closing.

Both Twig listings retain their original IDs, language modes and settings namespaces. Twig Language 2 is the canonical source; Twig Language is the compatibility distribution. Unsupported Pretty Formatter dialects and reports without reproducible source retain the explicit limits described above and in each README.

## Open VSX publication verification

On 2026-09-08, Twig Language 2 0.12.0, Twig Language 0.10.0 and Pretty Formatter 0.3.0 were published using the existing publisher account. Each public Open VSX VSIX download exactly matches its tested Marketplace/GitHub package by SHA-256.

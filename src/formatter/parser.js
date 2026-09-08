"use strict";

const { scan, SyntaxError } = require("./lexer");
const BLOCKS = new Set(
  "if for block macro set apply filter autoescape with embed sandbox spaceless trans cache switch nav ifchildren component capture".split(
    " ",
  ),
);
const STATEMENTS = new Set(
  "extends include import from use do flush deprecated props types".split(" "),
);
const BRANCHES = new Set(["else", "elseif", "case", "default"]);

function isOpening(info, paired) {
  if (!BLOCKS.has(info.name) && !paired.has(info.name)) return false;
  if (info.name === "set" && info.atoms.some((a) => a.text === "="))
    return false;
  if (info.name === "block" && info.atoms.length > 2) return false;
  return true;
}

// The source-order leaves are lossless. Twig owns its own block tree; HTML
// leaves deliberately do not constrain it, since Twig can conditionally emit
// either half of an HTML element. All offsets use JavaScript/VS Code UTF-16.
function parse(source) {
  let tokens;
  try {
    tokens = scan(source);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return {
      type: "document",
      start: 0,
      end: source.length,
      tokens: [{ type: "error", start: 0, end: source.length, raw: source }],
      children: [],
      opaque: [],
      diagnostics: [
        {
          code: "lexical",
          start: error.offset,
          end: source.length,
          message: error.message,
        },
      ],
      lexicalError: error,
    };
  }
  const document = {
    type: "document",
    start: 0,
    end: source.length,
    tokens,
    children: [],
    opaque: [],
    diagnostics: [],
  };
  const paired = new Set(
    tokens
      .filter((t) => t.type === "tag" && t.info.name.startsWith("end"))
      .map((t) => t.info.name.slice(3)),
  );
  const stack = [];
  let children = document.children;
  const diagnostic = (token, code, message) =>
    document.diagnostics.push({
      code,
      start: token.start,
      end: token.end,
      message,
    });
  for (const token of tokens) {
    if (token.type !== "tag") {
      children.push(token);
      continue;
    }
    const { name } = token.info;
    if (name.startsWith("end")) {
      const frame = stack[stack.length - 1];
      if (!frame || frame.node.name !== name.slice(3)) {
        diagnostic(token, "unexpected-end", `Unexpected ${name}`);
        children.push(token);
        continue;
      }
      token.role = "close";
      const previousBranch = frame.node.branches.at(-1);
      if (previousBranch) previousBranch.end = token.start;
      frame.node.close = token;
      frame.node.end = token.end;
      if (frame.node.unknown)
        document.opaque.push({ start: frame.node.start, end: token.end });
      stack.pop();
      children = frame.parent;
    } else if (BRANCHES.has(name)) {
      const frame = stack[stack.length - 1];
      const allowed =
        frame &&
        ((name === "elseif" && frame.node.name === "if") ||
          (name === "else" && ["if", "for"].includes(frame.node.name)) ||
          (["case", "default"].includes(name) && frame.node.name === "switch"));
      if (!allowed || frame.terminal) {
        diagnostic(token, "unexpected-branch", `Unexpected ${name}`);
        children.push(token);
        continue;
      }
      frame.terminal = name === "else" || name === "default";
      token.role = "branch";
      const previousBranch = frame.node.branches.at(-1);
      if (previousBranch) previousBranch.end = token.start;
      const branch = {
        type: "branch",
        start: token.start,
        end: source.length,
        open: token,
        children: [],
      };
      frame.node.branches.push(branch);
      children = branch.children;
    } else if (isOpening(token.info, paired)) {
      if (stack.length >= 256)
        throw new Error("Twig nesting exceeds 256 levels");
      token.role = "open";
      const node = {
        type: "block",
        name,
        start: token.start,
        end: source.length,
        open: token,
        close: null,
        unknown: !BLOCKS.has(name),
        children: [],
        branches: [],
      };
      children.push(node);
      stack.push({ node, parent: children, terminal: false });
      children = node.children;
    } else {
      children.push(token);
      if (!STATEMENTS.has(name) && !["set", "block"].includes(name))
        document.opaque.push({ start: token.start, end: token.end });
    }
  }
  for (const { node } of stack)
    diagnostic(node.open, "unclosed-block", `Unclosed ${node.name} block`);
  document.opaque.sort((a, b) => a.start - b.start || b.end - a.end);
  // Collapse nested protected regions for a linear edit sweep.
  const merged = [];
  for (const region of document.opaque) {
    const previous = merged[merged.length - 1];
    if (previous && region.start <= previous.end)
      previous.end = Math.max(previous.end, region.end);
    else merged.push({ ...region });
  }
  document.opaque = merged;
  return document;
}

// Sorted disjoint intervals keep protection checks logarithmic even for files
// with thousands of custom tags. A zero-width insertion inside a region is protected.
function isOpaque(regions, start, end = start) {
  let lo = 0,
    hi = regions.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (regions[mid].end <= start) lo = mid + 1;
    else hi = mid;
  }
  return (
    lo < regions.length &&
    (end === start ? regions[lo].start <= start : regions[lo].start < end)
  );
}

module.exports = { parse, isOpaque };

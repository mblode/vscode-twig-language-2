"use strict";
const prettier = require("prettier/standalone");
const babel = require("prettier/plugins/babel");
const estree = require("prettier/plugins/estree");
const postcss = require("prettier/plugins/postcss");
const { twigStart, twigEnd } = require("./lexer");

function islands(source) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (!twigStart(source, i)) continue;
    const end = twigEnd(source, i);
    result.push({ start: i, end, raw: source.slice(i, end) });
    i = end - 1;
  }
  return result;
}

function stringRanges(ast) {
  const ranges = [];
  const stack = [ast];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (node.type === "StringLiteral" || node.type === "TemplateElement")
      ranges.push([node.start, node.end]);
    for (const [key, value] of Object.entries(node)) {
      if (["tokens", "comments", "loc", "extra"].includes(key)) continue;
      if (Array.isArray(value)) stack.push(...value);
      else if (value && typeof value === "object") stack.push(value);
    }
  }
  return ranges;
}

function cssStringRanges(source) {
  const ranges = [];
  for (let i = 0; i < source.length; i++) {
    if (source.startsWith("/*", i)) {
      const end = source.indexOf("*/", i + 2);
      if (end < 0) break;
      i = end + 1;
      continue;
    }
    if (source[i] !== '"' && source[i] !== "'") continue;
    const start = i,
      quote = source[i++];
    for (; i < source.length; i++) {
      if (source[i] === "\\") i++;
      else if (source[i] === quote) break;
    }
    ranges.push([start, i + 1]);
  }
  return ranges;
}

async function formatEmbedded(token, source, options) {
  const body = source.slice(token.bodyStart, token.bodyEnd);
  const opening = source.slice(token.start, token.openingEnd);
  const closing = source.slice(token.closingStart, token.end);
  if (!body.trim()) return token.raw;
  // JSON/data scripts and non-CSS styles are literal payloads, not JavaScript/CSS.
  const type = /\btype\s*=\s*(['"])(.*?)\1/i.exec(opening)?.[2].toLowerCase();
  const parser = token.kind === "style" ? "css" : "babel";
  if (
    type &&
    !(
      parser === "css"
        ? ["text/css"]
        : ["module", "text/javascript", "application/javascript"]
    ).includes(type)
  )
    return token.raw;
  if (/\b(?:src|lang)\s*=/i.test(opening)) return token.raw;
  try {
    const twig = islands(body);
    if (twig.length && parser === "css") return token.raw;
    const common = {
      parser,
      plugins: [babel, estree, postcss],
      tabWidth: options.tabSize,
      useTabs: !options.insertSpaces,
      printWidth: options.wrap || 80,
      endOfLine: options.eol === "\r\n" ? "crlf" : "lf",
    };
    if (twig.length) {
      const ast = await babel.parsers.babel.parse(body, common);
      const ranges = stringRanges(ast);
      if (
        twig.some(
          (t) =>
            !t.raw.startsWith("{{") ||
            !ranges.some(([a, b]) => a <= t.start && b >= t.end),
        )
      )
        return token.raw;
    }
    const formatted = (await prettier.format(body, common)).trimEnd();
    if (
      JSON.stringify(islands(formatted).map((t) => t.raw)) !==
      JSON.stringify(twig.map((t) => t.raw))
    )
      return token.raw;
    const protectedRanges =
      parser === "babel"
        ? stringRanges(await babel.parsers.babel.parse(formatted, common))
        : cssStringRanges(formatted);
    // Prefixing every line would mutate multiline template-string values.
    const unit = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";
    const prefix = unit.repeat(token.depth + 1);
    let offset = 0;
    const indented = formatted
      .split(options.eol)
      .map((line) => {
        const insideString = protectedRanges.some(
          ([a, b]) => offset > a && offset < b,
        );
        offset += line.length + options.eol.length;
        return line && !insideString ? prefix + line : line;
      })
      .join(options.eol);
    return (
      opening +
      options.eol +
      indented +
      options.eol +
      unit.repeat(token.depth) +
      closing
    );
  } catch {
    // An unsupported embedded body is retained exactly, including its whitespace.
    return token.raw;
  }
}
module.exports = { formatEmbedded };

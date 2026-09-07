"use strict";

class SyntaxError extends Error {
  constructor(message, offset) {
    super(`${message} at offset ${offset}`);
    this.name = "TwigFormatError";
    this.offset = offset;
  }
}

const twigStart = (source, i) =>
  source[i] === "{" && ["{", "%", "#"].includes(source[i + 1]);
const word = /^[\p{L}_][\p{L}\p{N}_]*/u;

// Twig interpolation can contain strings of its own: "Hello #{map["name"]}".
function quotedEnd(source, start) {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === "\\") {
      i += 2;
      continue;
    }
    if (source[i] === quote) return i + 1;
    if (quote === '"' && source.startsWith("#{", i)) {
      let depth = 1;
      i += 2;
      while (i < source.length && depth) {
        if (source[i] === '"' || source[i] === "'") i = quotedEnd(source, i);
        else if (source[i++] === "{") depth++;
        else if (source[i - 1] === "}") depth--;
      }
      if (depth) throw new SyntaxError("Unclosed string interpolation", start);
      continue;
    }
    i++;
  }
  throw new SyntaxError("Unclosed string", start);
}

function twigEnd(source, start) {
  const close =
    source[start + 1] === "{" ? "}}" : source[start + 1] === "%" ? "%}" : "#}";
  if (close === "#}") {
    const end = source.indexOf(close, start + 2);
    if (end < 0) throw new SyntaxError("Unclosed Twig comment", start);
    return end + 2;
  }
  const stack = [];
  let i = start + 2;
  while (i < source.length) {
    if (!stack.length && source.startsWith(close, i)) return i + 2;
    const c = source[i];
    if (c === '"' || c === "'") {
      i = quotedEnd(source, i);
      continue;
    }
    if (c === "#") {
      const newline = source.indexOf("\n", i);
      if (newline < 0) throw new SyntaxError("Unclosed Twig line comment", i);
      i = newline + 1;
      continue;
    }
    if ("([{".includes(c)) stack.push(c);
    else if (")]}".includes(c)) {
      if (stack.pop() !== { ")": "(", "]": "[", "}": "{" }[c])
        throw new SyntaxError("Unbalanced Twig expression", i);
    }
    i++;
  }
  throw new SyntaxError("Unclosed Twig expression", start);
}

function expressionParts(source) {
  const parts = [];
  let i = 0;
  while (i < source.length) {
    const start = i;
    const c = source[i];
    let kind = "symbol";
    if (/\s/.test(c)) {
      while (/\s/.test(source[i] || "") && i < source.length) i++;
      kind = "space";
    } else if (c === '"' || c === "'") {
      i = quotedEnd(source, i);
      kind = "string";
    } else if (c === "#") {
      i = source.indexOf("\n", i);
      if (i < 0) i = source.length;
      kind = "comment";
    } else {
      const match =
        source.slice(i).match(/^b-(?:and|or|xor)\b/) ||
        source.slice(i).match(word) ||
        source.slice(i).match(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      if (match) {
        i += match[0].length;
        kind = "word";
      } else {
        const op = [
          "<=>",
          "===",
          "!==",
          "...",
          "=>",
          "==",
          "!=",
          "<=",
          ">=",
          "??",
          "?:",
          "**",
          "//",
          "..",
          "?.",
          "&&",
          "||",
        ].find((x) => source.startsWith(x, i));
        i += op ? op.length : 1;
      }
    }
    parts.push({ kind, text: source.slice(start, i), start, end: i });
  }
  return parts;
}

function twigInfo(raw) {
  const left = /^[{][{%#][-~]?/.exec(raw)[0];
  const right = /[-~]?[}%#][}]$/.exec(raw)[0];
  const body = raw.slice(left.length, -right.length);
  const parts = expressionParts(body);
  const atoms = parts.filter((x) => x.kind !== "space" && x.kind !== "comment");
  return { left, right, body, parts, atoms, name: atoms[0]?.text || "" };
}

function htmlEnd(source, start) {
  let i = start + 1;
  let quote = null;
  while (i < source.length) {
    if (twigStart(source, i)) {
      i = twigEnd(source, i);
      continue;
    }
    const c = source[i++];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === ">") return i;
  }
  throw new SyntaxError("Unclosed HTML tag", start);
}

function scan(source) {
  const tokens = [];
  const push = (type, start, end, extra = {}) =>
    tokens.push({ type, start, end, raw: source.slice(start, end), ...extra });
  let i = 0;
  let textStart = 0;
  while (i < source.length) {
    let type,
      end,
      extra = {};
    if (twigStart(source, i)) {
      end = twigEnd(source, i);
      type =
        source[i + 1] === "#"
          ? "comment"
          : source[i + 1] === "%"
            ? "tag"
            : "output";
      if (type === "tag") {
        extra.info = twigInfo(source.slice(i, end));
        const literal = ["verbatim", "raw"].includes(extra.info.name);
        const customEmbedded = [
          "js",
          "css",
          "scss",
          "javascript",
          "includejs",
          "includecss",
        ].includes(extra.info.name);
        if (literal || customEmbedded) {
          const re = new RegExp(
            "\\{%[-~]?\\s*end" + extra.info.name + "\\s*[-~]?%\\}",
            "g",
          );
          re.lastIndex = end;
          const close = re.exec(source);
          if (!close && literal)
            throw new SyntaxError("Unclosed raw Twig block", i);
          if (close) {
            end = re.lastIndex;
            type = "raw";
            extra.kind = literal ? "verbatim" : "twig-embedded";
          }
        }
      }
    } else if (source.startsWith("<!--", i)) {
      const at = source.indexOf("-->", i + 4);
      if (at < 0) throw new SyntaxError("Unclosed HTML comment", i);
      end = at + 3;
      type = "comment";
    } else if (source.startsWith("<![CDATA[", i)) {
      const at = source.indexOf("]]>", i + 9);
      if (at < 0) throw new SyntaxError("Unclosed CDATA", i);
      end = at + 3;
      type = "raw";
    } else if (source.startsWith("<?", i)) {
      const at = source.indexOf("?>", i + 2);
      if (at < 0) throw new SyntaxError("Unclosed processing instruction", i);
      end = at + 2;
      type = "raw";
    } else if (
      /^<\/?[a-zA-Z][\w:.-]*(?=[\s/>])|^<![a-zA-Z]/.test(source.slice(i))
    ) {
      end = htmlEnd(source, i);
      type = "html";
      const match = /^<(\/?)([\w:.-]+)/.exec(source.slice(i, end));
      if (match)
        extra = {
          name: match[2].toLowerCase(),
          closing: !!match[1],
          selfClosing: /\/\s*>$/.test(source.slice(i, end)),
        };
      if (
        match &&
        !extra.closing &&
        !extra.selfClosing &&
        ["script", "style", "pre", "textarea"].includes(extra.name)
      ) {
        const re = new RegExp("</" + extra.name + "\\s*>", "ig");
        re.lastIndex = end;
        const close = re.exec(source);
        if (!close) throw new SyntaxError(`Unclosed ${extra.name} element`, i);
        extra = {
          ...extra,
          openingEnd: end,
          bodyStart: end,
          bodyEnd: close.index,
          closingStart: close.index,
          kind: extra.name,
        };
        end = re.lastIndex;
        type = "raw";
      }
    }
    if (
      type === "comment" &&
      /(?:twig|prettier|parse)-ignore-start/.test(source.slice(i, end))
    ) {
      const marker = /(?:twig|prettier|parse)-ignore-start/
        .exec(source.slice(i, end))[0]
        .replace("start", "end");
      const closing = new RegExp(
        "(?:\\{#\\s*" + marker + "\\s*#\\}|<!--\\s*" + marker + "\\s*-->)",
        "g",
      );
      closing.lastIndex = end;
      const match = closing.exec(source);
      if (!match) throw new SyntaxError("Unclosed formatter ignore region", i);
      end = closing.lastIndex;
      type = "raw";
      extra.kind = "ignore";
    }
    if (type) {
      if (textStart < i) push("text", textStart, i);
      push(type, i, end, extra);
      i = end;
      textStart = i;
    } else i++;
  }
  if (textStart < source.length) push("text", textStart, source.length);
  return tokens;
}

module.exports = {
  scan,
  twigEnd,
  twigStart,
  twigInfo,
  expressionParts,
  quotedEnd,
  SyntaxError,
};

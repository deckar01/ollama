import { visit } from "unist-util-visit";
import type { Root, RootContent } from "mdast";

const MATH_START = /(?<!\w|\\)\$/;
const MATH_END = /\$(?!\w)/;
const MATH_EXPR = /((?:\\\$|[^\s$])(?:(?:\\\$|[^$])*?(?:\\\$|[^\s$]))?)/;
const MATH = new RegExp(MATH_START.source + MATH_EXPR.source + MATH_END.source, "g");

/**
 * A remark plugin that adds inline math support for single dollar signs
 * with heuristics to preserve plain text dollar signs:
 * - Math must not start or end with whitespace ($x $, $ x$)
 * - Math must not border letters or digits (o$x$, $x$0)
 * - Backslash escapes (e.g. \$) are stripped from emitted text nodes;
 *   math content keeps its backslashes for downstream LaTeX rendering
 *
 * Run remarkBackslash before this plugin so that backslash escapes
 * are visible in text node values.
 */
export default function remarkInlineMath() {
  return (tree: Root) => {
    visit(tree, "text", (node, index, parent) => {
      const value = node.value;

      let match;
      let last = 0;
      const pieces: RootContent[] = [];

      MATH.lastIndex = 0;
      while ((match = MATH.exec(value))) {
        if (match.index > last) {
          pieces.push({
            type: "text",
            value: value.slice(last, match.index).replace(/\\(.)/g, "$1"),
          });
        }
        const mathValue = match[1];
        pieces.push({
          type: "inlineMath" as "text",
          value: mathValue,
          data: {
            hName: "code",
            hProperties: { className: ["language-math", "math-inline"] },
            hChildren: [{ type: "text", value: mathValue }],
          },
        } as RootContent);
        last = match.index + match[0].length;
      }

      if (pieces.length) {
        if (last < value.length) {
          pieces.push({
            type: "text",
            value: value.slice(last).replace(/\\(.)/g, "$1"),
          });
        }
        parent?.children?.splice(index ?? 0, 1, ...pieces);
        return (index ?? 0) + pieces.length;
      } else {
        node.value = value.replace(/\\(.)/g, "$1");
      }
    });
  };
}

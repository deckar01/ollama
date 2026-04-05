import { visit } from "unist-util-visit";
import type { Root, Text } from "mdast";
import type { Plugin } from "unified";

/**
 * Restores backslash escapes into text node values immediately after the
 * remark parser strips them. This lets subsequent plugins (like inline math)
 * distinguish escaped punctuation (like \$) from control characters.
 */
const remarkBackslash: Plugin<[], Root> = function remarkBackslash() {
  return (tree, file) => {
    const source = String(file.value ?? "");

    visit(tree, "text", (node: Text) => {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (start == null || end == null || end <= start) return;
      node.value = source.slice(start, end);
    });
  };
};

export default remarkBackslash;
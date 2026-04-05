import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, Text } from "mdast";
import { VFile } from "vfile";
import remarkBackslash from "./remarkBackslash";

function getFirstTextNode(markdown: string): Text {
  const processor = unified().use(remarkParse).use(remarkBackslash);
  const tree = processor.runSync(
    processor.parse(markdown),
    new VFile({ value: markdown }),
  ) as Root;

  const paragraph = tree.children.find((node) => node.type === "paragraph");
  const textNode = paragraph?.children.find((node) => node.type === "text");
  return textNode as Text;
}

describe("remarkBackslash", () => {
  it("restores backslash escapes into text node values", () => {
    const textNode = getFirstTextNode("Cost is \\$5 and \\*literal\\*.");
    expect(textNode.value).toBe("Cost is \\$5 and \\*literal\\*.");
  });

  it("leaves text without escapes unchanged", () => {
    const textNode = getFirstTextNode("No escaped punctuation here.");
    expect(textNode.value).toBe("No escaped punctuation here.");
  });
});
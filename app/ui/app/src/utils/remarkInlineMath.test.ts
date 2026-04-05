import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { VFile } from "vfile";
import remarkInlineMath from "./remarkInlineMath";
import remarkBackslash from "./remarkBackslash";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath, {singleDollarTextMath: false})
  .use(remarkBackslash)
  .use(remarkInlineMath);

function extractNodes(markdown: string, types: string[] = ["inlineMath"]) {
  const tree = processor.runSync(
    processor.parse(markdown),
    new VFile({ value: markdown }),
  );
  const mathNodes: { type: string; value: string }[] = [];
  function walk(node: any) {
    if (types.includes(node.type)) {
      mathNodes.push({ type: node.type, value: node.value });
    }
    if (node.children) {
      node.children.forEach(walk);
    }
  }
  walk(tree);
  return mathNodes;
}

describe("remarkInlineMath", () => {
  it("should parse inline math without empty text nodes", () => {
    let nodes = extractNodes("$x^2$", ["inlineMath", "text"]);
    expect(nodes).toEqual([{ type: "inlineMath", value: "x^2" }]);
    nodes = extractNodes("$2^x$", ["inlineMath", "text"]);
    expect(nodes).toEqual([{ type: "inlineMath", value: "2^x" }]);
  });

  it("should preserve surrounding text", () => {
    let nodes = extractNodes("before $x$ after", ["inlineMath", "text"]);
    expect(nodes).toEqual([
      { type: "text", value: "before "},
      { type: "inlineMath", value: "x" },
      { type: "text", value: " after"},
    ]);
    nodes = extractNodes("($x$)", ["inlineMath", "text"]);
    expect(nodes).toEqual([
      { type: "text", value: "("},
      { type: "inlineMath", value: "x" },
      { type: "text", value: ")"},
    ]);
  });

  it("should parse single-character math content", () => {
    const nodes = extractNodes("Variable $x$ here.");
    expect(nodes).toEqual([{ type: "inlineMath", value: "x" }]);
  });

  it("should parse multiple inline math expressions", () => {
    const nodes = extractNodes("Both $a$ and $b$ are vars.");
    expect(nodes).toEqual([
      { type: "inlineMath", value: "a" },
      { type: "inlineMath", value: "b" },
    ]);
  });

  it("should not match dollar amounts", () => {
    let nodes = extractNodes("Prices are $5 and $10 respectively.");
    expect(nodes).toEqual([]);
    nodes = extractNodes("Prices are 5$ and 10$ for some reason.");
    expect(nodes).toEqual([]);
  });

  it("should not match decorative words", () => {
    const nodes = extractNodes("BEWARE OF $HA$TA BEA$T$");
    expect(nodes).toEqual([]);
  });

  it("should not match wrapped dollar amounts", () => {
    let nodes = extractNodes("Prices are ($5) and ($10) respectively.");
    expect(nodes).toEqual([]);
    nodes = extractNodes("For some reason (5$) and (10$)?.");
    expect(nodes).toEqual([]);
  });

  it("should not match when content starts/ends with whitespace", () => {
    let nodes = extractNodes("Not math: $ x$ here.");
    expect(nodes).toEqual([]);
    nodes = extractNodes("Not math: $x $ here.");
    expect(nodes).toEqual([]);
  });

  it("should allow inline math using $$", () => {
    const nodes = extractNodes("$$x^2$$");
    expect(nodes).toEqual([{ type: "inlineMath", value: "x^2" }]);
  });

  it("should allow math blocks using $$", () => {
    const nodes = extractNodes("$$\nx^2\n$$", ["math"]);
    expect(nodes).toEqual([{ type: "math", value: "x^2" }]);
  });

  it("should allow escaped dollar signs", () => {
    const nodes = extractNodes("Let $x = \\$55$", [
      "inlineMath",
      "text",
    ]);
    expect(nodes).toEqual([
      { type: "text", value: "Let " },
      { type: "inlineMath", value: "x = \\$55" },
    ]);
  });

  it("should parse complex inline math expressions", () => {
    const nodes = extractNodes("*   **Annual Maintenance Total:** $\\mathbf{\\sim \\$160\\text{ per year}}$");
    expect(nodes).toEqual([
      { type: "inlineMath", value: "\\mathbf{\\sim \\$160\\text{ per year}}" },
    ]);
  });

  it("should prevent escaped block math", () => {
    const nodes = extractNodes("\\$\\$test\\$\\$", [
      "inlineMath",
      "text",
    ]);
    expect(nodes).toEqual([
      { type: "text", value: "$$test$$" },
    ]);
  });

  it("should preserve other escaped symbols", () => {
    const nodes = extractNodes("$20\\%$ ($\\$640$)");
    expect(nodes).toEqual([
      { type: "inlineMath", value: "20\\%" },
      { type: "inlineMath", value: "\\$640" },
    ]);
  });
});

// -*- mode: javascript -*-

// Very minimal and loose type checking of Rangy API

type Bookmark = { start: number, end: number, containerNode: Node };

declare class RangyRange {
  static constructor(): RangyRange;
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
  commonAncestorContainer: Node;
  collapsed: bool;
  setStart(node: Node, offset: number): void;
  setStartBefore(node: Node): void;
  setStartAfter(node: Node): void;
  setEnd(node: Node, offset: number): void;
  setEndBefore(node: Node): void;
  setEndAfter(node: Node): void;
  setStartAndEnd(startNode: Node, startOffset: number, endNode?: Node, endOffset?: number): void;
  setStartAndEnd(node: Node, offset: number): void;
  setStartAndEnd(node: Node, startOffset: number, endOffset: number): void;
  setStartAndEnd(startNode: Node, startOffset: number, endNode: Node, endOffset: number): void;
  selectNode(node: Node): void;
  selectNodeContents(node: Node): void;
  collapse(toStart: Boolean): void;
  compareBoundaryPoints(comparisonType: number, range: RangyRange): number;
  insertNode(node: Node): void;
  cloneContents(): DocumentFragment;
  extractContents(): DocumentFragment;
  deleteContents(): void;
  canSurroundContents(): bool;
  surroundContents(node: Node): void;
  cloneRange(): RangyRange;
  isValid(): bool;
  toString(): string;
  toHtml(): string;
  compareNode(node: Node): number;
  comparePoint(node: Node, offset: number): number;
  intersectsOrTouchesRange(range: RangyRange): bool;
  intersectsRange(range: RangyRange): bool;
  intersectsNode(node: Node, touchingIsIntersecting?: bool): bool;
  intersection(range: RangyRange): RangyRange;
  union(range: RangyRange): RangyRange;
  isPointInRange(node: Node, offset: number): bool;
  createContextualFragment(html: string): DocumentFragment;
  containsNode(node: Node, partial: Boolean): bool;
  containsNodeContents(node: Node): bool;
  containsNodeText(node: Node): bool;
  containsRange(range: RangyRange): bool;
  splitBoundaries(): void;
  normalizeBoundaries(): void;
  collapseToPoint(node: Node, offset: number): void;
  collapseBefore(node: Node): void;
  collapseAfter(node: Node): void;
  getNodes(nodeTypes?: Array<number>, filter?: (Node) => bool): Array<Node>;
  getBookmark(containerNode?: Node): Bookmark;
  moveToBookmark(bookmark: Bookmark): void;
  getDocument(): Document;
  detach(): void;
  inspect(): string;
  equals(range: RangyRange): bool;
  refresh(): void;
  select(): void;
  // if TextRange included:
  selectCharacters(containerNode: Node, startIndex: number, endIndex: number): void;
  text(): string;
}

type Rangy = {
  createRange: () => RangyRange,
  createNativeRange(doc?: Document): Range, // or TextRange in IE 6-8
  createRangyRange(doc?: Document): RangyRange,
  rangePrototype: Object        // "a prototype Range object"?
};

declare var rangy: Rangy

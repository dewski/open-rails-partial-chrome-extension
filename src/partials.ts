export type PartialComment = {
  node: Node;

  // The partial path
  path: string;

  // Whether this is a BEGIN or END comment
  begin: boolean;
};

export function parsePartialComment(node: Node): PartialComment | null {
  if (node.nodeType !== Node.COMMENT_NODE) {
    return null;
  }

  const matches = node.textContent?.trim().match(/^(BEGIN|END) ([^\s]+)$/);
  if (!matches) {
    return null;
  }

  return {
    node,
    path: matches[2],
    begin: matches[1] === "BEGIN",
  };
}

export function nearestPartialComment(
  node: Node,
  previousPartialComment?: PartialComment
): PartialComment | null {
  if (!node) {
    return null;
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    const partialComment = parsePartialComment(node);
    if (partialComment) {
      // If the previous partial comment was an END comment, and this is a BEGIN
      // continue iterating through previous siblings if present.
      if (
        !previousPartialComment?.begin &&
        partialComment.path === previousPartialComment?.path &&
        node.previousSibling
      ) {
        return nearestPartialComment(node.previousSibling);
      }

      if (!partialComment.begin && node.previousSibling) {
        return nearestPartialComment(node.previousSibling, partialComment);
      }

      return partialComment;
    } else if (node.previousSibling) {
      return nearestPartialComment(
        node.previousSibling,
        previousPartialComment
      );
    } else if (node.parentNode) {
      return nearestPartialComment(node.parentNode);
    } else {
      return null;
    }
  }

  const nextCandidate = node.previousSibling ?? node.parentNode;
  if (nextCandidate) {
    return nearestPartialComment(nextCandidate, previousPartialComment);
  }

  return null;
}

// Build a list of partial paths from a given element
export function walkPartialComments(node: Node): string[] {
  const partialPaths = [];
  let partialComment = nearestPartialComment(node);

  while (partialComment !== null) {
    partialPaths.push(partialComment.path);

    const nextCandidate =
      partialComment.node.previousSibling ?? partialComment.node.parentElement;
    partialComment = nextCandidate
      ? nearestPartialComment(nextCandidate)
      : null;
  }

  return partialPaths;
}

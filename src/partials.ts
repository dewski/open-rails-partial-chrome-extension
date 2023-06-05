export function commentPartialPath(element: Node): string | null {
  if (element.nodeType !== Node.COMMENT_NODE) {
    return null;
  }

  const matches = element.textContent?.trim().match(/^BEGIN ([^\s]+)$/);
  if (!matches) {
    return null;
  }

  return matches[1];
}

export function nearestPartialComment(element: Node): Node | null {
  if (!element) {
    return null;
  }

  if (element.nodeType === Node.COMMENT_NODE) {
    const partialPath = commentPartialPath(element);
    if (partialPath) {
      return element;
    } else if (element.parentElement) {
      return nearestPartialComment(element.parentElement);
    } else {
      return null;
    }
  }

  const nextCandidate = element.previousSibling ?? element.parentElement;
  if (nextCandidate) {
    return nearestPartialComment(nextCandidate);
  }

  return null;
}

// Build a list of partial paths from a given element
export function walkPartialComments(element: Node): string[] {
  const partialPaths = [];
  let partialComment = nearestPartialComment(element);

  while (partialComment !== null) {
    const partialPath = commentPartialPath(partialComment);
    if (partialPath) {
      partialPaths.push(partialPath);
    }

    const nextCandidate =
      partialComment.previousSibling ?? partialComment.parentElement;
    partialComment = nextCandidate
      ? nearestPartialComment(nextCandidate)
      : null;
  }

  return partialPaths;
}

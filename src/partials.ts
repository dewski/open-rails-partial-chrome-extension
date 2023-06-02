export function commentPartialPath(element: HTMLElement): string | null {
  if (element.nodeType !== Node.COMMENT_NODE) {
    return null;
  }

  const matches = element.textContent?.trim().match(/^BEGIN ([^\s]+)$/);
  if (!matches) {
    return null;
  }

  return matches[1];
}

export function findNearestPartialComment(
  element: HTMLElement
): HTMLElement | null {
  // The nearest partial comment will be a sibling comment node to an element,
  // starting from a given element search all available previous siblings for a
  // partial comment.
  let sibling = element.previousSibling as HTMLElement;
  while (sibling !== null) {
    if (commentPartialPath(sibling)) {
      return sibling;
    }

    sibling = sibling.previousSibling as HTMLElement;
  }

  // If we have not found a partial comment in the siblings, search the parent
  // and repeat the process until we reach the root of the document.
  if (element.parentNode !== null) {
    return findNearestPartialComment(element.parentNode as HTMLElement);
  }

  return null;
}

// Build a list of partial paths from a given element
export function walkPartialComments(element: HTMLElement): string[] {
  let partialPaths: string[] = [];
  let partialComment = findNearestPartialComment(element);

  while (partialComment !== null) {
    const partialPath = commentPartialPath(partialComment);
    if (partialPath) {
      partialPaths.push(partialPath);
    }

    const nextElement = partialComment.previousSibling
      ? partialComment
      : partialComment.parentElement;

    partialComment = nextElement
      ? findNearestPartialComment(nextElement as HTMLElement)
      : null;
  }

  return partialPaths;
}

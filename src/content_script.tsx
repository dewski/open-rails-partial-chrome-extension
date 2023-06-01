// A message sent from the background service worker notifying us one of the
// context menu items was selected.
chrome.runtime.onMessage.addListener(
  ({ action, value }, sender, sendResponse) => {
    if (action === "openPath") {
      const url = new URL("vscode://dewski.open-rails-partial/partial");
      url.searchParams.append("path", value);
      window.open(url, "_blank");
    }
  }
);

const clearPartials = () => {
  chrome.runtime.sendMessage({
    action: "foundPartials",
    value: [],
  });
};

const foundPartials = (partials: string[]) => {
  chrome.runtime.sendMessage({
    action: "foundPartials",
    value: partials,
  });
};

const onMouseOver = (event: MouseEvent) => {
  if (!event.target) {
    clearPartials();
    return;
  }

  const partials = walkPartialComments(event.target as HTMLElement);
  if (!partials.length) {
    clearPartials();
    return;
  }

  foundPartials(partials);
};

function commentPartialPath(element: HTMLElement): string | null {
  if (element.nodeType !== Node.COMMENT_NODE) {
    return null;
  }

  const matches = element.textContent?.trim().match(/BEGIN (.*)/);
  if (!matches) {
    return null;
  }

  return matches[1];
}

function findNearestPartialComment(element: HTMLElement): HTMLElement | null {
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
function walkPartialComments(element: HTMLElement): string[] {
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

// For supported pages its expected that the root node will be a comment node
// with the layout partial.
if (
  document.firstChild &&
  commentPartialPath(document.firstChild as HTMLElement) !== null
) {
  document.addEventListener("mouseover", onMouseOver, true);
} else {
  // For other pages where we should not expect to find any partials, clear the
  // list of partials anytime the page becomes visible.
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "visible") {
        clearPartials();
      }
    },
    true
  );
}

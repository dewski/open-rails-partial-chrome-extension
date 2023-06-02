// A message sent from the background service worker notifying us one of the

import { commentPartialPath, walkPartialComments } from "./partials";

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

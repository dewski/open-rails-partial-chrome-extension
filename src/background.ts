const ROOT_CONTEXT_MENU_ID = "openRailsPartial";
const contexts = ["all"];

// Setup initial context menu items
chrome.runtime.onInstalled.addListener(() => buildContextMenu());

const buildContextMenu = (partials: string[] = []) => {
  chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: ROOT_CONTEXT_MENU_ID,
    title: "Open Rails partial",
    contexts,
  });

  buildContextMenuOptions(partials);
};

const buildContextMenuOptions = (partials: string[] = []) => {
  if (partials.length) {
    partials.forEach((partial: string) => {
      chrome.contextMenus.create({
        id: partial,
        title: partial,
        parentId: ROOT_CONTEXT_MENU_ID,
        contexts,
      });
    });
  } else {
    chrome.contextMenus.create({
      id: "noPartials",
      title: "No partials found",
      parentId: ROOT_CONTEXT_MENU_ID,
      contexts,
      enabled: false,
    });
  }
};

chrome.contextMenus.onClicked.addListener(
  (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
    if (!tab?.id) return;

    // If any of the partials are selected, open the partial by sending a message to the content script
    // which can open the URL without the user being prompted if the `chrome.tabs.create` API was used.
    if (info.parentMenuItemId === ROOT_CONTEXT_MENU_ID) {
      chrome.tabs.sendMessage(tab.id, {
        action: "openPath",
        value: info.menuItemId,
      });
    }
  }
);

chrome.runtime.onMessage.addListener(
  ({ action, value }, sender, sendResponse) => {
    switch (action) {
      case "foundPartials":
        buildContextMenu(value);
        break;
      default:
        console.debug(
          "chrome.runtime.onMessage received unknown action",
          action
        );
        break;
    }
  }
);

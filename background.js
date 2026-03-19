chrome.commands.onCommand.addListener((command) => {
  if (command === "rename-tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) return;
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: promptAndRename,
      });
    });
  }
});

function promptAndRename() {
  // Remove any existing rename dialog
  const existing = document.getElementById("__rename-tab-dialog");
  if (existing) {
    existing.remove();
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "__rename-tab-dialog";
  overlay.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;display:flex;align-items:flex-start;justify-content:center;padding-top:80px;background:rgba(0,0,0,0.3);font-family:-apple-system,BlinkMacSystemFont,sans-serif;";

  const box = document.createElement("div");
  box.style.cssText =
    "background:#fff;border-radius:10px;padding:16px 20px;box-shadow:0 8px 30px rgba(0,0,0,0.2);width:360px;";

  const label = document.createElement("div");
  label.textContent = "Rename this tab";
  label.style.cssText = "font-size:13px;font-weight:600;color:#333;margin-bottom:8px;";

  const input = document.createElement("input");
  input.type = "text";
  input.value = document.title;
  input.placeholder = "Tab name";
  input.style.cssText =
    "width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:14px;outline:none;";
  input.addEventListener("focus", () => {
    input.style.borderColor = "#4285f4";
  });
  input.addEventListener("blur", () => {
    input.style.borderColor = "#ccc";
  });

  const buttons = document.createElement("div");
  buttons.style.cssText = "display:flex;justify-content:flex-end;gap:8px;margin-top:12px;";

  const cancel = document.createElement("button");
  cancel.textContent = "Cancel";
  cancel.style.cssText =
    "padding:6px 14px;border:1px solid #ccc;border-radius:6px;background:#fff;font-size:13px;cursor:pointer;";

  const save = document.createElement("button");
  save.textContent = "Save";
  save.style.cssText =
    "padding:6px 14px;border:none;border-radius:6px;background:#4285f4;color:#fff;font-size:13px;cursor:pointer;";

  function close() {
    overlay.remove();
  }

  function apply() {
    const name = input.value.trim();
    if (name) {
      document.title = name;
      // Prevent the page from resetting the title
      const observer = new MutationObserver(() => {
        if (document.title !== name) {
          document.title = name;
        }
      });
      observer.observe(document.querySelector("title") || document.head, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      // Store observer so it can be disconnected on next rename
      window.__renameTabObserver?.disconnect();
      window.__renameTabObserver = observer;
    }
    close();
  }

  cancel.addEventListener("click", close);
  save.addEventListener("click", apply);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") apply();
    if (e.key === "Escape") close();
    e.stopPropagation();
  });

  buttons.append(cancel, save);
  box.append(label, input, buttons);
  overlay.append(box);
  document.body.append(overlay);
  input.select();
}

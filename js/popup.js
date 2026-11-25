chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "get_menu":
      const $html = message.menus && message.menus.length > 0
        ? message.menus
            .map(
              (item, index) =>
                `<li class="${item.active ? "active list-item" : "list-item"}" title="${escapeHtml(
                  item.title
                )}"><span class="index">${index + 1}</span><span class="title">${escapeHtml(
                  item.title
                )}</span></li>`
            )
            .join("")
        : '<li class="list-item"><span class="title">暂无数据</span></li>';
      document.querySelector(".list-wrap").innerHTML = $html;
      break;

    case "copy_success":
      const btn = document.querySelector(`#copy-${message.scope}`);
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = "✓ 已复制";
        btn.classList.add("btn-success");
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove("btn-success");
        }, 2000);
      }
      break;
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 配置区展开/收起
document.querySelector("#config-toggle").addEventListener("click", function () {
  document.querySelector("#config-section").classList.toggle("expanded");
});

// 初始化时加载配置
chrome.storage.sync.get(["pathPrefix", "importPath"], (result) => {
  const prefixInput = document.querySelector("#path-prefix");
  const importInput = document.querySelector("#import-path");
  if (prefixInput) prefixInput.value = result.pathPrefix || "";
  if (importInput) importInput.value = result.importPath || "@/utils/request";
});

// 主动请求菜单数据
chrome.tabs.query({}, function (tabs) {
  tabs
    .filter((v) => v.active)
    .forEach((v) => {
      chrome.tabs.sendMessage(v.id, { type: "get_menu" });
    });
});

document.querySelector("#copy-current").addEventListener("click", function () {
  chrome.tabs.query({}, function (tabs) {
    tabs
      .filter((v) => v.active)
      .forEach((v) => {
        chrome.tabs.sendMessage(v.id, { type: "copy_current" });
      });
  });
});

document.querySelector("#copy-all").addEventListener("click", function () {
  chrome.tabs.query({}, function (tabs) {
    tabs
      .filter((v) => v.active)
      .forEach((v) => {
        chrome.tabs.sendMessage(v.id, { type: "copy_all" });
      });
  });
});

document.querySelector("#save-config").addEventListener("click", function () {
  const pathPrefix = document.querySelector("#path-prefix").value;
  const importPath = document.querySelector("#import-path").value;
  chrome.storage.sync.set(
    {
      pathPrefix,
      importPath,
    },
    () => {
      const btn = document.querySelector("#save-config");
      const originalText = btn.textContent;
      btn.textContent = "✓ 已保存";
      btn.classList.add("btn-success");
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove("btn-success");
      }, 2000);
    }
  );
});

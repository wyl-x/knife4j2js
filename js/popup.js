/**
 * @author 王玉龙
 * @email wangyulong@kyland.com
 * @create date 2023-12-27 14:45:02
 * @modify date 2023-12-27 14:45:02
 * @desc [description]
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "get_menu":
      const $html = message.menus
        .map(
          (item) =>
            `<li class="${item.active ? "active list-item" : "list-item"}">${
              item.title
            }</li>`
        )
        .join("");
      document.querySelector(".list-wrap").innerHTML = $html;
  }
});

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

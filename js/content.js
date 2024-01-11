/**
 * @author 王玉龙
 * @email wangyulong@kyland.com
 * @create date 2023-12-27 14:45:30
 * @modify date 2023-12-27 14:45:30
 * @desc [description]
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("content receive:", message);
  switch (message.type) {
    case "get_menu":
      const menus = getMenu();
      chrome.runtime.sendMessage({ type: "get_menu", menus });
      break;

    case "copy_current":
      const result = getApiConfig(
        ".ant-tabs-tabpane.ant-tabs-tabpane-active .knife4j-body-content"
      );
      if (result) copyTextToClipboard(genApiContent(result) + "\n");
      break;

    case "copy_all":
      let resultStr = "";
      $(".ant-tabs-tabpane .knife4j-body-content").each((index, item) => {
        const result = getApiConfig(item);
        if (result) {
          resultStr += genApiContent(result);
          resultStr += "\n";
        }
      });

      copyTextToClipboard(resultStr);
      break;
  }
});

function getMenu() {
  if ($(".knife4j-menu").length === 0) {
    return;
  }

  const subMenus = $(".ant-tabs-tab").has('[data-icon="close"]');
  const menus = subMenus.map((index, item) => {
    const active = $(item).hasClass("ant-tabs-tab-active");
    return {
      title: item.innerText,
      active,
    };
  });
  return [...menus];
}

function getApiConfig(item) {
  const result = {};
  const contentEl = $(item);

  const title = contentEl.find(".knife4j-api-title .ant-col-18").text();
  result.title = title.trim();

  const method = contentEl.find(".knife4j-api-summary-method").text();
  result.method = method.trim().toLowerCase();

  const path = contentEl.find(".knife4j-api-summary-path").text();
  result.path = path;

  if (!result.title && !result.path) return null;
  return result;
}

function genApiContent(data) {
  const pathParam = data.path.match(/{(.*?)}/)?.[1];
  const pathParamArg = pathParam ? `${pathParam}, ` : "";

  const actionMap = {
    get: "query",
    post: "create",
    put: "update",
    delete: "delete",
  };

  const apiName =
    actionMap[data.method] +
    data.path
      .split("/")
      .slice(-2)
      .join("-")
      .split("-")
      .map((item) => {
        if (item.includes("{")) {
          return `By${item[1].toUpperCase()}${item.slice(2, -1)}`;
        }

        const camel = item
          .split("")
          .map((it, idx) => {
            if (idx === 0) return it.toUpperCase();
            return it;
          })
          .join("");
        return camel;
      })
      .join("");
  data.path = data.path.split("{").join("${");
  if (data.path.includes("${")) {
    data.path = `\`${data.path}\``;
  } else {
    data.path = `'${data.path}'`;
  }
  if (data.method === "get") {
    return `
/**
 * ${data.title}
 */
export function ${apiName}(${pathParamArg}params) {
  return request.${data.method}(${data.path}, { params })
}`;
  }

  return `
/**
 * ${data.title}
 */
export function ${apiName}(${pathParamArg}data) {
  return request.${data.method}(${data.path}, data)
}`;
}

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

// 从 storage 读取配置
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["pathPrefix", "importPath"], (result) => {
      resolve({
        pathPrefix: result.pathPrefix || "",
        importPath: result.importPath || "@/utils/request",
      });
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "get_menu":
      const menus = getMenu() || [];
      chrome.runtime.sendMessage({ type: "get_menu", menus });
      break;

    case "copy_current":
      getConfig().then((config) => {
        const result = getApiConfig(
          ".ant-tabs-tabpane.ant-tabs-tabpane-active .knife4j-body-content",
          config
        );
        if (result) {
          copyTextToClipboard(genApiContent(result, config) + "\n").then(() => {
            chrome.runtime.sendMessage({ type: "copy_success", scope: "current" });
          });
        }
      });
      break;

    case "copy_all":
      getConfig().then((config) => {
        let resultStr = `import request from '${config.importPath}'\n`;
        $(".ant-tabs-tabpane .knife4j-body-content").each((index, item) => {
          const result = getApiConfig(item, config);
          if (result) {
            resultStr += genApiContent(result, config);
            resultStr += "\n";
          }
        });
        copyTextToClipboard(resultStr).then(() => {
          chrome.runtime.sendMessage({ type: "copy_success", scope: "all" });
        });
      });
      break;
  }
});

// 初始化时主动请求菜单数据
chrome.tabs.query({}, function (tabs) {
  tabs
    .filter((v) => v.active)
    .forEach((v) => {
      chrome.tabs.sendMessage(v.id, { type: "get_menu" });
    });
});

function getMenu() {
  if ($(".knife4j-menu").length === 0) {
    return [];
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

function getApiConfig(item, config) {
  const result = {};
  const contentEl = $(item);

  const title = contentEl.find(".knife4j-api-title>div>span").text();
  result.title = title.trim();

  const method = contentEl.find(".knife4j-api-summary-method").text();
  result.method = method.trim().toLowerCase();

  const path = contentEl.find(".knife4j-api-summary-path").text();
  result.path = (config.pathPrefix || "") + path;

  if (!result.title && !result.path) return null;
  return result;
}

function genApiContent(data, config) {
  // 提取所有路径参数
  const pathParams = [...data.path.matchAll(/\{(.*?)\}/g)].map((m) => m[1]);

  // 处理参数名冲突
  const reserved = new Set(["params", "data"]);
  const safeParams = pathParams.map((p, idx) => {
    if (reserved.has(p)) {
      return `${p}Path${idx > 0 ? idx : ""}`;
    }
    // 处理重复参数名
    const count = pathParams.slice(0, idx).filter((x) => x === p).length;
    return count > 0 ? `${p}${count + 1}` : p;
  });

  const pathParamArg = safeParams.length ? safeParams.join(", ") + ", " : "";

  const actionMap = {
    get: "query",
    post: "create",
    put: "update",
    delete: "delete",
  };

  const action = actionMap[data.method] || "call";

  const apiName =
    action +
    data.path
      .split("/")
      .slice(-2)
      .join("-")
      .split("_")
      .join("-")
      .split("-")
      .map((item) => {
        // 安全处理路径参数
        const paramMatch = item.match(/^\{(.+)\}$/);
        if (paramMatch) {
          const paramName = paramMatch[1];
          if (paramName && paramName.length > 0) {
            return `By${paramName[0].toUpperCase()}${paramName.slice(1)}`;
          }
          return "ByParam";
        }

        // 普通路径段转驼峰
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

  // 替换路径参数为模板字符串
  let templatePath = data.path;
  safeParams.forEach((param, idx) => {
    templatePath = templatePath.replace(`{${pathParams[idx]}}`, `\${${param}}`);
  });

  if (templatePath.includes("${")) {
    templatePath = `\`${templatePath}\``;
  } else {
    templatePath = `'${templatePath}'`;
  }

  if (data.method === "get") {
    return `
/**
 * ${data.title}
 */
export function ${apiName}(${pathParamArg}params) {
  return request.${data.method}(${templatePath}, { params })
}`;
  }

  return `
/**
 * ${data.title}
 */
export function ${apiName}(${pathParamArg}data) {
  return request.${data.method}(${templatePath}, data)
}`;
}

async function copyTextToClipboard(text) {
  // 1. 安全上下文优先使用现代 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API 失败，尝试降级方案:", err);
    }
  }

  // 2. HTTP 页面或权限受限时的降级方案
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    return successful;
  } catch (err) {
    console.error("复制失败:", err);
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

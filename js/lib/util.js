/**
 * @author 王玉龙
 * @email wangyulong@kyland.com
 * @create date 2023-12-27 14:46:19
 * @modify date 2023-12-27 14:46:19
 * @desc [description]
 */
globalThis.sleep = function (duration = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};

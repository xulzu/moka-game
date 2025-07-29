// 拷贝完整的静态资源，包括package.json等，方便源码部署
const fs = require("fs-extra");
const assets = [
  ["./config", "./back_dist/config", "配置"],
  ["./dist", "./back_dist/static", "前端静态资源"],
  ["./dist", "./static", "同步开发阶段的static目录"],
  ["./package.json", "./back_dist/package.json", "package.json"],
  ["./.npmrc", "./back_dist/.npmrc", ".npmrc"],
  ["./script/readme.md", "./back_dist/readme.md", "readme.md"],
];

for (const [src, des, name] of assets) {
  fs.copy(src, des)
    .then(() => {
      console.log(`✅ 拷贝${name || src}完成`);
    })
    .catch((err) => {
      console.error(`拷贝${src}失败`, err);
    });
}

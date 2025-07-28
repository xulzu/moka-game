const fs = require("fs-extra");

const srcDir = "./config";
const destDir = "./back_dist/config";

const assets = [
  ["./config", "./back_dist/config"],
  ["./dist", "./back_dist/static"],
  ["./package.json", "./back_dist/package.json"],
  ["./.npmrc", "./back_dist/.npmrc"],
  ["./script/readme.md", "./back_dist/readme.md"],
];

for (const [src, des] of assets) {
  fs.copy(src, des)
    .then(() => {
      console.log(`✅ 拷贝${src}完成`);
    })
    .catch((err) => {
      console.error(`拷贝${src}失败`, err);
    });
}

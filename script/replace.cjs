// 将所有js文件中的import路径替换为.js后缀

const fs = require("fs");
const path = require("path");

const targetDir = process.argv[2] || "./back_dist/server";

const extsToSkip = [".js", ".json", ".ts"];

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  const fixed = content.replace(
    /(?<=\b(?:import|export)\s+(?:[^'"]+?\s+from\s+)?['"])(\.{1,2}\/[^'"]+?)(?=['"])/g,
    (importPath) => {
      const ext = path.extname(importPath);
      if (ext) return importPath; // already has extension
      return importPath + ".js";
    }
  );

  fs.writeFileSync(filePath, fixed, "utf8");
  console.log(`✅ fixed: ${filePath}`);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (stat.isFile() && fullPath.endsWith(".js")) {
      fixImportsInFile(fullPath);
    }
  }
}

walk(path.resolve(targetDir));

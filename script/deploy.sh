#!/bin/bash

# 批量删除指定文件和目录
ls | grep -v -e '^node_modules$' -e '^asset.zip$' -e '^gamedb.sqlite$'| xargs rm -rf

# 解压 asset.zip
if [ -f "asset.zip" ]; then
  unzip -o asset.zip
  echo "已解压: asset.zip"
else
  echo "未找到 asset.zip"
fi

# 移动 back_dist 下的文件到当前目录
if [ -d "back_dist" ]; then
  mv back_dist/* .
  rm -r back_dist
  echo "已移动 back_dist/* 到当前目录"
else
  echo "未找到 back_dist 目录"
fi
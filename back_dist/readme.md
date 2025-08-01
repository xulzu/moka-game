# 游戏程序说明

### 环境准备

* 电脑上需准备一个^18以上的nodejs环境(推荐node\^22)
* 执行 `node -v` 检查node环境是否准备好。如果显示了版本号则表示node环境正常。
* 执行 `npm i pm2 -g` 安装node的进程管理工具

### 启动服务

1、首次启动时先安装依赖，依赖正常来说安装一次就行。如果报错时可以把项目目录下旧的依赖安装目录 `node_modules/` 删除。

```
npm i
```

2 、启动服务

```
pm2 start server/index.js
```

### FQA

|目录|说明|
|-|-|
|config/|配置文件目录|
|server/|服务端代码|
|static/|前端静态资源|
|gamedb.sqlite|数据库|

listen.json 配置文件说明
|key|value|desc|
|-|-|-|
|port|52820|服务端口|
|auth|--|jwt认证地址|
|sign_start_day|--|签到活动的日期|

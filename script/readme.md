# 游戏程序说明

0、电脑上需准备一个^18以上的nodejs环境(推荐node\^22)

 1、首次启动时先安装依赖，依赖正常来说安装一次就行

```
npm i
```

2 、启动服务

```
npm run start

nohup npm run start > out.log 2>&1 &
```

|目录|说明|
|-|-|
|config/|配置文件目录|
|server/|服务端代码|
|static/|前端静态资源|
|gamedb.sqlite|数据库|

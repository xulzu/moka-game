import Koa from "koa";
import { DataStore } from "./sqlite";
import { Config } from "./Configs";
import staticServe from "koa-static";
import NodeCache from "node-cache";
import jwt from "jsonwebtoken";
import { clientRouter } from "./clientAPI";
import { adminRouter } from "./adminAPI";
import bodyParser from "koa-bodyparser";
const GlobalCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const app = new Koa();
app.use(bodyParser());
//错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next(); // 执行下一个中间件或路由
  } catch (err) {
    console.error("Koa caught error:", err);
    ctx.status = err.status || 500;
    ctx.body = err.message || "程序出错";
  }
});

//认证jwt中间件
app.use(async (ctx, next) => {
  const bearer =
    ctx.cookies.get("bearer") || (ctx.query.bearer as string) || "test";
  const isDev = Config.DEV;
  if (!bearer && !isDev) {
    throw new Error("请先登录");
  }
  let user = "";
  if (GlobalCache.has(bearer) && !isDev) {
    user = GlobalCache.get(bearer);
  } else {
    let userid = "";
    let username = "";
    if (isDev) {
      userid = ctx.cookies.get("user");
      username = ctx.cookies.get("username");
      if (!userid) {
        userid = "random_" + String(Math.random()).slice(2, 7);
        username = userid;
        // userid = "220811";
        // username = "zy3";
        ctx.cookies.set("user", userid);
        ctx.cookies.set("username", encodeURIComponent(username));
      }
    } else {
      try {
        const payload = jwt.verify(bearer, Config.JWT_SECRET);
        userid = payload?.jti;
        username = payload?.sub;
      } catch (err) {
        console.error("jwt解析失败", err);
      }
    }

    if (!userid || !username) {
      throw new Error("认证出错,缺少用户名或工号");
    }
    const userInfo = DataStore.getUser(userid);
    if (!userInfo) {
      DataStore.addUser({
        userid,
        name: username,
        avatar: "",
        score: 0,
      });
    }
    user = userid;
    //jwt 和 用户id 缓存10分钟，过期后重新认证，不然每次都http去其他系统认证耗时间
    GlobalCache.set(bearer, userid, 10 * 60);
  }
  ctx.user = user;
  return next();
});

//接口鉴权
app.use((ctx, next) => {
  const admins = Config.ADMIN || [];
  const prod = !Config.DEV;
  if (ctx.path.startsWith("/api/admin") && prod) {
    if (!admins.includes(ctx.user)) {
      throw new Error("无权限");
    }
  }
  return next();
});

app.use(staticServe("static"));
//注册路由
[adminRouter, clientRouter].forEach((router) => {
  app.use(router.routes());
  app.use(router.allowedMethods());
});
const PORT = Config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

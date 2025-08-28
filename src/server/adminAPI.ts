import Router from "@koa/router";
import { DataStore } from "./sqlite";
const router = new Router({ prefix: "/api/admin" });
router.get("/users", (ctx) => {
  const users = DataStore.getUsers();
  ctx.body = users;
});
router.delete("/user", (ctx) => {
  const userid = ctx.query.userid as string;
  DataStore.deleteUser(userid);
  ctx.body = "ok";
});
router.put("/reset-stamina", (ctx) => {
  const body = ctx.request.body as any;
  const userid = body.userid as string;
  const stamina = DataStore.getStamina(userid);
  if (!stamina) {
    DataStore.addStamina(userid, 20);
  } else {
    DataStore.updateStamina(userid, 20);
  }
  ctx.body = "ok";
});
router.get("/matches", (ctx) => {
  const page = ctx.query.page as string;
  const pageSize = ctx.query.pageSize as string;
  const keyword = ctx.query.keyword as string;
  const matches = DataStore.getMatches(Number(page), Number(pageSize), keyword);
  ctx.body = matches;
});
export const adminRouter = router;

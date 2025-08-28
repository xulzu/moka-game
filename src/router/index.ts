import { createWebHashHistory, createRouter } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import HomeView from "../view/home/index.vue";
import GameView from "../view/game/index.vue";
import Pend from "../view/home/pending.vue";
import Cards from "../view/home/cards.vue";
import Top from "../view/home/top.vue";
import loadGame from "../view/home/loadGame.vue";
import tips from "../view/home/tips.vue";
import dayTask from "../view/home/dayTask.vue";
const routes: RouteRecordRaw[] = [
  {
    path: "/client",
    component: () => import("../view/client/index.vue"),
    children: [
      { path: "/", component: HomeView },
      { path: "/game", component: GameView },
      {
        path: "/pend",
        component: Pend,
      },
      {
        path: "/cards",
        component: Cards,
      },
      {
        path: "/top",
        component: Top,
      },
      {
        path: "/load",
        component: loadGame,
      },
      {
        path: "/tips",
        component: tips,
      },
      {
        path: "/dayTask",
        component: dayTask,
      },
    ],
  },
  {
    path: "/admin",
    component: () => import("../view/admin/index.vue"),
    redirect: "/admin/user",
    children: [
      {
        path: "user",
        component: () => import("../view/admin/user/index.vue"),
      },
      {
        path: "match",
        component: () => import("../view/admin/match/index.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
let hasLoadAssets = false;
router.beforeEach((to, from) => {
  if (to.path === "/load") {
    hasLoadAssets = true;
  } else if (to.path === "/game") {
    if (!hasLoadAssets) {
      console.log("没加载资源");
      return {
        path: "/load",
      };
    }
  }
});

export default router;

import { createWebHashHistory, createRouter } from "vue-router";

import HomeView from "../view/home/index.vue";
import GameView from "../view/game/index.vue";
import Pend from "../view/home/pending.vue";
const routes = [
  { path: "/", component: HomeView },
  { path: "/game", component: GameView },
  {
    path: "/pend",
    component: Pend,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

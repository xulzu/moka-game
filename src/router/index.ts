import { createWebHashHistory, createRouter } from "vue-router";

import HomeView from "../view/home/index.vue";
import GameView from "../view/game/index.vue";
import Pend from "../view/home/pending.vue";
import Cards from "../view/home/cards.vue";
import Top from "../view/home/top.vue";
const routes = [
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
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

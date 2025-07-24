import { createWebHashHistory, createRouter } from "vue-router";

import HomeView from "../view/home/index.vue";
import GameView from "../view/game/index.vue";
import Pend from "../view/home/pending.vue";
import Cards from "../view/home/cards.vue";
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
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

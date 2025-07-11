import { createWebHashHistory, createRouter } from "vue-router";

import HomeView from "../view/home/index.vue";
import GameView from "../view/game/index.vue";

const routes = [
  { path: "/", component: HomeView },
  { path: "/game", component: GameView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

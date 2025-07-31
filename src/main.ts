import { createApp } from "vue";
import "vant/lib/index.css";
import "./style/index.css";
import App from "./App.vue";
import router from "./router";
import { Toast } from "vant";
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import axios from "axios";

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error?.response?.data);
  }
);

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);
createApp(App).use(router).use(Toast).mount("#app");

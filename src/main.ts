import { createApp } from "vue";
import "vant/lib/index.css";
import "./style/index.css";
import App from "./App.vue";
import router from "./router";
import { Toast } from "vant";
createApp(App).use(router).use(Toast).mount("#app");

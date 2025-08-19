<template>
  <div
    @click="fullScreen"
    class="h-full w-full flex justify-center items-center relative flex-col bg"
  >
    <Desc v-if="showDesc" @click="showDesc = false"></Desc>
    <img
      :src="btn0"
      alt=""
      @click="start"
      srcset=""
      width="120"
      class="shdaow_ absolute top-[40%] left-1/2 -translate-x-1/2"
    />
    <img
      :src="btn1"
      alt=""
      srcset=""
      @click="$router.push('/top')"
      width="90"
      class="shdaow_ absolute top-[calc(40%+120px)] left-[16%]"
    />
    <img
      :src="btn2"
      alt=""
      @click="$router.push('/cards')"
      srcset=""
      width="90"
      class="shdaow_ absolute top-[calc(40%+120px)] right-[16%]"
    />
    <div class="absolute top-[18%] right-[4px]">
      <div @click="showStamina" class="">
        <img
          src="/assets/tili.webp"
          alt=""
          class="h-[34px] translate-x-[6px]"
        />
        <div class="text-white text-[12px] mt-1">
          体力:<span style="font-family: Consolas">{{
            String(stamina).padStart(2, "0")
          }}</span>
        </div>
      </div>
      <div class="mt-3" @click="$router.push('/tips')">
        <img
          src="/assets/icon2.webp"
          alt=""
          class="h-[34px] translate-x-[6px]"
        />
        <div class="text-white text-[12px] translate-x-[8px] mt-1">教学</div>
      </div>
      <div class="mt-3" @click="showDesc = true">
        <img
          src="/assets/icon3.webp"
          alt=""
          class="h-[34px] translate-x-[6px]"
        />
        <div class="text-white text-[12px] translate-x-[8px] mt-1">规则</div>
      </div>
      <div class="mt-3 relative" @click="$router.push('/dayTask')">
        <div
          v-if="!signin"
          class="w-[10px] h-[10px] rounded-[50%] bg-red-500 absolute right-[8px] -top-[2px] z-10"
        ></div>
        <img src="/assets/qd.webp" alt="" class="h-[34px] translate-x-[6px]" />
        <div class="text-white text-[12px] translate-x-[8px] mt-1">签到</div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import axios from "axios";
import { Button, Field, showToast } from "vant";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { loadAssets } from "../utils/loadAssets";
import btn0 from "@/assets/btn0.webp";
import btn1 from "@/assets/btn1.webp";
import btn2 from "@/assets/btn2.webp";
import Desc from "./desc.vue";

const router = useRouter();
const route = useRoute();
const showDesc = ref(false);
const user = ref("");
const signin = ref(true);
const cache = localStorage.getItem("user");
if (cache) {
  user.value = cache;
}
if (!user.value) {
  user.value = (Math.random() * 100).toFixed(2);
} else if (route.query.id as string) {
  user.value = route.query.id as string;
}
localStorage.setItem("user", user.value);

const stamina = ref(0);
init();
function init() {
  axios.get("/api/init", {
    params: {
      user: user.value,
    },
  });
  loadStamina();
  loadSignin();
}
let isTips = ref(false);
let isTipsCache = localStorage.getItem("isTips");
if (isTipsCache) {
  isTips.value = true;
}
async function start() {
  if (!isTips.value) {
    localStorage.setItem("isTips", "1");
    router.push("/tips");
  } else {
    await loadStamina();
    if (stamina.value < 2) {
      showToast("体力不足2点，每小时会恢复一点体力。");
      return;
    }
    router.push(`/pend`);
  }
}

function fullScreen() {
  // document.documentElement.requestFullscreen();
}

function showStamina() {
  showToast("每局游戏会消耗2体力，每小时会恢复1点");
}

async function loadStamina() {
  try {
    const { data } = await axios.get("/api/stamina");
    stamina.value = data || 0;
  } catch (error) {}
}

async function loadSignin() {
  const { data } = await axios.get("/api/signin/status");
  signin.value = data;
}
</script>
<style lang="less" scoped>
.bg {
  background-image: url("@/assets/home.png");
  background-size: 100% 100%;
}
.shdaow_ {
  filter: drop-shadow(0px 0px 20px #f9fdfd);
}
</style>

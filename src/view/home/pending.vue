<template>
  <div v-if="page === 0"></div>
  <div
    v-if="page === 1"
    class="h-[100vh] relative w-[100vw] bg-[#201542] text-white flex flex-col items-center pt-[10vh]"
  >
    <img src="/assets/pend_bg.webp" class="rotate" alt="" width="200" />
    <div class="mt-6 text-[16px] font-bold text-gray-300">匹配对手中</div>
    <div class="relative text-[22px] font-bold mt-4 w-[200px] text-center">
      <span class="z-10"> {{ formatTime(time) }} </span>
      <img
        src="/assets/pend_txt_bg.png"
        alt=""
        class="absolute z-0 opacity-50 w-[200px] h-[20px] left-[2px] top-[8px]"
      />
    </div>
    <div
      class="fixed bottom-[20vh] px-[40px] py-[20px] flex items-center justify-center"
    >
      <img
        src="/assets/btn_bg.webp"
        class="absolute w-[230px] h-[35px]"
        alt=""
      />
      <div class="relative z-10" @click="cancel">取消匹配</div>
    </div>
  </div>
  <div v-if="page === 2" class="h-[100vh] w-[100vw] bg text-white">
    <div class="fixed top-[17vh]">
      <img src="/assets/loading_tag1.webp" class="w-[220px]" alt="" />
      <span class="absolute top-[10px] left-[10px] text-gray-300">
        {{ p2Info.name }}
      </span>
      <div
        class="absolute left-[100px] -top-[35px] border-[2px] border-solid rounded-[10px] overflow-hidden border-gray-300"
      >
        <img :src="p2Info.src" class="w-[70px]" alt="" />
      </div>
    </div>
    <div class="fixed bottom-[17vh] right-0">
      <img src="/assets/loading_tag2.webp" class="w-[220px]" alt="" />
      <span class="absolute top-[10px] right-[10px] text-gray-300">
        {{ p1Info.name }}
      </span>
      <div
        class="absolute right-[100px] -top-[35px] border-[2px] border-solid rounded-[10px] overflow-hidden border-gray-300"
      >
        <img :src="p1Info.src" class="w-[70px]" alt="" />
      </div>
    </div>
    <div class="fixed bottom-[20px] left-1/2 -translate-x-1/2">加载中...</div>
  </div>
</template>
<script lang="ts" setup>
import axios from "axios";
import { loadAssets } from "../utils/loadAssets";
import { useRouter } from "vue-router";
import { onBeforeUnmount, ref } from "vue";
import img from "/assets/user_ico.webp";
let controller: AbortController | null = null;
const router = useRouter();
const page = ref(0);
const p1Info = ref({
  src: img,
  name: "~",
});
const p2Info = ref({
  src: img,
  name: "~",
});
const time = ref(0);
init();
async function init() {
  try {
    page.value = 0;
    const user = localStorage.getItem("user");
    const { data } = await axios.get(`/api/gameInfo?user=${user}`);
    if (data) {
      p1Info.value = data.p1Info || {};
      p2Info.value = data.p2Info || {};
      toGame();
    } else {
      start();
    }
  } catch (error) {}
}
async function start() {
  page.value = 1;
  setInterval(() => {
    time.value += 1;
  }, 1000);
  controller = new AbortController();

  const tag = await new Promise((res) => {
    const sse = new EventSource(`/sse/pending`);
    sse.onmessage = (event) => {
      const data = event.data;
      sse.close();
      res(data);
    };
  });
  console.log("tag", tag);
  if (Number(tag) === 1) {
    toGame();
  }
}
function cancel() {
  axios.get("/api/cancel");
  router.push(`/`);
}

async function toGame() {
  page.value = 2;
  await Promise.all([
    loadAssets(),
    new Promise<void>((res_) => {
      setTimeout(() => {
        res_();
      }, 2000);
    }),
  ]);
  router.push(`/game`);
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");
  return `${formattedMinutes}:${formattedSeconds}`;
}
</script>
<style lang="less" scoped>
.rotate {
  animation: spin 4s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.bg {
  background-image: url("/assets/loading_bg.webp");
  background-size: 100% 100%;
}
</style>

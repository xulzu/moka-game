<template>
  <div
    class="h-[100vh] relative w-[100vw] bg-[#201542] text-white flex flex-col items-center pt-[10vh]"
  >
    <img src="/assets/pend_bg.webp" class="rotate" alt="" width="200" />
    <div class="mt-6 text-[16px] font-bold">匹配对手中</div>
    <div class="relative text-[22px] font-bold mt-4 w-[200px] text-center">
      <span class="z-10"> 00:00 </span>
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
</template>
<script lang="ts" setup>
import axios from "axios";
import { loadAssets } from "../utils/loadAssets";
import { useRouter } from "vue-router";
let controller: AbortController | null = null;
const router = useRouter();
start();
async function start() {
  await loadAssets();
  const controller = new AbortController();
  const user = localStorage.getItem("user");
  await Promise.all([
    loadAssets(),
    axios.get(`/api/pending?user=${user}`, {
      signal: controller.signal,
    }),
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    }),
  ]);
  router.push(`/game`);
}
function cancel() {
  controller?.abort();
  router.push(`/`);
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
</style>

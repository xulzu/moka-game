<template>
  <div class="h-[100vh] w-[100vw] bg text-white">
    <div class="fixed top-[17vh]">
      <img src="/assets/loading_tag1.webp" class="w-[220px]" alt="" />
      <span class="absolute top-[10px] left-[10px] text-gray-300">
        {{ p2Info.name }}
      </span>
      <div
        class="absolute left-[100px] -top-[35px] border-[2px] border-solid rounded-[10px] overflow-hidden border-gray-300"
      >
        <img
          :src="p2Info.src"
          class="w-[70px]"
          alt=""
          @error="p2Info.src = img"
        />
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
        <img
          :src="p1Info.src"
          class="w-[70px]"
          alt=""
          @error="p1Info.src = img"
        />
      </div>
    </div>
    <div class="fixed bottom-[20px] left-1/2 -translate-x-1/2">加载中...</div>
  </div>
</template>
<script lang="ts" setup>
import axios from "axios";
import img from "/assets/user_ico.webp";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loadAssets } from "../utils/loadAssets";

if (sessionStorage.getItem("reload") !== "ok") {
  sessionStorage.setItem("reload", "ok");
  location.reload();
} else {
  sessionStorage.removeItem("reload");
}

const p1Info = ref({
  src: img,
  name: "~",
});
const p2Info = ref({
  src: img,
  name: "~",
});
const router = useRouter();
init();
async function init() {
  const { data } = await axios.get("/api/gameInfo");
  if (!data) {
    router.replace("/");
  } else {
    p1Info.value = data.p1Info || {};
    p2Info.value = data.p2Info || {};
    await Promise.all([
      loadAssets(),
      new Promise<void>((res_) => {
        setTimeout(() => {
          res_();
        }, 2500);
      }),
    ]);
    router.replace(`/game`);
  }
}
</script>
<style lang="less" scoped>
.bg {
  background-image: url("/assets/loading_bg.webp");
  background-size: 100% 100%;
}
</style>

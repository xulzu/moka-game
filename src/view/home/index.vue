<template>
  <div
    class="h-[100vh] w-[100vw] flex justify-center items-center relative flex-col bg"
  >
    <img
      :src="btn0"
      alt=""
      @click="start"
      srcset=""
      width="120"
      class="shdaow_ absolute top-[40vh] left-1/2 -translate-x-1/2"
    />
    <img
      :src="btn1"
      alt=""
      srcset=""
      width="90"
      class="shdaow_ absolute top-[calc(40vh+120px)] left-[16vw]"
    />
    <img
      :src="btn2"
      alt=""
      @click="$router.push('/cards')"
      srcset=""
      width="90"
      class="shdaow_ absolute top-[calc(40vh+120px)] right-[16vw]"
    />
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

const router = useRouter();
const route = useRoute();
const user = ref("");
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
async function start() {
  try {
    router.push(`/pend`);
  } catch (error) {
    showToast(error + "");
  }
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

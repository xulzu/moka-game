<template>
  <div class="h-[100vh] w-full flex justify-center items-center flex-col">
    <Field v-model="user" placeholder="请输入用户名" class="mb-3" />
    <Button type="primary" @click="start">开始</Button>
  </div>
</template>
<script lang="ts" setup>
import axios from "axios";
import { Button, Field, showToast } from "vant";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loadAssets } from "../utils/loadAssets";
const router = useRouter();
const user = ref(Date.now().toString());
const cache = localStorage.getItem("user");
if (cache) {
  user.value = cache;
}
async function start() {
  try {
    localStorage.setItem("user", user.value);
    router.push(`/pend`);
  } catch (error) {
    showToast(error + "");
  }
}
init();
async function init() {
  await loadAssets();
}
</script>
<style lang="less" scoped></style>

<template>
  <div class="h-[100vh] w-full flex justify-center items-center">
    <Button type="primary" @click="start">开始</Button>
  </div>
</template>
<script lang="ts" setup>
import { Button } from "vant";
import { useRouter } from "vue-router";
const router = useRouter();
async function start() {
  const res = await fetch("/api/pending");
  console.log(res);
  router.push(`/game`);
}
</script>
<style lang="less" scoped></style>

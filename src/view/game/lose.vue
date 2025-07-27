<template>
  <div
    v-if="show"
    @click="show = false"
    class="fixed top-0 left-0 h-[100vh] w-[100vw] z-10 bg-[#060606c9] flex justify-center items-center"
  >
    <div class="relative">
      <img src="/assets/btn_bg.webp" alt="" class="w-[140px]" />
      <div
        @click.stop="lose"
        class="absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 text-[#fce190]"
      >
        认输
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import axios from "axios";
import { ref } from "vue";
const show = ref(false);

async function lose() {
  await axios.get("/api/lose");
  show.value = false;
}
defineExpose({
  openSet() {
    show.value = true;
  },
});
</script>
<style lang="less" scoped></style>

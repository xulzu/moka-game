<template>
  <div
    v-if="show"
    @click="show = false"
    class="absolute top-0 left-0 h-full w-full z-10 bg-[#060606c9] flex flex-col justify-center items-center"
  >
    <div class="relative">
      <img src="/assets/btn_bg.webp" alt="" class="w-[140px]" />
      <div
        @click.stop="lose"
        class="absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 text-[#fce190]"
      >
        本局认输
      </div>
    </div>

    <div class="relative mt-4">
      <img src="/assets/btn_bg.webp" alt="" class="w-[140px]" />
      <div
        @click.stop="reload"
        class="absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 text-[#fce190]"
      >
        重新进入
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

function reload() {
  location.reload();
}
defineExpose({
  openSet() {
    show.value = true;
  },
});
</script>
<style lang="less" scoped></style>

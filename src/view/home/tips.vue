<template>
  <div>
    <img @click="next" :src="img" class="w-full h-full" alt="" />
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import tips1 from "/assets/tips1.webp";
import tips2 from "/assets/tips2.webp";
import tips3 from "/assets/tips3.webp";
const img = ref(tips1);
import { useRouter } from "vue-router";
const step = ref(1);
const router = useRouter();
let timer: any;
function next() {
  if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      step.value++;
      if (step.value === 2) {
        img.value = tips2;
      } else if (step.value === 3) {
        img.value = tips3;
      } else if (step.value > 3) {
        router.replace("/pend");
      }
    }, 100);
  }
}
</script>
<style lang="less" scoped></style>

<template>
  <div class="h-[100vh] w-[100vw] overflow-auto bg">
    <div
      @click="$router.push('/')"
      class="absolute top-[10px] left-[5px] text-white text-[18px] font-bold flex items-center"
    >
      <
      <div class="text-[12px] ml-[5px]">返回</div>
    </div>
    <div
      @click="click()"
      class="absolute left-0 top-[50vh] flex justify-center items-center flex-col w-full"
    >
      <div class="text-[12px] font-serif mb-2">点击签到，领取今日积分奖励</div>

      <div class="w-[160px] grid grid-cols-2 gap-y-3">
        <div
          v-for="(item, idx) in list"
          :key="idx"
          class="w-[50px] h-[50px] bg-[#e8d1a8] rounded-[50%] justify-self-center text-[18px] flex items-center justify-center"
        >
          <span class="text-green-700" v-if="item === 1"> ✓ </span>
          <span v-else-if="item === 0" class="text-gray-600"> </span>
          <span v-else class="text-red-500">×</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import axios from "axios";
import { showToast } from "vant";
import { ref } from "vue";
const list = ref<number[]>([]);
load();
async function load() {
  const { data } = await axios.get("/api/sigins");
  list.value = data || [];
}
async function click() {
  try {
    await axios.get("/api/signin");
    showToast("签到成功，获得5积分");
    load();
  } catch (error) {
    console.log(error);
    showToast(error + "");
  }
}
</script>
<style lang="less" scoped>
.bg {
  background-image: url("/assets/day_task.webp");
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
</style>

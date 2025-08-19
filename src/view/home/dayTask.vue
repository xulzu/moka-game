<template>
  <div class="h-full w-full overflow-auto bg">
    <div
      @click="$router.push('/')"
      class="absolute top-[10px] left-[5px] text-white text-[18px] font-bold flex items-center"
    >
      <
      <div class="text-[12px] ml-[5px]">返回</div>
    </div>
    <div
      @click="click()"
      class="absolute left-0 top-[50%] flex justify-center items-center flex-col w-full"
    >
      <div class="text-[12px] font-serif mb-4 mt-2">
        点击签到，领取今日积分奖励
      </div>

      <div class="w-[190px] grid grid-cols-3 gap-y-8">
        <div
          v-for="(item, idx) in list"
          :key="idx"
          class="w-[40px] h-[40px] bg-[#e8d1a8] rounded-[50%] relative justify-self-center text-[18px] flex items-center justify-center"
        >
          <span class="text-green-700" v-if="item.sigin === 1"> ✓ </span>
          <span v-else-if="item.sigin === 0" class="text-gray-600"> </span>
          <span v-else class="text-red-500">×</span>
          <span class="absolute text-[12px] -bottom-[20px]">
            <span v-if="item.date === today" class="text-blue-700">今天</span>
            <span v-else>{{ format(item.date) }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import axios from "axios";
import dayjs from "dayjs";
import { showToast } from "vant";
import { ref } from "vue";
const list = ref<
  {
    sigin: number;
    date: string;
  }[]
>([]);
const today = dayjs().format("YYYY-MM-DD");
load();
async function load() {
  const { data } = await axios.get("/api/sigins");
  list.value = data || [];
}
function format(str: string) {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const idx = dayjs(str).day();
  return weekdays[idx];
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

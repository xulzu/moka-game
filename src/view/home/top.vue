<template>
  <div class="z-0 bg absolute top-0 left-0 h-[100vh] w-[100vw]"></div>
  <div class="z-10 relative bg-[#1e1d6685] w-[100vw] min-h-[100vh] p-[5px]">
    <div class="mb-[20px] pt-[20px] relative">
      <span
        @click="$router.push('/')"
        class="absolute left-[4px] top-[22px] text-white text-[22px] font-[600]"
      >
        <
      </span>
      <div class="text-[#fce190] text-[26px] font-[600] text-center">
        排行榜
      </div>
    </div>
    <div class="flex justify-between">
      <div class="top2 mt-[18px] relative">
        <img
          src="/assets/top2.webp"
          class="h-[195px] z-10 relative shdaow_"
          alt=""
        />
        <img
          :src="top2?.avatar || img1"
          class="absolute w-[50px] h-[50px] top-[17px] left-1/2 -translate-x-1/2 rounded-[50%] overflow-hidden"
          alt=""
          @error="top2 && (top2.avatar = img1)"
        />
        <div class="w-full h-[90px] absolute top-[80px] left-0 z-20">
          <div
            class="text-[26px] font-[600] text-[#52738c] text-center"
            :style="{
              fontFamily: 'Times New Roman',
            }"
          >
            TOP2
          </div>

          <div
            class="text-[12px] text-[#6086a3] text-center mt-[3px] w-full truncate"
          >
            {{ top2?.name || "~" }}
          </div>

          <div
            class="text-[12px] font-bold text-[#52738c] text-center mt-[10px]"
          >
            积分：{{ top2?.score || 0 }}
          </div>
        </div>
      </div>
      <div class="top1 relative">
        <img
          src="/assets/top1.webp"
          class="h-[195px] z-10 relative shdaow_"
          alt=""
        />
        <img
          :src="top1?.avatar || img1"
          class="absolute w-[50px] h-[50px] top-[20px] left-1/2 -translate-x-1/2 rounded-[50%] overflow-hidden"
          alt=""
          @error="top1 && (top1.avatar = img1)"
        />
        <div class="w-full h-[90px] absolute top-[80px] left-0 z-20">
          <div
            class="text-[26px] font-[600] text-[#bb7c00] text-center"
            :style="{
              fontFamily: 'Times New Roman',
            }"
          >
            TOP1
          </div>

          <div
            class="text-[12px] text-[#d89308] text-center mt-[3px] w-full truncate"
          >
            {{ top1?.name }}
          </div>

          <div
            class="text-[12px] font-bold text-[#bb7c00] text-center mt-[10px]"
          >
            积分：{{ top1?.score || 0 }}
          </div>
        </div>
      </div>
      <div class="top3 mt-[18px] relative">
        <img
          src="/assets/top3.webp"
          class="h-[195px] z-10 relative shdaow_"
          alt=""
        />
        <img
          :src="top3?.avatar || img1"
          class="absolute w-[50px] h-[50px] top-[15px] left-1/2 -translate-x-1/2 rounded-[50%] overflow-hidden"
          alt=""
          @error="top3 && (top3.avatar = img1)"
        />
        <div class="w-full h-[90px] absolute top-[80px] left-0 z-20">
          <div
            class="text-[26px] font-[600] text-[#903b00] text-center"
            :style="{
              fontFamily: 'Times New Roman',
            }"
          >
            TOP3
          </div>

          <div
            class="text-[12px] text-[#b34d05] text-center mt-[3px] w-full truncate"
          >
            {{ top3?.name || "~" }}
          </div>

          <div
            class="text-[12px] font-bold text-[#903b00] text-center mt-[10px]"
          >
            积分：{{ top3?.score || 0 }}
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-[8px] mt-[10px] mb-[90px]" v-if="1">
      <div
        v-for="(item, index) in list.slice(3)"
        :key="index"
        class="h-[60px] flex rounded-[6px] overflow-hidden"
      >
        <div
          class="w-[65px] bg-[#5c518c] text-[22px] font-bold text-white text-center leading-[60px]"
        >
          {{ index + 4 }}
        </div>
        <div
          class="flex-1 bg-[#4d3f7c] flex items-center pl-[10px] text-[12px]"
        >
          <img
            :src="item.avatar"
            class="w-[45px] h-[45px] rounded-[50%] border-[2px] border-solid border-[#ecd4d4] overflow-hidden"
            alt=""
            @error="item && (item.avatar = img1)"
          />
          <div class="text-[#fff] ml-[10px]">
            {{ item.name }}
          </div>
          <div class="text-[#fff] ml-[10px] flex-1 flex justify-end p-[20px]">
            积分：{{ item.score }}
          </div>
        </div>
      </div>
    </div>

    <div class="fixed p-[5px] left-0 bottom-[2px] w-full">
      <div class="h-full w-full flex rounded-[6px] overflow-hidden selfShadow">
        <div
          class="w-[65px] bg-[#7264ad] text-[22px] font-bold text-white text-center leading-[60px]"
        >
          {{ self && self.rank > 99 ? "99+" : self?.rank }}
        </div>
        <div
          class="flex-1 bg-[#6755a0] flex items-center pl-[10px] text-[12px]"
        >
          <img
            :src="self?.avatar || img1"
            class="w-[45px] h-[45px] rounded-[50%] border-[2px] border-solid border-[#ecd4d4] overflow-hidden"
            alt=""
            @error="self && (self.avatar = img1)"
          />
          <div class="text-[#ea9f0c] ml-[10px]">
            {{ self?.name || "~" }}
          </div>
          <div
            class="text-[#ea9f0c] ml-[10px] flex-1 flex justify-end p-[20px]"
          >
            积分：{{ self?.score || 0 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref } from "vue";
import img1 from "/assets/user_ico.webp";
import axios from "axios";
import "/assets/loading_bg.webp";
interface User {
  name: string;
  userid: string;
  score: string;
  avatar: string;
}
const list = ref<User[]>([]);
const self = ref<User & { rank: number }>();
const top1 = computed(() => {
  if (list.value.length === 0) return;
  return list.value[0];
});
const top2 = computed(() => {
  if (list.value.length < 2) return;
  return list.value[1];
});
const top3 = computed(() => {
  if (list.value.length < 3) return;
  return list.value[2];
});
init();
async function init() {
  const user = localStorage.getItem("user");
  const { data } = await axios.get("/api/list");
  list.value = data || [];
  const selfIdx = list.value.findIndex((item: any) => item.userid == user);
  if (selfIdx !== -1) {
    self.value = {
      ...list.value[selfIdx],
      rank: selfIdx,
    };
  }
}
</script>
<style lang="less" scoped>
.bg {
  background-image: url("/assets/loading_bg.webp");
  background-size: 100% 100%;
}

.shdaow_ {
  filter: drop-shadow(0px 0px 2px #fdfdf9);
}

.selfShadow {
  box-shadow: 0px -5px 54px #0a0a0ac7;
}
</style>

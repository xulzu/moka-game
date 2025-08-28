<template>
  <ConfigProvider :locale="zhCN">
    <div class="grid grid-cols-[200px_1fr]">
      <div class="min-h-screen bg-[#001529]">
        <div
          class="font-bold text-3xl py-2 text-center bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent"
        >
          GAME-ADMIN
        </div>
        <Menu
          :items="items"
          theme="dark"
          :selectedKeys="activeKey"
          @click="click"
        >
        </Menu>
      </div>
      <div class="p-2">
        <RouterView></RouterView>
      </div>
    </div>
  </ConfigProvider>
</template>
<script lang="ts" setup>
import { Card, ConfigProvider, Menu, Table } from "ant-design-vue";
import { computed, h, ref } from "vue";
import { AppstoreOutlined } from "@ant-design/icons-vue";
import { useRoute, useRouter } from "vue-router";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
const items = [
  {
    key: "/admin/user",
    label: "用户管理",
    icon: () => h(AppstoreOutlined),
  },
  {
    key: "/admin/match",
    label: "对局记录",
    icon: () => h(AppstoreOutlined),
  },
];
const route = useRoute();
const router = useRouter();
const activeKey = computed(() => {
  return [route.path];
});

function click(item: any) {
  router.push(item.key);
}
</script>
<style scoped></style>

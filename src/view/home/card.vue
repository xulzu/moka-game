<template>
  <div ref="divRef" class="w-[131px] h-[160px]"></div>
</template>
<script lang="ts" setup>
import { Application } from "pixi.js";
import { onMounted, useTemplateRef } from "vue";
import { Card } from "../game/Card";
import { loadAssets } from "../utils/loadAssets";
const divRef = useTemplateRef("divRef");
const props = defineProps<{
  data: any;
}>();
onMounted(async () => {
  if (!props.data) return;
  const app = new Application();
  await loadAssets();
  await app.init({
    background: "#2a174c",
    resizeTo: divRef.value!,
    resolution: window.devicePixelRatio,
    autoDensity: true,
  });
  divRef.value?.appendChild(app.canvas);
  const card = new Card(0, 0, props.data as any, app);
  card.draggle = false;
  card.pivot.set(0, 0);
  app.stage.addChild(card);
});
</script>
<style lang="less" scoped></style>

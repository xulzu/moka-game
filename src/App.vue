<template>
  <div
    class="flex justify-center items-center sm:h-[100vh]"
    :class="{
      bigbk: !isMobile,
    }"
  >
    <div
      class="relative z-10 h-[100vh] sm:h-[667px] w-[100vw] sm:w-[375px] overflow-auto hide-scrollbar"
    >
      <RouterView />
    </div>
  </div>
</template>
<script lang="ts" setup>
const isMobile = window.isMobile;
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.hide-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

.bigbk {
  background-image: url("/assets/bigbk.webp");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  backdrop-filter: brightness(0.5) blur(10px);
}
.bigbk::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #054151e6;
}
</style>

<template>
  <div
    class="h-full w-full bg-[#000000c7] absolute left-0 top-0 z-10 text-white text-[14px] p-2 justify-center flex flex-col items-center"
  >
    <div class="w-[80%] space-y-2 relative">
      <div class="text-red-500">X 关闭</div>
      <div>1、 游戏方式为双方交替出牌,率先将对方生命值降为零时获取胜利。</div>
      <div>2、体力每小时恢复一点，开始一局游戏需要两点体力。</div>
      <div>
        3、每回合自动抽两张牌，回合结束时最多只能保留四张。多出的会从左侧开始丢弃。
      </div>
      <div>
        4、红色攻击牌和绿色策略牌只能在自己回合打出，蓝色防御牌只能在对方回合对方攻击时用来防守。
      </div>
      <div>
        5、当抽牌阶段抽牌时如果牌库数目不够，会对自己扣除抽排数的生命值（2点）。
      </div>
      <div>
        6、当10秒内没匹配到其他玩家会和电脑进行对战，与电脑对战胜利时只能增加2点积分。当和玩家对战胜利时默认获得4点积分，真人对战三连胜后改为获得6点积分。如果输掉游戏扣除2点积分。
      </div>
      <div>
        7、每名玩家的回合时间为默认为30秒，倒计时结束后自动结束。为防止恶意挂机，每当倒计时结束后没手动结束，自己的回合时间会按[20,10,5]的节奏依次减少。
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup></script>
<style lang="less" scoped></style>

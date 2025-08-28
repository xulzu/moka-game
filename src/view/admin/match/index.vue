<template>
  <div>
    <Table
      :columns="columns"
      :dataSource="tableData"
      :pagination="{
        current: pageIndex,
        pageSize: pageSize,
        total: pageTotal,
        onChange: (page, pageSize) => {
          loadTableData(page, pageSize);
        },
        showTotal(total) {
          return `共${total}条`;
        },
      }"
    >
    </Table>
  </div>
</template>
<script lang="ts" setup>
import {
  Button,
  Card,
  Divider,
  Input,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from "ant-design-vue";
import type { ColumnsType } from "ant-design-vue/es/table";
import axios from "axios";
import dayjs from "dayjs";
import { reactive, ref } from "vue";

interface Match {
  id: number;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  score1: number;
  score2: number;
  created_at: string;
}

const columns: ColumnsType<Match> = [
  {
    title: "玩家1",
    dataIndex: "player1_id",
  },
  {
    title: "玩家2",
    dataIndex: "player2_id",
  },
  {
    title: "胜者",
    dataIndex: "winner_id",
  },
  {
    title: "p1积分",
    dataIndex: "score1",
  },
  {
    title: "p2积分",
    dataIndex: "score2",
  },
  {
    title: "对局结束时间",
    dataIndex: "created_at",
    customRender({ record }) {
      return (
        record.created_at &&
        dayjs(record.created_at).add(8, "hours").format("YYYY-MM-DD HH:mm:ss")
      );
    },
  },
];
const loading = ref(false);
const tableData = ref<Match[]>([]);
const pageIndex = ref(1);
const pageSize = ref(10);
const pageTotal = ref(0);
loadTableData();
async function loadTableData(
  page_: number = pageIndex.value,
  pageSize_: number = pageSize.value
) {
  try {
    const { data } = await axios.get("/api/admin/matches", {
      params: {
        page: page_,
        pageSize: pageSize_,
      },
    });
    pageIndex.value = page_;
    pageSize.value = pageSize_;
    tableData.value = data.data;
    pageTotal.value = data.total;
  } catch (error) {
    message.error(error + "");
  } finally {
    loading.value = false;
  }
}
</script>
<style lang="less" scoped></style>

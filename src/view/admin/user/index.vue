<template>
  <div>
    <Card class="!mb-2">
      <Input
        style="width: 200px"
        allowClear
        v-model:value="keyword"
        placeholder="用户名/工号"
      >
      </Input>

      <Button type="primary" class="ml-2" @click="loadTableData()">
        查询
      </Button>
    </Card>
    <Table
      :columns="columns"
      :dataSource="tableData"
      :pagination="{
        showTotal(total) {
          return `共${total}条`;
        },
      }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'opt'">
          <Space :size="5">
            <template #split>
              <Divider type="vertical" class="border-[#a9adad]" />
            </template>
            <Popconfirm
              title="确认继续重置体力？"
              @confirm="resetStamina(record as User)"
            >
              <Typography.Link class="text-blue-600">重置体力</Typography.Link>
            </Popconfirm>
            <Popconfirm
              title="确认继续删除？"
              @confirm="deleteItem(record as User)"
            >
              <Typography.Link type="danger">删除</Typography.Link>
            </Popconfirm>
          </Space>
        </template>
      </template>
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
import { useRoute, useRouter } from "vue-router";

interface User {
  id: number;
  userid: string;
  name: string;
  avatar: string;
  score: number;
  stamina: number;
  last_update: number;
}

const columns: ColumnsType<User> = [
  {
    title: "姓名",
    dataIndex: "name",
  },
  {
    title: "工号",
    dataIndex: "userid",
  },
  {
    title: "积分",
    dataIndex: "score",
  },
  {
    title: "体力",
    dataIndex: "stamina",
  },
  {
    title: "体力更新时间",
    dataIndex: "last_update",
    customRender({ record }) {
      return (
        record.last_update &&
        dayjs(record.last_update).format("YYYY-MM-DD HH:mm:ss")
      );
    },
  },
  {
    title: "操作",
    key: "opt",
    align: "center",
    width: 200,
  },
];
const loading = ref(false);
const tableData = ref<User[]>([]);
const keyword = ref("");
loadTableData();
async function loadTableData() {
  try {
    const { data } = await axios.get("/api/admin/users");
    tableData.value =
      (data as User[]).filter((item) => {
        if (!keyword.value) return true;
        if (item.name.includes(keyword.value)) return true;
        if (item.userid.includes(keyword.value)) return true;
        return false;
      }) || [];
  } catch (error) {
    message.error(error + "");
  } finally {
    loading.value = false;
  }
}

async function deleteItem(record: any) {
  try {
    await axios.delete("/api/admin/user", {
      params: {
        userid: record.userid,
      },
    });
    message.success("删除成功");
    loadTableData();
  } catch (error) {
    message.error(error + "");
  }
}

async function resetStamina(params: User) {
  try {
    const { data } = await axios.put("/api/admin/reset-stamina", {
      userid: params.userid,
    });
    message.success("重置体力成功");
    loadTableData();
  } catch (error) {
    message.error(error + "");
  }
}
</script>
<style lang="less" scoped></style>

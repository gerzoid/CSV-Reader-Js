<script setup>
import * as XLSX from "xlsx";
import { HotTable } from "@handsontable/vue3";
import { onMounted, ref } from 'vue';

const hotTable = ref(null);

const data = ref([]);
const headers = ref([]);
const headersFirstRow = ref(false);

const onFileChange = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const data = XLSX.readFile(reader.result);
    const sheet = data.Sheets[0];

    if (headersFirstRow.value) {
      headers.value = sheet.columns.map(col => col.dataFormat.label);
      data.value = sheet.data.map(row => row.slice(1));
    } else {
      headers.value = sheet.columns.map(col => col.dataFormat.label);
      data.value = sheet.data;
    }

    hotTable.value.loadData(data.value);
  };

  reader.readAsBinaryString(file);
};

onMounted(() => {
  // Инициализация данных
  if (document.querySelector('.file-input').files.length) {
    onFileChange(document.querySelector('.file-input'));
  }
});
</script>

<template>
  <div>
    <h1>CSV редактор</h1>
    <div class="file-upload">
      <input type="file" class="file-input" @change="onFileChange" />
      <label for="file-input">Выбрать файл</label>
    </div>
    <div class="table" v-if="data">
      <hot-table
        ref="hotTable"
        data="data"
        columns="headers"
        width="100%"
        height="500px"
      ></hot-table>
    </div>
    <div class="settings">
      <input type="checkbox" id="headers-first-row" v-model="headersFirstRow" />
      <label for="headers-first-row">Заголовки в первой строке</label>
    </div>
  </div>
</template>
<script setup>
import * as XLSX from "xlsx";
import { HotTable } from "@handsontable/vue3";
import { ContextMenu } from "handsontable/plugins/contextMenu";
import { registerAllModules } from "handsontable/registry";
import { ref, onMounted } from "vue";
import * as chardet from "chardet";
import "handsontable/dist/handsontable.full.min.css";
import { useSettingsStore } from "../stores/settingsStore";

const settingsStore = useSettingsStore();

registerAllModules();

var csvData = ref([[null, null, null, null]]);
var hotCSV = ref(null);

onMounted(() => {});

var hotSettings = {
  licenseKey: "non-commercial-and-evaluation",
  width: "100%",
  height: "100%",
  allowInsertColumn: true,
  colHeaders: true,
  rowHeaders: true,
  manualColumnResize: true,
  manualColumnMove: true, // Активация возможности перемещения колонок
  renderAllRows: false,
  minRows: 10,
  startRows: 10,
  columns: [
    { title: "Колонка 1" },
    { title: "Колонка 2" },
    { title: "Колонка 3" },
    { title: "Колонка 4" },
  ],
  contextMenu: {
    items: {
      col_left: {
        name: "Вставить столбец (перед)",
        disabled: false,
        callback(key, selection, clickEvent) {
          csvData.value.forEach(function (row, rowIndex) {
            row.splice(selection[0].start.col, 0, null);
          });
          hotSettings.columns.splice(selection[0].start.col, 0, null);
        },
      },
      row_above: {
        name: "Вставить строку (перед)",
      },
      row_below: {
        name: "Вставить строку (после)",
      },
      separator: ContextMenu.SEPARATOR,
      clear_custom: {
        name: "Очистить таблицу",
        callback() {
          this.clear();
        },
      },
    },
  },
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    settingsStore.currentFile = file;
    parseCSV(file);
  }
};

const onHandleCheckBoxHasHeaderChange = () => {
  parseCSV(settingsStore.currentFile);
};

const parseCSV = async (file) => {
  console.log("parseCSV");
  if (file == null) return;

  const buffer = await readFileAsync(file);
  // Автоматическое определение кодировки
  settingsStore.detectedEncoding = chardet.detect(buffer);
  // Выбор кодировки: автоматически или пользовательский выбор
  const selectedEncoding2 = settingsStore.useAutoDetectEncoding
    ? settingsStore.detectedEncoding
    : settingsStore.selectedEncoding.value;
  // Преобразование данных с использованием выбранной кодировки
  const text = new TextDecoder(selectedEncoding2).decode(buffer);

  const workbook = XLSX.read(text, { type: "binary" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Автоматическое определение кодировки
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  csvData.value = jsonData.reduce((acc, row, index) => {
    if (settingsStore.hasHeaders && index === 0) {
      return acc; // Пропускаем первую строку при включенном чекбоксе
    }
    const valuesArray = Object.values(row);
    acc.push(valuesArray);
    return acc;
  }, []);

  // Обновляем колонки в hotSettings
  hotSettings.columns = jsonData[0].map((header, index) => ({
    data: index,
    title: settingsStore.hasHeaders === true ? header : `Column ${index + 1}`,
  }));
  hotSettings.minSpareRows = 0;

  if (hotCSV.value !== null) {
    hotCSV.value.hotInstance.updateSettings(hotSettings);
    hotCSV.value.hotInstance.updateData(csvData);
  }
};

const readFileAsync = (file) => {
  console.log("readfileAsync");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const buffer = new Uint8Array(arrayBuffer);
      resolve(buffer);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

const saveCSV = () => {
  console.log(csvData);
  return;

  const exportData = settingsStore.hasHeaders.value
    ? [hotSettings.columns.map((col) => col.title), ...csvData.value]
    : csvData.value;

  console.log(exportData);
  console.log(csvData.value);
  const ws = XLSX.utils.json_to_sheet(exportData);
  const csvData2 = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvData2], { type: "text/csv;charset=Shift_JIS" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "output.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>
<template>
  <div class="container">
    <input type="file" @change="handleFileChange" />
    <div class="row">
      <label>
        <input
          type="checkbox"
          @change="onHandleCheckBoxHasHeaderChange"
          v-model="settingsStore.hasHeaders"
        />
        У файла есть заголовки
      </label>
      <label>
        <input
          type="checkbox"
          @change="onHandleCheckBoxHasHeaderChange"
          v-model="settingsStore.useAutoDetectEncoding"
        />
        Автоопределение кодировки
      </label>
      <div class="col-100px">
        <select
          :disabled="settingsStore.useAutoDetectEncoding"
          v-model="settingsStore.selectedEncoding"
          @change="onHandleCheckBoxHasHeaderChange"
        >
          <option value="UTF-8">UTF-8</option>
          <option value="UTF-16">UTF-16</option>
          <option value="ISO-8859-1">ISO-8859-1</option>
          <option value="Windows-1251">Windows-1251</option>
          <option value="KOI8-R">KOI8-R</option>
          <option value="CP1252">CP1252</option>
        </select>
      </div>
    </div>
    <div class="table">
      <hot-table
        ref="hotCSV"
        :data="csvData"
        :settings="hotSettings"
        v-if="csvData.length > 0"
      ></hot-table>
    </div>
    <button class="buttons col-100px" @click="saveCSV">Сохранить в CSV</button>
  </div>
</template>
<style>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.file-input {
  width: 100%;
}

.row {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.col-100px {
  width: 100px;
}
.col {
  flex: 1;
}
</style>
../astores/settingsStore

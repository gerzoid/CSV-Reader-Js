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
  allowRemoveColumn: true,
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
          hotSettings.columns.splice(selection[0].start.col, 0, {
            title: "Column" + (selection[0].start.col + 1),
          });

          csvData.value.forEach(function (row, rowIndex) {
            row.splice(selection[0].start.col, 0, null);
          });
        },
      },
      col_right: {
        name: "Вставить столбец (после)",
        disabled: false,
        callback(key, selection, clickEvent) {
          var posColumn = selection[0].start.col + 1;
          hotSettings.columns.splice(posColumn, 0, {
            title: "Column" + (posColumn+1),
          });
          csvData.value.forEach(function (row, rowIndex) {
            row.splice(posColumn, 0, null);
          });
        },
      },

      row_above: {
        name: "Вставить строку (перед)",
      },
      row_below: {
        name: "Вставить строку (после)",
      },
      remove_row: {
        name: "Удалить строку",
      },
      remove_col: {
        name: "Удалить колонку",
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
const updateGrid=()=>{
  if (hotCSV.value !== null) {
    hotCSV.value.hotInstance.updateSettings(hotSettings);
    hotCSV.value.hotInstance.updateData(csvData.value);
  }
}
//Смена значения чекбокса - У файла есть заголовки
const onHandleCheckBoxHasHeaderChange = (event) => {
  //Копируем значение колонок в массив данных
  if (!settingsStore.hasHeaders)
    csvData.value.unshift(hotSettings.columns.map((column) => column.title));
    hotSettings.columns = csvData.value[0].map((header, index) => ({
    title: settingsStore.hasHeaders === true ? header : `Column ${index + 1}`,
  }));

  if (settingsStore.hasHeaders) {
    csvData.value = csvData.value.reduce((acc, row, index) => {
      if (settingsStore.hasHeaders && index === 0) {
        return acc; // Пропускаем первую строку при включенном чекбоксе
      }
      acc.push(Array.from(row, (value, key) => value));
      return acc;
    }, []);
  }

  if (hotCSV.value !== null) {
    hotCSV.value.hotInstance.updateSettings(hotSettings);
    hotCSV.value.hotInstance.updateData(csvData.value);
  }
};
const parseCSV = async (file) => {

  if (file == null) return;

  const buffer = await readFileAsync(file);
  // Автоматическое определение кодировки
  settingsStore.detectedEncoding = chardet.detect(buffer);

  const selectedEncoding2 = settingsStore.useAutoDetectEncoding
    ? settingsStore.detectedEncoding
    : settingsStore.selectedEncoding;

  // Преобразование данных с использованием выбранной кодировки
  const text = new TextDecoder(selectedEncoding2).decode(buffer);

  const workbook = XLSX.read(text, { type: "binary" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

  csvData.value = jsonData.reduce((acc, row, index) => {
    if (settingsStore.hasHeaders && index === 0) {
      return acc; // Пропускаем первую строку при включенном чекбоксе
    }
    acc.push(Array.from(row, (value, key) => value));
    return acc;
  }, []);

  // Обновляем колонки в hotSettings
  hotSettings.columns = jsonData[0].map((header, index) => ({
    //data: index,
    title: settingsStore.hasHeaders === true ? header : `Column ${index + 1}`,
  }));
  hotSettings.minSpareRows = 0;

  updateGrid();
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

  const exportData = [...csvData.value];
  if (settingsStore.hasHeaders)
    exportData.unshift(hotSettings.columns.map((column) => column.title));

  const ws = XLSX.utils.json_to_sheet(exportData);
  var csvData2 = XLSX.utils.sheet_to_csv(ws);

  let index = csvData2.indexOf(String.fromCharCode(0x0A))
  if (index !== -1)
    csvData2 = csvData2.substring(index + 1);

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
    <div class="buttons-row">
      <div id="customFileInput">
        <label  class="buttons col-150px" for="fileInput">Открыть файл</label>
        <input type="file" id="fileInput" @change="handleFileChange" style="display: none;" />
      </div>
      <button class="buttons col-150px" @click="saveCSV">Сохранить в CSV</button>
  </div>
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
          v-model="settingsStore.useAutoDetectEncoding"
        />
        Автоопределение кодировки
      </label>
      <div class="col-100px">
        <select
          :disabled="settingsStore.useAutoDetectEncoding"
          v-model="settingsStore.selectedEncoding"
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
  </div>
</template>
<style>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.buttons-row{
  display: flex;
}

.file-input {
  width: 100%;
}

.row {
  display: flex;
  flex-direction: row;
  width: 100%;
}
#customFileInput{
  display: flex;
  text-align: center;
}
.col-100px {
  width: 100px;
}
.col-150px {
  width: 140px;
  padding:5px;
  margin:10px;
}
.col {
  flex: 1;
}
</style>
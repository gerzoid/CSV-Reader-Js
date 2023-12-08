<script setup>
import * as XLSX from "xlsx";
import { HotTable } from "@handsontable/vue3";
import { registerAllModules } from "handsontable/registry";
import { ref } from "vue";
import "handsontable/dist/handsontable.full.min.css";

var csvData = ref([]);
registerAllModules();
var hotCSV = ref(null);

var hotSettings = { 
  data: [],
  licenseKey: "non-commercial-and-evaluation",
  colHeaders: true,
  rowHeaders: true,
  stretchH: "all",
  renderAllRows: false,
  minSpareRows: 10,
  minSpareCols: 10,
  columns: [],
};
var hasHeaders = ref(true);

var currentFile = null;

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    currentFile = file;
    parseCSV(file);
  }
};

const onHandleCheckBoxHasHeaderChange =()=>{
  parseCSV(currentFile);
}


const parseCSV = (file) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1});

    csvData.value = jsonData.reduce((acc, row, index) => {
          if (hasHeaders.value && index === 0) {
            return acc; // Пропускаем первую строку при включенном чекбоксе
          }
          const obj = {};
          Object.keys(row).forEach((key) => {
            obj[key] = row[key];
          });
          acc.push(obj);
          return acc;
        }, []);
        // Обновляем колонки в hotSettings
        hotSettings.columns =  jsonData[0].map((header,index) => ({
          data: index,
          title: hasHeaders.value===true ? header : `Column ${index + 1}`,
        }))
  };
  reader.readAsText(file, "WINDOWS-1251");
  hotSettings.minSpareRows = 0;

  if (hotCSV.value!==null)
  {
    hotCSV.value.hotInstance.updateSettings(hotSettings);
    hotCSV.value.hotInstance.updateData(csvData);
  }


};

const saveCSV = ()=> {
  const exportData = hasHeaders.value
        ? [hotSettings.columns.map((col) => col.title), ...csvData.value]
        : csvData.value;

        console.log(exportData);
        console.log(csvData.value);
     const ws = XLSX.utils.json_to_sheet(exportData);
      const csvData2 = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvData2], { type: 'text/csv;charset=Shift_JIS' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'output.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); 
}

</script>
<template>
   <div class="container">
    <input type="file" @change="handleFileChange" />
    <label> <input type="checkbox" @change="onHandleCheckBoxHasHeaderChange" v-model="hasHeaders" /> У файла есть заголовки </label>
    <div class="row">
    <hot-table
      ref="hotCSV"
      :data="csvData"
      :settings="hotSettings"
      v-if="csvData.length > 0"
    ></hot-table>
    </div>
    <button @click="saveCSV">Сохранить в CSV</button>
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

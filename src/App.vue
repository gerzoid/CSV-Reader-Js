<script setup>
import CsvEditor from "./components/CsvEditor.vue";
import CsvEditor2 from "./components/CsvEditor2.vue";
</script>

<template>
  <CsvEditor2></CsvEditor2>
</template>

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
</style>

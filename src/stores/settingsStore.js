import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        loading: false,
        selectedEncoding:"Windows-1251",
        detectedEncoding:"",
        hasHeaders:true,
        useAutoDetectEncoding: true,
        currentFile:null,
    }),
    getters: {
    },
    actions: {
    },
  })
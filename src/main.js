import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

let Pinia = createPinia();

createApp(App).use(Pinia).mount('#app')

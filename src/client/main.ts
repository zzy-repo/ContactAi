import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'virtual:uno.css'

const app = createApp(App)

// 导入 pdfjs 并设置工作目录
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

// 导入 pinia
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)

createApp(App).mount('#app')

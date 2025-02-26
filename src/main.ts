import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)

// 导入 pdfjs 并设置工作目录
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.js',
    import.meta.url
).toString();  // [3,9](@ref)

// 导入 pinia
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)

createApp(App).mount('#app')

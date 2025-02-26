import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), UnoCSS()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.SERVER_PORT}`,
        changeOrigin: true,
      },
    },
  },
})

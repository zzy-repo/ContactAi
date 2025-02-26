import express from 'express';
import path from 'path';
import cors from 'cors'
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 获取当前文件的绝对路径，找到public的位置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __publicpath = path.join(__dirname, '..', '..', 'public')
// console.log(__publicpath)

// 加载 .env 文件
dotenv.config();
const PORT = process.env.SERVER_PORT

const app = express();

// 设置静态文件服务，指向 public 目录
app.use(express.static(__publicpath))
app.use(cors())

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
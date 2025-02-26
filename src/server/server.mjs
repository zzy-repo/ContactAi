import express from 'express';
import path from 'path';
import cors from 'cors'
import dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();
const PORT = process.env.SERVER_PORT

const app = express();

// 设置静态文件服务，指向 public 目录
app.use(express.static(path.join('..', '..', 'public')));
app.use(cors)

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
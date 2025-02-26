import express from 'express';
import path from 'path';

const app = express();

// 设置静态文件服务，指向 public 目录
app.use(express.static(path.join('..', '..', 'public')));

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${import.meta.env.PORT}`);
});
import express from 'express';
import path from 'path';
import cors from 'cors'
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth'; // 添加 Word 文档解析库

// 获取当前文件的绝对路径，找到public的位置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __publicpath = path.join(__dirname, '..', '..', 'public')
const __docxPath = path.join(__publicpath, 'sample.docx'); // 文档路径
// console.log(__publicpath)

// 加载 .env 文件
dotenv.config();
const PORT = process.env.SERVER_PORT

const app = express();

// 设置静态文件服务，指向 public 目录
app.use(express.static(__publicpath))
app.use(cors())

// 文档处理 API
app.get('/document', async (req, res) => {
    try {
        // 读取并解析 Word 文档
        const { value: html } = await mammoth.convertToHtml({ path: __docxPath });

        // 清理和格式化文本内容
        const cleanText = html
            .replace(/<[^>]+>/g, '') // 移除 HTML 标签
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');

        res.json({
            success: true,
            content: cleanText,
            metadata: {
                source: path.basename(__docxPath),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('文档处理失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DOC_PROCESSING_ERROR',
                message: '无法处理文档文件'
            }
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
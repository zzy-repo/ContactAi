import express from 'express';
import path from 'path';
import cors from 'cors'
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth'; // 添加 Word 文档解析库
import OpenAI from "openai";
import bodyParser from 'body-parser'
import { error } from 'console';

// 加载 .env 文件
dotenv.config();
const PORT = process.env.SERVER_PORT

// 初始化 OpenAI 客户端
const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: process.env.BASE_URL
});

// 调用阿里云 API
async function request2model(prompt, question) {
    try {
        const completion = await openai.chat.completions.create({
            model: "qwen-max-latest", // 使用 qwen-max-latest 模型
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: question }
            ],
        });

        // 返回 API 响应
        return completion;
    } catch (error) {
        console.error('调用模型 API 失败:', error);
        throw error;
    }
}

// 获取当前文件的绝对路径，找到public的位置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __publicpath = path.join(__dirname, '..', '..', 'public')
const __docxPath = path.join(__publicpath, 'sample.docx'); // 文档路径
// console.log(__publicpath)


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

// 新增合同检查API端点
app.use(bodyParser.json());
app.post('/check-contract', async (req, res) => {
    try {
        const { contractContent } = req.body;
        if (!contractContent) {
            throw error('没有接收到消息')
        }

        // 构造请求参数（参考网页3邮件API的配置方式）
        const rules = [
            "检查合同是否包含双方的正式名称和签署日期。",
            "验证合同总金额与付款条款的一致性。",
            "检查合同中是否明确规定了交货工期。",
            "确认合同中是否包含保密条款。",
            "检查违约金条款是否符合法律规定。",
            "验证知识产权归属是否明确。",
            "检查合同是否包含不可抗力条款。",
            "确认合同是否规定了解决争议的方式。",
            "检查合同是否包含项目实施计划的具体要求。",
            "验证合同附件是否齐全。",
        ]

        const prompt = `你是一名法律咨询师，现有一个合同文档和若干需要检查的规则内容。请根据这些规则对合同进行检查，并以JSON数组格式输出结果。输出格式如下：[{\"rule\":\"检查合同是否包含项目实施计划的具体要求。\",\"qualification\":true,\"description\":\"...\"},{\"rule\":\"...\",\"qualification\":true,\"description\":\"...\"}]。请注意：1. 必须严格按照提供的规则进行检查；2. 输出内容必须严格符合JSON格式，不得包含任何额外的文本或字符，包括代码块标记（如\`\`\`json\`\`\`）。`;

        // 调用阿里云API
        const question = `规则:\n${rules.join('\n')}\n合同内容:\n${contractContent}`
        const completion = await request2model(prompt, question)
        const result = completion.choices[0].message.content
        const data = JSON.parse(result)
        console.log(data)

        // 返回标准化响应
        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('合同检查失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'CONTRACT_CHECK_ERROR',
                message: '合同规则校验失败'
            }
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
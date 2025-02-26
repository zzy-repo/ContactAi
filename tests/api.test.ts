import { describe, test, expect } from 'vitest';

describe('API 真实请求测试', () => {
  test('成功获取 PDF 文件', async () => {
    // 1. 发起真实请求
    const response = await fetch('http://localhost:5173/api/sample.pdf');

    // 2. 验证基础响应状态
    expect(response.status).toBe(200);
    expect(response.ok).toBeTruthy(); // 验证 HTTP 状态码 2xx[7](@ref)

    // 3. 验证内容类型
    const contentType = response.headers.get('content-type');
    expect(contentType).toMatch(/application\/pdf/); // 包含 MIME 类型标识[7,9](@ref)

    // 4. 验证二进制内容特征
    const buffer = await response.arrayBuffer();
    const headerBytes = new Uint8Array(buffer.slice(0, 4));
    const pdfHeader = Array.from(headerBytes)
      .map(byte => String.fromCharCode(byte))
      .join('');
      
    expect(pdfHeader).toMatch(/^%PDF/); // 验证 PDF 文件头标识[9](@ref)
  });

  test('正常响应测试', async () => {
    // 执行请求
    const response = await fetch('http://localhost:5173/api/document')

    // 2. 验证基础响应状态
    expect(response.status).toBe(200);
    expect(response.ok).toBeTruthy(); // 验证 HTTP 状态码 2xx[7](@ref)

    // 验证响应结构
    expect(response.body).toMatchObject({
      success: true,
      content: expect.any(String),
      metadata: {
        source: expect.stringMatching(/\.docx$/),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      }
    })

    console.log(response)
  });
});

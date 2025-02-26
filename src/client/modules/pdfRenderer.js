import { stateManager } from './stateManager.js';
import searchUtils from './searchUtils.js'
import * as pdfjsLib from 'pdfjs-dist';

export default class pdfRenderer {
    constructor() {
    }

    /**
     * 渲染指定页码的 PDF 页面，并更新相关状态。
     *
     * @param {number} pageNumber - 要渲染的页码。
     */
    static async renderPage(pageNumber) {
        // 设置渲染状态为 true
        stateManager.setIsPageRendering(true);
        // 清除画布内容
        this.clearCanvas();
        // 渲染 PDF 页面
        await this.renderPdfPage(pageNumber);
        // 如果有搜索文本，则高亮显示
        const searchText = stateManager.getSearchText()
        const page = await stateManager.getCurrentPageItem()
        if (searchText) {
            const canvasElement = stateManager.getElement()
            await this.highlightSearchText(canvasElement, page, searchText);
        }
        // 更新页码显示和状态
        this.updatePageState(pageNumber);
    }

    static async highlightSearchText(canvasElement, page, searchText) {
        const canvasContext = canvasElement.getContext('2d')
        // 获取页面的文本内容
        const textContent = await page.getTextContent()
        const items = searchUtils.searchForTextInItems(textContent.items, searchText)

        // 遍历所有文本块
        items.forEach(item => {// TODO:绘制高亮
            // 获取文本坐标信息
            const { transform } = item;
            const [scaleX, skewY, skewX, scaleY, offsetX, offsetY] = transform;

            // 获取画布坐标信息
            const { left, top, right, bottom, width, height } = canvasElement.getBoundingClientRect();

            // 计算文本坐标
            const x = offsetX + right
            const y = offsetY + bottom

            // 绘制一个点
            canvasContext.fillStyle = "red"; // 设置填充颜色
            canvasContext.fillRect(x, y, 100, 100); // 绘制一个 5*5 的矩形
            console.log({ x }, { y })

        });
    }

    /**
     * 清除画布内容。
     */
    static clearCanvas() {
        const canvasElement = stateManager.getElement();
        const canvasContext = canvasElement.getContext('2d');
        canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }

    /**
     * 更新页面状态，并处理待渲染的页码（如果有）。
     *
     * @param {number} pageNumber - 当前页码。
     */
    static updatePageState(pageNumber) {
        stateManager.updatePageDisplay(pageNumber); // 更新页面显示
        stateManager.setIsPageRendering(false); // 解除渲染状态
        // 如果有待渲染的页码，则立即渲染该页码
        if (stateManager.getPendingPageNumber()) {
            this.renderPage(stateManager.getPendingPageNumber());
            stateManager.clearPendingPageNumber(); // 清除待渲染页码
        }
    }

    /**
     * 渲染指定页码的 PDF 页面。
     *
     * @param {number} pageNumber - 要渲染的页码。
     */
    static async renderPdfPage(pageNumber) {
        const pdfDoc = stateManager.getPdfDoc(); // 获取 PDF 文档
        const page = await pdfDoc.getPage(pageNumber); // 获取指定页码的页面
        const viewport = page.getViewport({ scale: stateManager.getZoomLevel() }); // 获取视口信息
        // 设置画布尺寸以匹配视口
        const canvasElement = stateManager.getElement();
        const canvasContext = canvasElement.getContext('2d');
        [canvasElement.height, canvasElement.width] = [viewport.height, viewport.width];
        // 渲染页面
        const renderContext = { canvasContext, viewport };
        await page.render(renderContext).promise;
    }

    /**
     * 加载 PDF 文件并初始化渲染。
     *
     * @param {string} url - PDF 文件的 URL 地址。
     */
    static async loadPdf(url) {
        try {
            // 通过 fetch 获取 PDF 数据，再传递给 pdfjsLib
            const response = await fetch(url); // 相对路径会被 Vite 代理转发
            if (!response.ok) {
                throw new Error('Failed to fetch PDF');
            }
            const arrayBuffer = await response.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            // 使用 pdfjsLib 加载 PDF 文档
            // const pdf = await pdfjsLib.getDocument(url).promise;
            await stateManager.init(pdf); // 将 PDF 文档存储到状态管理器中
            // 获取画布元素并渲染当前页面
            this.renderPage(stateManager.getCurrentPage());
        } catch (error) {
            // 捕获加载错误并提示用户
            console.error('Failed to load PDF:', error);
            alert('无法加载 PDF 文件，请检查网络连接或文件路径。');
        }
    }
}
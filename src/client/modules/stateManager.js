import searchUtils from './searchUtils.js'

/**
 * 状态管理器类，用于管理 PDF 查看器的各种状态信息。
 */
class StateManager {
    /**
     * 构造函数，初始化各种状态属性。
     */
    constructor() {
        // 单例模式
        if (StateManager.instance) {
            return StateManager.instance; // 如果已经存在实例，则返回它
        }
        this.pdfDoc = null; // 存储 PDF 文档
        this.currentPage = 1; // 当前页码
        this.isPageRendering = false; // 是否正在渲染页面
        this.pendingPageNumber = null; // 待渲染的页码
        this.searchText = ''; // 当前搜索文本
        this.zoomLevel = 1; // 缩放级别
        this.totalPages = 0; // 总页数
        this.element = null; // 存储关联的 DOM 元素
        this.allItems = null // 页面的所有items
    }

    async init(pdfDoc) {
        this.setPdfDoc(pdfDoc)
        this.updatePageCount(pdfDoc.numPages)
        this.setAllItems(await searchUtils.getAllItemsWithPageInfo(this.pdfDoc))
    }

    setPdfDoc(pdfDoc) { this.pdfDoc = pdfDoc; }
    getPdfDoc() { return this.pdfDoc; }

    setCurrentPage(pageNumber) { this.currentPage = pageNumber; }
    getCurrentPage() { return this.currentPage; }

    setIsPageRendering(value) { this.isPageRendering = value; }
    getIsPageRendering() { return this.isPageRendering; }

    setPendingPageNumber(pageNumber) { this.pendingPageNumber = pageNumber; }
    getPendingPageNumber() { return this.pendingPageNumber; }
    clearPendingPageNumber() { this.pendingPageNumber = null; }

    setSearchText(text) { this.searchText = text; }
    getSearchText() { return this.searchText; }

    setZoomLevel(zoom) { this.zoomLevel = zoom; }
    getZoomLevel() { return this.zoomLevel; }

    setTotalPages(numPages) { this.totalPages = numPages; }
    getTotalPages() { return this.totalPages; }

    updatePageCount(numPages) {
        this.setTotalPages(numPages);
        document.getElementById('page_count').textContent = numPages;
    }

    updatePageDisplay(pageNumber) {
        document.getElementById('page_num').textContent = pageNumber;
    }

    setElement(element) { this.element = element }
    getElement() { return this.element }

    setAllItems(allItems) {
        this.allItems = allItems
    }
    getAllItems() { return this.allItems }

    async getCurrentPageItem() { return await this.pdfDoc.getPage(this.currentPage) }
}

export const stateManager = new StateManager();
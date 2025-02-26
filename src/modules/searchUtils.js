// searchUtils.js
import pdfRenderer from './pdfRenderer.js';
import { updateSidebar } from './updateSidebar.js';

export default class searchUtils {
    /**
     * 设置搜索功能。
     * @param {HTMLInputElement} inputElement - 搜索输入框元素。
     * @param {HTMLElement} buttonElement - 搜索按钮元素。
     * @param {HTMLElement} sidebarElement - 侧边栏元素。
     * @param {StateManager} stateManager - 状态管理器实例。
     */
    static setupSearch(inputElement, buttonElement, sidebarElement, stateManager) {
        buttonElement.addEventListener('click', () => {
            // 在当前页面上高亮内容
            const searchText = inputElement.value.trim();
            if (!searchText) {
                updateSidebar('', sidebarElement);
                return
            }
            stateManager.setSearchText(searchText);
            pdfRenderer.renderPage(stateManager.getCurrentPage(), stateManager);
            // 从所有页面的items中查找text项，并显示在sidebarElement上
            const allItems = stateManager.getAllItems();
            const sideBarItems = this.searchForTextInItems(allItems, searchText);
            updateSidebar(sideBarItems, sidebarElement);
        });
    }

    /**
     * 获取页面上的文本内容。
     * @returns {Promise<{ items: Array<Object> }>} - 包含文本及其变换信息的对象数组。
     */
    static async getTextContentByPage(page) {
        return await page.getTextContent();
    }

    /**
     * 获取 PDF 文档中所有页面的文本内容及其变换信息，并附加页面编号。
     * @param {Object} pdfDoc - PDF 文档对象，提供 `getPage` 方法。
     * @returns {Promise<Array<Object>>} - 包含所有页面的 `items` 数组，每个 `item` 都附带页面编号。
     */
    static async getAllItemsWithPageInfo(pdfDoc) {
        try {
            // 获取文档的总页数
            const numPages = pdfDoc.numPages;
            let allItems = [];
            // 遍历每一页
            for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
                const page = await pdfDoc.getPage(pageNumber); // 获取当前页
                const { items } = await this.getTextContentByPage(page); // 获取当前页的文本内容
                // 为每个 item 添加页面编号
                const itemsWithPageInfo = items.map(item => ({
                    ...item,
                    pageNumber // 添加页面编号
                }));
                // 将当前页的 items 添加到总数组中
                allItems.push(...itemsWithPageInfo);
            }
            return allItems; // 返回所有页面的 items
        } catch (error) {
            console.error('Error fetching items from PDF:', error);
            throw error; // 抛出错误以便调用者处理
        }
    }

    /**
     * 搜索文本并在项目中返回匹配项。
     * @param {Array<Object>} items - 包含文本及其变换信息的对象数组。
     * @param {string} searchText - 要搜索的文本。
     * @returns {Array<{ str: string, transform: Array<number> }>} - 匹配项数组。
     */
    static searchForTextInItems(items, searchText) {
        // 断言检查 items 是否是数组
        if (!Array.isArray(items)) {
            throw new Error('items is not an array');
        }
        return items.flatMap(item =>
            item.str.split(' ')
                .filter(word => word.toLowerCase().includes(searchText.toLowerCase()))
                .map(word => ({ str: word, transform: item.transform, pageNumber: item.pageNumber }))
        );
    }
}
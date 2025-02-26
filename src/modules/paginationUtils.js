import pdfRenderer from './pdfRenderer.js'; // 导入 renderPage 函数
import { stateManager } from './stateManager.js';

export default class PaginationUtils {
    /**
     * 设置分页按钮的点击事件监听器。
     *
     * @static
     * @param {string[]} buttonIds - 包含前一页和后一页按钮 ID 的数组。
     * @param {Object} stateManager - 状态管理对象，负责页面状态的更新。
     */
    static setupPaginationListeners(buttonIds) {
        buttonIds.forEach(buttonId => {
            document.getElementById(buttonId).addEventListener('click', () => {
                this.handlePageClick(buttonId);
            });
        });
    }

    /**
     * 处理分页按钮点击事件。
     *
     * @static
     * @param {string} buttonId - 按钮 ID，表示前一页或后一页。
     * @param {Object} stateManager - 状态管理对象，负责页面状态的更新。
     */
    static handlePageClick(buttonId) {
        const isPrev = buttonId === 'prev'; // 判断点击的是前一页还是后一页按钮
        const currentPage = stateManager.getCurrentPage(); // 获取当前页码
        const totalPages = stateManager.getTotalPages(); // 获取总页码
        // 检查是否可以切换页面
        if ((currentPage <= 1 && isPrev) || (currentPage >= totalPages && !isPrev)) return;
        const newPage = isPrev ? currentPage - 1 : currentPage + 1; // 计算新的页码
        this.updateStateAndRender(newPage);
    }

    /**
     * 更新状态并处理页面渲染逻辑。
     *
     * @static
     * @param {number} newPage - 新的页码。
     * @param {Object} stateManager - 状态管理对象，负责页面状态的更新。
     */
    static updateStateAndRender(newPage) {
        stateManager.setCurrentPage(newPage); // 更新当前页码
        // 清除之前的 pendingPageNumber
        stateManager.clearPendingPageNumber();
        // 处理页面渲染逻辑
        if (stateManager.getIsPageRendering()) {
            stateManager.setPendingPageNumber(newPage); // 如果正在渲染页面，则设置 pendingPageNumber
        } else {
            pdfRenderer.renderPage(newPage); // 否则直接渲染新页面
        }
    }

    /**
     * 设置分页按钮的点击事件监听器，并处理页面切换逻辑。
     *
     * @static
     * @param {string[]} buttonIds - 包含前一页和后一页按钮 ID 的数组。
     * @param {Object} stateManager - 状态管理对象，负责页面状态的更新。
     */
    static setupPagination(buttonIds) {
        this.setupPaginationListeners(buttonIds);
    }
}
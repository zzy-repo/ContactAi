import pdfRenderer from './pdfRenderer.js'

/**
 * 更新侧边栏显示所有页面的文本内容及其变换信息。
 * @param {Object} stateManager - 状态管理器对象，提供 `getPdfDoc` 方法。
 * @param {HTMLElement} sidebarElement - 侧边栏元素，用于显示文本内容。
 */
export const updateSidebar = async (items, sidebarElement) => {
    // 清空侧边栏内容
    sidebarElement.innerHTML = '';
    // 创建 ul 元素
    const ulElement = document.createElement('ul');
    // 遍历所有 items 并添加到侧边栏
    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `第${item.pageNumber}页: ${item.str}`;
        listItem.classList.add('list-item'); 
        
        // 为每个 li 添加点击事件
        listItem.addEventListener('click', () => {
            // 调用 renderPage 方法，传入当前页码
            pdfRenderer.renderPage(item.pageNumber);
        });

        ulElement.appendChild(listItem);
    });
    // 将 ul 元素添加到侧边栏
    sidebarElement.appendChild(ulElement);
};
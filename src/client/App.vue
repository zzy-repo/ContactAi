<script setup>
import { onMounted } from 'vue';
import { stateManager } from './modules/stateManager.js';

const renderPage = async (pageNumber) => {
    try {
        // 设置渲染状态为 true
        stateManager.setIsPageRendering(true);

        // 清除画布内容
        const canvasElement = stateManager.getElement();
        const canvasContext = canvasElement.getContext('2d');
        canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // 获取 PDF 文档和页面
        const pdfDoc = stateManager.getPdfDoc();
        const page = await pdfDoc.getPage(pageNumber);

        // 获取视口信息并设置画布尺寸
        const viewport = page.getViewport({ scale: stateManager.getZoomLevel() });
        [canvasElement.height, canvasElement.width] = [viewport.height, viewport.width];

        // 渲染页面
        const renderContext = { canvasContext, viewport };
        await page.render(renderContext).promise;

        // 如果有搜索文本，则高亮显示
        const searchText = stateManager.getSearchText();
        if (searchText) {
            // 获取页面的文本内容
            const textContent = await page.getTextContent();
            const items = textContent.items
                .flatMap(item =>
                    item.str.split(' ')
                        .filter(word => word.toLowerCase().includes(searchText.toLowerCase()))
                        .map(word => ({ str: word, transform: item.transform }))
                );

            // 遍历所有匹配项并绘制高亮
            items.forEach(item => {
                const { transform } = item;
                const [scaleX, skewY, skewX, scaleY, offsetX, offsetY] = transform;

                // 绘制高亮区域（示例逻辑）
                canvasContext.fillStyle = "rgba(255, 255, 0, 0.5)"; // 半透明黄色
                canvasContext.fillRect(offsetX, offsetY, 100, 10); // 示例高亮区域
            });
        }

        // 更新页面显示
        stateManager.updatePageDisplay(pageNumber);
    } catch (error) {
        console.error('Error rendering PDF page:', error);
    } finally {
        // 解除渲染状态
        stateManager.setIsPageRendering(false);

        // 如果有待渲染的页码，则立即渲染该页码
        if (stateManager.getPendingPageNumber()) {
            renderPage(stateManager.getPendingPageNumber());
            stateManager.clearPendingPageNumber(); // 清除待渲染页码
        }
    }
}

onMounted(async () => {

    stateManager.setElement(document.getElementById('pdf-canvas'))

    // 初始化 PDF 加载
    try {
        // 通过 fetch 获取 PDF 数据，再传递给 pdfjsLib
        const response = await fetch('/api/sample.pdf'); // 相对路径会被 Vite 代理转发
        if (!response.ok) {
            throw new Error('Failed to fetch PDF');
        }
        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        // 初始化状态管理器并将 PDF 文档存储到状态管理器中
        await stateManager.init(pdf);

        // 渲染当前页面
        renderPage(stateManager.getCurrentPage());
    } catch (error) {
        // 捕获加载错误并提示用户
        console.error('Failed to load PDF:', error);
        alert('无法加载 PDF 文件，请检查网络连接或文件路径。');
    }

    // 设置分页导航
    ['prev', 'next'].forEach(buttonId => {
        document.getElementById(buttonId).addEventListener('click', () => {
            const isPrev = buttonId === 'prev';
            const currentPage = stateManager.getCurrentPage();
            const totalPages = stateManager.getTotalPages();

            if ((currentPage <= 1 && isPrev) || (currentPage >= totalPages && !isPrev)) return;

            const newPage = isPrev ? currentPage - 1 : currentPage + 1;
            stateManager.setCurrentPage(newPage);
            stateManager.clearPendingPageNumber();

            if (stateManager.getIsPageRendering()) {
                stateManager.setPendingPageNumber(newPage);
            } else {
                renderPage(newPage);
            }
        });
    });


    // 设置搜索功能
    const inputElement = document.getElementById('search-input');
    const buttonElement = document.getElementById('search-btn');
    const sidebarElement = document.getElementById('sidebar')
    buttonElement.addEventListener('click', async () => {
        const searchText = inputElement.value.trim();
        if (!searchText) {
            sidebarElement.innerHTML = ''; // 清空侧边栏内容
            return;
        }

        stateManager.setSearchText(searchText);
        renderPage(stateManager.getCurrentPage(), stateManager);

        try {
            const pdfDoc = stateManager.getPdfDoc(); // 假设 stateManager 提供获取 PDF 文档的方法
            const numPages = pdfDoc.numPages;
            let allItems = [];

            // 内联 getAllItemsWithPageInfo 的逻辑
            for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
                const page = await pdfDoc.getPage(pageNumber);
                const { items } = await page.getTextContent();
                const itemsWithPageInfo = items.map(item => ({
                    ...item,
                    pageNumber
                }));
                allItems.push(...itemsWithPageInfo);
            }

            // 内联 searchForTextInItems 的逻辑
            const sideBarItems = allItems.flatMap(item =>
                item.str.split(' ')
                    .filter(word => word.toLowerCase().includes(searchText.toLowerCase()))
                    .map(word => ({ str: word, transform: item.transform, pageNumber: item.pageNumber }))
            );

            // 清空侧边栏内容
            sidebarElement.innerHTML = '';
            const ulElement = document.createElement('ul');

            sideBarItems.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = `第${item.pageNumber}页: ${item.str}`;
                listItem.classList.add('list-item');

                listItem.addEventListener('click', () => {
                    renderPage(item.pageNumber);
                });

                ulElement.appendChild(listItem);
            });

            sidebarElement.appendChild(ulElement);
        } catch (error) {
            console.error('Error fetching items from PDF:', error);
        }
    });
})

</script>

<template>
    <div id="viewerContainer" class="w-[60%] mx-auto my-5 overflow-hidden bg-gradient-to-b from-white to-[#f5f7fa]">
        <div id="viewer" class="flex flex-col overflow-hidden">
            <!-- 工具栏 -->
            <div
                class="toolbar bg-white p-2.5 border-b border-[#e0e0e0] border-solid flex items-center justify-between">
                <input type="text" id="search-input" placeholder="Search..." class="search-input" />
                <button id="search-btn" class="toolbar-button">Search</button>
                <button id="prev" class="toolbar-button">Previous</button>
                <div class="page flex items-center gap-1 text-[#333] text-sm">
                    <span id="page_num">1</span>/<span id="page_count">0</span>
                </div>
                <button id="next" class="toolbar-button">Next</button>
            </div>

            <!-- 内容区域 -->
            <div class="content-container flex flex-grow">
                <canvas id="pdf-canvas"
                    class="flex-grow p-5 bg-white border-r border-[#e0e0e0] border-solid overflow-y-auto"></canvas>
                <div id="sidebar" class="flex-grow p-5 bg-white border-l border-[#e0e0e0] border-solid overflow-y-auto">
                    <ul class="p-0 m-0">
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

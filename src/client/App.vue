<script setup>
import { onMounted } from 'vue';
import pdfRenderer from './modules/pdfRenderer.js';
import { stateManager } from './modules/stateManager.js';
onMounted(async () => {

    stateManager.setElement(document.getElementById('pdf-canvas'))

    // 初始化 PDF 加载
    await pdfRenderer.loadPdf('/api/sample.pdf');

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
                pdfRenderer.renderPage(newPage);
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
        pdfRenderer.renderPage(stateManager.getCurrentPage(), stateManager);

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
                    pdfRenderer.renderPage(item.pageNumber);
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

<script setup>
import { onMounted } from 'vue';

// import PaginationUtils from './modules/paginationUtils.js';
// import pdfRenderer from './modules/pdfRenderer.js';
// import searchUtils from './modules/searchUtils.js';
// import { stateManager } from './modules/stateManager.js';

// stateManager.setElement(document.getElementById('pdf-canvas'))

// // 初始化 PDF 加载
// await pdfRenderer.loadPdf('http://localhost:8080/data/output/sample.pdf');

// // 设置分页导航
// PaginationUtils.setupPagination(['prev', 'next'], stateManager);

// // 设置搜索功能
// const searchInput = document.getElementById('search-input');
// const searchButton = document.getElementById('search-btn');
// const sidebarElement = document.getElementById('sidebar')
// searchUtils.setupSearch(searchInput, searchButton, sidebarElement, stateManager);


onMounted(() => {
    // 测试 /api/sample.pdf 是否可以找到
    fetch('/api/sample.pdf')
        .then(response => {
            if (response.ok) {
                console.log('File found:', response.url);
            } else {
                console.error('File not found:', response.status, response.statusText);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
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
                    <ul class="list-none p-0 m-0">
                        <li class="list-item" v-for="index in [1, 2, 3]" :key="index">
                            Item {{ index }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

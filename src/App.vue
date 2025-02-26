<script setup lang="ts">
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

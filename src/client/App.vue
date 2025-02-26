<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePdfViewerStore } from './stores/pdfViewer'
import { ref } from 'vue'

const store = usePdfViewerStore()
const {
    pdfDoc,
    currentPage,
    isPageRendering,
    pendingPageNumber,
    searchText,
    zoomLevel,
    totalPages,
    element,
    allItems
} = storeToRefs(store)

// 修改后的 renderPage 方法
const renderPage = async (pageNumber) => {
    try {
        // 添加前置校验
        if (!element.value || !pdfDoc.value) {
            throw new Error('画布或文档未初始化')
        }

        isPageRendering.value = true
        const canvas = element.value
        const ctx = canvas.getContext('2d')

        // 安全清空画布
        if (canvas.width > 0 && canvas.height > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        // 获取页面并校验
        const page = await store.getCurrentPageItem(pageNumber)
        if (!page?.getViewport) {
            throw new Error('获取页面对象失败')
        }

        // 校验缩放级别
        const safeZoom = Math.max(0.1, Math.min(zoomLevel.value, 5)) || 1
        const viewport = page.getViewport({ scale: safeZoom })

        // 设置画布尺寸
        canvas.height = viewport.height
        canvas.width = viewport.width

        // 执行渲染
        await page.render({
            canvasContext: ctx,
            viewport,
            intent: 'display' // 添加渲染意图参数
        }).promise

        // 高亮处理（添加边界校验）
        if (searchText.value) {
            //   const textContent = await page.getTextContent()
            //   textContent.items
            //     .filter(item => item.str?.toLowerCase().includes(searchText.value.toLowerCase()))
            //     .forEach(({ transform, str }) => {
            //       if (!transform || transform.length < 6) return

            //       const [,,, scaleY, x, y] = transform
            //       const textWidth = ctx.measureText(str).width

            //       // 安全绘制高亮
            //       if (textWidth > 0 && scaleY > 0) {
            //         ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'
            //         ctx.fillRect(x, y - scaleY, textWidth, scaleY)
            //       }
            //     })
        }

        // 更新状态
        currentPage.value = pageNumber
    } catch (error) {
        console.error('详细错误信息:', {
            error,
            pageNumber,
            zoomLevel: zoomLevel.value,
            pdfReady: !!pdfDoc.value,
            canvasReady: !!element.value
        })
    } finally {
        isPageRendering.value = false
        // 添加 pending 页码校验
        if (pendingPageNumber.value !== null && pendingPageNumber.value !== currentPage.value) {
            renderPage(pendingPageNumber.value)
            pendingPageNumber.value = null
        }
    }
}

// 分页控制逻辑
const setupPagination = () => {
    const handlers = {
        prev: () => !isPageRendering.value && currentPage.value > 1 &&
            (currentPage.value--, renderPage(currentPage.value)),
        next: () => !isPageRendering.value && currentPage.value < totalPages.value &&
            (currentPage.value++, renderPage(currentPage.value))
    }

    document.getElementById('prev').addEventListener('click', handlers.prev)
    document.getElementById('next').addEventListener('click', handlers.next)

    return () => {
        document.getElementById('prev').removeEventListener('click', handlers.prev)
        document.getElementById('next').removeEventListener('click', handlers.next)
    }
}

// 搜索功能
const results = ref([]); // 用响应式数据存储结果
const setupSearch = () => {
    const sidebar = document.getElementById('sidebar')
    const input = document.getElementById('search-input')


    const handleSearch = async () => {
        const query = input.value.trim()
        if (!query) return sidebar.innerHTML = ''

        searchText.value = query
        renderPage(currentPage.value)

        // 构建搜索结果
        results.value = allItems.value.flatMap(({ pageNumber, str, transform }) =>
            str.split(' ')
                .filter(word => word.toLowerCase().includes(query.toLowerCase()))
                .map(word => ({ pageNumber, str: word, transform }))
        )
    }

    document.getElementById('search-btn').addEventListener('click', handleSearch)
    return () => {
        document.getElementById('search-btn').removeEventListener('click', handleSearch)
    }
}

const loadPdf = async (url, canvasElementId) => {
    store.element = document.getElementById('pdf-canvas')
    try {
        const response = await fetch(url)
        const pdf = await pdfjsLib.getDocument({
            data: await response.arrayBuffer()
        }).promise

        await store.init(pdf)
        renderPage(currentPage.value)
    } catch (error) {
        alert(`PDF加载失败: ${error.message}`)
    }
}

// 初始化
onMounted(async () => {
    loadPdf('/api/sample.pdf', 'pdf-canvas')
})

// 添加事件监听器
onMounted(() => {
    const cleanPagination = setupPagination() // 设置分页事件监听器
    const cleanSearch = setupSearch() // 设置搜索事件监听器

    return () => {
        cleanPagination() // 清理分页事件监听器
        cleanSearch() // 清理搜索事件监听器
    }
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
                    <span id="page_num">{{ currentPage }}</span>/<span id="page_count">{{ totalPages }}</span>
                </div>
                <button id="next" class="toolbar-button">Next</button>
            </div>

            <!-- 内容区域 -->
            <div class="content-container flex flex-grow">
                <canvas id="pdf-canvas"
                    class="flex-grow p-5 bg-white border-r border-[#e0e0e0] border-solid overflow-y-auto"></canvas>
                <div id="sidebar" class="flex-grow p-5 bg-white border-l border-[#e0e0e0] border-solid overflow-y-auto">
                    <ul class="p-0 m-0">
                        <li v-for="result in results" :key="result.str" class="list-item"
                            @click="renderPage(result.pageNumber)">
                            第{{ result.pageNumber }}页: {{ result.str }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

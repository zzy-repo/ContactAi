<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePdfViewerStore } from './stores/pdfViewer'
import { ref } from 'vue'

// 全局变量
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
    allItems,
    docx_content,
    isCherking
} = storeToRefs(store)

// pdf 渲染部分
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

        // TODO:高亮处理
        if (searchText.value) {
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
const listItems = ref([]); // 用响应式数据存储结果
const setupSearch = () => {
    const sidebar = document.getElementById('sidebar')
    const input = document.getElementById('search-input')


    const handleSearch = async () => {
        const query = input.value.trim()
        if (!query) return sidebar.innerHTML = ''

        searchText.value = query
        renderPage(currentPage.value)

        // 构建搜索结果
        listItems.value = allItems.value.flatMap(({ pageNumber, str, transform }) =>
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

// 智能审查功能
const handleSmartCherk = async () => {
    try {
        // 防止重复点击
        if (isCherking.value) {
            return
        }
        isCherking.value = true

        // 发送请求
        const contractContent = docx_content.value
        if (!contractContent) {
            throw error('contractContent的值为空')
        }
        const response = await fetch('/api/check-contract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contractContent: contractContent })
        })
        if (!response.ok) {
            throw new Error('Network response was not ok:' + response.statusText);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error('Failed to fetch document:', data.error.message);
        }

        // 页面展示
        listItems.value = data.data

    }
    catch (err) {
        console.error("智能审查时出现错误:", err)
    }
    finally {
        isCherking.value = false
    }
}
const setupSmartCherk = () => {
    document.getElementById('SmartCherk-btn').addEventListener('click', handleSmartCherk)
    return () => {
        document.getElementById('SmartCherk-btn').removeEventListener('click', handleSmartCherk)
    }

}


// 页面初始化
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
const setDocument = async () => {
    const response = await fetch('/api/document'); // 替换为实际的API URL
    if (!response.ok) {
        throw new Error('Network response was not ok:' + response.statusText);
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error('Failed to fetch document:', data.error.message);
    }
    docx_content.value = data.content

}
onMounted(async () => {
    loadPdf('/api/sample.pdf', 'pdf-canvas')
    setDocument()

})

// 添加事件监听器
onMounted(() => {
    const cleanPagination = setupPagination() // 设置分页事件监听器
    const cleanSearch = setupSearch() // 设置搜索事件监听器
    const cleanSmartCherk = setupSmartCherk() // 设置搜索事件监听器

    return () => {
        cleanPagination()
        cleanSearch()
        cleanSmartCherk()
    }
})

</script>

<template>
    <div id="viewerContainer" class="w-[60%] mx-auto my-5 overflow-hidden bg-gradient-to-b from-white to-[#f5f7fa]">
        <div id="viewer" class="flex flex-col overflow-hidden">
            <!-- 工具栏 -->
            <div class="bg-white p-2.5 border-b border-[#e0e0e0] border-solid flex items-center justify-between">
                <button id="prev" class="toolbar-button">上一页</button>
                <div class="page flex items-center content-center gap-1 text-[#333] text-sm">
                    <span id="page_num">{{ currentPage }}</span>/<span id="page_count">{{ totalPages }}</span>
                </div>
                <button id="next" class="toolbar-button">下一页</button>
                <input type="text" id="search-input" placeholder="Search..." class="search-input" />
                <button id="search-btn" class="toolbar-button">搜索</button>
                <button id="SmartCherk-btn" class="toolbar-button">智能审查</button>
            </div>

            <!-- 内容区域 -->
            <div class="content-container flex flex-grow">
                <canvas id="pdf-canvas"
                    class="flex-grow p-5 bg-white border-r border-[#e0e0e0] border-solid overflow-y-auto"></canvas>
                <div id="sidebar" class="w-100 p-5 bg-white border-l border-[#e0e0e0] border-solid overflow-y-auto">
                    <p v-if="isCherking">等待回答中，请不要关掉或刷新页面...</p>
                    <ul class="p-0 m-0">
                        <li v-if="listItems && 'pageNumber' in listItems[0]"
                            v-for="(item, index) in listItems" :key="index" @click="renderPage(item.pageNumber)"
                            class="list-none px-4.5 py-3.5 border-b border-[#f0f4f8] text-sm text-[#4a5568] font-medium cursor-pointer select-none transition-all duration-300 hover:bg-[#f5f7fa] hover:text-[#007bff] hover:translate-x-1.25">
                            <span>
                                第{{ item.pageNumber }}页: {{ item.str }}
                            </span>
                        </li>

                        <li v-if="listItems && 'rule' in listItems[0]" v-for="(item, index) in listItems"
                            :key="index"
                            class="px-6 py-4 border-b border-[#f0f4f8] text-sm text-[#4a5568] font-medium cursor-pointer select-none transition-all duration-300 hover:bg-[#f5f7fa] hover:text-[#007bff] hover:translate-x-2">
                            <div class="flex flex-col space-y-1">
                                <p class="text-base font-semibold text-[#2d3748]">{{ item.rule }}</p>
                                <p class="text-sm text-[#718096]"
                                    :class="item.qualification ? 'text-green-500' : 'text-red-500'">
                                    {{ item.qualification ? '通过' : '未通过' }}
                                </p>
                                <p class="text-sm text-[#a0aec0] italic">{{ item.description }}</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

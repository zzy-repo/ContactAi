// stores/pdfViewer.js
import { defineStore } from 'pinia'
import { ref, reactive,shallowRef } from 'vue'

export const usePdfViewerStore = defineStore('pdfViewer', () => {
    // State（使用组合式 API）
    const pdfDoc = shallowRef(null) // 避免深度响应式
    const currentPage = ref(1)

    const isPageRendering = ref(false)
    const pendingPageNumber = ref(null)
    const searchText = ref('')
    const zoomLevel = ref(1)
    const totalPages = ref(0)
    const element = ref(null)
    const allItems = reactive([]) // 使用 reactive 保持数组响应性

    // Actions（处理异步操作和复杂逻辑）
    const init = async (pdfDocument) => {
        pdfDoc.value = pdfDocument
        totalPages.value = pdfDocument.numPages

        try {
            const items = []
            for (let pageNumber = 1; pageNumber <= totalPages.value; pageNumber++) {
                const page = await pdfDocument.getPage(pageNumber)
                const { items: pageItems } = await page.getTextContent()
                items.push(...pageItems.map(item => ({ ...item, pageNumber })))
            }
            allItems.splice(0, allItems.length, ...items) // 保持响应式更新
        } catch (error) {
            console.error('PDF 初始化失败:', error)
            throw error
        }
    }

    // 状态操作方法
    const setPageState = (pageNum) => {
        currentPage.value = pageNum
        if (element.value) {
            element.value.querySelector('#page_num').textContent = pageNum
        }
    }

    // 自动清除 pending 状态的方法
    const processPending = () => {
        if (pendingPageNumber.value !== null) {
            currentPage.value = pendingPageNumber.value
            pendingPageNumber.value = null
        }
    }

    // 修改后的 getCurrentPageItem
    const getCurrentPageItem = async (pageNumber = currentPage.value) => {
        if (!pdfDoc.value) throw new Error('PDF 文档未初始化')
        if (pageNumber < 1 || pageNumber > totalPages.value) {
            throw new Error(`无效页码: ${pageNumber}`)
        }
        return pdfDoc.value.getPage(pageNumber)
    }

    return {
        // State
        pdfDoc,
        currentPage,
        isPageRendering,
        pendingPageNumber,
        searchText,
        zoomLevel,
        totalPages,
        element,
        allItems,

        // Actions
        init,
        setPageState,
        processPending,
        getCurrentPageItem
    }
})
import { defineConfig, presetAttributify } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'

export default defineConfig({
    presets: [
        presetAttributify({ /* preset options */ }),
        presetWind3(),
    ],

    shortcuts: {
        'search-input': 'flex-grow mx-2.5 px-4 py-2 bg-[#f0f4f8] text-[#333] text-sm border-none rounded-md outline-none transition-all duration-300 focus:border focus:bg-white',

        'toolbar-button': 'mx-1 px-4 py-2.5 bg-gradient-to-b from-white to-gray-50/90 border border-gray-200/80 rounded-lg shadow-sm text-gray-600 flex items-center transition-all duration-200 hover:(from-gray-50 to-white shadow-md border-blue-300 text-blue-600) active:(scale-95 shadow-sm)'
    },
})

import { defineConfig, presetAttributify } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'

export default defineConfig({
    presets: [
        presetAttributify({ /* preset options */ }),
        presetWind3(),
    ],

    shortcuts: {
        'search-input': 'flex-grow mr-2.5 px-4 py-2 border-none rounded-md bg-[#f0f4f8] text-[#333] text-sm outline-none transition-all duration-300 focus:border focus:border-[#007bff] focus:bg-white',
        'toolbar-button': 'px-4 py-2 bg-[#f0f4f8] m-x-1 border-none text-[#333] text-sm rounded-md cursor-pointer transition-all duration-300 hover:bg-[#dfe6ed] hover:scale-102',
        'list-item': 'list-none px-4.5 py-3.5 border-b border-[#f0f4f8] text-sm text-[#4a5568] font-medium cursor-pointer select-none transition-all duration-300 hover:bg-[#f5f7fa] hover:text-[#007bff] hover:translate-x-1.25'
    },
})
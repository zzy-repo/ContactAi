import { defineConfig, presetAttributify } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'

export default defineConfig({
    presets: [
        presetAttributify({ /* preset options */ }),
        presetWind3(),
    ],
})
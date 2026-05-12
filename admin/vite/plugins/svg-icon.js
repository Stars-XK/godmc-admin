import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'

export default function createSvgIcon(isBuild) {
    return createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/svg')],
        symbolId: 'icon-[dir]-[name]',
        // 始终启用 SVGO 优化，移除 SVG 中的硬编码 fill/stroke，
        // 确保图标能通过 CSS fill: currentColor 继承父元素颜色
        svgoOptions: {
            plugins: [
                {
                    name: 'removeAttrs',
                    params: { attrs: '(fill|stroke)' }
                },
                {
                    name: 'addAttributesToSVGElement',
                    params: { attributes: [{ fill: 'currentColor' }] }
                }
            ]
        }
    })
}

import type { Palette } from './types'
import { curatedContrastGradients } from './curatedContrastGradients'

type PaletteFamily = {
  hue: number
  saturation: number
  lightFrom: number
  lightTo: number
  names: string[]
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const h = ((hue % 360) + 360) % 360
  const s = Math.max(0, Math.min(100, saturation)) / 100
  const l = Math.max(0, Math.min(100, lightness)) / 100
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const section = h / 60
  const secondary = chroma * (1 - Math.abs((section % 2) - 1))
  const [red, green, blue] = section < 1 ? [chroma, secondary, 0]
    : section < 2 ? [secondary, chroma, 0]
      : section < 3 ? [0, chroma, secondary]
        : section < 4 ? [0, secondary, chroma]
          : section < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary]
  const match = l - chroma / 2
  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0'))
    .join('')}`
}

const families: PaletteFamily[] = [
  {
    hue: 8, saturation: 88, lightFrom: 66, lightTo: 40,
    names: ['龙之火焰', '凤凰余烬', '赤焰珊瑚', '火山信笺', '朱雀翎羽', '熔岩回声', '炽热朱砂', '落日燃烧', '红莲业火', '火星来客'],
  },
  {
    hue: 338, saturation: 72, lightFrom: 76, lightTo: 48,
    names: ['大西洋三文鱼', '乔治亚桃子', '樱花牛乳', '蔷薇来信', '珊瑚婚礼', '草莓月光', '桃夭春水', '胭脂云霞', '粉晶梦境', '海棠未眠'],
  },
  {
    hue: 42, saturation: 88, lightFrom: 70, lightTo: 42,
    names: ['琥珀蜂蜜', '金色麦浪', '萤火虫', '沙漠落日', '黄铜唱片', '柚子糖霜', '太阳碎片', '秋日银杏', '焦糖布丁', '黄金海岸'],
  },
  {
    hue: 108, saturation: 60, lightFrom: 68, lightTo: 35,
    names: ['龙之绿', '青柠气泡', '翡翠森林', '苔藓密语', '雨后竹林', '抹茶星冰', '新叶来信', '孔雀石绿', '山谷晨雾', '青苹果园'],
  },
  {
    hue: 174, saturation: 66, lightFrom: 68, lightTo: 34,
    names: ['薄荷海盐', '深海极光', '绿松石湾', '孔雀尾羽', '冰岛温泉', '海玻璃瓶', '雨林潮汐', '青瓷釉色', '鲸落浅滩', '湖心倒影'],
  },
  {
    hue: 211, saturation: 80, lightFrom: 70, lightTo: 41,
    names: ['冰川蓝莓', '北海航线', '群青档案', '蓝色时刻', '深海电台', '雨夜霓虹', '钴蓝矿脉', '天空邮局', '潮汐蓝调', '水手日记'],
  },
  {
    hue: 238, saturation: 65, lightFrom: 67, lightTo: 36,
    names: ['午夜航行', '靛青宇宙', '蓝紫鸢尾', '夜幕电光', '深空信标', '暴雨前夜', '皇家蓝绒', '星舰尾焰', '暮色港湾', '蓝调黑胶'],
  },
  {
    hue: 278, saturation: 72, lightFrom: 72, lightTo: 41,
    names: ['霓虹葡萄', '紫藤瀑布', '水晶女巫', '鸢尾迷宫', '银河薰衣草', '紫罗兰夜', '黑莓魔法', '暮光剧场', '葡萄汽水', '星云信纸'],
  },
  {
    hue: 24, saturation: 46, lightFrom: 65, lightTo: 32,
    names: ['可可旧书', '焦糖木屋', '红茶皮革', '胡桃木盒', '陶土壁炉', '肉桂拿铁', '古铜怀表', '秋叶标本', '栗子蛋糕', '橡木酒桶'],
  },
  {
    hue: 220, saturation: 16, lightFrom: 48, lightTo: 16,
    names: ['北欧化学黑', '黑金派对', '乌鸦羽毛', '石墨唱针', '暴雨云层', '深夜油墨', '钢铁月色', '玄武岩层', '旧式打字机', '煤烟天鹅绒'],
  },
  {
    hue: 318, saturation: 92, lightFrom: 69, lightTo: 43,
    names: ['电光玫红', '赛博樱桃', '激光甜心', '像素糖果', '霓虹招牌', '酸性覆盆子', '故障艺术', '舞池闪电', '电子泡泡糖', '未来游乐场'],
  },
  {
    hue: 194, saturation: 74, lightFrom: 72, lightTo: 39,
    names: ['银河薄雾', '彗星冰尘', '月海回声', '猎户星云', '天狼微光', '极昼之境', '行星晨昏', '宇宙海盐', '星环碎片', '黎明观测站'],
  },
]

export const palettes: Palette[] = families.flatMap((family, familyIndex) =>
  family.names.map((name, index) => {
    const hue = family.hue + (index - 4.5) * 2.2
    const saturation = family.saturation + ((index % 3) - 1) * 4
    const backgroundFrom = hslToHex(hue + 5, saturation, family.lightFrom)
    const backgroundTo = hslToHex(hue - 4, saturation + 5, family.lightTo)
    return {
      kind: 'tonal' as const,
      name,
      swatch: backgroundTo,
      backgroundFrom,
      backgroundTo,
      textFrom: '#ffffff',
      textTo: hslToHex(hue, Math.min(82, saturation), 91 + (familyIndex % 2) * 2),
      accent: hslToHex(hue - 3, Math.min(90, saturation + 8), Math.max(12, family.lightTo - 18)),
    }
  }),
)

function darken(hex: string, amount = 0.42) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.split('').map((part) => part + part).join('') : value
  return `#${[0, 2, 4]
    .map((offset) => Math.round(Number.parseInt(normalized.slice(offset, offset + 2), 16) * (1 - amount)).toString(16).padStart(2, '0'))
    .join('')}`
}

export const contrastPalettes: Palette[] = curatedContrastGradients.map(({ name, colors }) => ({
  kind: 'contrast',
  name,
  swatch: colors[0],
  backgroundFrom: colors[0],
  backgroundTo: colors[1],
  textFrom: '#ffffff',
  textTo: '#f7fbff',
  accent: darken(colors[1]),
}))

palettes.push(...contrastPalettes)

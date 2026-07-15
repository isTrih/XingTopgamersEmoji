import type { BuiltInFont } from './builtInFonts'

export function FontSelect({
  label,
  value,
  systemFamily,
  systemName,
  currentName,
  fonts,
  onChange,
}: {
  label: string
  value: string
  systemFamily: string
  systemName: string
  currentName: string
  fonts: BuiltInFont[]
  onChange: (family: string, name: string) => void
}) {
  const isKnown = value === systemFamily || fonts.some((font) => font.family === value)

  return (
    <label className="font-select-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => {
          const family = event.target.value
          const selected = fonts.find((font) => font.family === family)
          onChange(family, selected?.name ?? systemName)
        }}
      >
        <option value={systemFamily}>{systemName}</option>
        {fonts.map((font) => <option key={font.id} value={font.family}>{font.name}</option>)}
        {!isKnown && <option value={value}>{currentName}（已上传）</option>}
      </select>
    </label>
  )
}

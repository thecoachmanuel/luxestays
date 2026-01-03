"use client"

import { ICON_MAP } from "../IconMap"

interface IconPickerProps {
  selectedIcon: string
  onChange: (icon: string) => void
}

export function IconPicker({ selectedIcon, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-2 border rounded-md max-h-48 overflow-y-auto">
      {Object.entries(ICON_MAP).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={`flex items-center justify-center p-2 rounded-md hover:bg-[var(--secondary)]/10 ${
            selectedIcon === name ? "bg-[var(--brand)] text-[var(--background)] hover:opacity-90" : "text-[var(--secondary)]"
          }`}
          title={name}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  )
}

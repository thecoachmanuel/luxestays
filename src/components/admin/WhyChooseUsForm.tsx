"use client";

import { useState } from "react";
import { WhyChooseUsItem } from "@/types";
import { Trash2, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export function WhyChooseUsForm({ initialItems }: { initialItems: WhyChooseUsItem[] }) {
  const [items, setItems] = useState<WhyChooseUsItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        title: "New Feature",
        description: "Description here",
        icon: "Star",
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleChange = (id: string, field: keyof WhyChooseUsItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const COLOR_THEMES = {
    brand: { label: 'Brand (Primary)', color: 'text-[var(--brand)]', bgColor: 'bg-[var(--brand)]/10' },
    accent: { label: 'Accent', color: 'text-[var(--accent)]', bgColor: 'bg-[var(--accent)]/10' },
    secondary: { label: 'Secondary', color: 'text-[var(--secondary)]', bgColor: 'bg-[var(--secondary)]/10' },
    blue: { label: 'Blue', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    green: { label: 'Green', color: 'text-green-600', bgColor: 'bg-green-100' },
    red: { label: 'Red', color: 'text-red-600', bgColor: 'bg-red-100' },
    yellow: { label: 'Yellow', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  } as const;

  const handleThemeChange = (id: string, themeKey: keyof typeof COLOR_THEMES) => {
    const theme = COLOR_THEMES[themeKey];
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, color: theme.color, bgColor: theme.bgColor } 
        : item
    ));
  };

  const getThemeKey = (color: string, bgColor: string): keyof typeof COLOR_THEMES | 'custom' => {
    for (const [key, theme] of Object.entries(COLOR_THEMES)) {
      if (theme.color === color && theme.bgColor === bgColor) {
        return key as keyof typeof COLOR_THEMES;
      }
    }
    return 'custom';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/why-choose-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (res.ok) {
        alert("Saved successfully!");
        router.refresh();
      } else {
        alert("Failed to save.");
      }
    } catch (e) {
      alert("Error saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={item.id} className="p-4 border rounded-lg bg-[var(--background)] space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-[var(--foreground)]">Item {index + 1}</h3>
                <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Title</label>
                    <input 
                        value={item.title} 
                        onChange={(e) => handleChange(item.id, 'title', e.target.value)}
                        className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Icon (Lucide name)</label>
                    <input 
                        value={item.icon} 
                        onChange={(e) => handleChange(item.id, 'icon', e.target.value)}
                        className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Description</label>
                    <input 
                        value={item.description} 
                        onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                        className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Color Theme</label>
                    <select
                        value={getThemeKey(item.color, item.bgColor)}
                        onChange={(e) => handleThemeChange(item.id, e.target.value as keyof typeof COLOR_THEMES)}
                        className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
                    >
                        <option value="custom" disabled>Custom (Legacy)</option>
                        {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                            <option key={key} value={key}>
                                {theme.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
      ))}

      <div className="flex gap-4">
        <button 
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--secondary)]/20 rounded hover:bg-[var(--secondary)]/5 text-[var(--foreground)]"
        >
            <Plus className="h-4 w-4" /> Add Item
        </button>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--brand)] text-white rounded hover:bg-[var(--brand)]/90 disabled:opacity-50"
        >
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

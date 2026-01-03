import { ColorPalette } from "@/types"

interface ThemeRegistryProps {
  palette?: ColorPalette
}

export function ThemeRegistry({ palette }: ThemeRegistryProps) {
  if (!palette) return null

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          --brand: ${palette.brand};
          --secondary: ${palette.secondary};
          --accent: ${palette.accent};
          --background: ${palette.background};
          --foreground: ${palette.text};
          
          --color-brand: ${palette.brand};
          --color-secondary: ${palette.secondary};
          --color-accent: ${palette.accent};
          --color-background: ${palette.background};
          --color-foreground: ${palette.text};
        }
      `
    }} />
  )
}

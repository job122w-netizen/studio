
export type ColorTheme = {
    id: string;
    name: string;
    primary: string; // HSL value for the primary color
};

export const defaultTheme: ColorTheme = {
    id: 'default-theme',
    name: 'Original',
    primary: '330 89% 67%'
};

export const colorThemes: ColorTheme[] = [
    defaultTheme,
    { id: 'theme-blue', name: 'Azul', primary: '221 83% 53%' },
    { id: 'theme-turquoise', name: 'Turquesa', primary: '174 72% 56%' },
    { id: 'theme-green', name: 'Verde', primary: '142 76% 36%' },
    { id: 'theme-lightblue', name: 'Celeste', primary: '199 89% 49%' },
    { id: 'theme-lilac', name: 'Lila', primary: '275 95% 76%' },
    { id: 'theme-orange', name: 'Naranja', primary: '25 95% 53%' },
    { id: 'theme-yellow', name: 'Amarillo', primary: '48 96% 56%' },
    { id: 'theme-red', name: 'Rojo', primary: '0 84% 60%' },
    { id: 'theme-cyan', name: 'Cian', primary: '187 78% 48%' },
    { id: 'theme-magenta', name: 'Magenta', primary: '316 69% 54%' },
];

/**
 * Applies the selected theme by updating CSS variables on the root element.
 * @param primaryColor - The HSL string for the primary color.
 */
export function applyTheme(primaryColor: string) {
    if (typeof window !== 'undefined') {
        document.documentElement.style.setProperty('--primary', primaryColor);
    }
}

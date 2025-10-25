
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

    
window.ThemeManager = {
    themes: {
        'light-mode': {
            name: 'Claro',
            colors: {
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f8f9fa',
                '--text-primary': '#212529',
                '--text-secondary': '#6c757d',
                '--accent-primary': '#6f42c1',
                '--accent-secondary': '#5a2d91',
                '--accent-light': '#e7d6ff',
                '--border-color': '#dee2e6',
                '--success': '#28a745',
                '--warning': '#ffc107',
                '--danger': '#dc3545',
                '--info': '#17a2b8'
            }
        },
        'dark-mode': {
            name: 'Escuro',
            colors: {
                '--bg-primary': '#1a1a1a',
                '--bg-secondary': '#2d2d2d',
                '--text-primary': '#ffffff',
                '--text-secondary': '#b0b0b0',
                '--accent-primary': '#8b5cf6',
                '--accent-secondary': '#7c3aed',
                '--accent-light': '#3b1f5c',
                '--border-color': '#404040',
                '--success': '#10b981',
                '--warning': '#f59e0b',
                '--danger': '#ef4444',
                '--info': '#06b6d4'
            }
        },
        'beauty-pink': {
            name: 'Rosa Noturno',
            colors: {
                '--bg-primary': '#1a0f1a',
                '--bg-secondary': '#2d1b2d',
                '--text-primary': '#f8e7f8',
                '--text-secondary': '#d1a3d1',
                '--accent-primary': '#ec4899',
                '--accent-secondary': '#db2777',
                '--accent-light': '#4a1f3d',
                '--border-color': '#3d2b3d',
                '--success': '#10b981',
                '--warning': '#f59e0b',
                '--danger': '#ef4444',
                '--info': '#06b6d4'
            }
        },
        'elegant-purple': {
            name: 'Roxo Sombrio',
            colors: {
                '--bg-primary': '#151022',
                '--bg-secondary': '#241833',
                '--text-primary': '#e2d8f0',
                '--text-secondary': '#b794c7',
                '--accent-primary': '#7c3aed',
                '--accent-secondary': '#6d28d9',
                '--accent-light': '#3d2463',
                '--border-color': '#342950',
                '--success': '#059669',
                '--warning': '#d97706',
                '--danger': '#dc2626',
                '--info': '#0284c7'
            }
        },
        'professional-blue': {
            name: 'Azul Meia-Noite',
            colors: {
                '--bg-primary': '#0f1419',
                '--bg-secondary': '#1e293b',
                '--text-primary': '#f1f5f9',
                '--text-secondary': '#94a3b8',
                '--accent-primary': '#0ea5e9',
                '--accent-secondary': '#0284c7',
                '--accent-light': '#1e3a5f',
                '--border-color': '#334155',
                '--success': '#16a34a',
                '--warning': '#ca8a04',
                '--danger': '#dc2626',
                '--info': '#0891b2'
            }
        },
        'nature-green': {
            name: 'Verde Floresta',
            colors: {
                '--bg-primary': '#0a1f0a',
                '--bg-secondary': '#1a2e1a',
                '--text-primary': '#f0fdf4',
                '--text-secondary': '#9ca3af',
                '--accent-primary': '#16a34a',
                '--accent-secondary': '#15803d',
                '--accent-light': '#2d4a2d',
                '--border-color': '#374151',
                '--success': '#22c55e',
                '--warning': '#eab308',
                '--danger': '#ef4444',
                '--info': '#06b6d4'
            }
        }
    },

    // Aplicar tema
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) {
            console.warn(`Tema ${themeName} não encontrado`);
            return;
        }

        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Atualizar classe do body
        document.body.className = themeName;
        
        // Salvar preferência
        localStorage.setItem('selectedTheme', themeName);
        
        // Atualizar configurações globais
        if (window.appState) {
            window.appState.settings.theme = themeName;
        }
        
        console.log(`Tema ${theme.name} aplicado com sucesso!`);
    },

    // Obter tema atual
    getCurrentTheme() {
        return localStorage.getItem('selectedTheme') || 'light-mode';
    },

    // Inicializar tema
    init() {
        const savedTheme = this.getCurrentTheme();
        this.applyTheme(savedTheme);
    },

    // Obter lista de temas para interface
    getThemesList() {
        const t = this.getTranslations();
        return Object.entries(this.themes).map(([key, theme]) => ({
            key,
            name: t[`theme${key.charAt(0).toUpperCase()}${key.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`] || theme.name,
            preview: theme.colors['--accent-primary']
        }));
    },
    
    getTranslations() {
        const currentLanguage = window.appState?.settings?.language || 'pt-BR';
        return window.translations?.[currentLanguage] || window.translations?.['pt-BR'] || {};
    }
};

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', () => {
    window.ThemeManager.init();
});

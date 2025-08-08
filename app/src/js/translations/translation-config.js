// Sistema de Traduções
// Inicializa o objeto global de traduções
window.translations = window.translations || {};

// Função utilitária global para obter traduções
window.getTranslation = function(key, language = null) {
    // Se não especificar idioma, usar o idioma atual das configurações
    const currentLanguage = language || (window.appSettings?.language) || 'pt-BR';
    
    // Verificar se o idioma existe
    if (!window.translations[currentLanguage]) {
        console.warn(`Idioma ${currentLanguage} não encontrado, usando pt-BR como fallback`);
        return window.translations['pt-BR']?.[key] || key;
    }
    
    // Retornar a tradução ou a chave original se não encontrar
    return window.translations[currentLanguage][key] || key;
};

// Função para atualizar títulos da navegação
window.updateNavigationTitles = function() {
    const navItems = [
        { id: 'calendarView', key: 'calendar' },
        { id: 'clientsView', key: 'clients' },
        { id: 'servicesView', key: 'services' },
        { id: 'staffView', key: 'staff' },
        { id: 'reportsView', key: 'reports' },
        { id: 'settingsView', key: 'settings' }
    ];
    
    navItems.forEach(item => {
        const navLink = document.querySelector(`[data-view="${item.id}"]`);
        if (navLink) {
            const textElement = navLink.querySelector('span');
            if (textElement) {
                textElement.textContent = window.getTranslation(item.key);
            }
        }
    });
    
    // Atualizar título do header se existir
    const headerTitle = document.querySelector('header h2');
    if (headerTitle && window.currentViewTitle) {
        headerTitle.textContent = window.getTranslation(window.currentViewTitle);
    }
};

// Função para atualizar todos os textos da interface
window.updateInterfaceLanguage = function() {
    window.updateNavigationTitles();
    
    // Disparar evento customizado para que outras partes do sistema atualizem
    const event = new CustomEvent('languageChanged', {
        detail: { language: window.appSettings?.language || 'pt-BR' }
    });
    document.dispatchEvent(event);
};

// Configurações globais de idioma
window.appSettings = window.appSettings || {
    language: 'pt-BR',
    theme: 'light-mode'
};

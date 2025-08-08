class CacheManager {
    constructor() {
        this.cacheName = 'salon-app-v1';
        this.dbName = 'SalonAppDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        await this.initIndexedDB();
    }

    // Inicializar IndexedDB para dados offline
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB inicializado');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store para agendamentos
                if (!db.objectStoreNames.contains('appointments')) {
                    const appointmentStore = db.createObjectStore('appointments', { keyPath: 'id' });
                    appointmentStore.createIndex('date', 'date', { unique: false });
                    appointmentStore.createIndex('staff_id', 'staff_id', { unique: false });
                }

                // Store para clientes
                if (!db.objectStoreNames.contains('clients')) {
                    db.createObjectStore('clients', { keyPath: 'id' });
                }

                // Store para serviços
                if (!db.objectStoreNames.contains('services')) {
                    db.createObjectStore('services', { keyPath: 'id' });
                }

                // Store para funcionários
                if (!db.objectStoreNames.contains('staff')) {
                    db.createObjectStore('staff', { keyPath: 'id' });
                }

                // Store para configurações
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Store para cache de sincronização
                if (!db.objectStoreNames.contains('sync_queue')) {
                    const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    syncStore.createIndex('action', 'action', { unique: false });
                }
            };
        });
    }

    // Salvar dados no cache local
    async saveToCache(storeName, data) {
        if (!this.db) await this.initIndexedDB();

        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        if (Array.isArray(data)) {
            // Salvar múltiplos registros
            for (const item of data) {
                await store.put(item);
            }
        } else {
            // Salvar registro único
            await store.put(data);
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Buscar dados do cache
    async getFromCache(storeName, id = null) {
        if (!this.db) await this.initIndexedDB();

        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            let request;
            
            if (id) {
                request = store.get(id);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Sincronizar dados com Supabase
    async syncWithSupabase() {
        if (!navigator.onLine) {
            console.log('Offline - sincronização adiada');
            return;
        }

        try {
            // Buscar dados do servidor
            const serverData = await this.fetchFromSupabase();
            
            // Atualizar cache local
            await this.updateLocalCache(serverData);
            
            // Processar queue de sincronização
            await this.processSyncQueue();
            
            console.log('Sincronização completada');
            
            // Disparar evento de sincronização
            window.dispatchEvent(new CustomEvent('dataSync', { 
                detail: { success: true, timestamp: new Date() }
            }));
            
        } catch (error) {
            console.error('Erro na sincronização:', error);
            
            window.dispatchEvent(new CustomEvent('dataSync', { 
                detail: { success: false, error: error.message }
            }));
        }
    }

    // Buscar dados do Supabase
    async fetchFromSupabase() {
        const supabase = window.supabase;
        if (!supabase) throw new Error('Supabase não inicializado');

        const [
            { data: appointments },
            { data: clients },
            { data: services },
            { data: staff }
        ] = await Promise.all([
            supabase.from('appointments').select('*'),
            supabase.from('clients').select('*'),
            supabase.from('services').select('*'),
            supabase.from('staff').select('*')
        ]);

        return { appointments, clients, services, staff };
    }

    // Atualizar cache local com dados do servidor
    async updateLocalCache(serverData) {
        const stores = ['appointments', 'clients', 'services', 'staff'];
        
        for (const store of stores) {
            if (serverData[store]) {
                await this.saveToCache(store, serverData[store]);
            }
        }
    }

    // Adicionar ação à queue de sincronização
    async addToSyncQueue(action, data) {
        const queueItem = {
            action,
            data,
            timestamp: new Date().toISOString(),
            retries: 0
        };

        await this.saveToCache('sync_queue', queueItem);
    }

    // Processar queue de sincronização
    async processSyncQueue() {
        const queue = await this.getFromCache('sync_queue');
        if (!queue || queue.length === 0) return;

        const supabase = window.supabase;
        if (!supabase) return;

        for (const item of queue) {
            try {
                await this.executeSyncAction(item);
                await this.removeFromSyncQueue(item.id);
            } catch (error) {
                console.error('Erro ao processar item da queue:', error);
                
                // Incrementar tentativas
                item.retries += 1;
                if (item.retries < 3) {
                    await this.saveToCache('sync_queue', item);
                } else {
                    // Remover após 3 tentativas
                    await this.removeFromSyncQueue(item.id);
                }
            }
        }
    }

    // Executar ação de sincronização
    async executeSyncAction(item) {
        const supabase = window.supabase;
        const { action, data } = item;

        switch (action) {
            case 'create_appointment':
                await supabase.from('appointments').insert(data);
                break;
            case 'update_appointment':
                await supabase.from('appointments').update(data).eq('id', data.id);
                break;
            case 'delete_appointment':
                await supabase.from('appointments').delete().eq('id', data.id);
                break;
            case 'create_client':
                await supabase.from('clients').insert(data);
                break;
            case 'update_client':
                await supabase.from('clients').update(data).eq('id', data.id);
                break;
            case 'delete_client':
                await supabase.from('clients').delete().eq('id', data.id);
                break;
            // Adicionar outros casos conforme necessário
        }
    }

    // Remover item da queue
    async removeFromSyncQueue(id) {
        const transaction = this.db.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');
        await store.delete(id);
    }

    // Trabalhar offline - salvar dados localmente
    async saveOffline(action, data) {
        // Salvar no cache local
        const storeName = this.getStoreNameFromAction(action);
        if (storeName) {
            await this.saveToCache(storeName, data);
        }

        // Adicionar à queue de sincronização
        await this.addToSyncQueue(action, data);
        
        console.log(`Dados salvos offline: ${action}`);
    }

    // Obter nome do store baseado na ação
    getStoreNameFromAction(action) {
        if (action.includes('appointment')) return 'appointments';
        if (action.includes('client')) return 'clients';
        if (action.includes('service')) return 'services';
        if (action.includes('staff')) return 'staff';
        return null;
    }

    // Verificar status da conexão
    isOnline() {
        return navigator.onLine;
    }

    // Obter estatísticas do cache
    async getCacheStats() {
        const stores = ['appointments', 'clients', 'services', 'staff', 'sync_queue'];
        const stats = {};

        for (const store of stores) {
            const data = await this.getFromCache(store);
            stats[store] = Array.isArray(data) ? data.length : (data ? 1 : 0);
        }

        return {
            ...stats,
            lastSync: localStorage.getItem('lastSyncTime'),
            isOnline: this.isOnline()
        };
    }

    // Limpar cache antigo
    async clearOldCache() {
        const transaction = this.db.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');
        const index = store.index('timestamp');
        
        // Remover itens com mais de 7 dias
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        
        const range = IDBKeyRange.upperBound(cutoff.toISOString());
        const request = index.openCursor(range);
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.init();
    }

    init() {
        // Monitorar carregamento da página
        window.addEventListener('load', () => {
            this.recordPageLoad();
        });

        // Monitorar mudanças de rota
        this.monitorRouteChanges();
    }

    recordPageLoad() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.push({
                type: 'page_load',
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                timestamp: new Date().toISOString()
            });
        }
    }

    monitorRouteChanges() {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        const recordRouteChange = (url) => {
            this.metrics.push({
                type: 'route_change',
                url,
                timestamp: new Date().toISOString()
            });
        };

        history.pushState = function(...args) {
            recordRouteChange(args[2]);
            return originalPushState.apply(this, args);
        };

        history.replaceState = function(...args) {
            recordRouteChange(args[2]);
            return originalReplaceState.apply(this, args);
        };
    }

    recordAction(actionName, duration) {
        this.metrics.push({
            type: 'user_action',
            action: actionName,
            duration,
            timestamp: new Date().toISOString()
        });
    }

    getMetrics() {
        return this.metrics;
    }

    clearMetrics() {
        this.metrics = [];
    }
}

// Instâncias globais
window.CacheManager = new CacheManager();
window.PerformanceMonitor = new PerformanceMonitor();

// Auto-sincronização periódica
setInterval(() => {
    if (navigator.onLine) {
        window.CacheManager.syncWithSupabase();
    }
}, 5 * 60 * 1000); // A cada 5 minutos

// Sincronizar quando voltar online
window.addEventListener('online', () => {
    console.log('Conexão restaurada - sincronizando...');
    window.CacheManager.syncWithSupabase();
});

// Notificar quando ficar offline
window.addEventListener('offline', () => {
    console.log('Aplicação offline - dados serão salvos localmente');
    window.dispatchEvent(new CustomEvent('appOffline'));
});

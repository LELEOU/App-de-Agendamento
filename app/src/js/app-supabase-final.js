document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se o Supabase foi carregado
    if (!window.supabase) {
        console.error('Supabase não foi carregado! Verifique se supabase-config.js foi carregado corretamente.');
        return;
    }

    // Funções utilitárias
    function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getTranslation(key) {
        return window.getTranslation(key, appState.settings.language);
    }

    function getTranslations() {
        return window.translations[appState.settings.language] || window.translations['pt-BR'] || {};
    }

    function formatTime(timeString) {
        // Converte "08:00:00" para "08:00"
        if (timeString && timeString.includes(':')) {
            return timeString.substring(0, 5);
        }
        return timeString;
    }

    function isDateInPast(dateStr) {
        // Função utilitária para verificar se uma data está no passado
        // Garante comparação consistente apenas de datas (sem horário)
        const checkDate = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        
        // Normalizar ambas as datas para meia-noite
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const checkDateNormalized = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        
        return checkDateNormalized < todayNormalized;
    }

    function updateCurrentDate() {
        if (dom.currentDateDisplay) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            dom.currentDateDisplay.textContent = appState.currentDate.toLocaleDateString('pt-BR', options);
        }
    }

    function updateAllTranslations() {
        // Atualizar elementos com data-translate
        const translatableElements = document.querySelectorAll('[data-translate]');
        translatableElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (key) {
                element.textContent = getTranslation(key);
            }
        });
        
        const searchInput = document.getElementById('clientSearch');
        if (searchInput) {
            searchInput.placeholder = getTranslation('searchClientPlaceholder');
        }
        
        const newClientBtn = document.getElementById('newClientBtn');
        if (newClientBtn) {
            newClientBtn.textContent = getTranslation('newClient');
        }
        
        const newServiceBtn = document.getElementById('newServiceBtn');
        if (newServiceBtn) {
            newServiceBtn.textContent = getTranslation('newService');
        }
        
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        if (newAppointmentBtn) {
            newAppointmentBtn.textContent = getTranslation('newAppointment');
        }
    }

    function handleClientSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredClients = appState.clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm) ||
            (client.phone && client.phone.includes(searchTerm)) ||
            (client.email && client.email.toLowerCase().includes(searchTerm))
        );
        
        renderFilteredClients(filteredClients);
    }

    function renderFilteredClients(clients) {
        const t = getTranslations();
        if (!clients.length) {
            dom.clientList.innerHTML = `<li class="p-4 text-center text-[var(--text-secondary)]">${t.noClientsFound}</li>`;
            return;
        }

        dom.clientList.innerHTML = clients.map(client => `
            <li class="p-4 hover:bg-[var(--accent-light)] flex justify-between items-center border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div>
                    <div class="font-medium text-[var(--text-primary)]">${client.name}</div>
                    <div class="text-sm text-[var(--text-secondary)]">${client.phone || ''} ${client.email || ''}</div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editClient('${client.id}')" class="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">${t.edit}</button>
                    <button onclick="deleteClient('${client.id}')" class="text-red-600 hover:text-red-800">${t.delete}</button>
                </div>
            </li>
        `).join('');
    }

    function showDayAppointments(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        
        appState.currentDate = new Date(year, month - 1, day);
        appState.calendarViewType = 'day';
        renderCalendar();
    }

    // Função para adicionar filtro de manicure (apenas para admin e recepcionista)
    function addManicuristFilter() {
        // Manicuristas não precisam do filtro, pois só veem seus próprios agendamentos
        if (isManicurist()) return;
        
        const t = getTranslations();
        const manicurists = appState.staff.filter(s => s.role === 'manicurist');
        
        if (manicurists.length === 0) return;
        
        const filterHtml = `
            <div class="mb-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    ${t.filterByManicurist || 'Filtrar por Manicure'}:
                </label>
                <select id="manicuristFilter" class="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)]" onchange="filterByManicurist(this.value)">
                    <option value="all">${t.allManicurists || 'Todas as Manicures'}</option>
                    ${manicurists.map(m => `
                        <option value="${m.id}" ${appState.selectedManicuristId === m.id ? 'selected' : ''}>
                            ${m.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
        
        // Adicionar o filtro antes do calendário
        const calendarContainer = dom.calendarContainer;
        if (!document.getElementById('manicuristFilter')) {
            calendarContainer.insertAdjacentHTML('beforebegin', filterHtml);
        }
    }

    // Função global para filtrar por manicure
    window.filterByManicurist = function(manicuristId) {
        appState.selectedManicuristId = manicuristId === 'all' ? null : manicuristId;
        renderCalendar();
    };

    // Função para adicionar botão de solicitação de fechamento para manicuristas
    function addScheduleRequestButton() {
        const scheduleContainer = document.getElementById('scheduleRequestContainer');
        if (scheduleContainer && !document.getElementById('scheduleRequestBtn')) {
            const buttonHtml = `
                <button id="scheduleRequestBtn" onclick="showScheduleRequestModal()" 
                    class="px-3 py-1 rounded-md text-sm border border-[var(--border-color)] hover:bg-[var(--accent-light)] hover:text-[var(--accent-primary)] transition-colors duration-200" 
                    title="Solicitar Fechamento de Agenda">
                    🔒
                </button>
            `;
            scheduleContainer.innerHTML = buttonHtml;
        }
    }

    // Função de notificação simples
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    window.editClient = function(clientId) {
        const client = appState.clients.find(c => c.id === clientId);
        if (client) showClientModal(client);
    };

    window.deleteClient = async function(clientId) {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await db.deleteClient(clientId);
                appState.clients = appState.clients.filter(c => c.id !== clientId);
                renderClients();
                showNotification('Cliente excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                showNotification('Erro ao excluir cliente');
            }
        }
    };

    window.editService = function(serviceId) {
        const service = appState.services.find(s => s.id === serviceId);
        if (service) showServiceModal(service);
    };

    window.deleteService = async function(serviceId) {
        if (confirm('Tem certeza que deseja excluir este serviço?')) {
            try {
                await db.deleteService(serviceId);
                appState.services = appState.services.filter(s => s.id !== serviceId);
                renderServices();
                showNotification('Serviço excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
                showNotification('Erro ao excluir serviço');
            }
        }
    };

    window.editStaff = function(staffId) {
        const staff = appState.staff.find(s => s.id === staffId);
        if (staff) showStaffModal(staff);
    };

    window.deleteStaff = async function(staffId) {
        if (confirm('Tem certeza que deseja excluir este funcionário?')) {
            try {
                await db.deleteStaff(staffId);
                appState.staff = appState.staff.filter(s => s.id !== staffId);
                renderStaff();
                showNotification('Funcionário excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir funcionário:', error);
                showNotification('Erro ao excluir funcionário');
            }
        }
    };

    window.editAppointment = function(appointmentId) {
        const appointment = appState.appointments.find(a => a.id === appointmentId);
        if (appointment) {
            // Verificar se o agendamento pode ser editado usando a função utilitária
            if (isDateInPast(appointment.date)) {
                alert('⚠️ Agendamentos de datas passadas não podem ser editados para evitar fraudes.');
                return;
            }
            
            showAppointmentModal(appointment);
        }
    };

    window.hideModal = hideModal;

    // Funções globais para solicitações de fechamento de agenda
    window.requestScheduleBlock = async function(date, reason) {
        const { currentUser, staff } = appState;
        const manicurist = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        
        if (!manicurist || manicurist.role !== 'manicurist') {
            showNotification('Apenas manicures podem solicitar fechamento de agenda', 'error');
            return;
        }

        try {
            const request = {
                staff_id: manicurist.id,
                date: date,
                reason: reason,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const newRequest = await db.addScheduleRequest(request);
            appState.scheduleRequests.push(newRequest);
            showNotification('Solicitação enviada com sucesso!');
            hideModal();
        } catch (error) {
            console.error('Erro ao criar solicitação:', error);
            showNotification('Erro ao enviar solicitação', 'error');
        }
    };

    window.approveScheduleRequest = async function(requestId) {
        try {
            await db.updateScheduleRequest(requestId, { 
                status: 'approved',
                approved_at: new Date().toISOString()
            });
            
            // Atualizar no estado local
            const requestIndex = appState.scheduleRequests.findIndex(r => r.id === requestId);
            if (requestIndex !== -1) {
                appState.scheduleRequests[requestIndex].status = 'approved';
                appState.scheduleRequests[requestIndex].approved_at = new Date().toISOString();
            }
            
            showNotification('Solicitação aprovada!');
            renderScheduleRequests();
        } catch (error) {
            console.error('Erro ao aprovar solicitação:', error);
            showNotification('Erro ao aprovar solicitação', 'error');
        }
    };

    window.rejectScheduleRequest = async function(requestId) {
        try {
            await db.updateScheduleRequest(requestId, { 
                status: 'rejected',
                rejected_at: new Date().toISOString()
            });
            
            // Atualizar no estado local
            const requestIndex = appState.scheduleRequests.findIndex(r => r.id === requestId);
            if (requestIndex !== -1) {
                appState.scheduleRequests[requestIndex].status = 'rejected';
                appState.scheduleRequests[requestIndex].rejected_at = new Date().toISOString();
            }
            
            showNotification('Solicitação rejeitada');
            renderScheduleRequests();
        } catch (error) {
            console.error('Erro ao rejeitar solicitação:', error);
            showNotification('Erro ao rejeitar solicitação', 'error');
        }
    };

    window.showScheduleRequestModal = function(selectedDate = null) {
        const t = getTranslations();
        const { currentUser, staff, scheduleRequests } = appState;
        
        // Verificar se é manicure
        const manicurist = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        if (!manicurist || manicurist.role !== 'manicurist') {
            showNotification('Apenas manicures podem solicitar fechamento de agenda', 'error');
            return;
        }

        // Verificar se já existe uma solicitação pendente ou aprovada para hoje
        const today = new Date().toDateString();
        const todayRequests = scheduleRequests.filter(r => 
            r.staff_id === manicurist.id && 
            new Date(r.created_at).toDateString() === today &&
            (r.status === 'pending' || r.status === 'approved')
        );

        if (todayRequests.length > 0) {
            const status = todayRequests[0].status === 'pending' ? 'pendente' : 'aprovada';
            showNotification(`Você já possui uma solicitação ${status} para hoje. Aguarde ou tente novamente amanhã.`, 'error');
            return;
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = getLocalDateString(tomorrow);
        
        const defaultDate = selectedDate || minDate;
        
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="event.target === event.currentTarget && hideModal()">
                <div class="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md mx-4 border border-[var(--border-color)]" onclick="event.stopPropagation()">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        ${t.requestScheduleBlock || 'Solicitar Fechamento de Agenda'}
                    </h3>
                    
                    <div class="mb-4 p-3 bg-[var(--accent-light)] border border-[var(--border-color)] rounded-lg">
                        <p class="text-sm text-[var(--text-primary)]">
                            <strong>⚠️ Importante:</strong> Só é possível enviar 1 solicitação por dia. Use com responsabilidade.
                        </p>
                    </div>

                    <form id="scheduleRequestForm" onsubmit="submitScheduleRequest(event)">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                ${t.date || 'Data'}:
                            </label>
                            <input type="date" id="requestDate" min="${minDate}" value="${defaultDate}" 
                                class="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                ${t.reason || 'Motivo'}:
                            </label>
                            <textarea id="requestReason" rows="3" placeholder="${t.scheduleRequestReason || 'Ex: Consulta médica, compromisso pessoal...'}"
                                class="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]" required></textarea>
                        </div>
                        <div class="flex space-x-3">
                            <button type="button" onclick="hideModal()" 
                                class="flex-1 px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--accent-light)] transition-colors">
                                ${t.cancel || 'Cancelar'}
                            </button>
                            <button type="submit" 
                                class="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors">
                                ${t.sendRequest || 'Enviar Solicitação'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Mostrar modal corretamente
        dom.modalContainer.innerHTML = modalHtml;
        dom.modalContainer.classList.remove('hidden');
    };

    window.submitScheduleRequest = function(event) {
        event.preventDefault();
        const date = document.getElementById('requestDate').value;
        const reason = document.getElementById('requestReason').value;
        
        if (date && reason) {
            requestScheduleBlock(date, reason);
        }
    };

    const appState = {
        currentDate: new Date(),
        currentView: 'calendarView',
        currentUser: null,
        appointments: [],
        clients: [],
        services: [],
        staff: [],
        scheduleRequests: [], // Para solicitações de fechamento de agenda
        selectedManicuristId: null, // Para filtrar por manicure específica
        settings: {
            theme: 'light-mode',
            language: 'pt-BR',
            businessName: 'Agenda de Salão',
            businessPhone: '(11) 99999-9999',
            appointmentDuration: 40,
            workingHours: { start: '08:00', end: '18:00' },
            workDays: [1, 2, 3, 4, 5, 6],
            lateToleranceInMinutes: 10,
            commissionRate: 0.5
        },
        calendarViewType: 'month'
    };

    // Funções para salvar/carregar configurações do localStorage
    function loadUserSettings() {
        try {
            const savedSettings = localStorage.getItem('salao-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                appState.settings = { ...appState.settings, ...parsed };
                // Aplicar tema salvo
                document.body.className = appState.settings.theme;
                // Atualizar configurações globais para o sistema de traduções
                window.appSettings = { ...window.appSettings, ...appState.settings };
                
                console.log('⚙️ Configurações carregadas:', appState.settings);
                console.log('🌐 Traduções globais disponíveis:', Object.keys(window.translations || {}));
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    function saveUserSettings() {
        try {
            localStorage.setItem('salao-settings', JSON.stringify(appState.settings));
            // Atualizar configurações globais para o sistema de traduções
            window.appSettings = { ...window.appSettings, ...appState.settings };
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    }

    // Função utilitária para verificar permissões do usuário
    function getUserRole() {
        const { currentUser, staff } = appState;
        const userStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        
        // Verificar por múltiplas formas
        if (currentUser?.user_metadata?.role === 'admin' || 
            userStaff?.role === 'admin' || 
            currentUser?.email === 'admin@supabase.io' ||
            currentUser?.email === 'admin@example.com') {
            return 'admin';
        }
        
        if (currentUser?.user_metadata?.role === 'receptionist' || userStaff?.role === 'receptionist') {
            return 'receptionist';
        }
        
        if (currentUser?.user_metadata?.role === 'manicurist' || userStaff?.role === 'manicurist') {
            return 'manicurist';
        }
        
        return 'admin'; // Default para compatibilidade
    }

    function isAdmin() {
        return getUserRole() === 'admin';
    }

    function isManicurist() {
        return getUserRole() === 'manicurist';
    }
    
    function isReceptionist() {
        return getUserRole() === 'receptionist';
    }

    // Para recepcionistas: podem ver todas as manicures e agendar para elas
    function canManageAllAppointments() {
        return isAdmin() || isReceptionist();
    }

    // Verifica se pode ver todos os agendamentos (admin e recepcionista)
    function canViewAllAppointments() {
        return isAdmin() || isReceptionist();
    }

    // Verifica se pode editar/criar (admin tem acesso total, recepcionista pode criar e editar clientes)
    function canEditClients() {
        return isAdmin() || isReceptionist();
    }

    function canEditServices() {
        return isAdmin();
    }

    function canEditStaff() {
        return isAdmin();
    }

    // Recepcionistas podem visualizar mas não editar
    function canViewClients() {
        return isAdmin() || isReceptionist();
    }

    function canViewServices() {
        return isAdmin() || isReceptionist();
    }

    function canViewStaff() {
        return isAdmin() || isReceptionist();
    }

    // Função para obter manicures que o usuário atual pode ver
    function getVisibleManicurists() {
        const { currentUser, staff } = appState;
        
        if (canViewAllAppointments()) {
            // Admin e recepcionista veem todas as manicures
            return staff.filter(s => s.role === 'manicurist');
        } else if (isManicurist()) {
            // Manicure só vê a si mesma
            const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
            return currentStaff ? [currentStaff] : [];
        }
        
        return [];
    }

    // Função para filtrar agendamentos baseado nas permissões
    function getVisibleAppointments(appointments = appState.appointments) {
        const { currentUser, staff, selectedManicuristId } = appState;
        
        if (canViewAllAppointments()) {
            // Admin e recepcionista veem todos os agendamentos
            let visibleAppointments = appointments;
            
            // Se houver uma manicure selecionada no filtro, mostrar apenas dela
            if (selectedManicuristId && selectedManicuristId !== 'all') {
                visibleAppointments = appointments.filter(app => app.staff_id === selectedManicuristId);
            }
            
            return visibleAppointments;
        } else if (isManicurist()) {
            // Manicure só vê seus próprios agendamentos
            const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
            if (currentStaff) {
                return appointments.filter(app => app.staff_id === currentStaff.id);
            }
        }
        
        return [];
    }

    // Funções do Supabase
    const auth = {
        async signUp(email, password, userData = {}) {
            try {
                const { data, error } = await window.supabase.auth.signUp({
                    email,
                    password,
                    options: { data: userData }
                });
                if (error) throw error;
                return { user: data.user, session: data.session };
            } catch (error) {
                console.error('Erro no cadastro:', error);
                throw error;
            }
        },

        async signIn(email, password) {
            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                return { user: data.user, session: data.session };
            } catch (error) {
                console.error('Erro no login:', error);
                throw error;
            }
        },

        async signOut() {
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) throw error;
            } catch (error) {
                console.error('Erro no logout:', error);
                throw error;
            }
        },

        async getUser() {
            try {
                const { data: { user }, error } = await window.supabase.auth.getUser();
                if (error) throw error;
                return user;
            } catch (error) {
                console.error('Erro ao obter usuário:', error);
                return null;
            }
        },

        onAuthStateChange(callback) {
            return window.supabase.auth.onAuthStateChange(callback);
        }
    };

    const db = {
        async getClients() {
            try {
                const { data, error } = await window.supabase
                    .from('clients')
                    .select('*')
                    .order('name');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar clientes:', error);
                return [];
            }
        },

        async addClient(client) {
            try {
                const { data, error } = await window.supabase
                    .from('clients')
                    .insert([client])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar cliente:', error);
                throw error;
            }
        },

        async updateClient(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('clients')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar cliente:', error);
                throw error;
            }
        },

        async deleteClient(id) {
            try {
                const { error } = await window.supabase
                    .from('clients')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                throw error;
            }
        },

        async getServices() {
            try {
                const { data, error } = await window.supabase
                    .from('services')
                    .select('*')
                    .order('name');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar serviços:', error);
                return [];
            }
        },

        async addService(service) {
            try {
                const { data, error } = await window.supabase
                    .from('services')
                    .insert([service])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar serviço:', error);
                throw error;
            }
        },

        async updateService(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('services')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar serviço:', error);
                throw error;
            }
        },

        async deleteService(id) {
            try {
                const { error } = await window.supabase
                    .from('services')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
                throw error;
            }
        },

        async getStaff() {
            try {
                const { data, error } = await window.supabase
                    .from('staff')
                    .select('*')
                    .order('name');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar funcionários:', error);
                return [];
            }
        },

        async addStaff(staff) {
            try {
                const { data, error } = await window.supabase
                    .from('staff')
                    .insert([staff])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar funcionário:', error);
                throw error;
            }
        },

        async updateStaff(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('staff')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar funcionário:', error);
                throw error;
            }
        },

        async deleteStaff(id) {
            try {
                const { error } = await window.supabase
                    .from('staff')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir funcionário:', error);
                throw error;
            }
        },

        async getAppointments(date = null) {
            try {
                let query = window.supabase
                    .from('appointments')
                    .select(`
                        *,
                        clients(*),
                        services(*),
                        staff(*)
                    `);
                
                if (date) {
                    query = query.eq('date', date);
                }
                
                const { data, error } = await query.order('date').order('time');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar agendamentos:', error);
                return [];
            }
        },

        async addAppointment(appointment) {
            try {
                const { data, error } = await window.supabase
                    .from('appointments')
                    .insert([appointment])
                    .select(`
                        *,
                        clients(*),
                        services(*),
                        staff(*)
                    `);
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar agendamento:', error);
                throw error;
            }
        },

        async updateAppointment(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('appointments')
                    .update(updates)
                    .eq('id', id)
                    .select(`
                        *,
                        clients(*),
                        services(*),
                        staff(*)
                    `);
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar agendamento:', error);
                throw error;
            }
        },

        async deleteAppointment(id) {
            try {
                const { error } = await window.supabase
                    .from('appointments')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir agendamento:', error);
                throw error;
            }
        },

        // Funções para solicitações de fechamento de agenda
        async getScheduleRequests() {
            try {
                const { data, error } = await window.supabase
                    .from('schedule_requests')
                    .select(`
                        *,
                        staff:staff_id (name)
                    `)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar solicitações:', error);
                return [];
            }
        },

        async addScheduleRequest(request) {
            try {
                const { data, error } = await window.supabase
                    .from('schedule_requests')
                    .insert([request])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao criar solicitação:', error);
                throw error;
            }
        },

        async updateScheduleRequest(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('schedule_requests')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar solicitação:', error);
                throw error;
            }
        },

        async deleteScheduleRequest(id) {
            try {
                const { error } = await window.supabase
                    .from('schedule_requests')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir solicitação:', error);
                throw error;
            }
        }
    };

    let dom = {};

    function init() {
        dom = {
            app: document.getElementById('app'),
            loginView: document.getElementById('login-view'),
            sidebarLinks: document.querySelectorAll('nav a'),
            mainContent: document.getElementById('mainContent'),
            headerTitle: document.querySelector('header h2'),
            currentDateDisplay: document.getElementById('currentDate'),
            modalContainer: document.getElementById('modal-container'),
            newClientBtn: document.getElementById('newClientBtn'),
            clientList: document.getElementById('clientList'),
            clientSearch: document.getElementById('clientSearch'),
            calendarContainer: document.getElementById('calendarContainer'),
            prevPeriodBtn: document.getElementById('prevPeriodBtn'),
            nextPeriodBtn: document.getElementById('nextPeriodBtn'),
            todayBtn: document.getElementById('todayBtn'),
            calendarViewToggles: document.querySelectorAll('.calendar-view-toggle'),
            newServiceBtn: document.getElementById('newServiceBtn'),
            serviceList: document.getElementById('serviceList'),
            staffList: document.getElementById('staffList'),
            newAppointmentBtn: document.getElementById('newAppointmentBtn'),
            settingsLink: document.getElementById('settingsLink'),
            logoutBtn: document.getElementById('logoutBtn')
        };

        setupEventListeners();
        loadUserSettings(); // Carregar configurações salvas
        checkAuthStatus();
        updateCurrentDate();
        
        // Adicionar listener para mudanças de idioma
        document.addEventListener('languageChanged', (e) => {
            console.log('🌐 Sistema de Tradução: Idioma alterado para:', e.detail.language);
            console.log('🌐 Traduções disponíveis:', Object.keys(window.translations || {}));
            console.log('🌐 Testando tradução "calendar":', getTranslation('calendar'));
            
            // Atualizar todos os elementos com tradução
            updateAllTranslations();
        });
    }

    async function checkAuthStatus() {
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            if (error) throw error;
            
            if (user) {
                appState.currentUser = user;
                showApp();
                await loadInitialData();
                showView('calendarView');
            } else {
                showLogin();
            }
        } catch (error) {
            console.error('Erro ao verificar status de autenticação:', error);
            showLogin();
        }
    }

    function showApp() {
        dom.loginView.style.display = 'none';
        dom.app.classList.remove('hidden');
    }

    function showLogin() {
        dom.app.classList.add('hidden');
        dom.loginView.style.display = 'block';
        renderLoginForm();
    }

    function renderLoginForm() {
        const t = getTranslations();
        dom.loginView.innerHTML = `
            <div class="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 overflow-hidden">
                <!-- Background decorativo animado -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div class="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-bounce"></div>
                    <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl animate-pulse"></div>
                </div>
                
                <!-- Container principal com animação de entrada -->
                <div class="max-w-md w-full space-y-8 relative z-10 px-4 animate-fade-in">
                    <div class="text-center">
                        <div class="mb-6">
                            <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30 p-2">
                                <img src="assets/imgs/icone-de-login.png" alt="Login Icon" class="w-12 h-12 object-contain">
                            </div>
                        </div>
                        <h2 class="text-4xl font-bold text-white mb-2">${t.appName}</h2>
                        <p class="text-white/80 text-lg">${t.appSubtitle}</p>
                    </div>
                    
                    <!-- Card de login com efeito de vidro -->
                    <div class="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
                        <form id="loginForm" class="space-y-6">
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">${t.email}</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">📧</span>
                                    <input id="email" name="email" type="email" required 
                                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="seu@email.com">
                                </div>
                            </div>
                            <div>
                                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">${t.password}</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                                    <input id="password" name="password" type="password" required 
                                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="••••••••">
                                </div>
                            </div>
                            <div>
                                <button type="submit" 
                                    class="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all duration-200 hover:scale-105 active:scale-95">
                                    ${t.login} ✨
                                </button>
                            </div>
                            <div class="text-sm text-center">
                                <a href="#" id="createAccountLink" class="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">
                                    ${t.createAccount} 🌟
                                </a>
                            </div>
                        </form>
                        <div id="loginError" class="mt-4 text-red-600 text-sm hidden p-3 bg-red-50 rounded-lg border border-red-200"></div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
                
                .shadow-3xl {
                    box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
                }
            </style>
        `;

        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('createAccountLink').addEventListener('click', showCreateAccount);
    }

    async function handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            appState.currentUser = data.user;
            showApp();
            await loadInitialData();
            showView('calendarView');
        } catch (error) {
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = getTranslation("loginError");
            errorDiv.classList.remove('hidden');
        }
    }

    function showCreateAccount() {
        const t = getTranslations();
        
        // Adicionar animação de saída
        const currentContent = dom.loginView.querySelector('.animate-fade-in');
        if (currentContent) {
            currentContent.style.opacity = '0';
            currentContent.style.transform = 'translateX(-20px)';
            currentContent.style.transition = 'all 0.3s ease-out';
        }
        
        setTimeout(() => {
            dom.loginView.innerHTML = `
                <div class="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
                    <!-- Background decorativo animado -->
                    <div class="absolute inset-0 overflow-hidden">
                        <div class="absolute top-1/4 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                        <div class="absolute bottom-3/4 left-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-bounce"></div>
                        <div class="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-300/15 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                    
                    <!-- Container principal com animação de entrada -->
                    <div class="max-w-md w-full space-y-8 relative z-10 px-4 animate-slide-in">
                        <div class="text-center">
                            <div class="mb-6">
                                <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                                    <span class="text-3xl">🌟</span>
                                </div>
                            </div>
                            <h2 class="text-4xl font-bold text-white mb-2">${t.createAccount}</h2>
                            <p class="text-white/80 text-lg">Bem-vindo ao futuro do seu salão!</p>
                        </div>
                        
                        <!-- Card de registro com efeito de vidro -->
                        <div class="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
                            <form id="signupForm" class="space-y-6">
                                <div>
                                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">${t.name}</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
                                        <input id="name" name="name" type="text" required 
                                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                            placeholder="Seu nome completo">
                                    </div>
                                </div>
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">${t.email}</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">📧</span>
                                        <input id="email" name="email" type="email" required 
                                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                            placeholder="seu@email.com">
                                    </div>
                                </div>
                                <div>
                                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">${t.password}</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                                        <input id="password" name="password" type="password" required minlength="6"
                                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                            placeholder="Mínimo 6 caracteres">
                                    </div>
                                </div>
                                <div>
                                    <button type="submit" 
                                        class="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all duration-200 hover:scale-105 active:scale-95">
                                        ${t.createAccount} 🚀
                                    </button>
                                </div>
                                <div class="text-sm text-center">
                                    <a href="#" id="backToLoginLink" class="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">
                                        ← ${t.login}
                                    </a>
                                </div>
                            </form>
                            <div id="signupError" class="mt-4 text-red-600 text-sm hidden p-3 bg-red-50 rounded-lg border border-red-200"></div>
                        </div>
                    </div>
                </div>
                
                <style>
                    @keyframes slide-in {
                        from { opacity: 0; transform: translateX(20px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    
                    .animate-slide-in {
                        animation: slide-in 0.6s ease-out;
                    }
                </style>
            `;
            
            document.getElementById('signupForm').addEventListener('submit', handleSignup);
            document.getElementById('backToLoginLink').addEventListener('click', (e) => {
                e.preventDefault();
                
                // Animação de saída
                const currentContent = dom.loginView.querySelector('.animate-slide-in');
                if (currentContent) {
                    currentContent.style.opacity = '0';
                    currentContent.style.transform = 'translateX(20px)';
                    currentContent.style.transition = 'all 0.3s ease-out';
                }
                
                setTimeout(() => {
                    renderLoginForm();
                }, 300);
            });
        }, 300);
    }

    async function handleSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const { user, session } = await auth.signUp(email, password, { name });
            
            if (user) {
                // Verificar se precisa de confirmação de email
                if (!session) {
                    // Email precisa ser confirmado
                    showEmailConfirmationMessage(email);
                    return;
                }
                
                // Se o usuário está logado, adicionar ao staff como manicurist (padrão)
                await db.addStaff({
                    name,
                    email,
                    role: 'manicurist', // Padrão para novos usuários
                    user_id: user.id
                });

                appState.currentUser = user;
                showApp();
                await loadInitialData();
                showView('calendarView');
            }
        } catch (error) {
            const errorDiv = document.getElementById('signupError');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    }

    function showEmailConfirmationMessage(email) {
        const t = getTranslations();
        
        dom.loginView.innerHTML = `
            <div class="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 overflow-hidden">
                <!-- Background decorativo animado -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div class="absolute top-3/4 right-1/4 w-96 h-96 bg-green-300/20 rounded-full blur-3xl animate-bounce"></div>
                    <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl animate-pulse"></div>
                </div>
                
                <!-- Container principal -->
                <div class="max-w-md w-full space-y-8 relative z-10 px-4 animate-fade-in">
                    <div class="text-center">
                        <div class="mb-6">
                            <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                                <span class="text-3xl">📧</span>
                            </div>
                        </div>
                        <h2 class="text-4xl font-bold text-white mb-2">Confirme seu Email</h2>
                        <p class="text-white/80 text-lg">Quase pronto!</p>
                    </div>
                    
                    <!-- Card de confirmação -->
                    <div class="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20">
                        <div class="text-center space-y-4">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-2xl">✉️</span>
                            </div>
                            
                            <h3 class="text-xl font-bold text-gray-800 mb-4">
                                Verifique seu Email
                            </h3>
                            
                            <p class="text-gray-600 mb-6">
                                Enviamos um link de confirmação para:
                                <br><strong class="text-blue-600">${email}</strong>
                            </p>
                            
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p class="text-sm text-blue-800">
                                    <strong>📋 O que fazer agora:</strong><br>
                                    1. Abra seu email<br>
                                    2. Procure por uma mensagem do sistema<br>
                                    3. Clique no link "Confirmar Email"<br>
                                    4. Volte aqui e faça login
                                </p>
                            </div>
                            
                            <div class="space-y-3">
                                <button id="resendEmailBtn" 
                                    class="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105">
                                    📨 Reenviar Email de Confirmação
                                </button>
                                
                                <button id="backToLoginFromConfirm" 
                                    class="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                                    ← Voltar ao Login
                                </button>
                            </div>
                        </div>
                        
                        <div id="resendMessage" class="mt-4 text-sm hidden p-3 rounded-lg border"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Event listeners
        document.getElementById('resendEmailBtn').addEventListener('click', async () => {
            const btn = document.getElementById('resendEmailBtn');
            const messageDiv = document.getElementById('resendMessage');
            
            btn.disabled = true;
            btn.textContent = '📨 Enviando...';
            
            try {
                const { error } = await window.supabase.auth.resend({
                    type: 'signup',
                    email: email
                });
                
                if (error) throw error;
                
                messageDiv.className = 'mt-4 text-sm p-3 bg-green-50 rounded-lg border border-green-200 text-green-800';
                messageDiv.textContent = '✅ Email reenviado com sucesso! Verifique sua caixa de entrada.';
                messageDiv.classList.remove('hidden');
                
            } catch (error) {
                messageDiv.className = 'mt-4 text-sm p-3 bg-red-50 rounded-lg border border-red-200 text-red-800';
                messageDiv.textContent = '❌ Erro ao reenviar email: ' + error.message;
                messageDiv.classList.remove('hidden');
            }
            
            btn.disabled = false;
            btn.textContent = '📨 Reenviar Email de Confirmação';
        });
        
        document.getElementById('backToLoginFromConfirm').addEventListener('click', () => {
            renderLoginForm();
        });
    }

    async function loadInitialData() {
        try {
            // Carregar dados do Supabase
            appState.clients = await db.getClients();
            appState.services = await db.getServices();
            appState.staff = await db.getStaff();
            appState.appointments = await db.getAppointments();
            appState.scheduleRequests = await db.getScheduleRequests();
            
            console.log('Agendamentos carregados:', appState.appointments.length);
            console.log('Solicitações carregadas:', appState.scheduleRequests.length);
            
            // Se não houver dados, criar dados padrão
            if (appState.services.length === 0) {
                const defaultServices = [
                    { name: 'Manicure', duration: 30, price: 25.00 },
                    { name: 'Pedicure', duration: 45, price: 35.00 },
                    { name: 'Esmaltação', duration: 20, price: 15.00 }
                ];
                
                for (const service of defaultServices) {
                    try {
                        const newService = await db.addService(service);
                        appState.services.push(newService);
                    } catch (error) {
                        console.error('Erro ao criar serviço padrão:', error);
                    }
                }
            }
            
            // Inicializar melhorias após carregar dados
            initializeEnhancements();
            
            // Se não houver nenhum staff E o usuário atual não existe na tabela staff,
            // criar o primeiro usuário como admin (fundador do sistema)
            const currentUserInStaff = appState.staff.find(s => 
                s.user_id === appState.currentUser?.id || s.email === appState.currentUser?.email
            );
            
            if (appState.staff.length === 0 && appState.currentUser && !currentUserInStaff) {
                // Primeiro usuário do sistema será admin
                const adminStaff = {
                    name: appState.currentUser.user_metadata?.name || 
                          appState.currentUser.email?.split('@')[0] || 'Admin',
                    email: appState.currentUser.email,
                    role: 'admin',
                    user_id: appState.currentUser.id
                };
                
                try {
                    const newStaff = await db.addStaff(adminStaff);
                    appState.staff.push(newStaff);
                    console.log('Primeiro usuário criado como admin:', newStaff);
                } catch (error) {
                    console.error('Erro ao criar staff admin:', error);
                }
            } else if (appState.currentUser && !currentUserInStaff) {
                // Usuários subsequentes serão manicurists por padrão
                const manicuristStaff = {
                    name: appState.currentUser.user_metadata?.name || 
                          appState.currentUser.email?.split('@')[0] || 'Usuário',
                    email: appState.currentUser.email,
                    role: 'manicurist',
                    user_id: appState.currentUser.id
                };
                
                try {
                    const newStaff = await db.addStaff(manicuristStaff);
                    appState.staff.push(newStaff);
                    console.log('Novo usuário criado como manicurist:', newStaff);
                } catch (error) {
                    console.error('Erro ao criar staff manicurist:', error);
                }
            }
            
            // Processar agendamentos atrasados automaticamente
            await processOverdueAppointments();
            
            // Configurar verificação periódica (a cada 5 minutos)
            setInterval(async () => {
                await processOverdueAppointments();
                // Re-renderizar a view atual se for o calendário
                if (appState.currentView === 'calendarView') {
                    renderCalendar();
                }
            }, 5 * 60 * 1000); // 5 minutos
            
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    function setupEventListeners() {
        dom.sidebarLinks.forEach(link => {
            link.addEventListener('click', handleNavigation);
        });

        // Adicionar event listener específico para o link de configurações
        const settingsLink = document.getElementById('settingsLink');
        if (settingsLink) {
            settingsLink.addEventListener('click', handleNavigation);
        }

        dom.newClientBtn.addEventListener('click', () => showClientModal());
        dom.newServiceBtn.addEventListener('click', () => showServiceModal());
        dom.newAppointmentBtn.addEventListener('click', () => showAppointmentModal());
        
        dom.logoutBtn.addEventListener('click', handleLogout);
        dom.clientSearch.addEventListener('input', handleClientSearch);

        auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                appState.currentUser = null;
                showLogin();
            }
        });
    }

    async function handleLogout() {
        try {
            await auth.signOut();
            showLogin();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    function handleNavigation(e) {
        e.preventDefault();
        const viewName = e.target.closest('a').dataset.view;
        console.log('Navegando para:', viewName); // Debug
        if (viewName) {
            showView(viewName);
        }
    }

    function showView(viewName) {
        const views = ['calendarView', 'clientsView', 'servicesView', 'staffView', 'reportsView', 'scheduleRequestsView', 'settingsView'];
        views.forEach(view => {
            const element = document.getElementById(view);
            if (element) element.classList.add('hidden');
        });

        const selectedView = document.getElementById(viewName);
        if (selectedView) {
            selectedView.classList.remove('hidden');
            appState.currentView = viewName;
        }

        // Atualizar links da sidebar
        dom.sidebarLinks.forEach(link => {
            link.classList.remove('bg-[var(--accent-light)]', 'text-[var(--accent-primary)]');
            if (link.dataset.view === viewName) {
                link.classList.add('bg-[var(--accent-light)]', 'text-[var(--accent-primary)]');
            }
        });

        // Também verificar o link de configurações separadamente
        const settingsLink = document.getElementById('settingsLink');
        if (settingsLink) {
            if (viewName === 'settingsView') {
                settingsLink.classList.add('bg-[var(--accent-light)]', 'text-[var(--accent-primary)]');
            } else {
                settingsLink.classList.remove('bg-[var(--accent-light)]', 'text-[var(--accent-primary)]');
            }
        }

        // Renderizar o conteúdo da view
        renderViewContent(viewName);
        
        // Atualizar permissões da interface
        setupUIPermissions();
    }

    function refreshCurrentView() {
        if (appState.currentView) {
            renderViewContent(appState.currentView);
        }
    }

    function renderViewContent(viewName) {
        switch (viewName) {
            case 'calendarView':
                renderCalendar();
                break;
            case 'clientsView':
                renderClients();
                break;
            case 'servicesView':
                renderServices();
                break;
            case 'staffView':
                renderStaff();
                break;
            case 'reportsView':
                renderReports();
                break;
            case 'scheduleRequestsView':
                renderScheduleRequests();
                break;
            case 'settingsView':
                renderSettings();
                break;
        }
    }

    function renderClients() {
        const t = getTranslations();
        
        if (!appState.clients.length) {
            dom.clientList.innerHTML = `<li class="p-4 text-center text-[var(--text-secondary)]">${t.noClientsFound}</li>`;
            return;
        }

        const canEdit = canEditClients();
        
        dom.clientList.innerHTML = appState.clients.map(client => `
            <li class="p-4 hover:bg-[var(--accent-light)] flex justify-between items-center border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div>
                    <div class="font-medium text-[var(--text-primary)]">${client.name}</div>
                    <div class="text-sm text-[var(--text-secondary)]">${client.phone || ''} ${client.email || ''}</div>
                </div>
                ${canEdit ? `
                    <div class="flex space-x-2">
                        <button onclick="editClient('${client.id}')" class="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">${t.edit}</button>
                        <button onclick="deleteClient('${client.id}')" class="text-red-600 hover:text-red-800">${t.delete}</button>
                    </div>
                ` : `
                    <div class="text-xs text-[var(--text-secondary)] px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded">
                        ${t.viewOnly || 'Somente visualização'}
                    </div>
                `}
            </li>
        `).join('');
    }

    function renderServices() {
        const t = getTranslations();
        
        if (!appState.services.length) {
            dom.serviceList.innerHTML = `<li class="p-4 text-center text-[var(--text-secondary)]">${t.noServicesFound}</li>`;
            return;
        }

        const canEdit = canEditServices();

        dom.serviceList.innerHTML = appState.services.map(service => `
            <li class="p-4 hover:bg-[var(--accent-light)] flex justify-between items-center border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div>
                    <div class="font-medium text-[var(--text-primary)]">${service.name}</div>
                    <div class="text-sm text-[var(--text-secondary)]">${service.duration}min - R$ ${service.price ? service.price.toFixed(2) : '0.00'}</div>
                </div>
                ${canEdit ? `
                    <div class="flex space-x-2">
                        <button onclick="editService('${service.id}')" class="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">${t.edit}</button>
                        <button onclick="deleteService('${service.id}')" class="text-red-600 hover:text-red-800">${t.delete}</button>
                    </div>
                ` : `
                    <div class="text-xs text-[var(--text-secondary)] px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded">
                        ${t.viewOnly || 'Somente visualização'}
                    </div>
                `}
            </li>
        `).join('');
    }

    function renderStaff() {
        const t = getTranslations();
        
        if (!appState.staff.length) {
            dom.staffList.innerHTML = `<li class="p-4 text-center text-[var(--text-secondary)]">${t.noStaffFound}</li>`;
            return;
        }

        const canEdit = canEditStaff();

        dom.staffList.innerHTML = appState.staff.map(staff => `
            <li class="p-4 hover:bg-[var(--accent-light)] flex justify-between items-center border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-white font-semibold">
                        ${staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="font-medium text-[var(--text-primary)]">${staff.name}</div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm px-2 py-1 rounded-full ${staff.role === 'admin' ? 'bg-purple-100 text-purple-800' : staff.role === 'receptionist' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">${t[staff.role] || staff.role}</span>
                        </div>
                    </div>
                </div>
                ${canEdit ? `
                    <div class="flex space-x-2">
                        <button onclick="editStaff('${staff.id}')" class="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">${t.edit}</button>
                        ${staff.role !== 'admin' ? `<button onclick="deleteStaff('${staff.id}')" class="text-red-600 hover:text-red-800">${t.delete}</button>` : ''}
                    </div>
                ` : `
                    <div class="text-xs text-[var(--text-secondary)] px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded">
                        ${t.viewOnly || 'Somente visualização'}
                    </div>
                `}
            </li>
        `).join('');
    }

    function renderCalendar() {
        updateCurrentDate();
        updateCalendarViewToggle();

        // Configurar event listeners para navegação do calendário
        setupCalendarNavigation();

        switch (appState.calendarViewType) {
            case 'month':
                renderMonthView();
                break;
            case 'week':
                renderWeekView();
                break;
            case 'day':
                renderDayView();
                break;
        }
    }

    function updateCalendarViewToggle() {
        dom.calendarViewToggles.forEach(btn => {
            const isSelected = btn.dataset.viewType === appState.calendarViewType;
            btn.classList.toggle('bg-[var(--accent-primary)]', isSelected);
            btn.classList.toggle('text-white', isSelected);
            btn.classList.toggle('text-[var(--text-secondary)]', !isSelected);
        });
    }

    function setupCalendarNavigation() {
        if (dom.prevPeriodBtn) {
            dom.prevPeriodBtn.onclick = () => {
                switch (appState.calendarViewType) {
                    case 'month':
                        appState.currentDate.setMonth(appState.currentDate.getMonth() - 1);
                        break;
                    case 'week':
                        appState.currentDate.setDate(appState.currentDate.getDate() - 7);
                        break;
                    case 'day':
                        appState.currentDate.setDate(appState.currentDate.getDate() - 1);
                        break;
                }
                renderCalendar();
            };
        }

        if (dom.nextPeriodBtn) {
            dom.nextPeriodBtn.onclick = () => {
                switch (appState.calendarViewType) {
                    case 'month':
                        appState.currentDate.setMonth(appState.currentDate.getMonth() + 1);
                        break;
                    case 'week':
                        appState.currentDate.setDate(appState.currentDate.getDate() + 7);
                        break;
                    case 'day':
                        appState.currentDate.setDate(appState.currentDate.getDate() + 1);
                        break;
                }
                renderCalendar();
            };
        }

        if (dom.todayBtn) {
            dom.todayBtn.onclick = () => {
                appState.currentDate = new Date();
                renderCalendar();
            };
        }

        dom.calendarViewToggles.forEach(btn => {
            btn.onclick = () => {
                appState.calendarViewType = btn.dataset.viewType;
                renderCalendar();
            };
        });
    }

    function renderMonthView() {
        const d = appState.currentDate;
        const year = d.getFullYear();
        const month = d.getMonth();
        const today = new Date();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        const weekdays = getTranslation('shortWeekdays') || ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        let html = '<div class="grid grid-cols-7 text-center text-xs font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">';
        weekdays.forEach(day => {
            html += `<div class="p-2">${day}</div>`;
        });
        html += '</div>';

        html += '<div class="grid grid-cols-7">';
        
        // Células vazias para dias antes do primeiro dia do mês
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += '<div class="border-t border-l border-[var(--border-color)] h-28"></div>';
        }

        // Células dos dias do mês
        for (let day = 1; day <= totalDays; day++) {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayClass = isToday ? 'bg-[var(--accent-primary)] text-white' : 'hover:bg-[var(--accent-light)]';
            
            // Criar data corretamente para evitar problemas de timezone
            const currentDay = new Date(year, month, day, 12, 0, 0); // meio-dia para evitar problemas de timezone
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Agendamentos para este dia - aplicar filtro de permissões
            const allDayAppointments = appState.appointments.filter(app => app.date === dateStr);
            const dayAppointments = getVisibleAppointments(allDayAppointments);
            
            html += `
                <div class="border-t border-l border-[var(--border-color)] h-28 p-1 cursor-pointer" onclick="showDayAppointments('${dateStr}')">
                    <div class="w-7 h-7 flex items-center justify-center rounded-full text-sm ${dayClass} mb-1">${day}</div>
                    <div class="space-y-1">
                        ${dayAppointments.slice(0, 3).map(app => {
                            const client = app.clients || appState.clients.find(c => c.id === app.client_id);
                            return `<div class="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate">${client?.name || 'Cliente'}</div>`;
                        }).join('')}
                        ${dayAppointments.length > 3 ? `<div class="text-xs text-gray-500">+${dayAppointments.length - 3} mais</div>` : ''}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        dom.calendarContainer.innerHTML = html;
        
        // Adicionar seletor de manicure para recepcionistas e admins
        if (canViewAllAppointments()) {
            addManicuristFilter();
        }
        
        // Adicionar botão de solicitação de fechamento para manicuristas
        if (isManicurist()) {
            addScheduleRequestButton();
        }
    }

    function renderWeekView() {
        const d = new Date(appState.currentDate);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay()); // Vai para domingo

        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        let html = `
            <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                        Semana de ${startOfWeek.toLocaleDateString('pt-BR')}
                    </h3>
                </div>
                <div class="grid grid-cols-7 gap-4">
        `;
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dateStr = getLocalDateString(day);
            const allDayAppointments = appState.appointments.filter(app => app.date === dateStr);
            const dayAppointments = getVisibleAppointments(allDayAppointments);
            const isToday = day.toDateString() === new Date().toDateString();
            
            html += `
                <div class="text-center ${isToday ? 'bg-[var(--accent-light)] rounded-lg p-2' : ''}">
                    <div class="text-sm font-medium text-[var(--text-primary)] mb-2">
                        ${weekdays[i]}
                    </div>
                    <div class="text-sm text-[var(--text-secondary)] mb-3">
                        ${day.getDate()}
                    </div>
                    <div class="space-y-1">
            `;

            if (dayAppointments.length === 0) {
                html += `<div class="text-xs text-[var(--text-secondary)]">Livre</div>`;
            } else {
                dayAppointments
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .slice(0, 3)
                    .forEach(appointment => {
                        const client = appointment.clients || appState.clients.find(c => c.id === appointment.client_id);
                        const canEdit = canEditAppointment(appointment);
                        html += `
                            <div class="text-xs p-1 rounded ${getStatusColor(appointment.status)} ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}"
                                 ${canEdit ? `onclick="editAppointment('${appointment.id}')"` : 'title="Agendamento passado - não editável"'}>
                                <div>${formatTime(appointment.time)} ${!canEdit ? '🔒' : ''}</div>
                                <div class="truncate">${client?.name || 'Cliente'}</div>
                            </div>
                        `;
                    });
                
                if (dayAppointments.length > 3) {
                    const t = getTranslations();
                    html += `<div class="text-xs text-[var(--text-secondary)]">+${dayAppointments.length - 3} ${t.moreAppointments || 'mais'}</div>`;
                }
            }

            html += `
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        dom.calendarContainer.innerHTML = html;
    }

    // Função para automatizar status de agendamentos passados
    async function processOverdueAppointments() {
        const updatedAppointments = [];
        
        for (let appointment of appState.appointments) {
            // Se o agendamento é de uma data passada e ainda está como 'scheduled'
            if (isDateInPast(appointment.date) && appointment.status === 'scheduled') {
                try {
                    // Atualizar automaticamente para 'no-show'
                    await db.updateAppointment(appointment.id, { status: 'no-show' });
                    appointment.status = 'no-show';
                    updatedAppointments.push(appointment);
                } catch (error) {
                    console.error('Erro ao atualizar status do agendamento:', error);
                }
            }
        }
        
        if (updatedAppointments.length > 0) {
            console.log(`${updatedAppointments.length} agendamentos atualizados automaticamente para 'não compareceu'`);
        }
    }

    // Função para verificar se um agendamento pode ser editado
    function canEditAppointment(appointment) {
        // Usar a função utilitária para verificação consistente
        return !isDateInPast(appointment.date);
    }

    function renderDayView() {
        const d = appState.currentDate;
        const dateStr = getLocalDateString(d);
        const dayAppointments = getVisibleAppointments(appState.appointments.filter(app => app.date === dateStr));

        // Definir horários de trabalho
        const startHour = parseInt(appState.settings.workingHours.start.split(':')[0]);
        const startMinute = parseInt(appState.settings.workingHours.start.split(':')[1]);
        const endHour = parseInt(appState.settings.workingHours.end.split(':')[0]);
        const endMinute = parseInt(appState.settings.workingHours.end.split(':')[1]);
        
        // Definir horário de almoço
        const lunchStart = appState.settings.lunchTime?.start || '12:00';
        const lunchEnd = appState.settings.lunchTime?.end || '13:00';
        const lunchStartTime = lunchStart.split(':').map(Number);
        const lunchEndTime = lunchEnd.split(':').map(Number);
        
        // Duração dos agendamentos em minutos
        const appointmentDuration = appState.settings.appointmentDuration || 40;

        // Verificar se a data é elegível para solicitação de fechamento (mínimo 1 dia de antecedência)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const canRequestBlock = isManicurist() && d >= tomorrow;

        let html = `
            <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                        ${d.toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </h3>
                </div>
        `;

        if (startHour === endHour && startMinute === endMinute) {
            html += `
                <div class="text-center text-[var(--text-secondary)] py-12">
                    <h3 class="text-sm font-medium">Nenhum horário configurado</h3>
                    <p class="text-sm">Configure os horários de funcionamento nas configurações.</p>
                </div>
            `;
        } else {
            // Gerar horários baseados na duração dos agendamentos
            const timeSlots = generateTimeSlots(
                appState.settings.workingHours.start,
                appState.settings.workingHours.end,
                appointmentDuration,
                lunchStart,
                lunchEnd
            );

            // Organizar agendamentos por horário - corrigir formato de hora
            const appointmentsByTime = {};
            
            dayAppointments.forEach(appointment => {
                // Converter "10:00:00" para "10:00" para compatibilidade
                const timeKey = appointment.time.substring(0, 5);
                appointmentsByTime[timeKey] = appointment;
            });

            // Renderizar cada slot de horário
            timeSlots.forEach(timeSlot => {
                const appointment = appointmentsByTime[timeSlot.time];
                const isLunchTime = timeSlot.isLunchTime;
                
                html += `
                    <div class="flex items-start py-3 border-b border-[var(--border-color)] last:border-b-0">
                        <div class="w-20 text-sm text-[var(--text-secondary)] font-mono pt-1">
                            ${timeSlot.time}
                        </div>
                        <div class="flex-1 ml-4">
                `;
                
                if (isLunchTime) {
                    html += `
                        <div class="text-sm text-orange-600 dark:text-orange-400 italic py-2">
                            Horário de almoço
                        </div>
                    `;
                } else if (!appointment) {
                    // Verificar se a data é no passado (anterior a hoje)
                    const isPast = isDateInPast(dateStr);
                    
                    html += `
                        <div class="py-2 cursor-pointer text-[var(--text-secondary)] ${isPast ? 'opacity-50 cursor-not-allowed' : 'hover:text-[var(--accent-primary)] hover:bg-[var(--accent-light)]'} transition-colors min-h-[2rem] rounded px-2" 
                             ${isPast ? '' : `onclick="showAppointmentModal(null, '${dateStr}', '${timeSlot.time}')"`}
                             ${isPast ? 'title="Não é possível agendar em datas passadas"' : ''}>
                             ${isPast ? '<span class="text-xs italic">Horário passado</span>' : ''}
                        </div>
                    `;
                } else {
                    // Acessar dados com JOIN - podem vir como objetos ou por ID
                    const client = appointment.clients || appState.clients.find(c => c.id === appointment.client_id);
                    const service = appointment.services || appState.services.find(s => s.id === appointment.service_id);
                    const staff = appointment.staff || appState.staff.find(s => s.id === appointment.staff_id);
                    const duration = service?.duration || appointmentDuration;
                    const endTime = addMinutesToTime(appointment.time, duration);
                    const canEdit = canEditAppointment(appointment);

                    html += `
                        <div class="py-2 ${canEdit ? 'cursor-pointer hover:bg-[var(--accent-light)]' : 'cursor-not-allowed opacity-75'} rounded-md p-2 -m-2 transition-colors" 
                             ${canEdit ? `onclick="editAppointment('${appointment.id}')"` : 'title="Agendamentos passados não podem ser editados"'}>
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-sm font-medium text-[var(--text-primary)]">${formatTime(appointment.time)} - ${formatTime(endTime)}</span>
                                        <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(appointment.status)}">
                                            ${getStatusText(appointment.status)}
                                        </span>
                                        ${!canEdit ? '<span class="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">🔒 Bloqueado</span>' : ''}
                                    </div>
                                    <div class="text-sm text-[var(--text-secondary)] mt-1">
                                        ${client?.name || 'Cliente'} • ${service?.name || 'Serviço'}
                                    </div>
                                    ${appointment.notes ? `<div class="text-xs text-[var(--text-secondary)] mt-1 italic">${appointment.notes}</div>` : ''}
                                </div>
                                <div class="text-right ml-4">
                                    <div class="text-xs text-[var(--text-secondary)]">${duration}min</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            // Resumo do dia (mais simples)
            if (dayAppointments.length > 0) {
                html += `
                    <div class="mt-6 pt-4 border-t border-[var(--border-color)]">
                        <div class="text-sm text-center">
                            <span class="text-[var(--text-secondary)]">Total: ${dayAppointments.length} agendamentos</span>
                        </div>
                    </div>
                `;
            }
        }

        html += '</div>';
        dom.calendarContainer.innerHTML = html;
    }

    // Função auxiliar para adicionar minutos a uma hora
    function addMinutesToTime(time, minutes) {
        const [hours, mins] = time.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    }

    // Função para gerar slots de horário baseados na duração dos agendamentos
    function generateTimeSlots(startTime, endTime, duration, lunchStart, lunchEnd) {
        const slots = [];
        
        // Converter horários para minutos
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const lunchStartMinutes = timeToMinutes(lunchStart);
        const lunchEndMinutes = timeToMinutes(lunchEnd);
        
        let currentMinutes = startMinutes;
        
        while (currentMinutes < endMinutes) {
            const timeStr = minutesToTime(currentMinutes);
            
            // Verificar se é horário de almoço
            const isLunchTime = currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes;
            
            slots.push({
                time: timeStr,
                isLunchTime: isLunchTime
            });
            
            currentMinutes += duration;
        }
        
        return slots;
    }

    // Converter horário para minutos
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Converter minutos para horário
    function minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    function getStatusColor(status) {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'no-show': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getStatusText(status) {
        const t = getTranslations();
        switch (status) {
            case 'scheduled': return t.statusScheduled || 'Agendado';
            case 'completed': return t.statusCompleted || 'Concluído';
            case 'cancelled': return t.statusCancelled || 'Cancelado';
            case 'no-show': return t.statusNoShow || 'Não compareceu';
            default: return status;
        }
    }

    function renderScheduleRequests() {
        const t = getTranslations();
        const scheduleRequestsView = document.getElementById('scheduleRequestsView');
        
        if (!scheduleRequestsView) {
            console.error('Schedule requests view not found');
            return;
        }

        // Verificar permissões
        if (isManicurist()) {
            // Manicures veem apenas suas próprias solicitações
            const { currentUser, staff } = appState;
            const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
            const userRequests = currentStaff ? 
                appState.scheduleRequests.filter(r => r.staff_id === currentStaff.id) : [];
            
            scheduleRequestsView.innerHTML = `
                <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        ${t.myScheduleRequests || 'Minhas Solicitações de Fechamento'}
                    </h3>
                    ${userRequests.length === 0 ? `
                        <p class="text-[var(--text-secondary)] text-center py-8">
                            ${t.noScheduleRequests || 'Nenhuma solicitação encontrada'}
                        </p>
                    ` : userRequests.map(request => `
                        <div class="border border-[var(--border-color)] rounded-lg p-4 mb-4 bg-[var(--bg-primary)]">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <span class="font-medium text-[var(--text-primary)]">
                                        ${new Date(request.date).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span class="ml-2 px-2 py-1 rounded-full text-xs ${
                                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }">
                                        ${request.status === 'pending' ? 'Pendente' :
                                          request.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                                    </span>
                                </div>
                                <small class="text-[var(--text-secondary)]">
                                    ${new Date(request.created_at).toLocaleDateString('pt-BR')}
                                </small>
                            </div>
                            <p class="text-[var(--text-secondary)] text-sm">
                                <strong>Motivo:</strong> ${request.reason}
                            </p>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (isAdmin()) {
            // Admins veem todas as solicitações e podem aprovar/rejeitar
            const pendingRequests = appState.scheduleRequests.filter(r => r.status === 'pending');
            const processedRequests = appState.scheduleRequests.filter(r => r.status !== 'pending');
            
            scheduleRequestsView.innerHTML = `
                <div class="space-y-6">
                    <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            ${t.pendingScheduleRequests || 'Solicitações Pendentes'}
                        </h3>
                        ${pendingRequests.length === 0 ? `
                            <p class="text-[var(--text-secondary)] text-center py-8">
                                ${t.noPendingRequests || 'Nenhuma solicitação pendente'}
                            </p>
                        ` : pendingRequests.map(request => {
                            const staff = appState.staff.find(s => s.id === request.staff_id);
                            return `
                                <div class="border border-[var(--border-color)] rounded-lg p-4 mb-4 bg-[var(--bg-primary)]">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <span class="font-medium text-[var(--text-primary)]">
                                                ${staff?.name || 'Funcionário'} - ${new Date(request.date).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span class="ml-2 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                                Pendente
                                            </span>
                                        </div>
                                        <small class="text-[var(--text-secondary)]">
                                            ${new Date(request.created_at).toLocaleDateString('pt-BR')}
                                        </small>
                                    </div>
                                    <p class="text-[var(--text-secondary)] text-sm mb-3">
                                        <strong>Motivo:</strong> ${request.reason}
                                    </p>
                                    <div class="flex space-x-2">
                                        <button onclick="approveScheduleRequest('${request.id}')" 
                                            class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                                            ✅ Aprovar
                                        </button>
                                        <button onclick="rejectScheduleRequest('${request.id}')" 
                                            class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                                            ❌ Rejeitar
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            ${t.processedScheduleRequests || 'Solicitações Processadas'}
                        </h3>
                        ${processedRequests.length === 0 ? `
                            <p class="text-[var(--text-secondary)] text-center py-8">
                                ${t.noProcessedRequests || 'Nenhuma solicitação processada'}
                            </p>
                        ` : processedRequests.slice(0, 10).map(request => {
                            const staff = appState.staff.find(s => s.id === request.staff_id);
                            return `
                                <div class="border border-[var(--border-color)] rounded-lg p-4 mb-4 bg-[var(--bg-primary)]">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <span class="font-medium text-[var(--text-primary)]">
                                                ${staff?.name || 'Funcionário'} - ${new Date(request.date).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span class="ml-2 px-2 py-1 rounded-full text-xs ${
                                                request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }">
                                                ${request.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                                            </span>
                                        </div>
                                        <small class="text-[var(--text-secondary)]">
                                            ${new Date(request.created_at).toLocaleDateString('pt-BR')}
                                        </small>
                                    </div>
                                    <p class="text-[var(--text-secondary)] text-sm">
                                        <strong>Motivo:</strong> ${request.reason}
                                    </p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            // Recepcionistas não têm acesso às solicitações
            scheduleRequestsView.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">🚫</div>
                    <h3 class="text-xl font-bold text-[var(--text-primary)] mb-2">${t.restrictedAccess}</h3>
                    <p class="text-[var(--text-secondary)]">Acesso restrito para administradores e manicures.</p>
                </div>
            `;
        }
    }

    function renderSettings() {
        const settingsView = document.getElementById('settingsView');
        const { currentUser, settings, staff } = appState;
        const t = getTranslations();
        
        // Usar a função utilitária para verificar se é admin
        const userStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        const loggedInUser = userStaff || { 
            name: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Admin', 
            email: currentUser?.email || 'admin@example.com' 
        };

        let settingsHtml = `
            <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-6">${t.settings}</h2>
            <div class="space-y-8 max-w-4xl mx-auto">
                
                <!-- Profile Settings -->
                <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                    <h3 class="text-xl font-bold mb-4">${t.profileSettingsTitle}</h3>
                    <form id="profileSettingsForm" class="space-y-4">
                        <div>
                            <label for="profileName" class="block text-sm font-medium text-[var(--text-secondary)]">${t.name}</label>
                            <input type="text" id="profileName" value="${loggedInUser.name}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label for="profileEmail" class="block text-sm font-medium text-[var(--text-secondary)]">${t.email}</label>
                            <input type="email" id="profileEmail" value="${loggedInUser.email}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label for="profilePassword" class="block text-sm font-medium text-[var(--text-secondary)]">${t.newPassword}</label>
                            <input type="password" id="profilePassword" placeholder="${t.changePasswordPlaceholder}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                        </div>
                        <button type="submit" class="bg-[var(--accent-primary)] text-white py-2 px-4 rounded-lg hover:bg-[var(--accent-secondary)] transition-colors duration-200">${t.saveChanges}</button>
                    </form>
                </div>

                <!-- Appearance Settings -->
                <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                    <h3 class="text-xl font-bold mb-4">${t.appearanceTitle}</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-3">${t.theme}</label>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                ${window.ThemeManager?.getThemesList().map(theme => `
                                    <div class="theme-option border-2 rounded-lg p-3 cursor-pointer transition-all ${window.ThemeManager?.getCurrentTheme() === theme.key ? 'border-[var(--accent-primary)] bg-[var(--accent-light)]' : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]'}" 
                                         onclick="selectTheme('${theme.key}')">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-6 h-6 rounded-full border-2 border-white shadow-sm" style="background-color: ${theme.preview}"></div>
                                            <span class="text-sm font-medium">${theme.name}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <label for="languageSelect" class="block text-sm font-medium text-[var(--text-secondary)]">${t.language}</label>
                            <select id="languageSelect" class="mt-1 block w-full max-w-xs px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                                <option value="pt-BR" ${appState.settings.language === 'pt-BR' ? 'selected' : ''}>Português</option>
                                <option value="en-US" ${appState.settings.language === 'en-US' ? 'selected' : ''}>English</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-[var(--accent-light)] rounded-full flex items-center justify-center">
                                    🔔
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-[var(--text-primary)]">${t.enableNotifications || 'Habilitar Notificações'}</span>
                                    <p class="text-xs text-[var(--text-secondary)]">
                                        ${'Notification' in window ? 
                                            'Receba alertas sobre agendamentos' : 
                                            'Notificações não suportadas neste navegador'}
                                    </p>
                                </div>
                            </div>
                            <label class="relative inline-flex items-center ${'Notification' in window ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}">
                                <input type="checkbox" id="enableNotifications" 
                                    ${localStorage.getItem('notifications-enabled') === 'true' && Notification?.permission === 'granted' ? 'checked' : ''} 
                                    ${'Notification' in window ? '' : 'disabled'} 
                                    class="sr-only peer">
                                <div class="w-11 h-6 bg-[var(--border-color)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:bg-gray-300 peer-disabled:cursor-not-allowed"></div>
                            </label>
                        </div>
                    </div>
                </div>
                ${isAdmin() ? `
                <!-- Admin Settings -->
                <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                    <h3 class="text-xl font-bold mb-4">${t.adminSettingsTitle}</h3>
                    <form id="adminSettingsForm" class="space-y-4">
                        <div>
                            <label for="salonName" class="block text-sm font-medium text-[var(--text-secondary)]">${t.salonName}</label>
                            <input type="text" id="salonName" value="${settings.businessName}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="workHoursStart" class="block text-sm font-medium text-[var(--text-secondary)]">${t.workHoursStart}</label>
                                <input type="time" id="workHoursStart" value="${settings.workingHours.start}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                            </div>
                            <div>
                                <label for="workHoursEnd" class="block text-sm font-medium text-[var(--text-secondary)]">${t.workHoursEnd}</label>
                                <input type="time" id="workHoursEnd" value="${settings.workingHours.end}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="appointmentDuration" class="block text-sm font-medium text-[var(--text-secondary)]">${t.appointmentDuration}</label>
                                <input type="number" id="appointmentDuration" value="${settings.appointmentDuration}" min="10" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                            </div>
                            <div>
                                <label for="lateTolerance" class="block text-sm font-medium text-[var(--text-secondary)]">${t.lateTolerance}</label>
                                <input type="number" id="lateTolerance" value="${settings.lateToleranceInMinutes}" min="0" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                            </div>
                        </div>
                        <div>
                            <label for="commissionRate" class="block text-sm font-medium text-[var(--text-secondary)]">${t.commissionRate}</label>
                            <input type="number" id="commissionRate" value="${settings.commissionRate * 100}" min="0" max="100" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="lunchStart" class="block text-sm font-medium text-[var(--text-secondary)]">${t.lunchStart}</label>
                                <input type="time" id="lunchStart" value="${settings.lunchTime ? settings.lunchTime.start : '12:00'}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                            </div>
                            <div>
                                <label for="lunchEnd" class="block text-sm font-medium text-[var(--text-secondary)]">${t.lunchEnd}</label>
                                <input type="time" id="lunchEnd" value="${settings.lunchTime ? settings.lunchTime.end : '13:00'}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                            </div>
                        </div>
                        <div class="flex items-center mt-4">
                            <input type="checkbox" id="allowManicuristToMoveAppointments" ${settings.allowManicuristToMoveAppointments ? 'checked' : ''} class="mr-2">
                            <label for="allowManicuristToMoveAppointments" class="text-sm font-medium text-[var(--text-secondary)]">${t.allowManicuristToMoveAppointments}</label>
                        </div>
                        <button type="submit" class="bg-[var(--accent-primary)] text-white py-2 px-4 rounded-lg hover:bg-[var(--accent-secondary)] transition-colors duration-200">${t.saveChanges}</button>
                    </form>
                </div>
                ` : ''}

            </div>
        `;
        
        settingsView.innerHTML = settingsHtml;
        addSettingsEventListeners();
    }

    function addSettingsEventListeners() {
        // Language select
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                appState.settings.language = e.target.value;
                saveUserSettings(); // Salvar configuração
                
                // Atualizar interface imediatamente usando o sistema global de traduções
                window.updateInterfaceLanguage();
                refreshCurrentView();
                
                showNotification('Idioma alterado com sucesso!');
            });
        }

        // Notifications toggle
        const notificationsToggle = document.getElementById('enableNotifications');
        if (notificationsToggle) {
            // Verificar se o dispositivo/navegador suporta notificações
            const supportsNotifications = 'Notification' in window;
            
            if (!supportsNotifications) {
                notificationsToggle.disabled = true;
                return; // Não adicionar event listener se não há suporte
            }

            notificationsToggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    try {
                        // Solicitar permissão diretamente usando a API nativa
                        let permission;
                        
                        // Tentar usar NotificationManager primeiro, senão usar API nativa
                        if (window.NotificationManager && window.NotificationManager.requestPermission) {
                            permission = await window.NotificationManager.requestPermission();
                        } else {
                            // Usar API nativa do navegador
                            if (Notification.requestPermission) {
                                permission = await Notification.requestPermission();
                                permission = permission === 'granted';
                            } else {
                                // Fallback para navegadores mais antigos
                                permission = Notification.permission === 'granted';
                            }
                        }

                        if (!permission) {
                            e.target.checked = false;
                            showNotification('Permissão para notificações negada. Verifique as configurações do seu navegador.', 'error');
                        } else {
                            // Salvar preferência no localStorage
                            localStorage.setItem('notifications-enabled', 'true');
                            showNotification('Notificações habilitadas com sucesso!');
                            
                            // Teste de notificação
                            if (Notification.permission === 'granted') {
                                new Notification('Sistema de Agendamento', {
                                    body: 'Notificações ativadas com sucesso!',
                                    icon: '/assets/imgs/logo.png'
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao solicitar permissão de notificação:', error);
                        e.target.checked = false;
                        showNotification('Erro ao habilitar notificações. Tente novamente.', 'error');
                    }
                } else {
                    // Desabilitar notificações
                    localStorage.setItem('notifications-enabled', 'false');
                    if (window.NotificationManager && window.NotificationManager.disable) {
                        window.NotificationManager.disable();
                    }
                    showNotification('Notificações desabilitadas');
                }
            });

            // Verificar estado inicial das notificações
            const notificationsEnabled = localStorage.getItem('notifications-enabled') === 'true' && Notification.permission === 'granted';
            notificationsToggle.checked = notificationsEnabled;
        }
        
        // Profile form
        const profileForm = document.getElementById('profileSettingsForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const name = document.getElementById('profileName').value;
                    const email = document.getElementById('profileEmail').value;
                    const password = document.getElementById('profilePassword').value;

                    // Atualizar dados do usuário no Supabase
                    const updates = { name };
                    if (password) {
                        await window.supabase.auth.updateUser({ password });
                    }
                    
                    await window.supabase.auth.updateUser({
                        email,
                        data: updates
                    });

                    showNotification('Perfil atualizado com sucesso!');
                } catch (error) {
                    console.error('Erro ao atualizar perfil:', error);
                    showNotification('Erro ao atualizar perfil: ' + error.message);
                }
            });
        }

        // Admin form
        const adminForm = document.getElementById('adminSettingsForm');
        if (adminForm) {
            adminForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    appState.settings.businessName = document.getElementById('salonName').value;
                    appState.settings.workingHours.start = document.getElementById('workHoursStart').value;
                    appState.settings.workingHours.end = document.getElementById('workHoursEnd').value;
                    appState.settings.appointmentDuration = parseInt(document.getElementById('appointmentDuration').value, 10);
                    appState.settings.lateToleranceInMinutes = parseInt(document.getElementById('lateTolerance').value, 10);
                    appState.settings.commissionRate = parseFloat(document.getElementById('commissionRate').value) / 100;
                    appState.settings.lunchTime = {
                        start: document.getElementById('lunchStart').value,
                        end: document.getElementById('lunchEnd').value
                    };
                    appState.settings.allowManicuristToMoveAppointments = document.getElementById('allowManicuristToMoveAppointments').checked;

                    // Salvar no Supabase (você pode implementar uma tabela de settings)
                    showNotification('Configurações administrativas salvas com sucesso!');
                } catch (error) {
                    console.error('Erro ao salvar configurações:', error);
                    showNotification('Erro ao salvar configurações: ' + error.message);
                }
            });
        }
    }

    // Função global para seleção de tema
    window.selectTheme = function(themeKey) {
        if (window.ThemeManager) {
            window.ThemeManager.applyTheme(themeKey);
            appState.settings.theme = themeKey;
            saveUserSettings();
            
            // Atualizar interface visual
            refreshCurrentView();
            showNotification(`Tema ${window.ThemeManager.themes[themeKey]?.name} aplicado!`);
        }
    };

    function showClientModal(client = null) {
        const t = getTranslations();
        const isEdit = !!client;
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? t.editClient : t.addNewClient}</h3>
                    <form id="clientForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.clientName}</label>
                            <input type="text" name="name" value="${client?.name || ''}" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.clientPhone}</label>
                            <input type="tel" name="phone" value="${client?.phone || ''}"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.clientEmail}</label>
                            <input type="email" name="email" value="${client?.email || ''}"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                ${t.cancel}
                            </button>
                            <button type="submit" 
                                class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                ${t.save}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        document.getElementById('clientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const clientData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email')
            };

            try {
                if (isEdit) {
                    await db.updateClient(client.id, clientData);
                    const index = appState.clients.findIndex(c => c.id === client.id);
                    if (index !== -1) {
                        appState.clients[index] = { ...client, ...clientData };
                    }
                } else {
                    const newClient = await db.addClient(clientData);
                    appState.clients.push(newClient);
                }
                renderClients();
                hideModal();
                showNotification(t.clientSaved);
            } catch (error) {
                console.error('Erro ao salvar cliente:', error);
            }
        });
    }

    function showServiceModal(service = null) {
        const t = getTranslations();
        const isEdit = !!service;
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? t.editService : t.addNewService}</h3>
                    <form id="serviceForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.serviceName}</label>
                            <input type="text" name="name" value="${service?.name || ''}" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.duration}</label>
                            <input type="number" name="duration" value="${service?.duration || 30}" required min="1"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.price}</label>
                            <input type="number" step="0.01" name="price" value="${service?.price || ''}" required min="0"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                ${t.cancel}
                            </button>
                            <button type="submit" 
                                class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                ${t.save}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        document.getElementById('serviceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const serviceData = {
                name: formData.get('name'),
                duration: parseInt(formData.get('duration')),
                price: parseFloat(formData.get('price'))
            };

            try {
                if (isEdit) {
                    await db.updateService(service.id, serviceData);
                    const index = appState.services.findIndex(s => s.id === service.id);
                    if (index !== -1) {
                        appState.services[index] = { ...service, ...serviceData };
                    }
                } else {
                    const newService = await db.addService(serviceData);
                    appState.services.push(newService);
                }
                renderServices();
                hideModal();
                showNotification(t.serviceSaved);
            } catch (error) {
                console.error('Erro ao salvar serviço:', error);
            }
        });
    }

    function showStaffModal(staff = null) {
        const t = getTranslations();
        const isEdit = !!staff;
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? t.editStaff : t.addNewStaff}</h3>
                    <form id="staffForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.staffName}</label>
                            <input type="text" name="name" value="${staff?.name || ''}" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.role}</label>
                            <select name="role" class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="manicurist" ${staff?.role === 'manicurist' ? 'selected' : ''} class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.manicurist}</option>
                                <option value="receptionist" ${staff?.role === 'receptionist' ? 'selected' : ''} class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.receptionist}</option>
                                <option value="admin" ${staff?.role === 'admin' ? 'selected' : ''} class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.admin}</option>
                            </select>
                        </div>
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                ${t.cancel}
                            </button>
                            <button type="submit" 
                                class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                ${t.save}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        document.getElementById('staffForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const staffData = {
                name: formData.get('name'),
                role: formData.get('role')
            };

            try {
                if (isEdit) {
                    await db.updateStaff(staff.id, staffData);
                    const index = appState.staff.findIndex(s => s.id === staff.id);
                    if (index !== -1) {
                        appState.staff[index] = { ...staff, ...staffData };
                    }
                } else {
                    const newStaff = await db.addStaff(staffData);
                    appState.staff.push(newStaff);
                }
                renderStaff();
                hideModal();
                showNotification(t.staffSaved);
            } catch (error) {
                console.error('Erro ao salvar funcionário:', error);
            }
        });
    }

    function showAppointmentModal(appointment = null, dateStr = null, timeStr = null) {
        const t = getTranslations();
        const isEdit = !!appointment;
        
        if (!isEdit && dateStr) {
            if (isDateInPast(dateStr)) {
                showModal(`
                    <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                        <div class="p-6 text-center">
                            <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium mb-2 text-[var(--text-primary)]">Data Inválida</h3>
                            <p class="text-[var(--text-secondary)] mb-4">Não é possível agendar para datas que já passaram.</p>
                            <button onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                Entendi
                            </button>
                        </div>
                    </div>
                `);
                return;
            }
        }
        
        // Se não for edição, preparar valores padrão
        const defaultDate = dateStr || getLocalDateString(new Date());
        const defaultTime = timeStr || '';
        
        // Obter data mínima (hoje)
        const today = new Date();
        const minDate = today.toISOString().split('T')[0];
        
        // Gerar horários válidos baseados na configuração
        const validTimeSlots = generateTimeSlots(
            appState.settings.workingHours.start,
            appState.settings.workingHours.end,
            appState.settings.appointmentDuration || 40,
            appState.settings.lunchTime?.start || '12:00',
            appState.settings.lunchTime?.end || '13:00'
        );
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? 'Editar Agendamento' : t.newAppointment}</h3>
                    <form id="appointmentForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.selectClient}</label>
                            <select name="client_id" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.selectClient}</option>
                                ${appState.clients.map(client => 
                                    `<option value="${client.id}" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.client_id === client.id ? 'selected' : ''}>${client.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.selectService}</label>
                            <select name="service_id" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.selectService}</option>
                                ${appState.services.map(service => 
                                    `<option value="${service.id}" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.service_id === service.id ? 'selected' : ''}>${service.name} - R$ ${service.price ? service.price.toFixed(2) : '0.00'}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.selectStaff}</label>
                            <select name="staff_id" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.selectStaff}</option>
                                ${getVisibleManicurists().map(staff => 
                                    `<option value="${staff.id}" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.staff_id === staff.id ? 'selected' : ''}>${staff.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.date}</label>
                            <input type="date" name="date" value="${appointment?.date || defaultDate}" required
                                ${!isEdit ? `min="${minDate}"` : ''}
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.time}</label>
                            <select name="time" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Selecione um horário</option>
                                ${validTimeSlots.filter(slot => !slot.isLunchTime).map(slot => 
                                    `<option value="${slot.time}" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.time === slot.time || defaultTime === slot.time ? 'selected' : ''}>${formatTime(slot.time)}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.notes}</label>
                            <textarea name="notes" rows="3"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">${appointment?.notes || ''}</textarea>
                        </div>
                        ${isEdit ? `
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Status</label>
                            <select name="status" class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="scheduled" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.status === 'scheduled' ? 'selected' : ''}>Agendado</option>
                                <option value="completed" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.status === 'completed' ? 'selected' : ''}>Concluído</option>
                                <option value="cancelled" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                                <option value="no-show" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.status === 'no-show' ? 'selected' : ''}>Não compareceu</option>
                            </select>
                        </div>
                        ` : ''}
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                ${t.cancel}
                            </button>
                            <button type="submit" 
                                class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                ${t.save}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const appointmentData = {
                client_id: formData.get('client_id'),
                service_id: formData.get('service_id'),
                staff_id: formData.get('staff_id'),
                date: formData.get('date'),
                time: formData.get('time'),
                notes: formData.get('notes'),
                status: formData.get('status') || 'scheduled'
            };

            try {
                if (isEdit) {
                    const updatedAppointment = await db.updateAppointment(appointment.id, appointmentData);
                    const index = appState.appointments.findIndex(a => a.id === appointment.id);
                    if (index !== -1) {
                        appState.appointments[index] = updatedAppointment;
                    }
                } else {
                    const newAppointment = await db.addAppointment(appointmentData);
                    appState.appointments.push(newAppointment);
                }
                
                // Recarregar dados para garantir sincronização
                appState.appointments = await db.getAppointments();
                
                // Atualizar a visualização atual
                if (appState.currentView === 'calendarView') {
                    renderCalendar();
                }
                
                hideModal();
                showNotification(isEdit ? 'Agendamento atualizado!' : t.appointmentSaved);
            } catch (error) {
                console.error('Erro ao salvar agendamento:', error);
                showNotification('Erro ao salvar agendamento: ' + error.message);
            }
        });
    }

    function showModal(content) {
        dom.modalContainer.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                ${content}
            </div>
        `;
        dom.modalContainer.classList.remove('hidden');
    }

    function hideModal() {
        dom.modalContainer.innerHTML = '';
        dom.modalContainer.classList.add('hidden');
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function getTranslation(key) {
        const lang = appState.settings.language;
        return translations[lang][key] || key;
    }

    function updateCurrentDate() {
        if (!dom.currentDateDisplay) return;
        
        const d = appState.currentDate;
        const monthName = getTranslation('months') ? getTranslation('months')[d.getMonth()] : 'Mês';
        let text = `${monthName} ${d.getFullYear()}`;

        if (appState.calendarViewType === 'week') {
            const startOfWeek = new Date(d);
            startOfWeek.setDate(d.getDate() - d.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            text = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${monthName} ${d.getFullYear()}`;
        } else if (appState.calendarViewType === 'day') {
            text = d.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        dom.currentDateDisplay.textContent = text;
    }

    function handleClientSearch(e) {
        const query = e.target.value.toLowerCase();
        const filteredClients = appState.clients.filter(client => 
            client.name.toLowerCase().includes(query) ||
            (client.phone && client.phone.includes(query)) ||
            (client.email && client.email.toLowerCase().includes(query))
        );
        
        const t = getTranslations();
        if (!filteredClients.length && query) {
            dom.clientList.innerHTML = `<li class="p-4 text-center text-gray-500">${t.noClientsFound}</li>`;
            return;
        }
        
        const originalClients = appState.clients;
        appState.clients = query ? filteredClients : originalClients;
        renderClients();
        if (query) appState.clients = originalClients;
    }

    window.editClient = (id) => {
        const client = appState.clients.find(c => c.id === id);
        if (client) showClientModal(client);
    };

    window.deleteClient = async (id) => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await db.deleteClient(id);
                appState.clients = appState.clients.filter(c => c.id !== id);
                renderClients();
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
            }
        }
    };

    window.editService = (id) => {
        const service = appState.services.find(s => s.id === id);
        if (service) showServiceModal(service);
    };

    window.deleteService = async (id) => {
        if (confirm('Tem certeza que deseja excluir este serviço?')) {
            try {
                await db.deleteService(id);
                appState.services = appState.services.filter(s => s.id !== id);
                renderServices();
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
            }
        }
    };

    window.editStaff = (id) => {
        const staff = appState.staff.find(s => s.id === id);
        if (staff) showStaffModal(staff);
    };

    window.deleteStaff = async (id) => {
        if (confirm('Tem certeza que deseja excluir este funcionário?')) {
            try {
                await db.deleteStaff(id);
                appState.staff = appState.staff.filter(s => s.id !== id);
                renderStaff();
            } catch (error) {
                console.error('Erro ao excluir funcionário:', error);
            }
        }
    };

    window.showDayAppointments = (dateStr) => {
        appState.currentDate = new Date(dateStr);
        appState.calendarViewType = 'day';
        renderCalendar();
    };

    window.editAppointment = (appointmentId) => {
        const appointment = appState.appointments.find(app => app.id === appointmentId);
        if (appointment) {
            showAppointmentModal(appointment);
        }
    };

    window.showAppointmentModal = (appointment = null, dateStr = null, timeStr = null) => {
        showAppointmentModal(appointment, dateStr, timeStr);
    };

    function renderReports() {
        const reportsView = document.getElementById('reportsView');
        if (!reportsView) return;
        
        const t = getTranslations();
        const userRole = getUserRole();
        let content = '';

        if (userRole === 'admin') {
            content = renderAdvancedAdminReports();
        } else if (userRole === 'manicurist') {
            content = renderManicuristReports();
        } else {
            content = `<p class="text-center text-[var(--text-secondary)]">${t.noPermissionViewReports}</p>`;
        }

        reportsView.innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-[var(--text-primary)]">${t.reportsTitle}</h2>
                ${content}
            </div>
        `;
    }

    function renderAdvancedAdminReports() {
        const t = getTranslations();
        const completedAppointments = appState.appointments.filter(a => a.status === 'completed');
        
        // Calcular métricas
        const totalRevenue = completedAppointments.reduce((sum, app) => {
            const service = appState.services.find(s => s.id === app.service_id);
            return sum + (service ? service.price : 0);
        }, 0);

        const averageTicket = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

        // Receita por período
        const today = new Date();
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const dailyRevenue = completedAppointments
            .filter(a => new Date(a.date).toDateString() === today.toDateString())
            .reduce((sum, app) => {
                const service = appState.services.find(s => s.id === app.service_id);
                return sum + (service ? service.price : 0);
            }, 0);

        const weeklyRevenue = completedAppointments
            .filter(a => new Date(a.date) >= thisWeek)
            .reduce((sum, app) => {
                const service = appState.services.find(s => s.id === app.service_id);
                return sum + (service ? service.price : 0);
            }, 0);

        const monthlyRevenue = completedAppointments
            .filter(a => new Date(a.date) >= thisMonth)
            .reduce((sum, app) => {
                const service = appState.services.find(s => s.id === app.service_id);
                return sum + (service ? service.price : 0);
            }, 0);

        // Serviços mais procurados
        const serviceStats = {};
        completedAppointments.forEach(app => {
            const service = appState.services.find(s => s.id === app.service_id);
            if (service) {
                if (!serviceStats[service.name]) {
                    serviceStats[service.name] = { count: 0, revenue: 0 };
                }
                serviceStats[service.name].count++;
                serviceStats[service.name].revenue += service.price;
            }
        });

        const topServices = Object.entries(serviceStats)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);

        // Performance por funcionário
        const performanceByStaff = appState.staff
            .map(staffMember => {
                const staffAppointments = completedAppointments.filter(a => a.staff_id === staffMember.id);
                const staffRevenue = staffAppointments.reduce((sum, app) => {
                    const service = appState.services.find(s => s.id === app.service_id);
                    return sum + (service ? service.price : 0);
                }, 0);
                const commission = staffRevenue * appState.settings.commissionRate;
                return {
                    name: staffMember.name,
                    revenue: staffRevenue,
                    commission: commission,
                    appointments: staffAppointments.length,
                    role: staffMember.role
                };
            })
            .filter(staff => staff.appointments > 0)
            .sort((a, b) => b.revenue - a.revenue);

        return `
            <!-- Métricas Principais -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            💰
                        </div>
                        <div>
                            <p class="text-xs text-[var(--text-secondary)]">${t.totalRevenue}</p>
                            <p class="text-lg font-bold text-green-600">R$ ${totalRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            📅
                        </div>
                        <div>
                            <p class="text-xs text-[var(--text-secondary)]">${t.totalAppointments}</p>
                            <p class="text-lg font-bold text-blue-600">${completedAppointments.length}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            🎯
                        </div>
                        <div>
                            <p class="text-xs text-[var(--text-secondary)]">${t.averageTicket}</p>
                            <p class="text-lg font-bold text-purple-600">R$ ${averageTicket.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                            👥
                        </div>
                        <div>
                            <p class="text-xs text-[var(--text-secondary)]">Funcionários Ativos</p>
                            <p class="text-lg font-bold text-orange-600">${performanceByStaff.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Receita por Período -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                    <h3 class="font-semibold text-[var(--text-primary)] mb-2">${t.dailyRevenue}</h3>
                    <p class="text-2xl font-bold text-[var(--accent-primary)]">R$ ${dailyRevenue.toFixed(2)}</p>
                    <p class="text-xs text-[var(--text-secondary)]">Hoje</p>
                </div>
                
                <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                    <h3 class="font-semibold text-[var(--text-primary)] mb-2">${t.weeklyRevenue}</h3>
                    <p class="text-2xl font-bold text-[var(--accent-primary)]">R$ ${weeklyRevenue.toFixed(2)}</p>
                    <p class="text-xs text-[var(--text-secondary)]">Últimos 7 dias</p>
                </div>
                
                <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                    <h3 class="font-semibold text-[var(--text-primary)] mb-2">${t.monthlyRevenue}</h3>
                    <p class="text-2xl font-bold text-[var(--accent-primary)]">R$ ${monthlyRevenue.toFixed(2)}</p>
                    <p class="text-xs text-[var(--text-secondary)]">Este mês</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Performance por Funcionário -->
                <div class="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)]">
                    <h3 class="font-bold text-lg mb-4 text-[var(--text-primary)]">${t.performanceByEmployee}</h3>
                    ${performanceByStaff.length > 0 ? `
                        <div class="space-y-3">
                            ${performanceByStaff.map((staff, index) => `
                                <div class="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            ${index + 1}
                                        </div>
                                        <div>
                                            <p class="font-medium text-[var(--text-primary)]">${staff.name}</p>
                                            <p class="text-xs text-[var(--text-secondary)]">${t[staff.role] || staff.role}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-semibold text-green-600">R$ ${staff.revenue.toFixed(2)}</p>
                                        <p class="text-xs text-[var(--text-secondary)]">${staff.appointments} atendimentos</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p class="text-[var(--text-secondary)]">${t.noEmployeeAppointments}</p>`}
                </div>

                <!-- Serviços Mais Procurados -->
                <div class="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)]">
                    <h3 class="font-bold text-lg mb-4 text-[var(--text-primary)]">${t.topServices}</h3>
                    ${topServices.length > 0 ? `
                        <div class="space-y-3">
                            ${topServices.map(([serviceName, stats], index) => `
                                <div class="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 bg-[var(--accent-secondary)] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            ${index + 1}
                                        </div>
                                        <div>
                                            <p class="font-medium text-[var(--text-primary)]">${serviceName}</p>
                                            <p class="text-xs text-[var(--text-secondary)]">${stats.count} vezes</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-semibold text-[var(--accent-primary)]">R$ ${stats.revenue.toFixed(2)}</p>
                                        <p class="text-xs text-[var(--text-secondary)]">Total</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p class="text-[var(--text-secondary)]">Nenhum serviço encontrado.</p>`}
                </div>
            </div>
        `;
    }

    function renderManicuristReports() {
        const t = getTranslations();
        const { currentUser, staff } = appState;
        
        const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        
        if (!currentStaff) {
            return `
                <div class="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)]">
                    <p class="text-center text-[var(--text-secondary)]">
                        ${t.noStaffDataFound || 'Dados do funcionário não encontrados'}
                    </p>
                </div>
            `;
        }
        
        const completedAppointments = appState.appointments.filter(a => 
            a.status === 'completed' && a.staff_id === currentStaff.id
        );
        
        const totalRevenue = completedAppointments.reduce((sum, app) => {
            const service = appState.services.find(s => s.id === app.service_id);
            return sum + (service ? service.price : 0);
        }, 0);
        
        const commission = totalRevenue * appState.settings.commissionRate;
        
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const monthlyAppointments = completedAppointments.filter(a => new Date(a.date) >= thisMonth);
        const monthlyRevenue = monthlyAppointments.reduce((sum, app) => {
            const service = appState.services.find(s => s.id === app.service_id);
            return sum + (service ? service.price : 0);
        }, 0);
        const monthlyCommission = monthlyRevenue * appState.settings.commissionRate;

        return `
            <div class="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)]">
                <h3 class="font-bold text-xl mb-6 text-[var(--text-primary)]">
                    ${t.myPerformance || 'Meu Desempenho'} - ${currentStaff.name}
                </h3>
                
                <!-- Métricas do Mês Atual -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                💰
                            </div>
                            <div>
                                <p class="text-xs text-[var(--text-secondary)]">Receita do Mês</p>
                                <p class="text-lg font-bold text-green-600">R$ ${monthlyRevenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                💵
                            </div>
                            <div>
                                <p class="text-xs text-[var(--text-secondary)]">Comissão do Mês</p>
                                <p class="text-lg font-bold text-blue-600">R$ ${monthlyCommission.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                📅
                            </div>
                            <div>
                                <p class="text-xs text-[var(--text-secondary)]">Atendimentos do Mês</p>
                                <p class="text-lg font-bold text-purple-600">${monthlyAppointments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Totais Gerais -->
                <div class="space-y-4">
                    <h4 class="font-semibold text-lg text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                        ${t.totalPerformance || 'Desempenho Total'}
                    </h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex justify-between items-center p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <span class="text-[var(--text-secondary)]">${t.totalRevenueGenerated || 'Receita Total Gerada'}</span>
                            <span class="font-bold text-lg text-[var(--accent-primary)]">R$ ${totalRevenue.toFixed(2)}</span>
                        </div>
                        
                        <div class="flex justify-between items-center p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <span class="text-[var(--text-secondary)]">${t.myCommission || 'Minha Comissão'}</span>
                            <span class="font-bold text-lg text-green-600">R$ ${commission.toFixed(2)}</span>
                        </div>
                        
                        <div class="flex justify-between items-center p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <span class="text-[var(--text-secondary)]">${t.totalServices || 'Total de Atendimentos'}</span>
                            <span class="font-bold text-lg text-[var(--accent-primary)]">${completedAppointments.length}</span>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 p-3 bg-[var(--accent-light)] rounded-lg">
                    <p class="text-sm text-[var(--text-secondary)]">
                        <strong>📊 Resumo:</strong> 
                        Taxa de comissão: ${(appState.settings.commissionRate * 100).toFixed(0)}% | 
                        Média por atendimento: R$ ${completedAppointments.length > 0 ? (totalRevenue / completedAppointments.length).toFixed(2) : '0.00'}
                    </p>
                </div>
            </div>
        `;
    }

    window.hideModal = hideModal;

    function showManicuristLoginsModal() {
        const t = getTranslations();
        const manicures = appState.staff.filter(s => s.role === 'manicurist');
        const modalHtml = `
            <div id="manicurist-logins-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-[var(--bg-primary)] rounded-lg shadow-xl p-6 w-full max-w-md border border-[var(--border-color)]">
                    <h3 class="text-xl font-bold mb-4 text-[var(--text-primary)]">${t.manicuristLogins}</h3>
                    <div class="overflow-x-auto mb-4">
                        <table class="w-full text-left text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="py-2 text-[var(--text-primary)]">${t.name}</th>
                                    <th class="py-2 text-[var(--text-primary)]">${t.email}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${manicures.length === 0 ? 
                                    `<tr><td colspan="2" class="py-2 text-[var(--text-secondary)]">${t.noManicuristRegistered}</td></tr>` :
                                    manicures.map(m => `
                                        <tr class="border-b border-[var(--border-color)]">
                                            <td class="py-2 text-[var(--text-primary)]">${m.name}</td>
                                            <td class="py-2 text-[var(--text-secondary)]">${m.email}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                    <button id="close-manicurist-logins-btn" class="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)] transition-colors duration-200">${t.close}</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('close-manicurist-logins-btn').addEventListener('click', () => {
            document.getElementById('manicurist-logins-modal').remove();
        });
        
        document.getElementById('manicurist-logins-modal').addEventListener('click', (e) => {
            if (e.target.id === 'manicurist-logins-modal') {
                document.getElementById('manicurist-logins-modal').remove();
            }
        });
    }

    // Expor função globalmente
    window.showManicuristLoginsModal = showManicuristLoginsModal;
    // Função para configurar permissões da interface
    function setupUIPermissions() {
        const canEditClientsFlag = canEditClients();
        const canEditServicesFlag = canEditServices();
        const canEditStaffFlag = canEditStaff();
        
        // Controlar visibilidade dos botões "Adicionar Novo"
        const newClientBtn = document.getElementById('newClientBtn');
        const newServiceBtn = document.getElementById('newServiceBtn');
        const newStaffBtn = document.getElementById('newStaffBtn');
        
        if (newClientBtn) {
            newClientBtn.style.display = canEditClientsFlag ? 'flex' : 'none';
        }
        
        if (newServiceBtn) {
            newServiceBtn.style.display = canEditServicesFlag ? 'flex' : 'none';
        }
        
        if (newStaffBtn) {
            newStaffBtn.style.display = canEditStaffFlag ? 'flex' : 'none';
        }

        // Controlar visibilidade dos relatórios
        // Admin: vê todos os relatórios gerais
        // Manicure: vê apenas seus próprios relatórios
        // Recepcionista: não vê relatórios
        const reportsLink = document.querySelector('[data-view="reportsView"]');
        if (reportsLink) {
            const canViewReports = isAdmin() || isManicurist();
            reportsLink.parentElement.style.display = canViewReports ? 'block' : 'none';
        }
    }

    function initializeEnhancements() {
        setupUIPermissions();

        if (window.NotificationManager) {
            // Programar lembretes diários
            if (window.NotificationIntegration) {
                window.NotificationIntegration.scheduleDailyReminders();
            }
        }

        // Inicializar sincronização automática
        if (window.CacheManager) {
            // Sincronizar dados na inicialização
            window.CacheManager.syncWithSupabase();
            
            // Configurar sincronização periódica baseada na conexão
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && navigator.onLine) {
                    window.CacheManager.syncWithSupabase();
                }
            });
        }

        // Aplicar tema salvo
        if (window.ThemeManager) {
            const savedTheme = window.ThemeManager.getCurrentTheme();
            if (savedTheme && savedTheme !== 'light-mode') {
                window.ThemeManager.applyTheme(savedTheme);
            }
        }

        if (window.PerformanceMonitor) {
            // Registrar tempo de carregamento da app
            window.PerformanceMonitor.recordAction('app_initialization', Date.now() - window.performance.timing.navigationStart);
        }
    }

    const originalSaveAppointment = window.saveAppointment;
    window.saveAppointment = function(appointmentData, isEdit = false) {
        const result = originalSaveAppointment?.call(this, appointmentData, isEdit);
        
        if (window.NotificationIntegration && !isEdit) {
            window.NotificationIntegration.onAppointmentCreated(appointmentData);
        }
        
        return result;
    };

    const originalCancelAppointment = window.cancelAppointment;
    window.cancelAppointment = function(appointmentId, reason) {
        const appointment = appState.appointments.find(a => a.id === appointmentId);
        
        const result = originalCancelAppointment?.call(this, appointmentId, reason);
        
        if (window.NotificationIntegration && appointment) {
            window.NotificationIntegration.onAppointmentCancelled(appointment, reason);
        }
        
        return result;
    };
    
    window.toggleNotificationPanel = function() {
        const panel = document.getElementById('notificationPanel');
        const badge = document.getElementById('notificationBadge');
        
        if (panel) {
            panel.classList.toggle('hidden');
            
            if (!panel.classList.contains('hidden') && badge) {
                badge.classList.add('hidden');
                document.getElementById('notificationCount').textContent = '0';
            }
        }
    };

    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notificationPanel');
        const bell = document.getElementById('notificationBell');
        
        if (panel && !panel.classList.contains('hidden') && 
            !panel.contains(e.target) && !bell?.contains(e.target)) {
            panel.classList.add('hidden');
        }
    });

    // Initialize the app
    init();
});
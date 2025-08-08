class NotificationManager {
    constructor() {
        this.permission = null;
        this.serviceWorkerRegistration = null;
        this.init();
    }

    async init() {
        // Verificar suporte a notificações
        if (!('Notification' in window)) {
            console.warn('Este navegador não suporta notificações');
            return;
        }

        // Solicitar permissão
        await this.requestPermission();
        
        // Registrar Service Worker
        await this.registerServiceWorker();
    }

    async requestPermission() {
        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const result = await Notification.requestPermission();
            this.permission = result;
            return result === 'granted';
        }

        return false;
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado com sucesso');
            } catch (error) {
                console.error('Erro ao registrar Service Worker:', error);
            }
        }
    }

    // Notificação para novo agendamento
    notifyNewAppointment(appointment, staff) {
        if (this.permission !== 'granted') return;

        const client = appointment.clients || { name: 'Cliente' };
        const service = appointment.services || { name: 'Serviço' };
        
        const title = '📅 Novo Agendamento!';
        const body = `${client.name} agendou ${service.name} para ${this.formatDateTime(appointment.date, appointment.time)}`;
        
        this.showNotification(title, body, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `appointment-${appointment.id}`,
            data: {
                type: 'new_appointment',
                appointmentId: appointment.id,
                staffId: staff.id
            },
            actions: [
                {
                    action: 'view',
                    title: 'Ver Detalhes',
                    icon: '/assets/icon/favicon.ico'
                },
                {
                    action: 'confirm',
                    title: 'Confirmar',
                    icon: '/assets/icon/favicon.ico'
                }
            ]
        });
    }

    // Notificação para cancelamento
    notifyAppointmentCancelled(appointment, staff, reason = '') {
        if (this.permission !== 'granted') return;

        const client = appointment.clients || { name: 'Cliente' };
        const service = appointment.services || { name: 'Serviço' };
        
        const title = '❌ Agendamento Cancelado';
        const body = `${client.name} cancelou ${service.name} (${this.formatDateTime(appointment.date, appointment.time)})${reason ? ` - ${reason}` : ''}`;
        
        this.showNotification(title, body, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `cancelled-${appointment.id}`,
            data: {
                type: 'appointment_cancelled',
                appointmentId: appointment.id,
                staffId: staff.id
            },
            requireInteraction: true
        });
    }

    // Notificação para alteração de agendamento
    notifyAppointmentChanged(appointment, staff, changes) {
        if (this.permission !== 'granted') return;

        const client = appointment.clients || { name: 'Cliente' };
        
        const title = '🔄 Agendamento Alterado';
        let body = `${client.name} alterou o agendamento:\n`;
        
        if (changes.date) body += `Nova data: ${this.formatDate(changes.date)}\n`;
        if (changes.time) body += `Novo horário: ${changes.time}\n`;
        if (changes.service) body += `Novo serviço: ${changes.service.name}\n`;
        
        this.showNotification(title, body, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `changed-${appointment.id}`,
            data: {
                type: 'appointment_changed',
                appointmentId: appointment.id,
                staffId: staff.id
            }
        });
    }

    // Lembrete para agendamento próximo (15 min antes)
    notifyUpcomingAppointment(appointment, staff) {
        if (this.permission !== 'granted') return;

        const client = appointment.clients || { name: 'Cliente' };
        const service = appointment.services || { name: 'Serviço' };
        
        const title = '⏰ Próximo Agendamento';
        const body = `${client.name} - ${service.name} em 15 minutos`;
        
        this.showNotification(title, body, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `reminder-${appointment.id}`,
            data: {
                type: 'appointment_reminder',
                appointmentId: appointment.id,
                staffId: staff.id
            },
            requireInteraction: true
        });
    }

    // Notificação personalizada para admin
    notifyAdmin(title, message, type = 'info') {
        if (this.permission !== 'granted') return;

        const icons = {
            info: '🔵',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        this.showNotification(`${icons[type]} ${title}`, message, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `admin-${Date.now()}`,
            data: {
                type: 'admin_notification',
                level: type
            }
        });
    }

    // Função base para mostrar notificação
    showNotification(title, body, options = {}) {
        if (this.permission !== 'granted') {
            console.warn('Permissão para notificações não concedida');
            return;
        }

        const defaultOptions = {
            body,
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            vibrate: [200, 100, 200],
            timestamp: Date.now(),
            requireInteraction: false
        };

        const finalOptions = { ...defaultOptions, ...options };

        if (this.serviceWorkerRegistration) {
            // Usar Service Worker para notificações persistentes
            this.serviceWorkerRegistration.showNotification(title, finalOptions);
        } else {
            // Fallback para notificação básica
            new Notification(title, finalOptions);
        }
    }

    // Programar lembrete automático
    scheduleReminder(appointment, staff, minutesBefore = 15) {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
        const reminderTime = new Date(appointmentDateTime.getTime() - (minutesBefore * 60 * 1000));
        const now = new Date();

        if (reminderTime > now) {
            const timeUntilReminder = reminderTime.getTime() - now.getTime();
            
            setTimeout(() => {
                this.notifyUpcomingAppointment(appointment, staff);
            }, timeUntilReminder);

            console.log(`Lembrete programado para ${reminderTime.toLocaleString()}`);
        }
    }

    // Utilitários
    formatDateTime(date, time) {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('pt-BR');
        const formattedTime = time.substring(0, 5);
        return `${formattedDate} às ${formattedTime}`;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR');
    }

    // Verificar se as notificações estão habilitadas
    isEnabled() {
        return this.permission === 'granted';
    }

    // Status das notificações
    getStatus() {
        return {
            supported: 'Notification' in window,
            permission: this.permission,
            serviceWorkerRegistered: !!this.serviceWorkerRegistration
        };
    }
}

// Instância global
window.NotificationManager = new NotificationManager();

// Integração com o sistema de agendamentos
window.NotificationIntegration = {
    // Notificar quando um novo agendamento é criado
    onAppointmentCreated(appointment) {
        const staff = window.appState?.staff?.find(s => s.id === appointment.staff_id);
        if (staff && staff.id !== window.appState?.currentUser?.id) {
            window.NotificationManager.notifyNewAppointment(appointment, staff);
        }
    },

    // Notificar quando um agendamento é cancelado
    onAppointmentCancelled(appointment, reason) {
        const staff = window.appState?.staff?.find(s => s.id === appointment.staff_id);
        if (staff) {
            window.NotificationManager.notifyAppointmentCancelled(appointment, staff, reason);
        }
    },

    // Notificar quando um agendamento é alterado
    onAppointmentUpdated(appointment, changes) {
        const staff = window.appState?.staff?.find(s => s.id === appointment.staff_id);
        if (staff && staff.id !== window.appState?.currentUser?.id) {
            window.NotificationManager.notifyAppointmentChanged(appointment, staff, changes);
        }
    },

    // Programar lembretes para todos os agendamentos do dia
    scheduleDailyReminders() {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = window.appState?.appointments?.filter(app => 
            app.date === today && app.status === 'scheduled'
        ) || [];

        todayAppointments.forEach(appointment => {
            const staff = window.appState?.staff?.find(s => s.id === appointment.staff_id);
            if (staff) {
                window.NotificationManager.scheduleReminder(appointment, staff);
            }
        });

        console.log(`${todayAppointments.length} lembretes programados para hoje`);
    }
};

// Disponibilizar globalmente
window.NotificationManager = NotificationManager;

// Traduções em Português - Brasil
window.translations = window.translations || {};

window.translations['pt-BR'] = {
    // Navegação
    calendar: 'Calendário',
    clients: 'Clientes',
    services: 'Serviços',
    staff: 'Funcionários',
    reports: 'Relatórios',
    settings: 'Configurações',
    
    // Agendamentos
    newAppointment: 'Novo Agendamento',
    appointmentSaved: 'Agendamento salvo com sucesso!',
    appointment: 'Agendamento',
    editAppointment: 'Editar Agendamento',
    date: 'Data',
    time: 'Horário',
    notes: 'Observações (opcional)',
    status: 'Status',
    
    // Status de agendamento
    scheduled: 'Agendado',
    completed: 'Concluído',
    noShow: 'Não Compareceu',
    cancelled: 'Cancelado',
    
    // Navegação do calendário
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    
    // Clientes
    newClient: 'Novo Cliente',
    addNewClient: 'Adicionar Novo Cliente',
    editClient: 'Editar Cliente',
    clientName: 'Nome',
    clientPhone: 'Telefone',
    clientEmail: 'Email',
    manageClients: 'Gerencie seus clientes',
    searchClientPlaceholder: 'Buscar cliente...',
    noClientsFound: 'Nenhum cliente encontrado.',
    clientSaved: 'Cliente salvo com sucesso!',
    selectClient: 'Selecione um Cliente',
    
    // Serviços
    addNewService: 'Adicionar Novo Serviço',
    editService: 'Editar Serviço',
    newService: 'Novo Serviço',
    serviceName: 'Nome do Serviço',
    duration: 'Duração (minutos)',
    price: 'Preço (R$)',
    manageServices: 'Gerencie seus serviços',
    noServicesFound: 'Nenhum serviço encontrado.',
    serviceSaved: 'Serviço salvo com sucesso!',
    selectService: 'Selecione um serviço',
    
    // Funcionários
    addNewStaff: 'Adicionar Novo Funcionário',
    editStaff: 'Editar Funcionário',
    newStaff: 'Novo Funcionário',
    staffName: 'Nome do Funcionário',
    role: 'Cargo',
    manageStaff: 'Gerencie seus funcionários',
    noStaffFound: 'Nenhum funcionário encontrado.',
    staffSaved: 'Funcionário salvo com sucesso!',
    selectStaff: 'Selecione um funcionário',
    admin: 'Administrador',
    manicurist: 'Manicure',
    receptionist: 'Recepcionista',
    
    // Botões e ações gerais
    cancel: 'Cancelar',
    save: 'Salvar',
    edit: 'Editar',
    delete: 'Excluir',
    saveChanges: 'Salvar Alterações',
    viewOnly: 'Somente visualização',
    
    // Filtros e permissões
    filterByManicurist: 'Filtrar por Manicure',
    allManicurists: 'Todas as Manicures',
    restrictedAccess: 'Acesso Restrito',
    manicureNoPermission: 'Manicures não têm permissão para',
    contactAdmin: 'Entre em contato com o administrador',
    
    // Solicitações de fechamento
    requestScheduleBlock: 'Solicitar Fechamento de Agenda',
    scheduleRequestReason: 'Ex: Consulta médica, compromisso pessoal...',
    sendRequest: 'Enviar Solicitação',
    myScheduleRequests: 'Minhas Solicitações de Fechamento',
    pendingScheduleRequests: 'Solicitações Pendentes',
    processedScheduleRequests: 'Solicitações Processadas',
    noScheduleRequests: 'Nenhuma solicitação encontrada',
    noPendingRequests: 'Nenhuma solicitação pendente',
    noProcessedRequests: 'Nenhuma solicitação processada',
    
    // Configurações
    profileSettings: 'Configurações de Perfil',
    name: 'Nome',
    email: 'E-mail',
    password: 'Senha',
    newPassword: 'Nova Senha',
    appearance: 'Aparência',
    theme: 'Tema',
    language: 'Idioma',
    light: 'Claro',
    dark: 'Escuro',
    
    // Configurações administrativas
    adminSettings: 'Configurações Administrativas',
    salonName: 'Nome do Salão',
    workHoursStart: 'Horário de Início',
    workHoursEnd: 'Horário de Término',
    appointmentDuration: 'Duração dos Agendamentos (min)',
    lateTolerance: 'Tolerância de Atraso (min)',
    commissionRate: 'Taxa de Comissão (%)',
    lunchStart: 'Início do Almoço',
    lunchEnd: 'Fim do Almoço',
    allowManicuristToMoveAppointments: 'Permitir manicures mover agendamentos',
    
    // Autenticação
    login: 'Login',
    logout: 'Sair',
    loginError: 'E-mail ou senha inválidos.',
    createAccount: 'Criar Conta',
    appName: 'Sistema de Agendamento',
    appSubtitle: 'Gerenciamento',
    
    // Relatórios
    totalRevenue: 'Receita Total',
    totalAppointments: 'Total de Agendamentos',
    manicuristPerformance: 'Desempenho das Manicures',
    totalGenerated: 'Total Gerado',
    commission: 'Comissão',
    myPerformance: 'Meu Desempenho',
    noReportData: 'Não há dados suficientes para gerar um relatório.',
    
    // Dias da semana
    shortWeekdays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    weekdays: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    
    // Meses
    months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    
    // Mensagens de erro e validação
    appointmentConflict: 'Já existe um agendamento para este horário com este funcionário.',
    appointmentInLunchBreak: 'Não é possível agendar no horário de almoço.',
    cannotBookInPast: 'Não é possível agendar em datas ou horários passados.',
    noAppointments: 'Nenhum agendamento para este dia.',
    
    // Outras mensagens
    dailySummary: 'Resumo do Dia',
    lunchBreak: 'Horário de Almoço',
    
    // Status específicos (para usar em textos)
    statusScheduled: 'Agendado',
    statusCompleted: 'Concluído',
    statusNoShow: 'Não Compareceu',
    statusCancelled: 'Cancelado',
    
    // Configurações específicas
    profileSettingsTitle: 'Configurações do Perfil',
    appearanceTitle: 'Aparência',
    // Settings - Admin
    adminSettingsTitle: 'Configurações Administrativas',
    salonName: 'Nome do Salão',
    workHoursStart: 'Horário de Início',
    workHoursEnd: 'Horário de Término',
    appointmentDuration: 'Duração dos Agendamentos (min)',
    lateTolerance: 'Tolerância de Atraso (min)',
    commissionRate: 'Taxa de Comissão (%)',
    lunchStart: 'Início do Almoço',
    lunchEnd: 'Fim do Almoço',
    allowManicuristToMoveAppointments: 'Permitir manicures mover agendamentos',
    saveChanges: 'Salvar Configurações',
    changePasswordPlaceholder: 'Deixe em branco para não alterar',
    
    // Relatórios específicos
    revenueLabel: 'Receita',
    appointmentsLabel: 'Agendamentos',
    performanceByStaff: 'Desempenho por Funcionário',
    noDataAvailable: 'Nenhum dado disponível',
    generatedAmount: 'Valor Gerado',
    commissionAmount: 'Comissão',
    appointmentCount: 'Total de Agendamentos',
    
    // Meses em português para relatórios
    monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    
    // Textos específicos do calendário
    moreAppointments: 'mais',
    clickToViewDay: 'Clique para ver o dia',
    noAppointmentsDay: 'Nenhum agendamento para este dia',
    
    // Textos de permissões
    restrictedAccess: 'Acesso Restrito',
    manicureNoPermission: 'Manicures não têm permissão para',
    contactAdmin: 'Entre em contato com o administrador',
    manageClients: 'gerenciar clientes',
    manageServices: 'gerenciar serviços',
    manageStaff: 'gerenciar funcionários',
    
    // Relatórios - textos adicionais
    reportsTitle: 'Relatórios',
    totalRevenue: 'Receita Total',
    totalAppointments: 'Total de Agendamentos',
    performanceByEmployee: 'Performance por Funcionário',
    myPerformance: 'Minha Performance',
    totalRevenueGenerated: 'Receita Total Gerada',
    myCommission: 'Minha Comissão',
    totalServices: 'Total de Atendimentos',
    noEmployeeAppointments: 'Nenhum funcionário com agendamentos concluídos encontrado.',
    noPermissionViewReports: 'Sem permissão para visualizar relatórios.',
    revenue: 'Receita',
    appointments: 'Atendimentos',
    
    // Modal de logins
    manicuristLogins: 'Logins das Manicures',
    noManicuristRegistered: 'Nenhuma manicure cadastrada.',
    close: 'Fechar',
    
    // Novas funcionalidades
    enableNotifications: 'Habilitar Notificações',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeBeautyPink: 'Rosa Noturno',
    themeElegantPurple: 'Roxo Sombrio',
    themeProfessionalBlue: 'Azul Meia-Noite',
    themeNatureGreen: 'Verde Floresta',
    
    // Papéis e permissões
    receptionist: 'Recepcionista',
    manicurist: 'Manicure',
    admin: 'Administrador',
    changeRole: 'Alterar Papel',
    roleChanged: 'Papel alterado com sucesso!',
    
    // Notificações
    notificationTitle: 'Sistema de Notificações',
    notificationPermissionDenied: 'Permissão para notificações negada',
    notificationPermissionGranted: 'Notificações habilitadas com sucesso!',
    newNotification: 'Nova Notificação',
    
    // Relatórios aprimorados
    dailyRevenue: 'Receita Diária',
    weeklyRevenue: 'Receita Semanal',
    monthlyRevenue: 'Receita Mensal',
    averageTicket: 'Ticket Médio',
    topServices: 'Serviços Mais Procurados',
    revenueChart: 'Gráfico de Receita',
    performanceChart: 'Gráfico de Performance'
};

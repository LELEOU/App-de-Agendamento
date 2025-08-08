// English Translations
window.translations = window.translations || {};

window.translations['en-US'] = {
    // Navigation
    calendar: 'Calendar',
    clients: 'Clients',
    services: 'Services',
    staff: 'Staff',
    reports: 'Reports',
    settings: 'Settings',
    
    // Appointments
    newAppointment: 'New Appointment',
    appointmentSaved: 'Appointment saved successfully!',
    appointment: 'Appointment',
    editAppointment: 'Edit Appointment',
    date: 'Date',
    time: 'Time',
    notes: 'Notes (optional)',
    status: 'Status',
    
    // Appointment status
    scheduled: 'Scheduled',
    completed: 'Completed',
    noShow: 'No-Show',
    cancelled: 'Cancelled',
    
    // Calendar navigation
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    
    // Clients
    newClient: 'New Client',
    addNewClient: 'Add New Client',
    editClient: 'Edit Client',
    clientName: 'Name',
    clientPhone: 'Phone',
    clientEmail: 'Email',
    manageClients: 'Manage your clients',
    searchClientPlaceholder: 'Search client...',
    noClientsFound: 'No clients found.',
    clientSaved: 'Client saved successfully!',
    selectClient: 'Select a Client',
    
    // Services
    addNewService: 'Add New Service',
    editService: 'Edit Service',
    newService: 'New Service',
    serviceName: 'Service Name',
    duration: 'Duration (minutes)',
    price: 'Price ($)',
    manageServices: 'Manage your services',
    noServicesFound: 'No services found.',
    serviceSaved: 'Service saved successfully!',
    selectService: 'Select a service',
    
    // Staff
    addNewStaff: 'Add New Staff Member',
    editStaff: 'Edit Staff Member',
    newStaff: 'New Staff Member',
    staffName: 'Staff Member Name',
    role: 'Role',
    manageStaff: 'Manage your staff',
    noStaffFound: 'No staff found.',
    staffSaved: 'Staff member saved successfully!',
    selectStaff: 'Select a staff member',
    admin: 'Administrator',
    manicurist: 'Manicurist',
    receptionist: 'Receptionist',
    
    // General buttons and actions
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    saveChanges: 'Save Changes',
    viewOnly: 'View Only',
    
    // Filters and permissions
    filterByManicurist: 'Filter by Manicurist',
    allManicurists: 'All Manicurists',
    restrictedAccess: 'Restricted Access',
    manicureNoPermission: 'Manicurists do not have permission to',
    contactAdmin: 'Contact the administrator',
    
    // Schedule requests
    requestScheduleBlock: 'Request Schedule Block',
    scheduleRequestReason: 'E.g: Medical appointment, personal commitment...',
    sendRequest: 'Send Request',
    myScheduleRequests: 'My Schedule Requests',
    pendingScheduleRequests: 'Pending Requests',
    processedScheduleRequests: 'Processed Requests',
    noScheduleRequests: 'No requests found',
    noPendingRequests: 'No pending requests',
    noProcessedRequests: 'No processed requests',
    
    // Settings
    profileSettings: 'Profile Settings',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    newPassword: 'New Password',
    appearance: 'Appearance',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    
    // Admin settings
    adminSettings: 'Administrative Settings',
    adminSettingsTitle: 'Administrative Settings',
    salonName: 'Salon Name',
    workHoursStart: 'Start Time',
    workHoursEnd: 'End Time',
    appointmentDuration: 'Appointment Duration (min)',
    lateTolerance: 'Late Tolerance (min)',
    commissionRate: 'Commission Rate (%)',
    lunchStart: 'Lunch Start',
    lunchEnd: 'Lunch End',
    allowManicuristToMoveAppointments: 'Allow manicurists to move appointments',
    
    // Authentication
    login: 'Login',
    logout: 'Logout',
    loginError: 'Invalid email or password.',
    createAccount: 'Create Account',
    appName: 'Appointment System',
    appSubtitle: 'Management',
    
    // Reports
    totalRevenue: 'Total Revenue',
    totalAppointments: 'Total Appointments',
    manicuristPerformance: 'Manicurist Performance',
    totalGenerated: 'Total Generated',
    commission: 'Commission',
    myPerformance: 'My Performance',
    noReportData: 'Not enough data to generate a report.',
    
    // Weekdays
    shortWeekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    
    // Months
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    
    // Error and validation messages
    appointmentConflict: 'There is already an appointment for this time with this staff member.',
    appointmentInLunchBreak: 'Cannot book during lunch break.',
    cannotBookInPast: 'Cannot book in the past.',
    noAppointments: 'No appointments for this day.',
    
    // Other messages
    dailySummary: 'Daily Summary',
    lunchBreak: 'Lunch Break',
    
    // Specific status (for use in texts)
    statusScheduled: 'Scheduled',
    statusCompleted: 'Completed',
    statusNoShow: 'No-Show',
    statusCancelled: 'Cancelled',
    
    // Specific settings
    profileSettingsTitle: 'Profile Settings',
    appearanceTitle: 'Appearance',
    adminSettingsTitle: 'Administrative Settings',
    changePasswordPlaceholder: 'Leave blank for no change',
    
    // Specific reports
    revenueLabel: 'Revenue',
    appointmentsLabel: 'Appointments',
    performanceByStaff: 'Performance by Staff',
    noDataAvailable: 'No data available',
    generatedAmount: 'Generated Amount',
    commissionAmount: 'Commission',
    appointmentCount: 'Total Appointments',
    
    // Short months for reports
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    
    // Specific calendar texts
    moreAppointments: 'more',
    clickToViewDay: 'Click to view day',
    noAppointmentsDay: 'No appointments for this day',
    
    // Permission texts
    restrictedAccess: 'Restricted Access',
    manicureNoPermission: 'Manicurists do not have permission to',
    contactAdmin: 'Contact the administrator',
    manageClients: 'manage clients',
    manageServices: 'manage services',
    manageStaff: 'manage staff',
    
    // Reports - additional texts
    reportsTitle: 'Reports',
    totalRevenue: 'Total Revenue',
    totalAppointments: 'Total Appointments',
    performanceByEmployee: 'Performance by Employee',
    myPerformance: 'My Performance',
    totalRevenueGenerated: 'Total Revenue Generated',
    myCommission: 'My Commission',
    totalServices: 'Total Services',
    noEmployeeAppointments: 'No employee with completed appointments found.',
    noPermissionViewReports: 'No permission to view reports.',
    revenue: 'Revenue',
    appointments: 'Appointments',
    
    // Login modal
    manicuristLogins: 'Manicurist Logins',
    noManicuristRegistered: 'No manicurist registered.',
    close: 'Close',
    
    // New features
    enableNotifications: 'Enable Notifications',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeBeautyPink: 'Night Pink',
    themeElegantPurple: 'Shadow Purple',
    themeProfessionalBlue: 'Midnight Blue',
    themeNatureGreen: 'Forest Green',
    
    // Roles and permissions
    receptionist: 'Receptionist',
    manicurist: 'Manicurist',
    admin: 'Administrator',
    changeRole: 'Change Role',
    roleChanged: 'Role changed successfully!',
    
    // Notifications
    notificationTitle: 'Notification System',
    notificationPermissionDenied: 'Notification permission denied',
    notificationPermissionGranted: 'Notifications enabled successfully!',
    newNotification: 'New Notification',
    
    // Enhanced reports
    dailyRevenue: 'Daily Revenue',
    weeklyRevenue: 'Weekly Revenue',
    monthlyRevenue: 'Monthly Revenue',
    averageTicket: 'Average Ticket',
    topServices: 'Top Services',
    revenueChart: 'Revenue Chart',
    performanceChart: 'Performance Chart'
};

// Educational Management System - Bilingual Frontend JavaScript
class EduManageApp {
    constructor() {
        // Determine API base URL based on environment
        if (window.location.origin.includes('3000')) {
            this.apiBaseUrl = 'http://localhost:3001/api';
        } else if (window.location.origin.includes('3001')) {
            this.apiBaseUrl = '/api';
        } else if (window.location.origin.includes('netlify.app')) {
            this.apiBaseUrl = 'https://web-production-e5f3c.up.railway.app/api';
        } else {
            this.apiBaseUrl = '/api';
        }
        
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
        this.currentSubsystem = localStorage.getItem('preferredSubsystem') || 'anglophone';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
        this.setupNavigation();
        this.initializeLanguageSystem();
    }

    // Helper function for authenticated API calls
    async apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return fetch(`${this.apiBaseUrl}${endpoint}`, {
            ...options,
            headers
        });
    }

    initializeLanguageSystem() {
        // Show language modal on first visit
        if (!localStorage.getItem('languageSelected')) {
            const langModal = document.getElementById('language-modal');
            const authPage = document.getElementById('auth-page');
            const mainApp = document.getElementById('main-app');
            if (langModal) langModal.style.display = 'block';
            if (authPage) authPage.style.display = 'none';
            if (mainApp) mainApp.style.display = 'none';
        } else {
            const langModal = document.getElementById('language-modal');
            if (langModal) langModal.style.display = 'none';
            this.showAuthPage();
        }
    }

    showAuthPage() {
        const authPage = document.getElementById('auth-page');
        const mainApp = document.getElementById('main-app');
        if (authPage) authPage.style.display = 'block';
        if (mainApp) mainApp.style.display = 'none';
    }

    showMainApp() {
        const authPage = document.getElementById('auth-page');
        const mainApp = document.getElementById('main-app');
        if (authPage) authPage.style.display = 'none';
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.classList.add('show');
        }
    }

    setupEventListeners() {
        // Language selection
        document.querySelectorAll('.language-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const lang = e.currentTarget.getAttribute('data-lang');
                this.selectLanguage(lang);
            });
        });

        // Language switcher
        const langSwitch = document.getElementById('lang-switch');
        if (langSwitch) {
            langSwitch.addEventListener('click', () => {
                const newLang = this.currentLanguage === 'en' ? 'fr' : 'en';
                this.switchLanguage(newLang);
            });
        }

        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAuthTab(e.currentTarget.getAttribute('data-tab'));
            });
        });

        // Auth forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Role-based form changes
        const regRole = document.getElementById('reg-role');
        const parentType = document.getElementById('parent-type');
        if (regRole) {
            regRole.addEventListener('change', this.handleRoleChange.bind(this));
        }
        if (parentType) {
            parentType.addEventListener('change', this.handleParentTypeChange.bind(this));
        }

        // Navigation
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Action buttons
        const actionButtons = [
            'add-student-btn', 'add-teacher-btn', 'add-parent-btn', 'add-class-btn',
            'add-grade-btn', 'add-quiz-btn', 'add-lesson-plan-btn', 'add-school-btn',
            'upload-file-btn', 'mark-all-read-btn'
        ];
        
        actionButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    const methodName = buttonId.replace('-btn', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    const methodNameCapitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
                    const method = this[`show${methodNameCapitalized}Modal`] || 
                                 this[methodName] || 
                                 (() => this.showAlert(`${methodName} - Coming soon!`, 'info'));
                    method.call(this);
                });
            }
        });

        // Modal close
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.closeModal.bind(this));
        }
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    selectLanguage(lang) {
        this.currentLanguage = lang;
        this.currentSubsystem = lang === 'fr' ? 'francophone' : 'anglophone';
        
        localStorage.setItem('preferredLanguage', lang);
        localStorage.setItem('preferredSubsystem', this.currentSubsystem);
        localStorage.setItem('languageSelected', 'true');
        
        // Update UI
        document.getElementById('current-lang').textContent = lang.toUpperCase();
        const subsystemName = document.getElementById('subsystem-name');
        if (subsystemName) {
            subsystemName.textContent = lang === 'fr' ? 'Français (Francophone)' : 'English (Anglophone)';
        }
        
        // Hide language modal and show auth page
        document.getElementById('language-modal').style.display = 'none';
        this.showAuthPage();
        
        // Translate interface
        this.translateInterface();
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;
        this.currentSubsystem = lang === 'fr' ? 'francophone' : 'anglophone';
        
        localStorage.setItem('preferredLanguage', lang);
        localStorage.setItem('preferredSubsystem', this.currentSubsystem);
        
        // Update UI
        document.getElementById('current-lang').textContent = lang.toUpperCase();
        const subsystemName = document.getElementById('subsystem-name');
        if (subsystemName) {
            subsystemName.textContent = lang === 'fr' ? 'Français (Francophone)' : 'English (Anglophone)';
        }
        
        // Translate interface
        this.translateInterface();
    }

    translateInterface() {
        // This will be handled by the translations.js file
        if (window.translations && window.switchLanguage) {
            window.switchLanguage(this.currentLanguage);
        }
    }

    switchAuthTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    handleRoleChange(e) {
        const role = e.target.value;
        const parentTypeGroup = document.getElementById('parent-type-group');
        const schoolSelectionGroup = document.getElementById('school-selection-group');

        if (role === 'parent') {
            parentTypeGroup.style.display = 'block';
            schoolSelectionGroup.style.display = 'block';
            this.loadSchools();
        } else {
            parentTypeGroup.style.display = 'none';
            schoolSelectionGroup.style.display = 'none';
        }
    }

    handleParentTypeChange(e) {
        const parentType = e.target.value;
        const schoolSelectionGroup = document.getElementById('school-selection-group');

        if (parentType === 'affiliated') {
            schoolSelectionGroup.style.display = 'block';
        } else {
            schoolSelectionGroup.style.display = 'none';
        }
    }

    async loadSchools() {
        try {
            const response = await this.apiCall('/schools');
            const schools = await response.json();
            
            // Update school selection dropdown (for registration)
            const select = document.getElementById('school-selection');
            if (select) {
                select.innerHTML = '<option value="">Select a school</option>';
                schools.forEach(school => {
                    const option = document.createElement('option');
                    option.value = school.id;
                    option.textContent = school.name;
                    select.appendChild(option);
                });
            }

            // Update schools table (for Super Admin dashboard)
            const schoolsTable = document.getElementById('schools-table');
            if (schoolsTable) {
                schoolsTable.innerHTML = '';
                
                schools.forEach(school => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${school.name}</td>
                        <td>
                            <span class="badge ${school.education_system === 'anglophone' ? 'badge-blue' : 'badge-green'}">
                                ${school.education_system === 'anglophone' ? 'Anglophone' : 'Francophone'}
                            </span>
                        </td>
                        <td>${school.address || 'N/A'}</td>
                        <td>${school.student_count || 0}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="app.viewSchool(${school.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="app.editSchool(${school.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteSchool(${school.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    `;
                    schoolsTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading schools:', error);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const role = document.getElementById('login-role').value;

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                
                this.showMainApp();
                this.loadDashboard();
            } else {
                this.showAlert(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Network error. Please try again.', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        // Get form values directly
        const data = {
            firstName: document.getElementById('reg-firstname').value,
            lastName: document.getElementById('reg-lastname').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            role: document.getElementById('reg-role').value,
            subsystem: this.currentSubsystem,
            language: this.currentLanguage
        };
        
        // Add parent-specific data if role is parent
        if (data.role === 'parent') {
            data.parentType = document.getElementById('parent-type').value;
            data.schoolId = document.getElementById('school-selection').value;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Registration successful! Please login.', 'success');
                this.switchAuthTab('login');
            } else {
                this.showAlert(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showAlert('Network error. Please try again.', 'error');
        }
    }

    async handleLogout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        this.showAuthPage();
    }

    checkAuth() {
        if (this.token) {
            this.currentUser = JSON.parse(localStorage.getItem('user'));
            this.showMainApp();
            this.loadDashboard();
        }
    }

    setupNavigation() {
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            this.showSection(hash);
        });

        // Initial section
        const hash = window.location.hash.substring(1) || 'home';
        this.showSection(hash);
    }

    handleNavigation(e) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        if (href && href.startsWith('#')) {
            window.location.hash = href;
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(sectionName);
        if (section) {
            section.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionName}"]`)?.classList.add('active');

        // Load section data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch(sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'students':
                await this.loadStudents();
                break;
            case 'teachers':
                await this.loadTeachers();
                break;
            case 'parents':
                await this.loadParents();
                break;
            case 'schools':
                await this.loadSchools();
                break;
            case 'classes':
                await this.loadClasses();
                break;
            case 'grades':
                await this.loadGrades();
                break;
            case 'quizzes':
                await this.loadQuizzes();
                break;
            case 'lesson-plans':
                await this.loadLessonPlans();
                break;
            case 'files':
                await this.loadFiles();
                break;
            case 'notifications':
                await this.loadNotifications();
                break;
            case 'profile':
                await this.loadProfile();
                break;
        }
    }

    async loadDashboard() {
        try {
            // Load user profile to determine role
            const profileRes = await this.apiCall('/auth/profile');
            if (!profileRes.ok) {
                throw new Error('Failed to load user profile');
            }
            
            const userProfile = await profileRes.json();
            this.currentUser = userProfile;
            
            // Load role-specific dashboard
            switch (userProfile.role) {
                case 'super_admin':
                    await this.loadSuperAdminDashboard();
                    break;
                case 'school_admin':
                    await this.loadSchoolAdminDashboard();
                    break;
                case 'teacher':
                    await this.loadTeacherDashboard();
                    break;
                case 'student':
                    await this.loadStudentDashboard();
                    break;
                case 'parent':
                    await this.loadParentDashboard();
                    break;
                default:
                    await this.loadDefaultDashboard();
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showAlert('Failed to load dashboard data', 'error');
        }
    }

    async loadSuperAdminDashboard() {
        try {
            // Show Super Admin dashboard
            this.showRoleDashboard('super-admin');

            // Load available data (only existing endpoints)
            const [schoolsRes, studentsRes, teachersRes, parentsRes] = await Promise.all([
                this.apiCall('/schools'),
                this.apiCall('/students'),
                this.apiCall('/teachers'),
                this.apiCall('/parents')
            ]);

            const schools = await schoolsRes.json();
            const students = await studentsRes.json();
            const teachers = await teachersRes.json();
            const parents = await parentsRes.json();

            // Calculate total users
            const totalUsers = students.length + teachers.length + parents.length;

            // Update KPI cards
            this.updateElement('total-schools-kpi', schools.length || 0);
            this.updateElement('total-users-kpi', totalUsers);
            this.updateElement('total-content-kpi', '0'); // Placeholder until CMS is implemented
            this.updateElement('total-revenue-kpi', '$0'); // Placeholder until revenue tracking is implemented

            // Update regular dashboard counters
            this.updateElement('total-students', students.length || 0);
            this.updateElement('total-teachers', teachers.length || 0);
            this.updateElement('total-parents', parents.length || 0);
            this.updateElement('total-classes', schools.reduce((acc, school) => acc + (school.class_count || 0), 0));

        } catch (error) {
            console.error('Error loading Super Admin dashboard:', error);
            this.showAlert('Failed to load Super Admin dashboard', 'error');
        }
    }

    async loadSchoolAdminDashboard() {
        try {
            // Show School Admin dashboard
            this.showRoleDashboard('school-admin');

            // Load school-specific data (only existing endpoints)
            const [studentsRes, teachersRes, parentsRes, classesRes] = await Promise.all([
                this.apiCall('/students'),
                this.apiCall('/teachers'),
                this.apiCall('/parents'),
                this.apiCall('/classes')
            ]);

            const students = await studentsRes.json();
            const teachers = await teachersRes.json();
            const parents = await parentsRes.json();
            const classes = await classesRes.json();

            // Update dashboard counters
            this.updateElement('total-students', students.length || 0);
            this.updateElement('total-teachers', teachers.length || 0);
            this.updateElement('total-parents', parents.length || 0);
            this.updateElement('total-classes', classes.length || 0);

            // Update school info (placeholder until school endpoint is implemented)
            this.updateElement('school-name-display', 'Your School');
            this.updateElement('subsystem-name', this.currentSubsystem === 'anglophone' ? 'English (Anglophone)' : 'Français (Francophone)');
            this.updateElement('school-code-display', 'SCH001');

            // Load school-specific analytics (placeholder)
            await this.loadSchoolAnalytics(1);

        } catch (error) {
            console.error('Error loading School Admin dashboard:', error);
            this.showAlert('Failed to load School Admin dashboard', 'error');
        }
    }

    async loadSchoolAnalytics(schoolId) {
        try {
            // Placeholder analytics data (until analytics endpoints are implemented)
            const attendancePercentage = 85; // Mock data
            const performanceTrend = '+5%'; // Mock data
            
            // Update analytics elements if they exist
            const attendanceProgress = document.getElementById('attendance-progress');
            const attendancePercentageEl = document.getElementById('attendance-percentage');
            const performanceTrendEl = document.getElementById('performance-trend');
            
            if (attendanceProgress) {
                attendanceProgress.style.width = `${attendancePercentage}%`;
            }
            if (attendancePercentageEl) {
                attendancePercentageEl.textContent = `${attendancePercentage}%`;
            }
            if (performanceTrendEl) {
                performanceTrendEl.innerHTML = `<i class="fas fa-arrow-up"></i><span>${performanceTrend}</span>`;
            }

        } catch (error) {
            console.error('Error loading school analytics:', error);
        }
    }

    async loadTeacherDashboard() {
        try {
            // Show default dashboard for teachers
            this.showRoleDashboard('default');

            // Load teacher-specific data
            const [classesRes, studentsRes, lessonPlansRes, quizzesRes] = await Promise.all([
                this.apiCall('/classes/teacher'),
                this.apiCall('/students/teacher'),
                this.apiCall('/lesson-plans/teacher'),
                this.apiCall('/quizzes/teacher')
            ]);

            const classes = await classesRes.json();
            const students = await studentsRes.json();
            const lessonPlans = await lessonPlansRes.json();
            const quizzes = await quizzesRes.json();

            // Update dashboard counters
            this.updateElement('total-classes', classes.length || 0);
            this.updateElement('total-students', students.length || 0);
            this.updateElement('total-teachers', 1); // Current teacher
            this.updateElement('total-parents', 0); // Not relevant for teachers

        } catch (error) {
            console.error('Error loading Teacher dashboard:', error);
            this.showAlert('Failed to load Teacher dashboard', 'error');
        }
    }

    async loadStudentDashboard() {
        try {
            // Show default dashboard for students
            this.showRoleDashboard('default');

            // Load student-specific data
            const [gradesRes, assignmentsRes, classesRes] = await Promise.all([
                this.apiCall('/grades/student'),
                this.apiCall('/assignments/student'),
                this.apiCall('/classes/student')
            ]);

            const grades = await gradesRes.json();
            const assignments = await assignmentsRes.json();
            const classes = await classesRes.json();

            // Update dashboard counters
            this.updateElement('total-classes', classes.length || 0);
            this.updateElement('total-students', 1); // Current student
            this.updateElement('total-teachers', 0); // Not relevant for students
            this.updateElement('total-parents', 0); // Not relevant for students

        } catch (error) {
            console.error('Error loading Student dashboard:', error);
            this.showAlert('Failed to load Student dashboard', 'error');
        }
    }

    async loadParentDashboard() {
        try {
            // Show default dashboard for parents
            this.showRoleDashboard('default');

            // Load parent-specific data
            const [childrenRes, progressRes, notificationsRes] = await Promise.all([
                this.apiCall('/students/parent'),
                this.apiCall('/progress/parent'),
                this.apiCall('/notifications/parent')
            ]);

            const children = await childrenRes.json();
            const progress = await progressRes.json();
            const notifications = await notificationsRes.json();

            // Update dashboard counters
            this.updateElement('total-students', children.length || 0);
            this.updateElement('total-classes', children.reduce((acc, child) => acc + (child.classes?.length || 0), 0));
            this.updateElement('total-teachers', 0); // Not directly relevant for parents
            this.updateElement('total-parents', 1); // Current parent

        } catch (error) {
            console.error('Error loading Parent dashboard:', error);
            this.showAlert('Failed to load Parent dashboard', 'error');
        }
    }

    async loadDefaultDashboard() {
        try {
            // Show default dashboard
            this.showRoleDashboard('default');

            // Fallback dashboard for unknown roles
            const [studentsRes, teachersRes, parentsRes, classesRes] = await Promise.all([
                this.apiCall('/students'),
                this.apiCall('/teachers'),
                this.apiCall('/parents'),
                this.apiCall('/classes')
            ]);

            const students = await studentsRes.json();
            const teachers = await teachersRes.json();
            const parents = await parentsRes.json();
            const classes = await classesRes.json();

            // Update dashboard counters
            this.updateElement('total-students', students.length || 0);
            this.updateElement('total-teachers', teachers.length || 0);
            this.updateElement('total-parents', parents.length || 0);
            this.updateElement('total-classes', classes.length || 0);

        } catch (error) {
            console.error('Error loading default dashboard:', error);
            this.showAlert('Failed to load dashboard data', 'error');
        }
    }

    // Helper method to safely update DOM elements
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Show role-specific dashboard
    showRoleDashboard(role) {
        // Hide all role dashboards
        const dashboards = document.querySelectorAll('.role-dashboard');
        dashboards.forEach(dashboard => {
            dashboard.classList.remove('active');
            dashboard.style.display = 'none';
        });

        // Show the appropriate dashboard
        const targetDashboard = document.getElementById(`${role}-dashboard`);
        if (targetDashboard) {
            targetDashboard.classList.add('active');
            targetDashboard.style.display = 'block';
        } else {
            // Fallback to default dashboard
            const defaultDashboard = document.getElementById('default-dashboard');
            if (defaultDashboard) {
                defaultDashboard.classList.add('active');
                defaultDashboard.style.display = 'block';
            }
        }
    }

    // Enhanced data loading methods with role-based functionality
    async loadStudents() { 
        try {
            const response = await this.apiCall('/students');
            if (!response.ok) {
                throw new Error('Failed to load students');
            }
            
            const students = await response.json();
            const studentsTable = document.getElementById('students-table');
            
            if (studentsTable) {
                studentsTable.innerHTML = '';
                
                students.forEach(student => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${student.first_name} ${student.last_name}</td>
                        <td>${student.class_name || 'N/A'}</td>
                        <td>
                            <span class="badge ${student.education_system === 'anglophone' ? 'badge-blue' : 'badge-green'}">
                                ${student.education_system === 'anglophone' ? 'Anglophone' : 'Francophone'}
                            </span>
                        </td>
                        <td>${student.parent_name || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="app.viewStudent(${student.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="app.editStudent(${student.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteStudent(${student.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    `;
                    studentsTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showAlert('Failed to load students', 'error');
        }
    }
    async loadTeachers() { 
        try {
            const response = await this.apiCall('/teachers');
            if (!response.ok) {
                throw new Error('Failed to load teachers');
            }
            
            const teachers = await response.json();
            const teachersTable = document.getElementById('teachers-table');
            
            if (teachersTable) {
                teachersTable.innerHTML = '';
                
                teachers.forEach(teacher => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${teacher.first_name} ${teacher.last_name}</td>
                        <td>
                            <span class="badge ${teacher.education_system === 'anglophone' ? 'badge-blue' : 'badge-green'}">
                                ${teacher.education_system === 'anglophone' ? 'Anglophone' : 'Francophone'}
                            </span>
                        </td>
                        <td>${teacher.subjects ? teacher.subjects.join(', ') : 'N/A'}</td>
                        <td>${teacher.class_count || 0}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="app.viewTeacher(${teacher.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="app.editTeacher(${teacher.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteTeacher(${teacher.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    `;
                    teachersTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
            this.showAlert('Failed to load teachers', 'error');
        }
    }
    async loadParents() { 
        try {
            const response = await this.apiCall('/parents');
            if (!response.ok) {
                throw new Error('Failed to load parents');
            }
            
            const parents = await response.json();
            const parentsTable = document.getElementById('parents-table');
            
            if (parentsTable) {
                parentsTable.innerHTML = '';
                
                parents.forEach(parent => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${parent.first_name} ${parent.last_name}</td>
                        <td>
                            <span class="badge ${parent.parent_type === 'affiliated' ? 'badge-green' : 'badge-blue'}">
                                ${parent.parent_type === 'affiliated' ? 'Affiliated' : 'Non-Affiliated'}
                            </span>
                        </td>
                        <td>${parent.school_name || 'N/A'}</td>
                        <td>${parent.children_count || 0}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="app.viewParent(${parent.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="app.editParent(${parent.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteParent(${parent.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    `;
                    parentsTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading parents:', error);
            this.showAlert('Failed to load parents', 'error');
        }
    }

    async loadClasses() { 
        try {
            const response = await this.apiCall('/classes');
            if (!response.ok) {
                throw new Error('Failed to load classes');
            }
            
            const classes = await response.json();
            const classesTable = document.getElementById('classes-table');
            
            if (classesTable) {
                classesTable.innerHTML = '';
                
                classes.forEach(cls => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${cls.name}</td>
                        <td>
                            <span class="badge ${cls.education_system === 'anglophone' ? 'badge-blue' : 'badge-green'}">
                                ${cls.education_system === 'anglophone' ? 'Anglophone' : 'Francophone'}
                            </span>
                        </td>
                        <td>${cls.teacher_name || 'Unassigned'}</td>
                        <td>${cls.student_count || 0}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="app.viewClass(${cls.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="app.editClass(${cls.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteClass(${cls.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    `;
                    classesTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            this.showAlert('Failed to load classes', 'error');
        }
    }

    async loadGrades() { 
        try {
            const response = await this.apiCall('/grades');
            if (!response.ok) {
                throw new Error('Failed to load grades');
            }
            
            const grades = await response.json();
            const gradesTable = document.getElementById('grades-table');
            
            if (gradesTable) {
                gradesTable.innerHTML = '';
                
                grades.forEach(grade => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${grade.student_name}</td>
                        <td>${grade.subject_name}</td>
                        <td>
                            <span class="grade-badge ${this.getGradeClass(grade.grade)}">
                                ${grade.grade}
                            </span>
                        </td>
                        <td>${new Date(grade.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="app.viewGrade(${grade.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="app.editGrade(${grade.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteGrade(${grade.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    `;
                    gradesTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading grades:', error);
            this.showAlert('Failed to load grades', 'error');
        }
    }
    async loadQuizzes() { 
        try {
            this.showAlert('Loading quizzes...', 'info'); 
        } catch (error) {
            console.error('Error loading quizzes:', error);
            this.showAlert('Failed to load quizzes', 'error');
        }
    }
    async loadLessonPlans() { 
        try {
            this.showAlert('Loading lesson plans...', 'info'); 
        } catch (error) {
            console.error('Error loading lesson plans:', error);
            this.showAlert('Failed to load lesson plans', 'error');
        }
    }
    async loadFiles() { 
        try {
            this.showAlert('Loading files...', 'info'); 
        } catch (error) {
            console.error('Error loading files:', error);
            this.showAlert('Failed to load files', 'error');
        }
    }
    async loadNotifications() { 
        try {
            this.showAlert('Loading notifications...', 'info'); 
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showAlert('Failed to load notifications', 'error');
        }
    }
    async loadProfile() { 
        try {
            this.showAlert('Loading profile...', 'info'); 
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showAlert('Failed to load profile', 'error');
        }
    }

    // Utility methods
    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Style the alert
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        alert.style.backgroundColor = colors[type] || colors.info;
        
        // Add to page
        document.body.appendChild(alert);
        
        // Remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        navMenu.classList.toggle('active');
    }

    // Placeholder methods for modal operations
    showAddStudentModal() { this.showAlert('Add Student modal - Coming soon!', 'info'); }
    showAddTeacherModal() { this.showAlert('Add Teacher modal - Coming soon!', 'info'); }
    showAddParentModal() { this.showAlert('Add Parent modal - Coming soon!', 'info'); }
    showAddClassModal() { this.showAlert('Add Class modal - Coming soon!', 'info'); }
    showAddGradeModal() { this.showAlert('Add Grade modal - Coming soon!', 'info'); }
    showAddQuizModal() { this.showAlert('Add Quiz modal - Coming soon!', 'info'); }
    showAddLessonPlanModal() { this.showAlert('Add Lesson Plan modal - Coming soon!', 'info'); }
    toggleFileUpload() { this.showAlert('File Upload - Coming soon!', 'info'); }
    markAllNotificationsRead() { this.showAlert('All notifications marked as read!', 'success');     }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Helper methods for UI elements
    getGradeClass(grade) {
        const numGrade = parseFloat(grade);
        if (numGrade >= 90) return 'grade-excellent';
        if (numGrade >= 80) return 'grade-good';
        if (numGrade >= 70) return 'grade-average';
        if (numGrade >= 60) return 'grade-poor';
        return 'grade-fail';
    }

    getFileTypeClass(fileType) {
        const type = fileType.toLowerCase();
        if (['pdf'].includes(type)) return 'file-pdf';
        if (['doc', 'docx'].includes(type)) return 'file-doc';
        if (['xls', 'xlsx'].includes(type)) return 'file-excel';
        if (['ppt', 'pptx'].includes(type)) return 'file-powerpoint';
        if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) return 'file-image';
        return 'file-default';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // School Management Functions
    showAddSchoolModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <h3>Create New School</h3>
            <form id="add-school-form">
                <div class="form-group">
                    <label for="school-name">School Name *</label>
                    <input type="text" id="school-name" required>
                </div>
                <div class="form-group">
                    <label for="school-address">Address</label>
                    <textarea id="school-address" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="school-phone">Phone</label>
                    <input type="tel" id="school-phone">
                </div>
                <div class="form-group">
                    <label for="school-email">Email</label>
                    <input type="email" id="school-email">
                </div>
                <div class="form-group">
                    <label for="principal-name">Principal Name</label>
                    <input type="text" id="principal-name">
                </div>
                <div class="form-group">
                    <label for="education-system">Education System *</label>
                    <select id="education-system" required>
                        <option value="">Select System</option>
                        <option value="anglophone">Anglophone (Class 1-6)</option>
                        <option value="francophone">Francophone (SIL-CM2)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="admin-email">School Admin Email *</label>
                    <input type="email" id="admin-email" required>
                </div>
                <div class="form-group">
                    <label for="admin-first-name">Admin First Name *</label>
                    <input type="text" id="admin-first-name" required>
                </div>
                <div class="form-group">
                    <label for="admin-last-name">Admin Last Name *</label>
                    <input type="text" id="admin-last-name" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create School</button>
                </div>
            </form>
        `;
        
        modal.style.display = 'block';
        
        // Add form submit listener
        document.getElementById('add-school-form').addEventListener('submit', this.handleAddSchool.bind(this));
    }

    async handleAddSchool(e) {
        e.preventDefault();
        
        // Validate required fields
        const requiredFields = ['school-name', 'education-system', 'admin-email', 'admin-first-name', 'admin-last-name'];
        const missingFields = requiredFields.filter(fieldId => {
            const field = document.getElementById(fieldId);
            return !field || !field.value.trim();
        });

        if (missingFields.length > 0) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        const data = {
            name: document.getElementById('school-name').value,
            address: document.getElementById('school-address').value,
            phone: document.getElementById('school-phone').value,
            email: document.getElementById('school-email').value,
            principal_name: document.getElementById('principal-name').value,
            education_system: document.getElementById('education-system').value,
            school_admin_email: document.getElementById('admin-email').value,
            school_admin_first_name: document.getElementById('admin-first-name').value,
            school_admin_last_name: document.getElementById('admin-last-name').value
        };

        try {
            const response = await this.apiCall('/schools/create-with-admin', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to create school');
            }

            const result = await response.json();

            this.showAlert('School created successfully!', 'success');
            this.closeModal();
            await this.loadSchools(); // Refresh the schools list
            
            // Show school admin credentials
            this.showAlert(`
                School Admin Credentials:<br>
                Email: ${result.school_admin.email}<br>
                Password: ${result.school_admin.temporary_password}
            `, 'info');
        } catch (error) {
            console.error('Error creating school:', error);
            this.showAlert(error.message || 'Network error. Please try again.', 'error');
        }
    }

    async viewSchool(schoolId) {
        try {
            const response = await this.apiCall(`/schools/${schoolId}`);
            const school = await response.json();
            
            const modal = document.getElementById('modal');
            const modalBody = document.getElementById('modal-body');
            
            modalBody.innerHTML = `
                <h3>${school.name}</h3>
                <div class="school-details">
                    <p><strong>Education System:</strong> ${school.education_system === 'anglophone' ? 'Anglophone' : 'Francophone'}</p>
                    <p><strong>Address:</strong> ${school.address || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${school.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> ${school.email || 'N/A'}</p>
                    <p><strong>Principal:</strong> ${school.principal_name || 'N/A'}</p>
                    <p><strong>School Code:</strong> ${school.school_code}</p>
                    <p><strong>Students:</strong> ${school.student_count || 0}</p>
                    <p><strong>Teachers:</strong> ${school.teacher_count || 0}</p>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Close</button>
                </div>
            `;
            
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error viewing school:', error);
            this.showAlert('Failed to load school details', 'error');
        }
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 18px;">&times;</button>
        `;
        
        // Insert at top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alert, mainContent.firstChild);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, 5000);
        }
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EduManageApp();
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded, initialize immediately
    window.app = new EduManageApp();
}

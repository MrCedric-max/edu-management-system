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
            'upload-file-btn', 'mark-all-read-btn', 'create-quiz-btn', 'create-lesson-plan-btn',
            'upload-materials-btn', 'grade-assignments-btn', 'take-quiz-btn', 'view-grades-btn',
            'view-progress-btn', 'download-materials-btn'
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
            // Show Teacher dashboard
            this.showRoleDashboard('teacher');

            // Load teacher-specific data (using existing endpoints)
            const [classesRes, studentsRes, lessonPlansRes, quizzesRes] = await Promise.all([
                this.apiCall('/classes'),
                this.apiCall('/students'),
                this.apiCall('/lesson-plans'),
                this.apiCall('/quizzes')
            ]);

            const classes = await classesRes.json();
            const students = await studentsRes.json();
            const lessonPlans = await lessonPlansRes.json();
            const quizzes = await quizzesRes.json();

            // Update teacher-specific dashboard counters
            this.updateElement('teacher-students', students.length || 0);
            this.updateElement('teacher-classes', classes.length || 0);
            this.updateElement('teacher-quizzes', quizzes.length || 0);
            this.updateElement('teacher-lesson-plans', lessonPlans.length || 0);

            // Update regular dashboard counters for compatibility
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
            // Show Student dashboard
            this.showRoleDashboard('student');

            // Load student-specific data (using existing endpoints)
            const [quizzesRes, gradesRes] = await Promise.all([
                this.apiCall('/quizzes'),
                this.apiCall('/grades')
            ]);

            const quizzes = await quizzesRes.json();
            const grades = await gradesRes.json();

            // Calculate student statistics
            const availableQuizzes = quizzes.filter(q => q.status === 'active').length;
            const completedQuizzes = quizzes.filter(q => q.status === 'completed').length;
            const averageGrade = grades.length > 0 ? 
                (grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length).toFixed(1) : '-';

            // Update student-specific dashboard counters
            this.updateElement('student-quizzes', availableQuizzes);
            this.updateElement('student-completed', completedQuizzes);
            this.updateElement('student-pending', availableQuizzes - completedQuizzes);
            this.updateElement('student-average-grade', averageGrade);

            // Update regular dashboard counters for compatibility
            this.updateElement('total-students', 1); // Current student
            this.updateElement('total-teachers', 0); // Not relevant for students
            this.updateElement('total-parents', 0); // Not relevant for students
            this.updateElement('total-classes', 0); // Not relevant for students

        } catch (error) {
            console.error('Error loading Student dashboard:', error);
            this.showAlert('Failed to load Student dashboard', 'error');
        }
    }

    async loadParentDashboard() {
        try {
            // Show Parent dashboard
            this.showRoleDashboard('parent');

            // Load parent-specific data (using existing endpoints)
            const [studentsRes, notificationsRes] = await Promise.all([
                this.apiCall('/students'),
                this.apiCall('/notifications')
            ]);

            const students = await studentsRes.json();
            const notifications = await notificationsRes.json();

            // Calculate parent statistics
            const childrenCount = students.length; // Assuming all students are children
            const unreadNotifications = notifications.filter(n => !n.is_read).length;
            const averageProgress = childrenCount > 0 ? '85%' : '-'; // Mock data

            // Update parent-specific dashboard counters
            this.updateElement('parent-children', childrenCount);
            this.updateElement('parent-notifications', unreadNotifications);
            this.updateElement('parent-progress', averageProgress);
            this.updateElement('parent-events', '0'); // Placeholder

            // Update regular dashboard counters for compatibility
            this.updateElement('total-students', childrenCount);
            this.updateElement('total-teachers', 0); // Not relevant for parents
            this.updateElement('total-parents', 1); // Current parent
            this.updateElement('total-classes', 0); // Not relevant for parents

            // Load children progress
            this.loadChildrenProgress(students);

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

// Teacher-specific methods
EduManageApp.prototype.showCreateQuizModal = function() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="quiz-modal">
            <h3>Create New Quiz</h3>
            <form id="quiz-form">
                <div class="form-group">
                    <label for="quiz-title">Quiz Title *</label>
                    <input type="text" id="quiz-title" required>
                </div>
                <div class="form-group">
                    <label for="quiz-subject">Subject *</label>
                    <input type="text" id="quiz-subject" required>
                </div>
                <div class="form-group">
                    <label for="quiz-class">Class *</label>
                    <select id="quiz-class" required>
                        <option value="">Select Class</option>
                        <option value="class1">Class 1 / SIL</option>
                        <option value="class2">Class 2 / CP</option>
                        <option value="class3">Class 3 / CE1</option>
                        <option value="class4">Class 4 / CE2</option>
                        <option value="class5">Class 5 / CM1</option>
                        <option value="class6">Class 6 / CM2</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="quiz-duration">Duration (minutes)</label>
                    <input type="number" id="quiz-duration" min="5" max="180" value="30">
                </div>
                
                <div class="question-type-selector">
                    <div class="question-type-btn active" data-type="multiple-choice">
                        <i class="fas fa-list-ul"></i>
                        <span>Multiple Choice</span>
                    </div>
                    <div class="question-type-btn" data-type="true-false">
                        <i class="fas fa-check-circle"></i>
                        <span>True/False</span>
                    </div>
                    <div class="question-type-btn" data-type="short-answer">
                        <i class="fas fa-edit"></i>
                        <span>Short Answer</span>
                    </div>
                    <div class="question-type-btn" data-type="essay">
                        <i class="fas fa-file-alt"></i>
                        <span>Essay</span>
                    </div>
                </div>
                
                <div class="question-builder" id="question-builder">
                    <h4>Questions</h4>
                    <button type="button" class="btn btn-primary" id="add-question-btn">Add Question</button>
                    <div id="questions-container"></div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Quiz</button>
                </div>
            </form>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // Add event listeners for quiz creation
    this.setupQuizCreationListeners();
};

EduManageApp.prototype.setupQuizCreationListeners = function() {
    // Question type selector
    document.querySelectorAll('.question-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.question-type-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
    
    // Add question button
    const addQuestionBtn = document.getElementById('add-question-btn');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            this.addQuestion();
        });
    }
    
    // Quiz form submission
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQuizCreation();
        });
    }
};

EduManageApp.prototype.addQuestion = function() {
    const container = document.getElementById('questions-container');
    const questionCount = container.children.length + 1;
    const activeType = document.querySelector('.question-type-btn.active').getAttribute('data-type');
    
    const questionHTML = `
        <div class="question-item" data-question="${questionCount}">
            <div class="question-header">
                <span class="question-number">Question ${questionCount}</span>
                <button type="button" class="remove-question" onclick="app.removeQuestion(${questionCount})">Remove</button>
            </div>
            <div class="form-group">
                <label>Question Text *</label>
                <textarea class="question-text" placeholder="Enter your question..." required></textarea>
            </div>
            <div class="question-options" data-type="${activeType}">
                ${this.getQuestionOptionsHTML(activeType)}
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
};

EduManageApp.prototype.getQuestionOptionsHTML = function(type) {
    switch(type) {
        case 'multiple-choice':
            return `
                <div class="form-group">
                    <label>Options *</label>
                    <div class="option-input">
                        <input type="text" placeholder="Option A" required>
                        <input type="radio" name="correct-${Date.now()}" value="0">
                    </div>
                    <div class="option-input">
                        <input type="text" placeholder="Option B" required>
                        <input type="radio" name="correct-${Date.now()}" value="1">
                    </div>
                    <div class="option-input">
                        <input type="text" placeholder="Option C" required>
                        <input type="radio" name="correct-${Date.now()}" value="2">
                    </div>
                    <div class="option-input">
                        <input type="text" placeholder="Option D" required>
                        <input type="radio" name="correct-${Date.now()}" value="3">
                    </div>
                    <small>Select the correct answer</small>
                </div>
            `;
        case 'true-false':
            return `
                <div class="form-group">
                    <label>Correct Answer *</label>
                    <div>
                        <label><input type="radio" name="correct-${Date.now()}" value="true" required> True</label>
                        <label><input type="radio" name="correct-${Date.now()}" value="false" required> False</label>
                    </div>
                </div>
            `;
        case 'short-answer':
            return `
                <div class="form-group">
                    <label>Expected Answer *</label>
                    <input type="text" class="expected-answer" placeholder="Enter expected answer..." required>
                </div>
            `;
        case 'essay':
            return `
                <div class="form-group">
                    <label>Grading Criteria</label>
                    <textarea class="grading-criteria" placeholder="Enter grading criteria..."></textarea>
                </div>
            `;
        default:
            return '';
    }
};

EduManageApp.prototype.removeQuestion = function(questionNumber) {
    const question = document.querySelector(`[data-question="${questionNumber}"]`);
    if (question) {
        question.remove();
        // Renumber remaining questions
        this.renumberQuestions();
    }
};

EduManageApp.prototype.renumberQuestions = function() {
    const questions = document.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
        const questionNumber = index + 1;
        question.setAttribute('data-question', questionNumber);
        question.querySelector('.question-number').textContent = `Question ${questionNumber}`;
    });
};

EduManageApp.prototype.handleQuizCreation = function() {
    const title = document.getElementById('quiz-title').value;
    const subject = document.getElementById('quiz-subject').value;
    const classLevel = document.getElementById('quiz-class').value;
    const duration = document.getElementById('quiz-duration').value;
    
    const questions = [];
    document.querySelectorAll('.question-item').forEach(questionEl => {
        const questionText = questionEl.querySelector('.question-text').value;
        const type = questionEl.querySelector('.question-options').getAttribute('data-type');
        
        let options = [];
        if (type === 'multiple-choice') {
            const optionInputs = questionEl.querySelectorAll('.option-input input[type="text"]');
            const correctRadio = questionEl.querySelector('input[type="radio"]:checked');
            optionInputs.forEach((input, index) => {
                options.push({
                    text: input.value,
                    isCorrect: correctRadio && correctRadio.value == index
                });
            });
        } else if (type === 'true-false') {
            const correctRadio = questionEl.querySelector('input[type="radio"]:checked');
            options = [
                { text: 'True', isCorrect: correctRadio && correctRadio.value === 'true' },
                { text: 'False', isCorrect: correctRadio && correctRadio.value === 'false' }
            ];
        }
        
        questions.push({
            text: questionText,
            type: type,
            options: options
        });
    });
    
    if (questions.length === 0) {
        this.showAlert('Please add at least one question', 'error');
        return;
    }
    
    const quizData = {
        title,
        subject,
        class_level: classLevel,
        duration: parseInt(duration),
        questions: questions,
        education_system: this.currentSubsystem
    };
    
    // Here you would send the quiz data to the backend
    console.log('Quiz data:', quizData);
    this.showAlert('Quiz created successfully! (Backend integration pending)', 'success');
    this.closeModal();
};

EduManageApp.prototype.showCreateLessonPlanModal = function() {
    this.showAlert('Create Lesson Plan modal - Coming soon!', 'info');
};

EduManageApp.prototype.showUploadMaterialsModal = function() {
    this.showAlert('Upload Materials modal - Coming soon!', 'info');
};

EduManageApp.prototype.showGradeAssignmentsModal = function() {
    this.showAlert('Grade Assignments modal - Coming soon!', 'info');
};

// Student-specific methods
EduManageApp.prototype.showTakeQuizModal = function() {
    this.showAlert('Take Quiz modal - Coming soon!', 'info');
};

EduManageApp.prototype.showViewGradesModal = function() {
    this.showAlert('View Grades modal - Coming soon!', 'info');
};

EduManageApp.prototype.showViewProgressModal = function() {
    this.showAlert('View Progress modal - Coming soon!', 'info');
};

EduManageApp.prototype.showDownloadMaterialsModal = function() {
    this.showAlert('Download Materials modal - Coming soon!', 'info');
};

// Parent-specific methods
EduManageApp.prototype.loadChildrenProgress = function(children) {
    const container = document.getElementById('children-progress-grid');
    if (!container) return;

    container.innerHTML = '';

    children.forEach((child, index) => {
        const progressCard = document.createElement('div');
        progressCard.className = 'child-progress-card';
        progressCard.innerHTML = `
            <h4>${child.first_name} ${child.last_name}</h4>
            <div class="progress-bar-container">
                <label>Overall Progress</label>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${85 + (index * 5)}%"></div>
                </div>
            </div>
            <div class="progress-bar-container">
                <label>Math</label>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${80 + (index * 3)}%"></div>
                </div>
            </div>
            <div class="progress-bar-container">
                <label>Science</label>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${90 + (index * 2)}%"></div>
                </div>
            </div>
        `;
        container.appendChild(progressCard);
    });
};

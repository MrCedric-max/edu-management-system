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
            document.getElementById('language-modal').style.display = 'block';
            document.getElementById('auth-page').style.display = 'none';
            document.getElementById('main-app').style.display = 'none';
        } else {
            document.getElementById('language-modal').style.display = 'none';
            this.showAuthPage();
        }
    }

    showAuthPage() {
        document.getElementById('auth-page').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('auth-page').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('main-app').classList.add('show');
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
                    const method = this[`show${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Modal`] || 
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
            
            const select = document.getElementById('school-selection');
            select.innerHTML = '<option value="">Select a school</option>';
            
            schools.forEach(school => {
                const option = document.createElement('option');
                option.value = school.id;
                option.textContent = school.name;
                select.appendChild(option);
            });
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
            // Load dashboard statistics
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

            document.getElementById('total-students').textContent = students.length || 0;
            document.getElementById('total-teachers').textContent = teachers.length || 0;
            document.getElementById('total-parents').textContent = parents.length || 0;
            document.getElementById('total-classes').textContent = classes.length || 0;
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    // Placeholder methods for data loading
    async loadStudents() { this.showAlert('Loading students...', 'info'); }
    async loadTeachers() { this.showAlert('Loading teachers...', 'info'); }
    async loadParents() { this.showAlert('Loading parents...', 'info'); }
    async loadClasses() { this.showAlert('Loading classes...', 'info'); }
    async loadGrades() { this.showAlert('Loading grades...', 'info'); }
    async loadQuizzes() { this.showAlert('Loading quizzes...', 'info'); }
    async loadLessonPlans() { this.showAlert('Loading lesson plans...', 'info'); }
    async loadFiles() { this.showAlert('Loading files...', 'info'); }
    async loadNotifications() { this.showAlert('Loading notifications...', 'info'); }
    async loadProfile() { this.showAlert('Loading profile...', 'info'); }

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
    showAddSchoolModal() { this.showAlert('Add School modal - Coming soon!', 'info'); }
    toggleFileUpload() { this.showAlert('File Upload - Coming soon!', 'info'); }
    markAllNotificationsRead() { this.showAlert('All notifications marked as read!', 'success'); }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EduManageApp();
});

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

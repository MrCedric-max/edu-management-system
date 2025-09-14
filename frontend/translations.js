// Translation system for bilingual educational management
const translations = {
    en: {
        // General
        'welcome': 'Welcome to Educational Management System',
        'select-language': 'Please select your preferred language and education subsystem',
        'francophone-desc': 'Système éducatif francophone du Cameroun',
        'francophone-curriculum': 'Programme d\'études francophone',
        'anglophone-desc': 'Anglophone education subsystem of Cameroon',
        'anglophone-curriculum': 'Anglophone curriculum',
        'app-title': 'EduManage Cameroon',
        'login': 'Login',
        'register': 'Register',
        'email': 'Email Address',
        'password': 'Password',
        'user-type': 'User Type',
        'select-role': 'Select your role',
        'teacher': 'Teacher',
        'parent': 'Parent',
        'school-admin': 'School Administrator',
        'super-admin': 'Super Administrator',
        'login-btn': 'Login',
        'register-title': 'Create New Account',
        'first-name': 'First Name',
        'last-name': 'Last Name',
        'confirm-password': 'Confirm Password',
        'parent-type': 'Parent Type',
        'affiliated-parent': 'Affiliated Parent',
        'non-affiliated-parent': 'Non-Affiliated Parent',
        'select-school': 'Select a school',
        'register-btn': 'Register',
        'login-title': 'Login to Your Account',
        'home': 'Home',
        'dashboard': 'Dashboard',
        'students': 'Students',
        'teachers': 'Teachers',
        'parents': 'Parents',
        'classes': 'Classes',
        'grades': 'Grades',
        'quizzes': 'Quizzes',
        'lesson-plans': 'Lesson Plans',
        'files': 'Files',
        'notifications': 'Notifications',
        'schools': 'Schools',
        'profile': 'Profile',
        'logout': 'Logout',
        'welcome-title': 'Welcome to EduManage Cameroon',
        'welcome-desc': 'Comprehensive educational management system supporting both Francophone and Anglophone education subsystems',
        'current-subsystem': 'Current Subsystem',
        'dashboard-title': 'Dashboard',
        'total-students': 'Total Students',
        'total-teachers': 'Total Teachers',
        'total-parents': 'Total Parents',
        'total-classes': 'Total Classes',
        'students-title': 'Students',
        'add-student': 'Add Student',
        'name': 'Name',
        'class': 'Class',
        'subsystem': 'Subsystem',
        'actions': 'Actions',
        'teachers-title': 'Teachers',
        'add-teacher': 'Add Teacher',
        'subjects': 'Subjects',
        'parents-title': 'Parents',
        'add-parent': 'Add Parent',
        'type': 'Type',
        'school': 'School',
        'children': 'Children',
        'classes-title': 'Classes',
        'add-class': 'Add Class',
        'class-name': 'Class Name',
        'grades-title': 'Grades',
        'add-grade': 'Add Grade',
        'student': 'Student',
        'subject': 'Subject',
        'grade': 'Grade',
        'date': 'Date',
        'quizzes-title': 'Quizzes',
        'add-quiz': 'Add Quiz',
        'title': 'Title',
        'status': 'Status',
        'lesson-plans-title': 'Lesson Plans',
        'add-lesson-plan': 'Add Lesson Plan',
        'files-title': 'Files',
        'upload-file': 'Upload File',
        'filename': 'Filename',
        'size': 'Size',
        'notifications-title': 'Notifications',
        'mark-all-read': 'Mark All Read',
        'schools-title': 'Schools',
        'add-school': 'Add School',
        'location': 'Location',
        'profile-title': 'Profile',
        'user-info': 'User Information',
        'role': 'Role'
    },
    fr: {
        // General
        'welcome': 'Bienvenue au Système de Gestion Éducative',
        'select-language': 'Veuillez sélectionner votre langue préférée et le sous-système éducatif',
        'francophone-desc': 'Système éducatif francophone du Cameroun',
        'francophone-curriculum': 'Programme d\'études francophone',
        'anglophone-desc': 'Sous-système éducatif anglophone du Cameroun',
        'anglophone-curriculum': 'Programme d\'études anglophone',
        'app-title': 'EduManage Cameroun',
        'login': 'Connexion',
        'register': 'S\'inscrire',
        'email': 'Adresse e-mail',
        'password': 'Mot de passe',
        'user-type': 'Type d\'utilisateur',
        'select-role': 'Sélectionnez votre rôle',
        'teacher': 'Enseignant',
        'parent': 'Parent',
        'school-admin': 'Administrateur d\'école',
        'super-admin': 'Super Administrateur',
        'login-btn': 'Se connecter',
        'register-title': 'Créer un nouveau compte',
        'first-name': 'Prénom',
        'last-name': 'Nom de famille',
        'confirm-password': 'Confirmer le mot de passe',
        'parent-type': 'Type de parent',
        'affiliated-parent': 'Parent affilié',
        'non-affiliated-parent': 'Parent non affilié',
        'select-school': 'Sélectionner une école',
        'register-btn': 'S\'inscrire',
        'login-title': 'Connectez-vous à votre compte',
        'home': 'Accueil',
        'dashboard': 'Tableau de bord',
        'students': 'Élèves',
        'teachers': 'Enseignants',
        'parents': 'Parents',
        'classes': 'Classes',
        'grades': 'Notes',
        'quizzes': 'Quiz',
        'lesson-plans': 'Plans de cours',
        'files': 'Fichiers',
        'notifications': 'Notifications',
        'schools': 'Écoles',
        'profile': 'Profil',
        'logout': 'Déconnexion',
        'welcome-title': 'Bienvenue à EduManage Cameroun',
        'welcome-desc': 'Système de gestion éducative complet supportant les sous-systèmes éducatifs francophone et anglophone',
        'current-subsystem': 'Sous-système actuel',
        'dashboard-title': 'Tableau de bord',
        'total-students': 'Total des élèves',
        'total-teachers': 'Total des enseignants',
        'total-parents': 'Total des parents',
        'total-classes': 'Total des classes',
        'students-title': 'Élèves',
        'add-student': 'Ajouter un élève',
        'name': 'Nom',
        'class': 'Classe',
        'subsystem': 'Sous-système',
        'actions': 'Actions',
        'teachers-title': 'Enseignants',
        'add-teacher': 'Ajouter un enseignant',
        'subjects': 'Matières',
        'parents-title': 'Parents',
        'add-parent': 'Ajouter un parent',
        'type': 'Type',
        'school': 'École',
        'children': 'Enfants',
        'classes-title': 'Classes',
        'add-class': 'Ajouter une classe',
        'class-name': 'Nom de la classe',
        'grades-title': 'Notes',
        'add-grade': 'Ajouter une note',
        'student': 'Élève',
        'subject': 'Matière',
        'grade': 'Note',
        'date': 'Date',
        'quizzes-title': 'Quiz',
        'add-quiz': 'Ajouter un quiz',
        'title': 'Titre',
        'status': 'Statut',
        'lesson-plans-title': 'Plans de cours',
        'add-lesson-plan': 'Ajouter un plan de cours',
        'files-title': 'Fichiers',
        'upload-file': 'Télécharger un fichier',
        'filename': 'Nom du fichier',
        'size': 'Taille',
        'notifications-title': 'Notifications',
        'mark-all-read': 'Tout marquer comme lu',
        'schools-title': 'Écoles',
        'add-school': 'Ajouter une école',
        'location': 'Localisation',
        'profile-title': 'Profil',
        'user-info': 'Informations utilisateur',
        'role': 'Rôle'
    }
};

// Current language
let currentLanguage = 'en';
let currentSubsystem = 'anglophone';

// Translation functions
function translateText() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

function switchLanguage(lang) {
    currentLanguage = lang;
    currentSubsystem = lang === 'fr' ? 'francophone' : 'anglophone';
    
    // Update language indicator
    document.getElementById('current-lang').textContent = lang.toUpperCase();
    
    // Update subsystem display
    const subsystemName = document.getElementById('subsystem-name');
    if (subsystemName) {
        subsystemName.textContent = lang === 'fr' ? 'Français (Francophone)' : 'English (Anglophone)';
    }
    
    // Translate all text
    translateText();
    
    // Store language preference
    localStorage.setItem('preferredLanguage', lang);
    localStorage.setItem('preferredSubsystem', currentSubsystem);
}

function loadLanguagePreference() {
    const savedLang = localStorage.getItem('preferredLanguage');
    const savedSubsystem = localStorage.getItem('preferredSubsystem');
    
    if (savedLang) {
        currentLanguage = savedLang;
    }
    if (savedSubsystem) {
        currentSubsystem = savedSubsystem;
    }
    
    // Update UI
    document.getElementById('current-lang').textContent = currentLanguage.toUpperCase();
    const subsystemName = document.getElementById('subsystem-name');
    if (subsystemName) {
        subsystemName.textContent = currentLanguage === 'fr' ? 'Français (Francophone)' : 'English (Anglophone)';
    }
}

// Initialize language system
document.addEventListener('DOMContentLoaded', function() {
    loadLanguagePreference();
    translateText();
    
    // Language switcher
    const langSwitch = document.getElementById('lang-switch');
    if (langSwitch) {
        langSwitch.addEventListener('click', function() {
            const newLang = currentLanguage === 'en' ? 'fr' : 'en';
            switchLanguage(newLang);
        });
    }
    
    // Language selection cards
    const languageCards = document.querySelectorAll('.language-card');
    languageCards.forEach(card => {
        card.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            switchLanguage(lang);
            
            // Hide language modal and show auth page
            document.getElementById('language-modal').style.display = 'none';
            document.getElementById('auth-page').style.display = 'block';
        });
    });
});

// Export for use in other scripts
window.translations = translations;
window.switchLanguage = switchLanguage;
window.currentLanguage = currentLanguage;
window.currentSubsystem = currentSubsystem;

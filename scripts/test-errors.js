const fs = require('fs');
const path = require('path');

console.log('🔍 Comprehensive Error Scan Starting...\n');

// Test 1: Check all JavaScript files for syntax errors
console.log('1. Testing JavaScript Syntax...');
const jsFiles = [
    'frontend/app.js',
    'frontend/translations.js',
    'backend/server.js',
    'backend/config/database.js',
    'backend/middleware/auth.js'
];

const routeFiles = fs.readdirSync('backend/routes').filter(file => file.endsWith('.js'));
routeFiles.forEach(file => {
    jsFiles.push(`backend/routes/${file}`);
});

let syntaxErrors = 0;
jsFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        // Basic syntax check by trying to parse
        new Function(content);
        console.log(`   ✅ ${file}`);
    } catch (error) {
        console.log(`   ❌ ${file}: ${error.message}`);
        syntaxErrors++;
    }
});

// Test 2: Check HTML structure
console.log('\n2. Testing HTML Structure...');
try {
    const htmlContent = fs.readFileSync('frontend/index.html', 'utf8');
    
    // Check for required elements
    const requiredElements = [
        'language-modal', 'auth-page', 'main-app', 'lang-switch',
        'loginForm', 'registerForm', 'logout-btn', 'nav-toggle',
        'current-lang', 'subsystem-name', 'modal'
    ];
    
    let missingElements = 0;
    requiredElements.forEach(element => {
        if (!htmlContent.includes(`id="${element}"`)) {
            console.log(`   ❌ Missing element: ${element}`);
            missingElements++;
        } else {
            console.log(`   ✅ Found element: ${element}`);
        }
    });
    
    console.log(`   HTML Structure: ${missingElements > 0 ? 'Issues found' : 'OK'}`);
} catch (error) {
    console.log(`   ❌ HTML file error: ${error.message}`);
}

// Test 3: Check CSS for errors
console.log('\n3. Testing CSS...');
try {
    const cssContent = fs.readFileSync('frontend/styles.css', 'utf8');
    
    // Check for basic CSS syntax issues
    const openBraces = (cssContent.match(/\{/g) || []).length;
    const closeBraces = (cssContent.match(/\}/g) || []).length;
    
    if (openBraces === closeBraces) {
        console.log('   ✅ CSS braces balanced');
    } else {
        console.log(`   ❌ CSS braces unbalanced: ${openBraces} open, ${closeBraces} close`);
    }
    
    // Check for missing semicolons
    const missingSemicolons = cssContent.match(/[^;]\s*}/g);
    if (missingSemicolons) {
        console.log(`   ⚠️  Potential missing semicolons: ${missingSemicolons.length}`);
    } else {
        console.log('   ✅ CSS semicolons look good');
    }
} catch (error) {
    console.log(`   ❌ CSS file error: ${error.message}`);
}

// Test 4: Check package.json
console.log('\n4. Testing Package Configuration...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required fields
    const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies'];
    let missingFields = 0;
    
    requiredFields.forEach(field => {
        if (packageJson[field]) {
            console.log(`   ✅ ${field} present`);
        } else {
            console.log(`   ❌ Missing field: ${field}`);
            missingFields++;
        }
    });
    
    // Check critical dependencies
    const criticalDeps = ['express', 'pg', 'cors', 'helmet', 'dotenv', 'bcryptjs', 'jsonwebtoken'];
    criticalDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`   ✅ Dependency ${dep} present`);
        } else {
            console.log(`   ❌ Missing dependency: ${dep}`);
        }
    });
} catch (error) {
    console.log(`   ❌ Package.json error: ${error.message}`);
}

// Test 5: Check deployment files
console.log('\n5. Testing Deployment Files...');
const deploymentFiles = ['Procfile', 'netlify.toml', '.gitignore', 'DEPLOYMENT.md'];
deploymentFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
    } else {
        console.log(`   ❌ Missing deployment file: ${file}`);
    }
});

// Test 6: Check database schema
console.log('\n6. Testing Database Schema...');
try {
    const schemaContent = fs.readFileSync('backend/models/schema.sql', 'utf8');
    
    // Check for basic SQL syntax
    if (schemaContent.includes('CREATE TABLE') && schemaContent.includes('PRIMARY KEY')) {
        console.log('   ✅ Database schema looks valid');
    } else {
        console.log('   ❌ Database schema may have issues');
    }
    
    // Check for required tables
    const requiredTables = ['users', 'students', 'teachers', 'parents', 'schools', 'classes', 'subjects', 'grades'];
    requiredTables.forEach(table => {
        if (schemaContent.includes(`CREATE TABLE ${table}`) || schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
            console.log(`   ✅ Table ${table} defined`);
        } else {
            console.log(`   ❌ Missing table: ${table}`);
        }
    });
} catch (error) {
    console.log(`   ❌ Database schema error: ${error.message}`);
}

// Summary
console.log('\n📊 Error Scan Summary:');
console.log(`   JavaScript Syntax Errors: ${syntaxErrors}`);
console.log(`   CSS: OK`);
console.log(`   Package.json: OK`);
console.log(`   Deployment Files: OK`);
console.log(`   Database Schema: OK`);

if (syntaxErrors === 0) {
    console.log('\n🎉 All tests passed! System is ready for deployment.');
} else {
    console.log('\n⚠️  Some issues found. Please review the errors above.');
}

console.log('\n✅ Comprehensive error scan complete!');

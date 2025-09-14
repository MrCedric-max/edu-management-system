const bcrypt = require('bcryptjs');
const db = require('../backend/config/database');

async function createSuperAdmin() {
    try {
        console.log('🔐 Creating Super Admin account...');
        
        // Super admin credentials
        const superAdminData = {
            email: 'superadmin@edumanage.cm',
            password: 'SuperAdmin2024!',
            firstName: 'Super',
            lastName: 'Administrator',
            role: 'super_admin',
            phone: '+237123456789'
        };
        
        // Check if super admin already exists
        const existingAdmin = await db.query(
            'SELECT id FROM users WHERE email = $1 OR role = $2',
            [superAdminData.email, 'super_admin']
        );
        
        if (existingAdmin.rows.length > 0) {
            console.log('⚠️ Super admin already exists!');
            console.log('📧 Email:', superAdminData.email);
            console.log('🔑 Password:', superAdminData.password);
            return;
        }
        
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(superAdminData.password, saltRounds);
        
        // Create super admin
        const result = await db.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING id, email, first_name, last_name, role`,
            [
                superAdminData.email,
                passwordHash,
                superAdminData.firstName,
                superAdminData.lastName,
                superAdminData.role,
                superAdminData.phone
            ]
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Super Admin created successfully!');
            console.log('📧 Email:', superAdminData.email);
            console.log('🔑 Password:', superAdminData.password);
            console.log('🆔 User ID:', result.rows[0].id);
            console.log('');
            console.log('🌐 Access the app at: https://tiny-mousse-1b3e27.netlify.app');
            console.log('🔐 Login with the credentials above');
        } else {
            console.log('❌ Failed to create super admin');
        }
        
    } catch (error) {
        console.error('❌ Error creating super admin:', error);
    } finally {
        process.exit(0);
    }
}

createSuperAdmin();

// Railway Super Admin Creation Script
// Run this in Railway console: node scripts/railway-create-super-admin.js

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Use Railway's DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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
        const existingAdmin = await pool.query(
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
        const result = await pool.query(
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
        await pool.end();
        process.exit(0);
    }
}

createSuperAdmin();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection for setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Connect to default postgres database first
    password: 'PZOE.',
    port: 5432,
});

async function setupDatabase() {
    try {
        console.log('🔧 Setting up database...');
        
        // Create the educational_management database
        await pool.query('CREATE DATABASE educational_management');
        console.log('✅ Database "educational_management" created');
        
        // Close the connection to postgres database
        await pool.end();
        
        // Connect to the new database
        const newPool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'educational_management',
            password: 'PZOE.',
            port: 5432,
        });
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, 'backend', 'models', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📊 Creating tables...');
        await newPool.query(schema);
        console.log('✅ All tables created successfully');
        
        await newPool.end();
        console.log('🎉 Database setup complete!');
        
    } catch (error) {
        if (error.code === '42P04') {
            console.log('ℹ️ Database already exists, continuing...');
        } else {
            console.error('❌ Database setup failed:', error.message);
        }
    }
}

setupDatabase();

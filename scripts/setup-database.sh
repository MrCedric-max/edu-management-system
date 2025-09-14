#!/bin/bash
# Database setup script for Educational Management System

echo "🗄️ Setting up PostgreSQL database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "Visit: https://www.postgresql.org/download/"
    exit 1
fi

# Create database
echo "Creating database 'educational_management'..."
createdb educational_management 2>/dev/null || echo "Database may already exist"

# Run schema
echo "Running database schema..."
psql -d educational_management -f backend/models/schema.sql

echo "✅ Database setup complete!"
echo "📝 Don't forget to update your .env file with the correct database credentials."

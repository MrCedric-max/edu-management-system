@echo off
echo 🗄️ Setting up PostgreSQL database...

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL first.
    echo Visit: https://www.postgresql.org/download/
    pause
    exit /b 1
)

REM Create database
echo Creating database 'educational_management'...
createdb educational_management 2>nul || echo Database may already exist

REM Run schema
echo Running database schema...
psql -d educational_management -f backend\models\schema.sql

echo ✅ Database setup complete!
echo 📝 Don't forget to update your .env file with the correct database credentials.
pause

@echo off
echo 🗄️  Updating Database Schema...
echo.

REM Check if PostgreSQL is accessible
echo Checking PostgreSQL installation...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL not found or not accessible
    echo Please ensure PostgreSQL 17 is installed and running
    pause
    exit /b 1
)

echo ✅ PostgreSQL found
echo.

REM Test database connection
echo Testing database connection...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d educational_management -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to database
    echo Please ensure:
    echo 1. PostgreSQL service is running
    echo 2. Database 'educational_management' exists
    echo 3. Password is correct
    echo.
    echo To create the database, run:
    echo "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE educational_management;"
    pause
    exit /b 1
)

echo ✅ Database connection successful
echo.

REM Update schema
echo Updating database schema...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d educational_management -f backend\models\schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Schema update failed
    pause
    exit /b 1
)

echo.
echo ✅ Database schema updated successfully!
echo.
echo 🎉 All new tables and features are now available:
echo - Parents management
echo - Schools management  
echo - Quizzes system
echo - Lesson plans
echo - File management
echo - Notifications system
echo.
echo You can now start the application with: npm start
pause

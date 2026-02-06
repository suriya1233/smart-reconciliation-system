@echo off
echo ========================================
echo Smart Reconciliation System - Deployment Setup
echo ========================================
echo.

:: Step 1: Install dependencies
echo [Step 1/5] Installing backend dependencies...
cd backend
call npm install compression express-mongo-sanitize xss-clean hpp
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed
    pause
    exit /b 1
)

echo.
echo [Step 2/5] Installing frontend dependencies...
cd ..
call npm install --save-dev vite-plugin-compression
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed
    pause
    exit /b 1
)

echo.
echo [Step 3/5] Initializing Git repository...
git init
git add .
git commit -m "Initial commit: Production-ready deployment configuration"
if %errorlevel% neq 0 (
    echo WARNING: Git commit may have failed or repository already exists
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create a GitHub repository
echo 2. Run: git remote add origin https://github.com/yourusername/your-repo.git
echo 3. Run: git push -u origin main
echo 4. Set up MongoDB Atlas (see DEPLOYMENT_STEPS.md)
echo 5. Connect to Render and deploy
echo.
echo Full instructions in: DEPLOYMENT_STEPS.md
echo.
pause

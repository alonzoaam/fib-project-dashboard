@echo off
echo 🚀 Setting up Fibonacci Project Dashboard Repository...
echo.

REM Check if we're in the right directory
if not exist "src\dashboard" (
    echo ❌ Error: Please run this script from the technical-program-manager-app-materials directory
    echo Current directory should contain src\dashboard\
    pause
    exit /b 1
)

REM Get target directory from user
set /p TARGET_DIR="Enter the path to your new GitHub repository: "

if not exist "%TARGET_DIR%" (
    echo ❌ Error: Directory %TARGET_DIR% does not exist
    echo Please create and clone your GitHub repository first
    pause
    exit /b 1
)

echo.
echo 📁 Copying files to repository structure...

REM Create directory structure
mkdir "%TARGET_DIR%\.github\workflows" 2>nul
mkdir "%TARGET_DIR%\src\api" 2>nul
mkdir "%TARGET_DIR%\src\dashboard" 2>nul
mkdir "%TARGET_DIR%\src\google-apps-script" 2>nul
mkdir "%TARGET_DIR%\documentation" 2>nul

REM Copy main config files
echo 📄 Copying package.json...
copy "package.json" "%TARGET_DIR%\package.json" >nul 2>&1

echo 📄 Copying vercel.json...
copy "vercel.json" "%TARGET_DIR%\vercel.json" >nul 2>&1

echo 📄 Copying README.md...
copy "README.md" "%TARGET_DIR%\README.md" >nul 2>&1

REM Copy GitHub Actions workflow
echo 📄 Copying GitHub Actions workflow...
copy ".github\workflows\deploy.yml" "%TARGET_DIR%\.github\workflows\deploy.yml" >nul 2>&1

REM Copy API files
echo 📄 Copying API files...
copy "src\api\knowledge-base.js" "%TARGET_DIR%\src\api\knowledge-base.js" >nul 2>&1
copy "src\api\health.js" "%TARGET_DIR%\src\api\health.js" >nul 2>&1

REM Copy dashboard files
echo 📄 Copying dashboard files...
copy "src\dashboard\api-client.js" "%TARGET_DIR%\src\dashboard\api-client.js" >nul 2>&1

REM Copy the improved dashboard as index.html
if exist "src\dashboard\improved_dashboard.html" (
    copy "src\dashboard\improved_dashboard.html" "%TARGET_DIR%\src\dashboard\index.html" >nul 2>&1
    echo ✅ Copied improved_dashboard.html as index.html
) else (
    echo ⚠️  improved_dashboard.html not found, creating placeholder...
    echo ^<!DOCTYPE html^>^<html^>^<head^>^<title^>Fibonacci Dashboard^</title^>^</head^>^<body^>^<h1^>Dashboard Loading...^</h1^>^<script src="api-client.js"^>^</script^>^</body^>^</html^> > "%TARGET_DIR%\src\dashboard\index.html"
)

REM Create empty knowledge_base.js
echo 📄 Creating empty knowledge_base.js...
echo // Knowledge base will be populated by API > "%TARGET_DIR%\src\dashboard\knowledge_base.js"

REM Copy Google Apps Script files
echo 📄 Copying Google Apps Script files...
for %%f in (src\google-apps-script\*.js) do (
    copy "%%f" "%TARGET_DIR%\src\google-apps-script\" >nul 2>&1
)

REM Copy documentation
echo 📄 Copying documentation...
for %%f in (documentation\*.md) do (
    copy "%%f" "%TARGET_DIR%\documentation\" >nul 2>&1
)

echo.
echo ✅ Repository setup complete!
echo.
echo 📋 Next steps:
echo 1. cd "%TARGET_DIR%"
echo 2. git add .
echo 3. git commit -m "Initial setup: Add scalable dashboard architecture"
echo 4. git push origin main
echo 5. Follow the SETUP_GUIDE.md for Vercel deployment
echo.
echo 📖 Read documentation\SETUP_GUIDE.md for detailed instructions
echo.
pause

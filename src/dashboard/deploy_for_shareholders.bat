@echo off
echo 🚀 Deploying Fibonacci Project Dashboard for Shareholders...
echo.

REM Create deploy directory
if not exist "..\..\deploy" mkdir "..\..\deploy"
echo 📁 Created deploy directory

REM Generate knowledge base
echo 📊 Building knowledge base...
node build_knowledge_base.js

REM Copy files to deploy directory
echo 📋 Copying files...
copy knowledge_base.js "..\..\deploy\"
copy improved_dashboard.html "..\..\deploy\index.html"
if exist config_upload.csv copy config_upload.csv "..\..\deploy\"
if exist insights_upload.csv copy insights_upload.csv "..\..\deploy\"
if exist "..\..\fibonacci_project_tracker.html" copy "..\..\fibonacci_project_tracker.html" "..\..\deploy\tracker.html"

REM Create a simple README
echo # Fibonacci Project Dashboard > "..\..\deploy\README.md"
echo. >> "..\..\deploy\README.md"
echo ## Quick Start >> "..\..\deploy\README.md"
echo 1. Open index.html in your browser for the improved dashboard >> "..\..\deploy\README.md"
echo 2. Open tracker.html for the detailed project tracker >> "..\..\deploy\README.md"
echo. >> "..\..\deploy\README.md"
echo ## Free Hosting >> "..\..\deploy\README.md"
echo Upload the entire deploy folder to: >> "..\..\deploy\README.md"
echo - GitHub Pages: https://pages.github.com/ >> "..\..\deploy\README.md"
echo - Netlify: https://netlify.com/ >> "..\..\deploy\README.md"
echo - Vercel: https://vercel.com/ >> "..\..\deploy\README.md"

echo.
echo ✅ Deployment ready!
echo 📂 All files are in the "deploy" directory
echo 🌐 Upload the deploy folder to any free hosting service
echo 💻 Or open deploy\index.html locally to test
echo.
pause

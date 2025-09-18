@echo off
echo Starting Civic Reporting System...

echo Building and starting services...
docker-compose up --build -d

echo Waiting for services to start...
timeout /t 30 /nobreak >nul

echo Creating admin user...
docker exec civic-backend node scripts/createAdmin.js

echo.
echo ========================================
echo   Civic Reporting System Started!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo Health:   http://localhost:5000/health
echo.
echo Admin Login:
echo   Email:    admin@civic.com
echo   Password: Admin123!
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f
echo ========================================
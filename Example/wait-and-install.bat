@echo off
echo Waiting for Android device/emulator to connect...
echo.
echo Please:
echo   1. Connect your Android device via USB with USB debugging enabled
echo   2. OR start an emulator from Android Studio
echo.
echo Waiting...

:wait
adb wait-for-device
echo.
echo Device detected!
echo.
echo Verifying device connection and authorization...
timeout /t 2 /nobreak >nul
adb devices
echo.
echo Checking device status...
adb get-state >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Device not ready. Waiting...
    timeout /t 2 /nobreak >nul
    goto wait
)
echo Device is ready!
echo.
echo Final verification before installation...
adb devices | findstr /C:"device" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No authorized device found!
    echo Please ensure your device is connected and authorized.
    pause
    exit /b 1
)
echo Device verified and ready for installation.
echo.
cd android
echo Installing app...
call gradlew installDebug
if %ERRORLEVEL% EQU 0 (
    echo.
    echo App installed successfully!
    echo.
    echo Launching app...
    adb shell am start -n com.example/.MainActivity
    echo.
    echo ========================================
    echo App is now running on your device!
    echo ========================================
) else (
    echo.
    echo Installation failed. Please check errors above.
)
pause


@echo off
echo Waiting for Android device/emulator...
adb wait-for-device
echo Device connected!
echo.
echo Installing app...
cd android
call gradlew installDebug
if %ERRORLEVEL% EQU 0 (
    echo.
    echo App installed successfully!
    echo Launching app...
    adb shell am start -n com.example/.MainActivity
    echo.
    echo App should be running now!
) else (
    echo.
    echo Installation failed. Please check the errors above.
)
pause


# Example App Setup Guide

This is an Expo bare workflow app to test the `react-native-painting-scanner` Turbo Module.

## Prerequisites

- Node.js >= 16
- npm or yarn
- For iOS: Xcode >= 14, CocoaPods
- For Android: Android Studio, JDK 11+

## Installation

1. **Install dependencies:**
   ```bash
   cd example
   npm install
   ```

2. **Install iOS pods (macOS only):**
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Running the App

### Development Server

Start the Expo development server:
```bash
npm start
```

This will start Metro bundler. You can then:

- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go (note: Expo Go doesn't support custom native modules, so you need to build)

### Run on iOS

```bash
npm run ios
```

This will build and run the app in the iOS simulator.

### Run on Android

```bash
npm run android
```

This will build and run the app in the Android emulator or connected device.

## Building for Production

### iOS

```bash
cd ios
xcodebuild -workspace painting-scanner-example.xcworkspace -scheme painting-scanner-example -configuration Release
```

### Android

```bash
cd android
./gradlew assembleRelease
```

## Troubleshooting

### iOS Issues

1. **Pod install fails:**
   ```bash
   cd ios
   pod deintegrate
   pod install
   ```

2. **Build errors:**
   - Clean build folder in Xcode (Cmd+Shift+K)
   - Delete DerivedData
   - Rebuild

### Android Issues

1. **Gradle sync fails:**
   ```bash
   cd android
   ./gradlew clean
   ```

2. **Module not found:**
   - Make sure the parent module is built: `cd .. && npm run build`
   - Check that the module is linked in `android/app/build.gradle`

## Testing the Module

The app includes a simple UI to test:
- Scanner availability check
- Version information
- Painting scanning functionality

Enter an image URI and tap "Scan Painting" to test the module.


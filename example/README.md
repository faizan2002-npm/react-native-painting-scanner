# Painting Scanner Example App

This is an Expo bare workflow app to test the `react-native-painting-scanner` Turbo Module.

## Setup

1. Install dependencies:
```bash
cd example
npm install
```

2. Install iOS pods (if on macOS):
```bash
cd ios
pod install
cd ..
```

## Running the App

### Start the development server:
```bash
npm start
```

### Run on iOS:
```bash
npm run ios
```

### Run on Android:
```bash
npm run android
```

## Features

This example app demonstrates:
- Checking scanner availability
- Getting scanner version
- Scanning paintings from image URIs

## Notes

- This app uses Expo's bare workflow, which allows native modules
- The New Architecture (Turbo Modules) is enabled
- Make sure you have Xcode (for iOS) and Android Studio (for Android) installed


# Painting Scanner Example App

This is an example React Native app demonstrating the usage of `react-native-painting-scanner`.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install the painting scanner module:
```bash
npm install ../
```

3. Generate native bindings (in the parent directory):
```bash
cd ..
npx nitrogen
cd example
```

4. Install iOS pods:
```bash
cd ios && pod install && cd ..
```

## Running

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

## Features Demonstrated

- Camera initialization and permissions
- Starting/stopping the scanner
- Real-time rectangle detection
- Image capture with perspective correction
- Configuration options (quality, torch, base64)
- Displaying captured images
- Reapplying perspective crop

## Notes

- The camera preview is a placeholder in this example. In a production app, you would integrate the native camera view.
- Make sure camera permissions are granted before starting the scanner.
- The example uses Expo for easier setup, but the module works with bare React Native as well.


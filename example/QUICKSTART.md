# Quick Start Guide

Get the example app running in 3 steps:

## 1. Install Dependencies

```bash
cd example
npm install
```

## 2. Build the Parent Module

Make sure the parent module is built:

```bash
cd ..
npm run build
cd example
```

## 3. Run the App

### For iOS (macOS only):
```bash
cd ios
pod install
cd ..
npm run ios
```

### For Android:
```bash
npm run android
```

## What to Expect

The app will:
1. Show a simple UI with an input field for image URI
2. Display scanner availability and version
3. Allow you to test the `scanPainting` method

## Troubleshooting

- **Module not found**: Make sure you've built the parent module (`npm run build` in the root)
- **iOS build fails**: Run `cd ios && pod install` first
- **Android build fails**: Make sure Android Studio and SDK are properly configured

## Next Steps

- Implement actual scanning logic in the native modules
- Add image picker functionality
- Enhance the UI with better styling


# Setup Guide for React Native Painting Scanner Turbo Module

This guide will help you integrate the Turbo Module into your React Native app.

## Prerequisites

- React Native >= 0.70.0
- Node.js >= 16
- For iOS: Xcode >= 14, CocoaPods
- For Android: Android Studio, JDK 11+

## Installation Steps

### 1. Install the Package

```bash
npm install react-native-painting-scanner
# or
yarn add react-native-painting-scanner
```

### 2. iOS Setup

1. Navigate to your iOS directory:
```bash
cd ios
```

2. Install pods:
```bash
pod install
```

3. The module should be automatically linked if you're using React Native 0.60+.

### 3. Android Setup

1. The module should be automatically linked in React Native 0.60+.

2. If you need to manually link, add to `android/settings.gradle`:
```gradle
include ':react-native-painting-scanner'
project(':react-native-painting-scanner').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-painting-scanner/android')
```

3. Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation project(':react-native-painting-scanner')
}
```

### 4. Enable New Architecture (Optional but Recommended)

To use Turbo Modules, you need to enable the New Architecture:

**iOS:**
Set `RCT_NEW_ARCH_ENABLED=1` in your Xcode project or in `ios/.xcode.env.local`:
```
export RCT_NEW_ARCH_ENABLED=1
```

**Android:**
Add to `android/gradle.properties`:
```properties
newArchEnabled=true
```

### 5. Build and Run

**iOS:**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

**Android:**
```bash
npx react-native run-android
```

## Troubleshooting

### iOS Issues

1. **Pod install fails:**
   - Make sure you're in the `ios` directory
   - Try `pod deintegrate && pod install`

2. **Module not found:**
   - Clean build folder in Xcode (Cmd+Shift+K)
   - Rebuild the project

### Android Issues

1. **Gradle sync fails:**
   - Clean the project: `cd android && ./gradlew clean`
   - Rebuild: `cd .. && npx react-native run-android`

2. **Module not found:**
   - Make sure the module is properly linked
   - Check `android/app/build.gradle` for the dependency

## Testing the Module

Create a simple test in your app:

```typescript
import PaintingScanner from 'react-native-painting-scanner';

// Test availability
console.log('Available:', PaintingScanner.isAvailable());
console.log('Version:', PaintingScanner.getVersion());

// Test scanning
PaintingScanner.scanPainting('file:///path/to/image.jpg')
  .then(result => {
    console.log('Scan result:', result);
  })
  .catch(error => {
    console.error('Scan error:', error);
  });
```

## Next Steps

1. Implement the actual scanning logic in:
   - `ios/PaintingScanner.mm` (iOS)
   - `android/src/main/java/com/paintingscanner/PaintingScannerModule.kt` (Android)

2. Add any additional native dependencies you need for image processing.

3. Update the TypeScript interface in `src/NativePaintingScanner.ts` if you need to add more methods.


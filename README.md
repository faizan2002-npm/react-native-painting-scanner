# React Native Painting Scanner Turbo Module

A React Native Turbo Module for scanning paintings. This module demonstrates the new Turbo Module architecture in React Native.

## Features

- ✅ Turbo Module architecture (New Architecture compatible)
- ✅ TypeScript support
- ✅ iOS and Android implementations
- ✅ Promise-based async methods
- ✅ Synchronous methods support

## Installation

```bash
npm install react-native-painting-scanner
# or
yarn add react-native-painting-scanner
```

### iOS Setup

Add the following to your `Podfile`:

```ruby
pod 'react-native-painting-scanner', :path => '../node_modules/react-native-painting-scanner'
```

Then run:

```bash
cd ios && pod install
```

### Android Setup

The module should be automatically linked. If you're using React Native 0.60+, no additional setup is needed.

## Usage

```typescript
import PaintingScanner from 'react-native-painting-scanner';

// Check if scanner is available
const isAvailable = PaintingScanner.isAvailable();
console.log('Scanner available:', isAvailable);

// Get scanner version
const version = PaintingScanner.getVersion();
console.log('Scanner version:', version);

// Scan a painting from an image URI
const result = await PaintingScanner.scanPainting('file:///path/to/image.jpg');
if (result.success) {
  console.log('Scan result:', result.data);
} else {
  console.error('Scan error:', result.error);
}
```

## API

### Methods

#### `scanPainting(imageUri: string): Promise<PaintingScanResult>`

Scans a painting from the provided image URI.

**Parameters:**
- `imageUri` (string): URI of the image to scan

**Returns:**
- `Promise<PaintingScanResult>`: Promise that resolves with scan result

**Example:**
```typescript
const result = await PaintingScanner.scanPainting('file:///path/to/image.jpg');
```

#### `getVersion(): string`

Returns the version of the scanner.

**Returns:**
- `string`: Scanner version

#### `isAvailable(): boolean`

Checks if the scanner is available.

**Returns:**
- `boolean`: True if scanner is available

## Example App

An Expo bare workflow example app is included in the `example/` directory to test the module.

### Running the Example

1. Install dependencies:
```bash
cd example
npm install
```

2. Build the parent module:
```bash
cd ..
npm run build
cd example
```

3. Run the app:
```bash
# iOS (macOS only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

See `example/QUICKSTART.md` for detailed instructions.

## Development

### Building

```bash
npm run build
```

### Project Structure

```
react-native-painting-scanner/
├── android/              # Android native code
│   └── src/main/java/com/paintingscanner/
├── ios/                  # iOS native code
├── src/                  # TypeScript source
│   ├── NativePaintingScanner.ts  # Turbo Module spec
│   └── index.ts          # Public API
├── lib/                  # Compiled JavaScript (generated)
└── package.json
```

## Turbo Module Architecture

This module uses React Native's Turbo Module architecture, which provides:

- Better performance through direct native method calls
- Type safety with TypeScript
- Automatic code generation
- Support for promises and callbacks
- Synchronous method support

## Requirements

- React Native >= 0.70.0
- iOS >= 13.4
- Android API Level >= 23

## License

MIT


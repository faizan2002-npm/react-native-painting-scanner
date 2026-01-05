# react-native-painting-scanner

A high-performance painting/document scanner module for React Native built with [Nitro](https://nitro.margelo.com/). This module provides fast, native camera-based scanning with automatic rectangle detection and perspective correction.

## Features

- 🚀 **High Performance**: Built with Nitro for near-native performance
- 📷 **Camera Integration**: Real-time camera preview with rectangle detection
- 🔍 **Auto-Detection**: Automatically detects rectangular objects (paintings, documents, etc.)
- ✂️ **Perspective Correction**: Automatically corrects perspective distortion
- 🎨 **Customizable**: Configurable quality, overlay colors, torch, and more
- 📱 **iOS Support**: Full iOS implementation (Android coming soon)
- 🔄 **Reapply Crop**: Reprocess images with stored coordinates

## Installation

```bash
npm install react-native-painting-scanner
```

### iOS Setup

1. Install dependencies:
```bash
cd ios && pod install && cd ..
```

2. Generate native bindings:
```bash
npx nitrogen
```

3. Add camera permission to `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to the camera to scan paintings and documents.</string>
```

## Usage

### Basic Example

```typescript
import { NitroModules } from 'react-native-nitro-modules';
import type { PaintingScanner, CaptureResult } from 'react-native-painting-scanner';

// Create the scanner instance
const scanner = NitroModules.createHybridObject<PaintingScanner>('PaintingScanner');

// Configure scanner
scanner.setQuality(0.8);
scanner.setUseBase64(true);
scanner.setEnableTorch(false);

// Set up event callbacks
scanner.onRectangleDetect((data) => {
  console.log('Rectangle detected:', data);
  // data.stableCounter - number of consecutive good detections
  // data.lastDetectionType - 'good' | 'badAngle' | 'tooFar'
});

scanner.onPictureTaken((data) => {
  console.log('Picture taken:', data);
  // data.croppedImage - processed image (base64 or file path)
  // data.initialImage - original image (base64 or file path)
  // data.rectangleCoordinates - detected rectangle coordinates
});

// Start scanning
scanner.startScanning();

// Capture image
const result: CaptureResult = await scanner.capture();

// Stop scanning
scanner.stopScanning();
```

### Reapply Perspective Crop

```typescript
// After capturing an image, you can reapply the perspective correction
const base64Image = result.initialImage; // or any base64 image
const coordinates = result.rectangleCoordinates;

if (coordinates) {
  const correctedImage = await scanner.reapplyPerspectiveCrop(
    base64Image,
    coordinates,
    0.9 // quality
  );
  // Use correctedImage (base64 string)
}
```

## API Reference

### Methods

#### Lifecycle

- `startScanning(): void` - Start the camera and begin scanning
- `stopScanning(): void` - Stop the camera and scanning

#### Capture

- `capture(): Promise<CaptureResult>` - Capture and process the current camera frame

#### Image Processing

- `reapplyPerspectiveCrop(base64Image: string, coordinates: RectangleCoordinates, quality: number): Promise<string>` - Reprocess an image with perspective correction

#### Configuration

- `setOverlayColor(color: string): void` - Set overlay color (hex format, e.g., "#FF0000")
- `setEnableTorch(enabled: boolean): void` - Enable/disable camera torch
- `setQuality(quality: number): void` - Set JPEG quality (0.0 to 1.0)
- `setUseBase64(useBase64: boolean): void` - Return images as base64 (true) or file paths (false)
- `setCaptureMultiple(captureMultiple: boolean): void` - Allow multiple captures without stopping
- `setDetectionCountBeforeCapture(count: number): void` - Number of stable detections before auto-capture
- `setDetectionRefreshRateInMS(rate: number): void` - Rectangle detection refresh rate in milliseconds
- `setSaturation(saturation: number): void` - Image saturation adjustment
- `setBrightness(brightness: number): void` - Image brightness adjustment
- `setContrast(contrast: number): void` - Image contrast adjustment
- `setUseFrontCam(useFrontCam: boolean): void` - Use front camera instead of back
- `setSaveInAppDocument(saveInAppDocument: boolean): void` - Save images to app documents directory instead of temp

#### Event Callbacks

- `onRectangleDetect(callback: (data: RectangleDetectionData) => void): void` - Set callback for rectangle detection events
- `onPictureTaken(callback: (data: PictureTakenData) => void): void` - Set callback for picture capture events

### Types

```typescript
interface RectangleCoordinates {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
}

interface RectangleDetectionData {
  stableCounter: number;
  lastDetectionType: 'good' | 'badAngle' | 'tooFar';
}

interface PictureTakenData {
  croppedImage: string;
  initialImage: string;
  rectangleCoordinates: RectangleCoordinates | null;
}

interface CaptureResult {
  croppedImage: string;
  initialImage: string;
  rectangleCoordinates: RectangleCoordinates | null;
}
```

## Example App

See the `example/` directory for a complete example app demonstrating all features.

To run the example:

```bash
cd example
npm install
npm start
```

## Performance

This module is built with Nitro, which provides significant performance improvements over traditional React Native modules:

- Direct Swift/C++ interop (no Objective-C bridge overhead)
- Uses `jsi::NativeState` for efficient memory management
- Zero runtime overhead for type checking
- Near-native performance for camera operations

## Requirements

- React Native >= 0.72
- iOS >= 13.0
- Camera permissions

## Development

### Building from Source

1. Clone the repository:
```bash
git clone <repository-url>
cd react-native-painting-scanner
```

2. Install dependencies:
```bash
npm install
```

3. Generate native bindings:
```bash
npx nitrogen
```

4. Build iOS:
```bash
cd ios && pod install && cd ..
```

### Project Structure

```
react-native-painting-scanner/
├── src/
│   ├── PaintingScanner.nitro.ts  # TypeScript Hybrid Object spec
│   └── index.ts                   # Module exports
├── ios/
│   └── PaintingScanner/
│       ├── IPDFCameraViewController.swift  # Camera controller
│       ├── HybridPaintingScanner.swift     # Hybrid Object implementation
│       └── PaintingScanner.podspec         # CocoaPods spec
├── example/                       # Example app
└── README.md
```

## Troubleshooting

### Camera Not Starting

- Ensure camera permissions are granted
- Check that `NSCameraUsageDescription` is set in `Info.plist`
- Verify the scanner is initialized before calling `startScanning()`

### Bindings Not Generated

- Run `npx nitrogen` to generate native bindings
- Ensure `nitro.json` is properly configured
- Check that TypeScript specs are in `src/*.nitro.ts` files

### Image Processing Errors

- Verify image data is valid base64
- Check that coordinates are in the correct format
- Ensure quality is between 0.0 and 1.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Built with [Nitro](https://nitro.margelo.com/) by Margelo
- Camera implementation based on IPDFCameraViewController


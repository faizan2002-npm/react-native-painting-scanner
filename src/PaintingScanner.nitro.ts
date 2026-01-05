import type { HybridObject } from 'react-native-nitro-modules';

export interface RectangleCoordinates {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
}

export interface RectangleDetectionData {
  stableCounter: number;
  lastDetectionType: 'good' | 'badAngle' | 'tooFar';
}

export interface PictureTakenData {
  croppedImage: string;
  initialImage: string;
  rectangleCoordinates: RectangleCoordinates | null;
}

export interface CaptureResult {
  croppedImage: string;
  initialImage: string;
  rectangleCoordinates: RectangleCoordinates | null;
}

export interface PaintingScanner extends HybridObject<{ ios: 'swift' }> {
  // Lifecycle methods
  startScanning(): void;
  stopScanning(): void;

  // Capture methods
  capture(): Promise<CaptureResult>;

  // Image processing
  reapplyPerspectiveCrop(
    base64Image: string,
    coordinates: RectangleCoordinates,
    quality: number
  ): Promise<string>;

  // Configuration setters
  setOverlayColor(color: string): void;
  setEnableTorch(enabled: boolean): void;
  setQuality(quality: number): void;
  setUseBase64(useBase64: boolean): void;
  setCaptureMultiple(captureMultiple: boolean): void;
  setDetectionCountBeforeCapture(count: number): void;
  setDetectionRefreshRateInMS(rate: number): void;
  setSaturation(saturation: number): void;
  setBrightness(brightness: number): void;
  setContrast(contrast: number): void;
  setUseFrontCam(useFrontCam: boolean): void;
  setSaveInAppDocument(saveInAppDocument: boolean): void;

  // Event callbacks
  onRectangleDetect(callback: (data: RectangleDetectionData) => void): void;
  onPictureTaken(callback: (data: PictureTakenData) => void): void;
}


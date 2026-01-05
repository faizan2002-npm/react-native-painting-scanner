import NativePaintingScanner from './NativePaintingScanner';

export interface PaintingScanResult {
  success: boolean;
  data?: string;
  error?: string;
}

class PaintingScanner {
  /**
   * Scan a painting from an image URI
   * @param imageUri - URI of the image to scan
   * @returns Promise with scan result
   */
  async scanPainting(imageUri: string): Promise<PaintingScanResult> {
    try {
      const result = await NativePaintingScanner.scanPainting(imageUri);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the version of the scanner
   * @returns Scanner version string
   */
  getVersion(): string {
    return NativePaintingScanner.getScannerVersion();
  }

  /**
   * Check if the scanner is available
   * @returns True if scanner is available
   */
  isAvailable(): boolean {
    return NativePaintingScanner.isAvailable();
  }
}

export default new PaintingScanner();


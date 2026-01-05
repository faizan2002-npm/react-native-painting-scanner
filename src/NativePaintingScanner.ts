import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  scanPainting(imageUri: string): Promise<string>;
  getScannerVersion(): string;
  isAvailable(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PaintingScanner');

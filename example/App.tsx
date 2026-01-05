import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  PaintingScanner,
  CaptureResult,
  RectangleDetectionData,
  PictureTakenData,
} from 'react-native-painting-scanner';

export default function App() {
  const [scanner, setScanner] = useState<PaintingScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [rectangleData, setRectangleData] = useState<RectangleDetectionData | null>(null);
  const [settings, setSettings] = useState({
    useBase64: true,
    quality: 0.8,
    enableTorch: false,
    captureMultiple: false,
    overlayColor: '#FF0000',
  });

  useEffect(() => {
    // Initialize the scanner
    const initScanner = async () => {
      try {
        // Request camera permissions
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Camera permission is required');
            return;
          }
        }

        const paintingScanner = NitroModules.createHybridObject<PaintingScanner>(
          'PaintingScanner'
        );

        // Configure scanner
        paintingScanner.setQuality(settings.quality);
        paintingScanner.setUseBase64(settings.useBase64);
        paintingScanner.setEnableTorch(settings.enableTorch);
        paintingScanner.setCaptureMultiple(settings.captureMultiple);
        paintingScanner.setOverlayColor(settings.overlayColor);

        // Set up event callbacks
        paintingScanner.onRectangleDetect((data: RectangleDetectionData) => {
          setRectangleData(data);
          console.log('Rectangle detected:', data);
        });

        paintingScanner.onPictureTaken((data: PictureTakenData) => {
          console.log('Picture taken:', data);
          setCapturedImage(data.croppedImage);
          setInitialImage(data.initialImage);
          setIsScanning(false);
        });

        setScanner(paintingScanner);
      } catch (error) {
        console.error('Failed to initialize scanner:', error);
        Alert.alert('Error', 'Failed to initialize painting scanner');
      }
    };

    initScanner();

    return () => {
      // Cleanup
      if (scanner) {
        scanner.stopScanning();
      }
    };
  }, []);

  const startScanning = () => {
    if (!scanner) {
      Alert.alert('Error', 'Scanner not initialized');
      return;
    }
    scanner.startScanning();
    setIsScanning(true);
    setCapturedImage(null);
    setInitialImage(null);
    setRectangleData(null);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stopScanning();
      setIsScanning(false);
    }
  };

  const capture = async () => {
    if (!scanner) {
      Alert.alert('Error', 'Scanner not initialized');
      return;
    }

    try {
      const result: CaptureResult = await scanner.capture();
      setCapturedImage(result.croppedImage);
      setInitialImage(result.initialImage);
      setIsScanning(false);
      Alert.alert('Success', 'Image captured successfully!');
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const reapplyCrop = async () => {
    if (!scanner || !initialImage || !rectangleData) {
      Alert.alert('Error', 'No image or rectangle data available');
      return;
    }

    try {
      // Note: This requires the rectangle coordinates from the capture result
      // For a full implementation, you'd store the coordinates from the capture
      Alert.alert('Info', 'Reapply crop functionality requires rectangle coordinates from capture');
    } catch (error) {
      console.error('Reapply crop error:', error);
      Alert.alert('Error', 'Failed to reapply crop');
    }
  };

  const toggleTorch = () => {
    if (scanner) {
      const newValue = !settings.enableTorch;
      scanner.setEnableTorch(newValue);
      setSettings({ ...settings, enableTorch: newValue });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Painting Scanner</Text>

        {/* Camera Preview Placeholder */}
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.placeholderText}>
            {isScanning ? 'Camera Preview (Native View)' : 'Camera Not Active'}
          </Text>
          {rectangleData && (
            <View style={styles.rectangleInfo}>
              <Text style={styles.infoText}>
                Detection: {rectangleData.lastDetectionType}
              </Text>
              <Text style={styles.infoText}>
                Stable Counter: {rectangleData.stableCounter}
              </Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isScanning ? (
            <TouchableOpacity style={styles.button} onPress={startScanning}>
              <Text style={styles.buttonText}>Start Scanning</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={capture}>
                <Text style={styles.buttonText}>Capture</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={stopScanning}
              >
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, styles.torchButton]}
            onPress={toggleTorch}
          >
            <Text style={styles.buttonText}>
              Torch: {settings.enableTorch ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.settings}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingRow}>
            <Text>Quality: {settings.quality.toFixed(1)}</Text>
            <View style={styles.sliderContainer}>
              <Text>0.1</Text>
              <View style={styles.slider} />
              <Text>1.0</Text>
            </View>
          </View>
          <View style={styles.settingRow}>
            <Text>Use Base64: {settings.useBase64 ? 'Yes' : 'No'}</Text>
            <Button
              title="Toggle"
              onPress={() => {
                const newValue = !settings.useBase64;
                scanner?.setUseBase64(newValue);
                setSettings({ ...settings, useBase64: newValue });
              }}
            />
          </View>
        </View>

        {/* Captured Images */}
        {capturedImage && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Captured Image</Text>
            {settings.useBase64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${capturedImage}` }}
                style={styles.capturedImage}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={{ uri: `file://${capturedImage}` }}
                style={styles.capturedImage}
                resizeMode="contain"
              />
            )}
            {initialImage && (
              <>
                <Text style={styles.sectionTitle}>Initial Image</Text>
                {settings.useBase64 ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${initialImage}` }}
                    style={styles.capturedImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={{ uri: `file://${initialImage}` }}
                    style={styles.capturedImage}
                    resizeMode="contain"
                  />
                )}
              </>
            )}
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={reapplyCrop}
            >
              <Text style={styles.buttonText}>Reapply Crop</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cameraPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  rectangleInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 2,
  },
  controls: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#8E8E93',
  },
  torchButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settings: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  slider: {
    flex: 1,
    height: 2,
    backgroundColor: '#007AFF',
    marginHorizontal: 10,
  },
  imageSection: {
    marginTop: 20,
  },
  capturedImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: '#F5F5F5',
  },
});


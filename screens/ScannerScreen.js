import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Image,
  Animated,
  ActivityIndicator,
  Platform,
  NativeModules,
  Dimensions
} from 'react-native';
import DocumentScanner from '../index';
import { Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export default class ScannerScreen extends Component {
  constructor(props) {
    super(props);
    this.scannerRef = null;
    this.state = {
      flashEnabled: false,
      stableCounter: 0,
      lastDetectionType: null,
      capturedImage: null,
      originalImage: null,
      rectangleCoordinates: null,
      showResult: false,
      isProcessing: false,
      overlayOpacity: new Animated.Value(0)
    };
  }

  handlePictureTaken = (data) => {
    // Store both cropped and original images with coordinates
    this.setState({
      capturedImage: data.croppedImage,
      originalImage: data.initialImage,
      rectangleCoordinates: data.rectangleCoordinates,
      showResult: true
    }, () => {
      // Animate result overlay - use the state value after setState
      Animated.timing(this.state.overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.42, 0, 0.58, 1)
      }).start();
    });
  };

  handleRectangleDetect = ({ stableCounter, lastDetectionType }) => {
    this.setState({ stableCounter, lastDetectionType });
  };

  capture = () => {
    if (this.scannerRef && this.state.stableCounter > 0) {
      this.scannerRef.capture();
    }
  };

  retake = () => {
    // Animate overlay out
    Animated.timing(this.state.overlayOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.bezier(0.42, 0, 0.58, 1)
    }).start(() => {
      // Reset all state
      this.setState({
        showResult: false,
        capturedImage: null,
        originalImage: null,
        rectangleCoordinates: null,
        stableCounter: 0,
        lastDetectionType: null,
        isProcessing: false
      });
    });
  };

  editAgain = async () => {
    const { originalImage, rectangleCoordinates, isProcessing } = this.state;
    
    // Prevent multiple simultaneous edits
    if (isProcessing || !originalImage || !rectangleCoordinates) {
      console.warn('Cannot edit: missing data', { 
        isProcessing, 
        hasOriginalImage: !!originalImage, 
        hasCoordinates: !!rectangleCoordinates 
      });
      return;
    }

    try {
      // Show loading state
      this.setState({ isProcessing: true });

      // Call native module to re-apply perspective crop
      const { RNPdfScannerManager } = NativeModules;
      
      if (!RNPdfScannerManager) {
        throw new Error('RNPdfScannerManager not available');
      }

      if (!RNPdfScannerManager.reapplyPerspectiveCrop) {
        throw new Error('reapplyPerspectiveCrop method not available');
      }

      // Get quality from scanner ref if available, otherwise use default
      const quality = this.scannerRef?.props?.quality || 0.8;
      
      // Prepare image input - handle both base64 (iOS) and file paths (Android)
      let imageInput = originalImage;
      
      // Remove data URI prefix if present (iOS base64 format)
      if (imageInput.startsWith('data:image')) {
        imageInput = imageInput.split(',')[1];
      }
      // Android returns file:// paths, which the native module now handles
      
      console.log('Calling reapplyPerspectiveCrop with:', {
        imageInputType: typeof imageInput,
        imageInputLength: imageInput?.length,
        hasCoordinates: !!rectangleCoordinates,
        quality
      });
      
      const croppedImage = await RNPdfScannerManager.reapplyPerspectiveCrop(
        imageInput,
        rectangleCoordinates,
        quality
      );

      if (!croppedImage) {
        throw new Error('Native module returned null/undefined result');
      }

      // Format result based on platform
      // iOS returns base64 string, Android returns base64 string or file path
      let formattedImage = croppedImage;
      if (Platform.OS === 'ios' && !croppedImage.startsWith('data:') && !croppedImage.startsWith('file://')) {
        // iOS returns base64 without prefix, add it for Image component
        formattedImage = `data:image/jpeg;base64,${croppedImage}`;
      }

      // Update captured image
      this.setState({
        capturedImage: formattedImage,
        isProcessing: false
      });

    } catch (error) {
      console.error('Error re-applying crop:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        originalImage: originalImage?.substring(0, 50),
        hasCoordinates: !!rectangleCoordinates
      });
      // Show error message to user (optional)
      this.setState({ isProcessing: false });
    }
  };

  keepScan = () => {
    const { capturedImage, originalImage, rectangleCoordinates } = this.state;
    const { onScanComplete } = this.props;
    
    if (!capturedImage) {
      return; // Don't proceed if no image
    }
    
    if (onScanComplete) {
      onScanComplete({
        croppedImage: capturedImage,
        initialImage: originalImage,
        rectangleCoordinates: rectangleCoordinates
      });
    }
  };

  getDetectionMessage = () => {
    const { lastDetectionType, stableCounter } = this.state;
    
    if (stableCounter > 0) {
      return `✓ Ready to capture`;
    }
    
    switch (lastDetectionType) {
      case 1:
        return '⚠ Adjust angle';
      case 2:
        return '⚠ Move closer';
      default:
        return 'Position document in frame';
    }
  };

  render() {
    const { 
      flashEnabled, 
      stableCounter, 
      capturedImage, 
      showResult,
      overlayOpacity,
      isProcessing
    } = this.state;

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          
          {/* Scanner - Always visible in background */}
          <DocumentScanner
            ref={(ref) => { this.scannerRef = ref; }}
            useBase64
            captureMultiple={true}
            onPictureTaken={this.handlePictureTaken}
            overlayColor="rgba(54, 120, 226, 0.28)"
            enableTorch={flashEnabled}
            // brightness={1}
            // saturation={1}
            // contrast={1.1}
            // quality={0.8}
            onRectangleDetect={this.handleRectangleDetect}
            detectionCountBeforeCapture={5}
            detectionRefreshRateInMS={30}
            manualOnly={true}
            style={styles.scanner}
          />

          {/* Header - Only show when not showing result */}
          {!showResult && (
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  if (this.props.onBack) {
                    this.props.onBack();
                  }
                }}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.flashButton}
                onPress={() => this.setState({ flashEnabled: !flashEnabled })}
              >
                <Text style={styles.flashButtonText}>
                  {flashEnabled ? '⚡ ON' : '⚡ OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Detection Status - Only show when not showing result */}
          {!showResult && (
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>
                {this.getDetectionMessage()}
              </Text>
            </View>
          )}

          {/* Capture Button - Only show when not showing result */}
          {!showResult && (
            <View style={styles.controls}>
              <TouchableOpacity 
                style={[
                  styles.captureButton,
                  stableCounter > 0 && styles.captureButtonActive
                ]}
                onPress={this.capture}
                disabled={stableCounter === 0}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          )}

          {/* Result Overlay - Slides in from bottom */}
          {showResult && (
            <Animated.View 
              style={[
                styles.resultOverlay,
                { 
                  opacity: overlayOpacity,
                  transform: [{
                    translateY: overlayOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height * 0.7, 0]
                    })
                  }]
                }
              ]}
            >
              {/* Separate Back Button in overlay header */}
              <TouchableOpacity 
                style={styles.overlayBackButton}
                onPress={this.retake}
              >
                <Text style={styles.overlayBackButtonText}>← Back</Text>
              </TouchableOpacity>

              <View style={styles.resultContainer}>
                {/* Result Image */}
                <View style={styles.resultImageContainer}>
                  <Image 
                    source={{ 
                      uri: capturedImage.startsWith('data:') || capturedImage.startsWith('file://') 
                        ? capturedImage 
                        : `data:image/jpeg;base64,${capturedImage}`
                    }}
                    style={styles.resultImage}
                    resizeMode="contain"
                  />
                  
                  {/* Loading Indicator */}
                  {isProcessing && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator 
                        size="large" 
                        color="#FFFFFF" 
                      />
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.resultActions}>
                  <TouchableOpacity 
                    style={[styles.resultButton, styles.retakeButton]}
                    onPress={this.retake}
                  >
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.resultButton, 
                      styles.editButton,
                      isProcessing && styles.editButtonDisabled
                    ]}
                    onPress={this.editAgain}
                    disabled={isProcessing}
                  >
                    <Text style={styles.editButtonText}>Edit Again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.resultButton, styles.keepScanButton]}
                    onPress={this.keepScan}
                  >
                    <Text style={styles.keepScanButtonText}>Keep Scan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

        </SafeAreaView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  safeArea: {
    flex: 1
  },
  scanner: {
    flex: 1
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10
  },
  backButton: {
    padding: 8
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16
  },
  flashButton: {
    padding: 8
  },
  flashButtonText: {
    color: '#FFF',
    fontSize: 16
  },
  statusBar: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    zIndex: 10
  },
  statusText: {
    color: '#00FF00',
    fontSize: 16,
    fontWeight: '600'
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    borderWidth: 5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5
  },
  captureButtonActive: {
    backgroundColor: '#00FF00',
    borderColor: '#00FF00',
    opacity: 1
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF'
  },
  resultOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    zIndex: 100
  },
  overlayBackButton: {
    position: 'absolute',
    top: 15,
    left: 20,
    zIndex: 101,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center'
  },
  overlayBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16
  },
  resultContainer: {
    flex: 1,
    paddingTop: 60
  },
  resultImageContainer: {
    height: 300,
    backgroundColor: '#000',
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  },
  resultImage: {
    width: '100%',
    height: '100%'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  resultActions: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between'
  },
  resultButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5
  },
  retakeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  retakeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  editButton: {
    backgroundColor: '#00FF00'
  },
  editButtonDisabled: {
    opacity: 0.5
  },
  editButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  keepScanButton: {
    backgroundColor: '#0066FF'
  },
  keepScanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});


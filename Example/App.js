/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import ScannerScreen from '../screens/ScannerScreen';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scannedData: null,
      showScanner: true,
    };
  }

  handleScanComplete = (data) => {
    console.log('Scan completed:', data);
    this.setState({
      scannedData: data,
      showScanner: false,
    });
    Alert.alert(
      'Scan Complete!',
      'Document scanned successfully. Check console for details.',
      [{text: 'OK'}],
    );
  };

  handleBack = () => {
    this.setState({showScanner: false, scannedData: null});
  };

  render() {
    const {showScanner, scannedData} = this.state;

    if (!showScanner && scannedData) {
      return (
        <View style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.title}>Scanned Document</Text>

            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri:
                    scannedData.croppedImage.startsWith('data:') ||
                    scannedData.croppedImage.startsWith('file://')
                      ? scannedData.croppedImage
                      : `data:image/jpeg;base64,${scannedData.croppedImage}`,
                }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.info}>
              Coordinates:{' '}
              {scannedData.rectangleCoordinates ? 'Available' : 'Not available'}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                this.setState({showScanner: true, scannedData: null})
              }>
              <Text style={styles.buttonText}>Scan Another Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ScannerScreen
          onScanComplete={this.handleScanComplete}
          onBack={this.handleBack}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0066FF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


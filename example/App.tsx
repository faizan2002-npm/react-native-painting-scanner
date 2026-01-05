import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  Alert,
} from 'react-native';
import PaintingScanner from 'react-native-painting-scanner';

const App = () => {
  const [imageUri, setImageUri] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!imageUri.trim()) {
      Alert.alert('Error', 'Please enter an image URI');
      return;
    }

    setLoading(true);
    try {
      const result = await PaintingScanner.scanPainting(imageUri);
      if (result.success) {
        setScanResult(result.data || 'Scan completed successfully');
      } else {
        Alert.alert('Scan Error', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = () => {
    const isAvailable = PaintingScanner.isAvailable();
    const version = PaintingScanner.getVersion();
    Alert.alert(
      'Scanner Info',
      `Available: ${isAvailable ? 'Yes' : 'No'}\nVersion: ${version}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Painting Scanner</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Image URI:</Text>
          <TextInput
            style={styles.input}
            value={imageUri}
            onChangeText={setImageUri}
            placeholder="file:///path/to/image.jpg"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Scanning...' : 'Scan Painting'}
            onPress={handleScan}
            disabled={loading}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Check Availability"
            onPress={checkAvailability}
          />
        </View>

        {scanResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Scan Result:</Text>
            <Text style={styles.resultText}>{scanResult}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 15,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
  },
});

export default App;


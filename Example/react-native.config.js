module.exports = {
  project: {
    android: {
      packageName: 'com.example',
      sourceDir: './android',
      appName: 'app',
    },
  },
  dependencies: {
    'react-native-document-scanner': {
      platforms: {
        android: null, // disable Android autolinking for this package
      },
    },
  },
};

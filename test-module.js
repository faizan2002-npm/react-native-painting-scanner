/**
 * Simple test script to verify the module structure
 * Note: This won't test native functionality, but will verify the JS/TS structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing React Native Painting Scanner Turbo Module...\n');

// Check if compiled files exist
const libPath = path.join(__dirname, 'lib');
const libIndex = path.join(libPath, 'index.js');
const libTypes = path.join(libPath, 'index.d.ts');

console.log('📦 Checking compiled files:');
console.log(`  ✓ lib/index.js: ${fs.existsSync(libIndex) ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`  ✓ lib/index.d.ts: ${fs.existsSync(libTypes) ? '✅ EXISTS' : '❌ MISSING'}`);

// Check source files
const srcPath = path.join(__dirname, 'src');
const srcIndex = path.join(srcPath, 'index.ts');
const srcNative = path.join(srcPath, 'NativePaintingScanner.ts');

console.log('\n📝 Checking source files:');
console.log(`  ✓ src/index.ts: ${fs.existsSync(srcIndex) ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`  ✓ src/NativePaintingScanner.ts: ${fs.existsSync(srcNative) ? '✅ EXISTS' : '❌ MISSING'}`);

// Check native implementations
const iosPath = path.join(__dirname, 'ios', 'PaintingScanner.mm');
const androidPath = path.join(__dirname, 'android', 'src', 'main', 'java', 'com', 'paintingscanner', 'PaintingScannerModule.kt');

console.log('\n📱 Checking native implementations:');
console.log(`  ✓ iOS (PaintingScanner.mm): ${fs.existsSync(iosPath) ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`  ✓ Android (PaintingScannerModule.kt): ${fs.existsSync(androidPath) ? '✅ EXISTS' : '❌ MISSING'}`);

// Try to read and verify the compiled JS structure
if (fs.existsSync(libIndex)) {
  console.log('\n📄 Compiled module structure:');
  const content = fs.readFileSync(libIndex, 'utf8');
  const hasDefaultExport = content.includes('exports.default') || content.includes('module.exports');
  const hasScanPainting = content.includes('scanPainting');
  const hasGetVersion = content.includes('getVersion');
  const hasIsAvailable = content.includes('isAvailable');
  
  console.log(`  ✓ Default export: ${hasDefaultExport ? '✅' : '❌'}`);
  console.log(`  ✓ scanPainting method: ${hasScanPainting ? '✅' : '❌'}`);
  console.log(`  ✓ getVersion method: ${hasGetVersion ? '✅' : '❌'}`);
  console.log(`  ✓ isAvailable method: ${hasIsAvailable ? '✅' : '❌'}`);
}

console.log('\n✅ Module structure verification complete!');
console.log('\n📌 Next steps:');
console.log('   1. To test native functionality, integrate this module into a React Native app');
console.log('   2. Use the example/App.tsx as a reference');
console.log('   3. Follow SETUP.md for integration instructions');
console.log('\n💡 To test in a React Native app:');
console.log('   - Create a new React Native app: npx react-native init TestApp');
console.log('   - Link this module: npm install ./react-native-painting-scanner');
console.log('   - Import and use: import PaintingScanner from "react-native-painting-scanner"');


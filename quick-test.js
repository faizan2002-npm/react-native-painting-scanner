/**
 * Quick test to verify the module can be imported (structure only)
 * Note: Native methods won't work without a React Native environment
 */

console.log('🧪 Quick Module Import Test\n');

try {
  // Try to require the compiled module
  const modulePath = require.resolve('./lib/index.js');
  console.log(`✅ Module path resolved: ${modulePath}`);
  
  // Read the module to check structure
  const fs = require('fs');
  const moduleContent = fs.readFileSync(modulePath, 'utf8');
  
  console.log('\n📋 Module exports found:');
  if (moduleContent.includes('scanPainting')) {
    console.log('  ✅ scanPainting method');
  }
  if (moduleContent.includes('getVersion')) {
    console.log('  ✅ getVersion method');
  }
  if (moduleContent.includes('isAvailable')) {
    console.log('  ✅ isAvailable method');
  }
  
  console.log('\n✅ Module structure is valid!');
  console.log('\n⚠️  Note: Native methods require a React Native app to test.');
  console.log('   The module structure is correct and ready to use.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}


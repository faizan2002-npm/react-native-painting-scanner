const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
const fs = require('fs');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const parentRoot = path.resolve(__dirname, '..');

const defaultConfig = getDefaultConfig(projectRoot);

// Try to use Metro's resolver if available
let metroResolver;
try {
  metroResolver = require('metro-resolver');
} catch (e) {
  // metro-resolver not available, we'll handle it differently
}

// Custom resolver to handle @babel/runtime sub-paths
const customResolver = (context, moduleName, platform) => {
  // Handle @babel/runtime and all its sub-paths
  if (moduleName === '@babel/runtime' || moduleName.startsWith('@babel/runtime/')) {
    const babelRuntimePath = path.resolve(projectRoot, 'node_modules', moduleName);
    
    // Try to resolve the file with .js extension first (most common)
    const jsPath = babelRuntimePath + '.js';
    if (fs.existsSync(jsPath)) {
      // Debug: uncomment to verify resolver is being called
      // console.log(`[Metro Resolver] Resolved ${moduleName} to ${jsPath}`);
      return {
        type: 'sourceFile',
        filePath: jsPath,
      };
    }
    
    // Try without extension (for directories with index.js)
    if (fs.existsSync(babelRuntimePath)) {
      try {
        const stat = fs.statSync(babelRuntimePath);
        if (stat.isFile()) {
          return {
            type: 'sourceFile',
            filePath: babelRuntimePath,
          };
        } else if (stat.isDirectory()) {
          const indexPath = path.join(babelRuntimePath, 'index.js');
          if (fs.existsSync(indexPath)) {
            return {
              type: 'sourceFile',
              filePath: indexPath,
            };
          }
        }
      } catch (e) {
        // If stat fails, continue to default resolution
      }
    }
  }
  
  // For all other modules, use Metro's default resolution via metro-resolver
  if (metroResolver) {
    try {
      // Use Metro's resolver with the merged config's resolver settings
      const resolverContext = {
        ...context,
        resolveRequest: undefined, // Remove our custom resolver to avoid recursion
      };
      return metroResolver.resolve(resolverContext, moduleName, platform);
    } catch (e) {
      // If resolution fails, re-throw to let Metro handle the error
      throw e;
    }
  }
  
  // If metro-resolver is not available, we can't properly delegate
  // This shouldn't happen in a normal React Native setup
  throw new Error(`Cannot resolve module ${moduleName}: metro-resolver not available`);
};

const config = {
  watchFolders: [parentRoot],
  resolver: {
    // Ensure Metro resolves node_modules from the Example directory first
    // even when processing files from the parent directory
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
    ],
    // Use custom resolver for @babel/runtime sub-paths
    resolveRequest: customResolver,
  },
  projectRoot: projectRoot,
};

module.exports = mergeConfig(defaultConfig, config);


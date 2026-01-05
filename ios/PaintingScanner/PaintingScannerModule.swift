import Foundation
// This file registers the Hybrid Object with Nitro
// After running `npx nitrogen`, you may need to register the Hybrid Object
// in your app's initialization code (typically in AppDelegate or similar)

// Registration example (C++ code that will be generated/called):
// HybridObjectRegistry::registerHybridObjectConstructor(
//   "PaintingScanner",
//   []() -> std::shared_ptr<HybridObject> {
//     return std::make_shared<HybridPaintingScanner>();
//   }
// );

// Note: The exact registration mechanism depends on how nitrogen generates
// the autolinking code. Check the generated files after running `npx nitrogen`.


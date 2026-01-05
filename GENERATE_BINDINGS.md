# Generating Native Bindings

After setting up the project, you need to generate the native bindings using nitrogen:

```bash
npm install
npx nitrogen
```

This will:
1. Generate the Swift protocol `HybridPaintingScannerSpec` that `HybridPaintingScanner` must conform to
2. Generate C++ bridge code for Nitro
3. Generate autolinking files
4. Create registration code for the Hybrid Object

After running nitrogen, you may need to:
- Update `HybridPaintingScanner.swift` to conform to the generated protocol
- Adjust method signatures if needed
- Register the Hybrid Object in the app initialization

The generated files will be in:
- `ios/generated/` - Generated Swift protocols and C++ bridges
- `android/generated/` - Generated Kotlin interfaces (when Android is implemented)


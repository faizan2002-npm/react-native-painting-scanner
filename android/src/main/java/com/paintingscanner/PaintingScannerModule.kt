package com.paintingscanner

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = PaintingScannerModule.NAME)
class PaintingScannerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun scanPainting(imageUri: String, promise: Promise) {
        // TODO: Implement actual scanning logic
        try {
            val result = "Scanned painting from: $imageUri"
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SCAN_ERROR", e.message, e)
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getScannerVersion(): String {
        return "1.0.0"
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isAvailable(): Boolean {
        return true
    }

    companion object {
        const val NAME = "PaintingScanner"
    }
}


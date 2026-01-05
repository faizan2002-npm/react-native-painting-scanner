package com.paintingscanner

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class PaintingScannerPackage : TurboReactPackage() {
    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return when (name) {
            PaintingScannerModule.NAME -> PaintingScannerModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val moduleMap: MutableMap<String, ReactModuleInfo> = mutableMapOf()
            val isTurboModule = true
            moduleMap[PaintingScannerModule.NAME] = ReactModuleInfo(
                PaintingScannerModule.NAME,
                PaintingScannerModule.NAME,
                false, // canOverrideExistingModule
                true, // needsEagerInit
                true, // hasConstants
                false, // isCxxModule
                isTurboModule // isTurboModule
            )
            moduleMap
        }
    }
}


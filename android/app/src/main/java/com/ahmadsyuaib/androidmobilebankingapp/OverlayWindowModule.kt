package com.anonymous.StickerSmash

import android.app.Activity
import android.os.Build
import android.util.Log
import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OverlayWindowModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "OverlayWindowModule"
    }

    @ReactMethod
fun setHideOverlay(enabled: Boolean) {
    val activity = currentActivity ?: return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        activity.runOnUiThread {
            try {
                activity.window.setHideOverlayWindows(enabled)
            } catch (e: SecurityException) {
                Log.e("OverlayWindowModule", "Permission denied: ${e.message}")
                Toast.makeText(reactContext, "App must be a system app to hide overlays", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.e("OverlayWindowModule", "Unexpected error: ${e.message}")
            }
        }
    }
}
}

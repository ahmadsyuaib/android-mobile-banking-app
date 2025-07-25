package com.ahmadsyuaib.androidmobilebankingapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
    this,
    object : ReactNativeHost(this) {
      override fun getUseDeveloperSupport(): Boolean {
        return BuildConfig.DEBUG
      }

      override fun getPackages(): List<ReactPackage> {
        return PackageList(this).packages
      }

      override fun getJSMainModuleName(): String {
        return "index"
      }

      override fun isNewArchEnabled(): Boolean {
        return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }

      override fun isHermesEnabled(): Boolean {
        return BuildConfig.IS_HERMES_ENABLED
      }
    }
  )

  override fun getReactNativeHost(): ReactNativeHost {
    return mReactNativeHost
  }

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, /* native exopackage */ false)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
}

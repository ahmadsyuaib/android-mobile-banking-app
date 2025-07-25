package com.ahmadsyuaib.androidmobilebankingapp

import android.app.AlertDialog
import android.os.Build
import android.os.Bundle
import android.content.pm.PackageManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import java.io.FileInputStream
import java.security.MessageDigest

class MainActivity : ReactActivity() {

  companion object {
    private const val EXPECTED_PACKAGE_NAME = "com.ahmadsyuaib.androidmobilebankingapp"
    private const val EXPECTED_SIGNATURE_HASH = "place_expected_signature_hash_here"
    private const val EXPECTED_APK_HASH = "place_expected_apk_hash_here"
    private val ALLOWED_INSTALLERS = setOf(
      "com.android.vending",
      "com.amazon.venezia",
      "com.android.packageinstaller"
    )
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme)
    super.onCreate(null)
    performIntegrityChecks()
  }

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(
        this,
        mainComponentName,
        fabricEnabled
      ) {}
    )
  }

  override fun invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      if (!moveTaskToBack(false)) {
        super.invokeDefaultOnBackPressed()
      }
      return
    }
    super.invokeDefaultOnBackPressed()
  }

  private fun performIntegrityChecks() {
    val results = mutableListOf<String>()
    results.add(verifyPackageName())
    results.add(verifySignature())
    results.add(verifyAPKChecksum())
    results.add(verifyInstaller())
    results.add(verifyClassLoader())
    showIntegrityResults(results)
  }

  private fun verifyPackageName(): String {
    return try {
      val actualPackageName = packageName
      if (EXPECTED_PACKAGE_NAME == actualPackageName) {
        "✅ Package Name: PASSED\n   Expected: $EXPECTED_PACKAGE_NAME\n   Actual: $actualPackageName"
      } else {
        "❌ Package Name: FAILED\n   Expected: $EXPECTED_PACKAGE_NAME\n   Actual: $actualPackageName"
      }
    } catch (e: Exception) {
      "❌ Package Name: ERROR - ${e.message}"
    }
  }

  private fun verifySignature(): String {
    return try {
      val packageInfo = packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
      val signatures = packageInfo.signatures
      if (signatures.isNullOrEmpty()) {
        return "❌ Signature: FAILED - No signatures found"
      }
      val md = MessageDigest.getInstance("SHA-256")
      val cert = signatures[0].toByteArray()
      md.update(signatures[0].toByteArray())
      val actualHash = bytesToHex(md.digest())
      if (EXPECTED_SIGNATURE_HASH == actualHash) {
        "✅ Signature Hash: PASSED\n   Hash: ${actualHash}"
      } else {
        "❌ Signature Hash: FAILED\n   Expected: ${EXPECTED_SIGNATURE_HASH}\n   Actual: ${actualHash}"
      }
    } catch (e: Exception) {
      "❌ Signature Hash: ERROR - ${e.message}"
    }
  }

  private fun verifyAPKChecksum(): String {
    return try {
      val apkPath = applicationInfo.sourceDir
      val fis = FileInputStream(apkPath)
      val md = MessageDigest.getInstance("SHA-256")
      val buffer = ByteArray(8192)
      var bytesRead: Int
      while (fis.read(buffer).also { bytesRead = it } != -1) {
        md.update(buffer, 0, bytesRead)
      }
      fis.close()
      val actualHash = bytesToHex(md.digest())
      if (EXPECTED_APK_HASH == actualHash) {
        "✅ APK Checksum: PASSED\n   Hash: ${actualHash}"
      } else {
        "❌ APK Checksum: FAILED\n   Expected: ${EXPECTED_APK_HASH}\n   Actual: ${actualHash}"
      }
    } catch (e: Exception) {
      "❌ APK Checksum: ERROR - ${e.message}"
    }
  }

  private fun verifyInstaller(): String {
    return try {
      val installer = packageManager.getInstallerPackageName(packageName)
      when {
        installer == null -> "❌ Installer: FAILED - App was sideloaded (no installer)"
        ALLOWED_INSTALLERS.contains(installer) -> {
          val name = when (installer) {
            "com.android.vending" -> "Google Play Store"
            "com.amazon.venezia" -> "Amazon App Store"
            "com.android.packageinstaller" -> "System Installer"
            else -> installer
          }
          "✅ Installer: PASSED\n   Source: $name"
        }
        else -> "❌ Installer: FAILED\n   Expected: Official store\n   Actual: $installer"
      }
    } catch (e: Exception) {
      "❌ Installer: ERROR - ${e.message}"
    }
  }

  private fun verifyClassLoader(): String {
    return try {
      val loaderName = classLoader.javaClass.name
      if (loaderName.contains("dalvik.system.PathClassLoader")) {
        "✅ Class Loader: PASSED\n   Type: $loaderName"
      } else {
        "❌ Class Loader: FAILED\n   Expected: PathClassLoader\n   Actual: $loaderName"
      }
    } catch (e: Exception) {
      "❌ Class Loader: ERROR - ${e.message}"
    }
  }

  private fun bytesToHex(bytes: ByteArray): String {
    return bytes.joinToString("") { "%02X".format(it) }
  }

  private fun showIntegrityResults(results: List<String>) {
    val message = buildString {
      appendLine("🔒 RASP Integrity Check Results")
      appendLine("=".repeat(35))
      appendLine()
      results.forEach {
        appendLine(it)
        appendLine()
      }
      appendLine("=".repeat(35))
      val failed = results.count { it.contains("❌") }
      val passed = results.count { it.contains("✅") }
      appendLine("Summary: $passed passed, $failed failed")
      appendLine()
      if (failed > 0) {
        appendLine("⚠️ Security Warning: App integrity compromised!")
      } else {
        appendLine("✅ All integrity checks passed successfully!")
      }
    }

    runOnUiThread {
      AlertDialog.Builder(this)
        .setTitle("🛡️ App Security Status")
        .setMessage(message)
        .setPositiveButton("Continue") { dialog, _ -> dialog.dismiss() }
        .setNegativeButton("Exit App") { _, _ ->
          android.os.Process.killProcess(android.os.Process.myPid())
        }
        .setCancelable(false)
        .show()
    }
  }
}

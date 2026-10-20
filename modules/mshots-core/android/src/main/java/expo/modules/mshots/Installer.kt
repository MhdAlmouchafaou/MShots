package expo.modules.mshots

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

/** Installs an APK with the system installer; reads APK metadata for the capture flow. */
object Installer {
  @Volatile var emit: (String, Map<String, Any?>) -> Unit = { _, _ -> }

  fun canInstall(ctx: Context): Boolean = Build.VERSION.SDK_INT < 26 || ctx.packageManager.canRequestPackageInstalls()

  private fun open(ctx: Context, uriStr: String): Pair<InputStream, Long> {
    val uri = Uri.parse(uriStr)
    if (uri.scheme == "file" || uri.scheme == null) {
      val f = File(uri.path ?: uriStr)
      return f.inputStream() to f.length()
    }
    val len = try { ctx.contentResolver.openFileDescriptor(uri, "r")?.use { it.statSize } ?: -1L } catch (_: Throwable) { -1L }
    val inp = ctx.contentResolver.openInputStream(uri) ?: throw IllegalStateException("cannot open")
    return inp to len
  }

  fun install(ctx: Context, uri: String) {
    val pi = ctx.packageManager.packageInstaller
    val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
    val id = pi.createSession(params)
    try {
      pi.openSession(id).use { session ->
        val (input, len) = open(ctx, uri)
        input.use { inp ->
          session.openWrite("base.apk", 0, len).use { out ->
            inp.copyTo(out, 1024 * 1024)
            session.fsync(out)
          }
        }
        val intent = Intent(ctx, InstallReceiver::class.java).setPackage(ctx.packageName)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0)
        session.commit(PendingIntent.getBroadcast(ctx, id, intent, flags).intentSender)
      }
    } catch (e: Throwable) {
      try { pi.abandonSession(id) } catch (_: Throwable) {}
      throw e
    }
  }

  /** Local copy of an APK (content:// cannot be parsed by the package manager). */
  private fun localCopy(ctx: Context, uriStr: String): File {
    val uri = Uri.parse(uriStr)
    if (uri.scheme == "file" || uri.scheme == null) return File(uri.path ?: uriStr)
    val f = File(ctx.cacheDir, "apk/${uriStr.hashCode().toString(16)}.apk")
    f.parentFile?.mkdirs()
    if (!f.exists() || f.length() == 0L) {
      ctx.contentResolver.openInputStream(uri)?.use { inp -> FileOutputStream(f).use { inp.copyTo(it, 1024 * 1024) } }
    }
    return f
  }

  private fun toBitmap(d: Drawable, size: Int): Bitmap {
    if (d is BitmapDrawable && d.bitmap != null) return Bitmap.createScaledBitmap(d.bitmap, size, size, true)
    val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val c = Canvas(bmp)
    d.setBounds(0, 0, size, size)
    d.draw(c)
    return bmp
  }

  fun apkInfo(ctx: Context, uri: String): Map<String, Any?>? {
    return try {
      val f = localCopy(ctx, uri)
      val pm = ctx.packageManager
      @Suppress("DEPRECATION")
      val info = pm.getPackageArchiveInfo(f.absolutePath, 0) ?: return null
      val ai = info.applicationInfo ?: return null
      ai.sourceDir = f.absolutePath
      ai.publicSourceDir = f.absolutePath
      val icon = File(ctx.cacheDir, "apk/icon_${info.packageName}.png")
      try { FileOutputStream(icon).use { toBitmap(ai.loadIcon(pm), 160).compress(Bitmap.CompressFormat.PNG, 100, it) } } catch (_: Throwable) {}
      val installed = try { pm.getPackageInfo(info.packageName, 0); true } catch (_: Throwable) { false }
      mapOf(
        "pkg" to info.packageName,
        "label" to pm.getApplicationLabel(ai).toString(),
        "version" to (info.versionName ?: ""),
        "icon" to (if (icon.exists()) Uri.fromFile(icon).toString() else null),
        "installed" to installed,
      )
    } catch (_: Throwable) {
      null
    }
  }
}

class InstallReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
    if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
      @Suppress("DEPRECATION")
      val confirm = intent.getParcelableExtra<Intent>(Intent.EXTRA_INTENT)
      if (confirm != null) {
        confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try { context.startActivity(confirm) } catch (_: Throwable) {}
      }
      return
    }
    Installer.emit(
      "onInstall",
      mapOf(
        "ok" to (status == PackageInstaller.STATUS_SUCCESS),
        "pkg" to intent.getStringExtra(PackageInstaller.EXTRA_PACKAGE_NAME),
        "message" to intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE),
      )
    )
  }
}

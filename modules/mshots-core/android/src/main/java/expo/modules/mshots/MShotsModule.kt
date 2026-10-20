package expo.modules.mshots

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.webkit.WebView
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File
import java.util.concurrent.Executors

class WebCaptureRecord : Record {
  @Field val url: String = ""
  @Field val width: Int = 390
  @Field val height: Int = 844
  @Field val scale: Double = 2.0
  @Field val fullPage: Boolean = false
  @Field val delay: Double = 800.0
  @Field val maxHeight: Int = 12000
  @Field val dark: Boolean = false
  @Field val mobile: Boolean = true
}

class MShotsModule : Module() {
  private val pool = Executors.newCachedThreadPool()
  private val main = Handler(Looper.getMainLooper())
  private var pendingBubble: Promise? = null
  private var pendingSession = "default"

  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  private fun safeSend(name: String, body: Map<String, Any?>) {
    main.post {
      try { sendEvent(name, body) } catch (_: Throwable) {}
    }
  }

  private fun bg(promise: Promise, block: () -> Any?) {
    pool.execute {
      try {
        promise.resolve(block())
      } catch (e: Throwable) {
        promise.reject("ERR_MSHOTS", e.message ?: e.javaClass.simpleName, e)
      }
    }
  }

  private fun open(intent: Intent): Boolean = try {
    val a = appContext.currentActivity
    if (a != null) a.startActivity(intent) else context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    true
  } catch (_: Throwable) {
    false
  }

  private fun canOverlay(): Boolean = Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(context)

  private fun captureInfo(f: File, session: String?): Map<String, Any?> {
    val o = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(f.absolutePath, o)
    return mapOf("uri" to Uri.fromFile(f).toString(), "width" to o.outWidth, "height" to o.outHeight, "date" to f.lastModified().toDouble(), "app" to null, "session" to session)
  }

  override fun definition() = ModuleDefinition {
    Name("MShotsCore")

    Events("onCapture", "onBubble", "onInstall")

    OnCreate {
      // Must be called before the first WebView is created, for full-page captures.
      main.post { try { WebView.enableSlowWholeDocumentDraw() } catch (_: Throwable) {} }
      CaptureService.listener = { n, b -> safeSend(n, b) }
      Installer.emit = { n, b -> safeSend(n, b) }
    }

    OnDestroy {
      CaptureService.listener = null
    }

    // ------------------------------------------------------------ web

    AsyncFunction("captureWeb") { o: WebCaptureRecord, promise: Promise ->
      val activity = appContext.currentActivity ?: return@AsyncFunction promise.reject("ERR_ACTIVITY", "no activity", null)
      if (o.url.isBlank()) return@AsyncFunction promise.reject("ERR_URL", "empty url", null)
      WebCapture.capture(
        activity,
        WebOptions(o.url, o.width.coerceIn(200, 4000), o.height.coerceIn(200, 4000), o.scale, o.fullPage, o.delay.toLong(), o.maxHeight.coerceIn(500, 40000), o.dark, o.mobile),
      ) { r, e ->
        if (r != null) promise.resolve(r) else promise.reject("ERR_CAPTURE", e ?: "capture failed", null)
      }
    }

    // --------------------------------------------------------- bubble

    Function("canDrawOverlays") { canOverlay() }

    Function("openOverlaySettings") {
      if (Build.VERSION.SDK_INT >= 23) open(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + context.packageName))) else true
    }

    AsyncFunction("startBubble") { session: String, promise: Promise ->
      if (CaptureService.running) return@AsyncFunction promise.resolve(true)
      if (!canOverlay()) return@AsyncFunction promise.resolve(false)
      val activity = appContext.currentActivity ?: return@AsyncFunction promise.resolve(false)
      pendingBubble?.resolve(false)
      pendingBubble = promise
      pendingSession = session.ifBlank { "default" }.replace(Regex("[^A-Za-z0-9_-]"), "_")
      main.post {
        try {
          val mpm = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
          activity.startActivityForResult(mpm.createScreenCaptureIntent(), REQ_PROJECTION)
        } catch (e: Throwable) {
          pendingBubble?.resolve(false)
          pendingBubble = null
        }
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != REQ_PROJECTION) return@OnActivityResult
      val p = pendingBubble ?: return@OnActivityResult
      pendingBubble = null
      if (payload.resultCode != Activity.RESULT_OK || payload.data == null) return@OnActivityResult p.resolve(false)
      try {
        val i = Intent(context, CaptureService::class.java)
          .setAction(CaptureService.ACTION_START)
          .putExtra(CaptureService.EXTRA_CODE, payload.resultCode)
          .putExtra(CaptureService.EXTRA_DATA, payload.data)
          .putExtra(CaptureService.EXTRA_SESSION, pendingSession)
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(i) else context.startService(i)
        p.resolve(true)
      } catch (e: Throwable) {
        p.resolve(false)
      }
    }

    Function("stopBubble") {
      CaptureService.stop(context)
      true
    }

    Function("bubbleRunning") { CaptureService.running }

    AsyncFunction("listCaptures") { session: String?, promise: Promise ->
      bg(promise) {
        val out = ArrayList<Pair<File, String?>>()
        val root = CaptureService.capturesDir(context)
        if (session != null && session != "web") {
          File(root, session).listFiles()?.filter { it.isFile && it.name.endsWith(".png") }?.forEach { out.add(it to session) }
        } else {
          if (session == null) {
            root.listFiles()?.filter { it.isDirectory }?.forEach { d ->
              d.listFiles()?.filter { it.isFile && it.name.endsWith(".png") }?.forEach { out.add(it to d.name) }
            }
          }
          File(context.filesDir, "web").listFiles()?.filter { it.isFile && it.name.endsWith(".png") }?.forEach { out.add(it to "web") }
        }
        out.sortedByDescending { it.first.lastModified() }.map { captureInfo(it.first, it.second) }
      }
    }

    AsyncFunction("deleteCaptures") { uris: List<String>, promise: Promise ->
      bg(promise) {
        val allowed = listOf(CaptureService.capturesDir(context).absolutePath, File(context.filesDir, "web").absolutePath)
        for (u in uris) {
          val path = Uri.parse(u).path ?: continue
          if (allowed.any { path.startsWith(it) }) File(path).delete()
        }
        // Remove empty session folders.
        CaptureService.capturesDir(context).listFiles()?.filter { it.isDirectory && (it.list()?.isEmpty() != false) }?.forEach { it.delete() }
        true
      }
    }

    // -------------------------------------------------------- install

    Function("canInstall") { Installer.canInstall(context) }

    AsyncFunction("installApk") { uri: String, promise: Promise ->
      bg(promise) {
        if (!Installer.canInstall(context)) {
          main.post {
            if (Build.VERSION.SDK_INT >= 26) open(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + context.packageName)))
          }
          "permission"
        } else {
          Installer.install(context, uri)
          "started"
        }
      }
    }

    Function("launchApp") { pkg: String ->
      val i = context.packageManager.getLaunchIntentForPackage(pkg) ?: return@Function false
      open(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    Function("isInstalled") { pkg: String ->
      try {
        context.packageManager.getPackageInfo(pkg, 0)
        true
      } catch (_: Throwable) {
        false
      }
    }

    AsyncFunction("apkInfo") { uri: String, promise: Promise -> bg(promise) { Installer.apkInfo(context, uri) } }
  }

  companion object {
    const val REQ_PROJECTION = 7311
  }
}

package expo.modules.mshots

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import java.io.File
import java.io.FileOutputStream

/** A WebView that never takes touches: it sits invisible over the app while it renders a capture. */
@SuppressLint("ViewConstructor")
private class GhostWebView(ctx: Context) : WebView(ctx) {
  override fun dispatchTouchEvent(event: MotionEvent): Boolean = false
  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean = false
}

data class WebOptions(
  val url: String,
  val width: Int,
  val height: Int,
  val scale: Double,
  val fullPage: Boolean,
  val delay: Long,
  val maxHeight: Int,
  val dark: Boolean,
  val mobile: Boolean,
)

/**
 * Renders a page in an invisible WebView at a given CSS viewport and draws it into a bitmap.
 * Everything runs on the main thread (WebView requirement); only the PNG encoding is offloaded.
 */
object WebCapture {
  private const val TIMEOUT = 30_000L
  private const val MAX_PIXELS = 40_000_000.0
  private const val DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  private val main = Handler(Looper.getMainLooper())
  @Volatile private var busy = false

  fun capture(activity: Activity, o: WebOptions, done: (Map<String, Any?>?, String?) -> Unit) {
    main.post {
      if (busy) return@post done(null, "busy")
      busy = true
      try {
        run(activity, o) { r, e ->
          busy = false
          done(r, e)
        }
      } catch (e: Throwable) {
        busy = false
        done(null, e.message ?: e.javaClass.simpleName)
      }
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun run(activity: Activity, o: WebOptions, done: (Map<String, Any?>?, String?) -> Unit) {
    val density = activity.resources.displayMetrics.density
    val root = activity.window.decorView as? ViewGroup ?: return done(null, "no window")
    val wPx = (o.width * density).toInt().coerceAtLeast(100)
    val hPx = (o.height * density).toInt().coerceAtLeast(100)
    val web = GhostWebView(activity)
    var finished = false
    var lastResource = SystemClock.elapsedRealtime()
    var pageDone = false
    var title: String? = null

    fun cleanup() {
      try { root.removeView(web) } catch (_: Throwable) {}
      try { web.stopLoading(); web.destroy() } catch (_: Throwable) {}
    }

    fun finish(r: Map<String, Any?>?, e: String?) {
      if (finished) return
      finished = true
      main.removeCallbacksAndMessages(web)
      cleanup()
      done(r, e)
    }

    web.alpha = 0f
    web.isClickable = false
    web.isFocusable = false
    web.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    web.setBackgroundColor(Color.WHITE)
    web.isVerticalScrollBarEnabled = false
    web.isHorizontalScrollBarEnabled = false
    with(web.settings) {
      javaScriptEnabled = true
      domStorageEnabled = true
      databaseEnabled = true
      loadsImagesAutomatically = true
      mediaPlaybackRequiresUserGesture = true
      // CSS px = view px / density: the page lays out at exactly o.width CSS px.
      useWideViewPort = false
      loadWithOverviewMode = false
      textZoom = 100
      cacheMode = WebSettings.LOAD_DEFAULT
      mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
      if (!o.mobile) userAgentString = DESKTOP_UA
    }
    try {
      CookieManager.getInstance().setAcceptCookie(true)
      CookieManager.getInstance().setAcceptThirdPartyCookies(web, true)
    } catch (_: Throwable) {}
    if (o.dark) {
      try {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) WebSettingsCompat.setAlgorithmicDarkening(web.settings, true)
        @Suppress("DEPRECATION")
        if (Build.VERSION.SDK_INT < 33 && WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) WebSettingsCompat.setForceDark(web.settings, WebSettingsCompat.FORCE_DARK_ON)
      } catch (_: Throwable) {}
    }

    web.webViewClient = object : WebViewClient() {
      override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
        lastResource = SystemClock.elapsedRealtime()
        return null
      }

      override fun onLoadResource(view: WebView?, url: String?) {
        lastResource = SystemClock.elapsedRealtime()
      }

      override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val scheme = request?.url?.scheme ?: return false
        return scheme != "http" && scheme != "https"
      }

      override fun onPageFinished(view: WebView?, url: String?) {
        if (pageDone || finished) return
        pageDone = true
        title = view?.title
        main.postAtTime({ waitIdle(web, o, density, { lastResource }, ::finish) { title } }, web, SystemClock.uptimeMillis() + o.delay.coerceIn(0L, 15_000L))
      }
    }

    root.addView(web, 0, FrameLayout.LayoutParams(wPx, hPx))
    // Behind the React root (index 0) and transparent: never visible, never touched.
    main.postAtTime({ finish(null, "timeout") }, web, SystemClock.uptimeMillis() + TIMEOUT + o.delay)
    web.loadUrl(normalize(o.url))
  }

  private fun normalize(u: String): String {
    val s = u.trim()
    if (s.startsWith("http://") || s.startsWith("https://")) return s
    return "https://$s"
  }

  /** Waits until no resource has loaded for 700 ms (max 5 s), then captures. */
  private fun waitIdle(web: WebView, o: WebOptions, density: Float, last: () -> Long, finish: (Map<String, Any?>?, String?) -> Unit, title: () -> String?) {
    val start = SystemClock.elapsedRealtime()
    val tick = object : Runnable {
      override fun run() {
        val now = SystemClock.elapsedRealtime()
        if (now - last() >= 700 || now - start > 5000) {
          if (o.fullPage) expand(web, o, density, finish, title) else shoot(web, o, density, o.height.toDouble(), finish, title)
        } else main.postAtTime(this, web, SystemClock.uptimeMillis() + 150)
      }
    }
    main.postAtTime(tick, web, SystemClock.uptimeMillis() + 150)
  }

  /** Full page: pins 100vh blocks to their pixel height, grows the view to the document height. */
  private fun expand(web: WebView, o: WebOptions, density: Float, finish: (Map<String, Any?>?, String?) -> Unit, title: () -> String?) {
    val js = """
      (function(){
        try {
          var vh = window.innerHeight;
          var all = document.querySelectorAll('body *');
          for (var i = 0; i < all.length && i < 4000; i++) {
            var el = all[i]; var cs = getComputedStyle(el);
            if (cs.position === 'fixed' && el.getBoundingClientRect().top > vh * 0.5) { el.style.display = 'none'; continue; }
            var h = el.getBoundingClientRect().height;
            if (h > 0 && Math.abs(h - vh) < 2) el.style.height = vh + 'px';
            if (cs.minHeight && cs.minHeight.indexOf('px') > 0 && Math.abs(parseFloat(cs.minHeight) - vh) < 2) el.style.minHeight = vh + 'px';
          }
          window.scrollTo(0, 0);
        } catch (e) {}
        return Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
      })()
    """.trimIndent()
    web.evaluateJavascript(js) { v ->
      val cssH = (v?.trim('"')?.toDoubleOrNull() ?: o.height.toDouble()).coerceIn(o.height.toDouble(), o.maxHeight.toDouble().coerceAtLeast(o.height.toDouble()))
      val lp = web.layoutParams
      lp.height = (cssH * density).toInt()
      web.layoutParams = lp
      web.requestLayout()
      // Let lazy images in the newly "visible" area load.
      main.postAtTime({ shoot(web, o, density, cssH, finish, title) }, web, SystemClock.uptimeMillis() + 900)
    }
  }

  private fun shoot(web: WebView, o: WebOptions, density: Float, cssH: Double, finish: (Map<String, Any?>?, String?) -> Unit, title: () -> String?) {
    try {
      var scale = o.scale.coerceIn(0.5, 4.0)
      while (o.width * scale * cssH * scale > MAX_PIXELS && scale > 0.6) scale -= 0.25
      val bw = (o.width * scale).toInt()
      val bh = (cssH * scale).toInt().coerceAtLeast(1)
      val bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bmp)
      canvas.drawColor(Color.WHITE)
      canvas.scale((scale / density).toFloat(), (scale / density).toFloat())
      web.draw(canvas)
      val ctx = web.context.applicationContext
      Thread {
        try {
          val dir = File(ctx.filesDir, "web").apply { mkdirs() }
          val f = File(dir, "${System.currentTimeMillis()}.png")
          FileOutputStream(f).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
          bmp.recycle()
          main.post { finish(mapOf("uri" to Uri.fromFile(f).toString(), "width" to bw, "height" to bh, "title" to title()), null) }
        } catch (e: Throwable) {
          main.post { finish(null, "save: ${e.message}") }
        }
      }.start()
    } catch (e: OutOfMemoryError) {
      finish(null, "memory")
    } catch (e: Throwable) {
      finish(null, e.message ?: "draw")
    }
  }
}

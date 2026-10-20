package expo.modules.mshots

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.RectF
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import java.io.File
import java.io.FileOutputStream
import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

/** The round MShots shutter bubble (black disc, white ring, smiling mark). */
private class BubbleView(ctx: Context) : View(ctx) {
  private val disc = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#0B0B0C") }
  private val ring = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE; style = Paint.Style.STROKE }
  private val mark = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
  private val accent = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#FF5A1F") }
  var down = false
    set(v) { field = v; invalidate() }

  override fun onDraw(canvas: Canvas) {
    val w = width.toFloat()
    val c = w / 2
    val r = c * (if (down) 0.86f else 0.92f)
    disc.setShadowLayer(c * 0.12f, 0f, c * 0.06f, Color.argb(90, 0, 0, 0))
    canvas.drawCircle(c, c, r, disc)
    ring.strokeWidth = c * 0.08f
    canvas.drawCircle(c, c, r * 0.72f, ring)
    // Smile: a half-moon inside the ring.
    val s = r * 0.36f
    canvas.drawArc(RectF(c - s, c - s * 0.55f, c + s, c + s * 1.15f), 0f, 180f, true, mark)
    canvas.drawCircle(c + s * 0.18f, c + s * 0.62f, s * 0.2f, accent)
  }

  init {
    setLayerType(LAYER_TYPE_SOFTWARE, null)
  }
}

/** Drop target shown at the bottom while dragging the bubble: release on it to stop. */
private class TargetView(ctx: Context) : View(ctx) {
  private val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(200, 20, 20, 22) }
  private val x = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE; style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND }
  var hot = false
    set(v) { field = v; invalidate() }

  override fun onDraw(canvas: Canvas) {
    val c = width / 2f
    bg.color = if (hot) Color.parseColor("#FF5A1F") else Color.argb(200, 20, 20, 22)
    canvas.drawCircle(c, c, c * (if (hot) 0.98f else 0.85f), bg)
    x.strokeWidth = c * 0.1f
    val d = c * 0.28f
    canvas.drawLine(c - d, c - d, c + d, c + d, x)
    canvas.drawLine(c + d, c - d, c - d, c + d, x)
  }
}

/**
 * Foreground service (type mediaProjection) that mirrors the screen into an ImageReader and shows
 * a floating bubble over every app. Tapping the bubble saves a PNG of the screen without it.
 */
class CaptureService : Service() {
  companion object {
    const val CHANNEL = "mshots_capture"
    const val ID = 7301
    const val ACTION_START = "expo.modules.mshots.START"
    const val ACTION_STOP = "expo.modules.mshots.STOP"
    const val EXTRA_CODE = "code"
    const val EXTRA_DATA = "data"
    const val EXTRA_SESSION = "session"

    @Volatile var running = false
    @Volatile var listener: ((String, Map<String, Any?>) -> Unit)? = null

    fun stop(ctx: Context) {
      try { ctx.startService(Intent(ctx, CaptureService::class.java).setAction(ACTION_STOP)) } catch (_: Throwable) {}
    }

    fun capturesDir(ctx: Context): File = File(ctx.filesDir, "captures")
  }

  private val main = Handler(Looper.getMainLooper())
  private lateinit var worker: HandlerThread
  private lateinit var bg: Handler
  private var projection: MediaProjection? = null
  private var vdisplay: VirtualDisplay? = null
  private var reader: ImageReader? = null
  private var wm: WindowManager? = null
  private var bubble: BubbleView? = null
  private var bubbleLp: WindowManager.LayoutParams? = null
  private var target: TargetView? = null
  private var flash: View? = null
  private var session = "default"
  private var count = 0
  private var screenW = 0
  private var screenH = 0
  private var dpi = 0
  @Volatile private var waitingFrame: ((Bitmap?) -> Unit)? = null
  @Volatile private var capturing = false

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    worker = HandlerThread("mshots-capture").apply { start() }
    bg = Handler(worker.looper)
    wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    if (Build.VERSION.SDK_INT >= 26) {
      val nm = getSystemService(NotificationManager::class.java)
      if (nm.getNotificationChannel(CHANNEL) == null) {
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "Capture d’écran", NotificationManager.IMPORTANCE_LOW).apply { setShowBadge(false); setSound(null, null) })
      }
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      shutdown()
      return START_NOT_STICKY
    }
    // Android 14+: startForeground(type mediaProjection) must come before getMediaProjection().
    try {
      ServiceCompat.startForeground(this, ID, notification(), if (Build.VERSION.SDK_INT >= 29) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION else 0)
    } catch (e: Throwable) {
      stopSelf()
      return START_NOT_STICKY
    }
    if (projection != null) return START_NOT_STICKY
    val code = intent?.getIntExtra(EXTRA_CODE, 0) ?: 0
    @Suppress("DEPRECATION")
    val data: Intent? = intent?.getParcelableExtra<Intent>(EXTRA_DATA)
    session = intent?.getStringExtra(EXTRA_SESSION) ?: "default"
    count = File(capturesDir(this), session).list()?.size ?: 0
    if (data == null) {
      shutdown()
      return START_NOT_STICKY
    }
    try {
      val mpm = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
      val mp = mpm.getMediaProjection(code, data) ?: throw IllegalStateException("no projection")
      projection = mp
      mp.registerCallback(object : MediaProjection.Callback() {
        override fun onStop() {
          main.post { shutdown() }
        }
      }, main)
      setupDisplay()
      showBubble()
      running = true
      listener?.invoke("onBubble", mapOf("running" to true))
    } catch (e: Throwable) {
      shutdown()
    }
    return START_NOT_STICKY
  }

  private fun metrics(): DisplayMetrics {
    val m = DisplayMetrics()
    if (Build.VERSION.SDK_INT >= 30) {
      val b = wm!!.currentWindowMetrics.bounds
      m.widthPixels = b.width()
      m.heightPixels = b.height()
      m.densityDpi = resources.displayMetrics.densityDpi
    } else {
      @Suppress("DEPRECATION")
      wm!!.defaultDisplay.getRealMetrics(m)
    }
    return m
  }

  @SuppressLint("WrongConstant")
  private fun setupDisplay() {
    val m = metrics()
    screenW = m.widthPixels
    screenH = m.heightPixels
    dpi = m.densityDpi
    val r = ImageReader.newInstance(screenW, screenH, PixelFormat.RGBA_8888, 3)
    r.setOnImageAvailableListener({ rd ->
      val cb = waitingFrame ?: return@setOnImageAvailableListener
      waitingFrame = null
      cb(grab(rd))
    }, bg)
    val old = reader
    reader = r
    val d = vdisplay
    if (d == null) {
      vdisplay = projection!!.createVirtualDisplay("mshots", screenW, screenH, dpi, DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, r.surface, null, bg)
    } else {
      d.resize(screenW, screenH, dpi)
      d.surface = r.surface
    }
    old?.close()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    // Rotation: follow the new screen size.
    if (projection != null) {
      try { setupDisplay() } catch (_: Throwable) {}
      bubbleLp?.let { lp ->
        lp.x = min(lp.x, max(0, screenW - lp.width))
        lp.y = min(lp.y, max(0, screenH - lp.height))
        bubble?.let { b -> try { wm?.updateViewLayout(b, lp) } catch (_: Throwable) {} }
      }
    }
  }

  /** Latest frame as a bitmap (handles the row padding of the image planes). */
  private fun grab(rd: ImageReader): Bitmap? {
    val img = try { rd.acquireLatestImage() } catch (_: Throwable) { null } ?: return null
    return try {
      val plane = img.planes[0]
      val pixelStride = plane.pixelStride
      val rowStride = plane.rowStride
      val w = img.width
      val h = img.height
      val padded = Bitmap.createBitmap(rowStride / pixelStride, h, Bitmap.Config.ARGB_8888)
      padded.copyPixelsFromBuffer(plane.buffer)
      if (padded.width == w) padded else Bitmap.createBitmap(padded, 0, 0, w, h).also { padded.recycle() }
    } catch (_: Throwable) {
      null
    } finally {
      img.close()
    }
  }

  private fun overlayType() = if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

  @SuppressLint("ClickableViewAccessibility")
  private fun showBubble() {
    val size = (60 * resources.displayMetrics.density).toInt()
    val lp = WindowManager.LayoutParams(
      size, size, overlayType(),
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = screenW - size - (12 * resources.displayMetrics.density).toInt()
      y = (screenH * 0.38).toInt()
    }
    val b = BubbleView(this)
    val slop = ViewConfiguration.get(this).scaledTouchSlop
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    var dragging = false
    b.setOnTouchListener { _, e ->
      when (e.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          downX = e.rawX; downY = e.rawY; startX = lp.x; startY = lp.y; dragging = false
          b.down = true
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = e.rawX - downX
          val dy = e.rawY - downY
          if (!dragging && hypot(dx, dy) > slop) {
            dragging = true
            showTarget(true)
          }
          if (dragging) {
            lp.x = (startX + dx).toInt()
            lp.y = (startY + dy).toInt()
            try { wm?.updateViewLayout(b, lp) } catch (_: Throwable) {}
            target?.hot = overTarget(lp)
          }
        }
        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
          b.down = false
          if (dragging) {
            val stop = overTarget(lp)
            showTarget(false)
            if (stop) {
              shutdown()
              return@setOnTouchListener true
            }
            // Snap to the nearest side.
            lp.x = if (lp.x + lp.width / 2 < screenW / 2) (8 * resources.displayMetrics.density).toInt() else screenW - lp.width - (8 * resources.displayMetrics.density).toInt()
            lp.y = lp.y.coerceIn(0, max(0, screenH - lp.height))
            try { wm?.updateViewLayout(b, lp) } catch (_: Throwable) {}
          } else if (e.actionMasked == MotionEvent.ACTION_UP) {
            shoot()
          }
        }
      }
      true
    }
    wm?.addView(b, lp)
    bubble = b
    bubbleLp = lp
  }

  private fun targetSize() = (72 * resources.displayMetrics.density).toInt()

  private fun overTarget(lp: WindowManager.LayoutParams): Boolean {
    val ts = targetSize()
    val tx = screenW / 2f
    val ty = screenH - ts * 1.6f + ts / 2f
    val bx = lp.x + lp.width / 2f
    val by = lp.y + lp.height / 2f
    return abs(bx - tx) < ts && abs(by - ty) < ts
  }

  private fun showTarget(show: Boolean) {
    if (show && target == null) {
      val ts = targetSize()
      val t = TargetView(this)
      val lp = WindowManager.LayoutParams(ts, ts, overlayType(), WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE, PixelFormat.TRANSLUCENT).apply {
        gravity = Gravity.TOP or Gravity.START
        x = screenW / 2 - ts / 2
        y = (screenH - ts * 1.6f).toInt()
      }
      try { wm?.addView(t, lp); target = t } catch (_: Throwable) {}
    } else if (!show) {
      target?.let { try { wm?.removeView(it) } catch (_: Throwable) {} }
      target = null
    }
  }

  /** Hides the bubble, waits for a fresh frame without it, saves it, shows the bubble again. */
  private fun shoot() {
    if (capturing) return
    val rd = reader ?: return
    capturing = true
    bubble?.visibility = View.INVISIBLE
    // Drop the frames that still contain the bubble, then take the next one.
    bg.post {
      try { rd.acquireLatestImage()?.close() } catch (_: Throwable) {}
      var delivered = false
      val deliver: (Bitmap?) -> Unit = { bmp ->
        if (!delivered) {
          delivered = true
          save(bmp)
        }
      }
      waitingFrame = deliver
      // Static screen: no new frame comes; take the latest one after a short wait.
      bg.postDelayed({
        if (!delivered) {
          waitingFrame = null
          deliver(grab(rd))
        }
      }, 450)
    }
  }

  private fun save(bmp: Bitmap?) {
    if (bmp == null) {
      main.post {
        bubble?.visibility = View.VISIBLE
        capturing = false
        Toast.makeText(this, "Capture impossible, réessayez", Toast.LENGTH_SHORT).show()
      }
      return
    }
    main.post {
      bubble?.visibility = View.VISIBLE
      flashScreen()
    }
    try {
      val dir = File(capturesDir(this), session).apply { mkdirs() }
      val f = File(dir, "${System.currentTimeMillis()}.png")
      FileOutputStream(f).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
      val w = bmp.width
      val h = bmp.height
      bmp.recycle()
      count++
      val n = count
      main.post {
        capturing = false
        Toast.makeText(this, "Capture $n enregistrée", Toast.LENGTH_SHORT).show()
        listener?.invoke(
          "onCapture",
          mapOf("uri" to Uri.fromFile(f).toString(), "width" to w, "height" to h, "date" to f.lastModified().toDouble(), "app" to null, "session" to session)
        )
      }
    } catch (e: Throwable) {
      main.post {
        capturing = false
        Toast.makeText(this, "Capture impossible : ${e.message}", Toast.LENGTH_SHORT).show()
      }
    }
  }

  private fun flashScreen() {
    if (flash != null) return
    val v = View(this).apply { setBackgroundColor(Color.WHITE); alpha = 0.55f }
    val lp = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT, overlayType(),
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT,
    )
    try {
      wm?.addView(v, lp)
      flash = v
      v.animate().alpha(0f).setDuration(260).withEndAction {
        try { wm?.removeView(v) } catch (_: Throwable) {}
        flash = null
      }.start()
    } catch (_: Throwable) {
      flash = null
    }
  }

  private fun notification(): Notification {
    val stop = PendingIntent.getBroadcast(this, 1, Intent(this, StopReceiver::class.java).setPackage(packageName), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    val open = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }
    return NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(R.drawable.mshots_notif)
      .setColor(Color.parseColor("#FF5A1F"))
      .setContentTitle("MShots capture")
      .setContentText("Touchez la bulle pour capturer l’écran")
      .setOngoing(true)
      .setSilent(true)
      .setContentIntent(open)
      .addAction(0, "Arrêter", stop)
      .build()
  }

  private fun shutdown() {
    showTarget(false)
    bubble?.let { try { wm?.removeView(it) } catch (_: Throwable) {} }
    bubble = null
    flash?.let { try { wm?.removeView(it) } catch (_: Throwable) {} }
    flash = null
    try { vdisplay?.release() } catch (_: Throwable) {}
    vdisplay = null
    try { reader?.close() } catch (_: Throwable) {}
    reader = null
    val p = projection
    projection = null
    try { p?.stop() } catch (_: Throwable) {}
    val was = running
    running = false
    if (was) listener?.invoke("onBubble", mapOf("running" to false))
    try { ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE) } catch (_: Throwable) {}
    stopSelf()
  }

  override fun onDestroy() {
    if (projection != null || bubble != null) shutdown()
    try { worker.quitSafely() } catch (_: Throwable) {}
    super.onDestroy()
  }
}

class StopReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    CaptureService.stop(context)
  }
}

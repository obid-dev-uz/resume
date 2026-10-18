package kho.resume

import android.Manifest
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaScannerConnection
import android.os.Build
import android.os.Environment
import android.print.PdfPrint
import android.print.PrintAttributes
import android.provider.MediaStore
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File

/*
 * Ilova (JS) uchun PDF ko'prigi: window.KhoAndroid.exportPdf(nom, "save" | "share").
 * Joriy sahifa print CSS bilan (faqat A4 varaqlar) PDF'ga yoziladi, keyin:
 *   save  — telefonning Download papkasiga (Android 10+ ruxsatsiz, 8/9 da yozish ruxsati so'raladi);
 *   share — Android "Ulashish" oynasi (Telegram, Gmail, Drive...).
 * Natija JS'ga qaytadi: window.__khoPdfDone({ ok, action, message }).
 */
class PdfBridge(private val activity: MainActivity, private val webView: WebView) {

  @JavascriptInterface
  fun exportPdf(fileName: String, action: String) {
    activity.runOnUiThread { build(safeName(fileName), action) }
  }

  private fun safeName(name: String): String {
    val clean = name.replace(Regex("[\\\\/:*?\"<>|\\n\\r\\t]"), " ").trim().take(80)
    return clean.ifEmpty { "resume" }
  }

  private fun build(name: String, action: String) {
    val dir = File(activity.cacheDir, "pdf").apply { mkdirs() }
    val file = File(dir, "$name.pdf")
    val attributes = PrintAttributes.Builder()
      .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
      .setResolution(PrintAttributes.Resolution("pdf", "pdf", 600, 600))
      .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
      .build()
    val adapter = webView.createPrintDocumentAdapter(name)
    PdfPrint(attributes).write(adapter, file) { error ->
      activity.runOnUiThread {
        when {
          error != null -> done(false, action, "PDF yaratilmadi: $error")
          action == "share" -> share(file)
          else -> save(file)
        }
      }
    }
  }

  // ---- Ulashish ----

  private fun share(file: File) {
    try {
      val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", file)
      val send = Intent(Intent.ACTION_SEND).apply {
        type = "application/pdf"
        putExtra(Intent.EXTRA_STREAM, uri)
        putExtra(Intent.EXTRA_SUBJECT, file.nameWithoutExtension)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      activity.startActivity(Intent.createChooser(send, "PDF'ni ulashish"))
      done(true, "share", "")
    } catch (e: Exception) {
      done(false, "share", "Ulashib bo'lmadi: ${e.message}")
    }
  }

  // ---- Download papkasiga saqlash ----

  private fun save(file: File) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      saveMediaStore(file)
      return
    }
    val permission = Manifest.permission.WRITE_EXTERNAL_STORAGE
    if (ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED) {
      saveLegacy(file)
    } else {
      activity.requestPermissions(arrayOf(permission)) { granted ->
        activity.runOnUiThread {
          if (granted == true) saveLegacy(file)
          else done(false, "save", "Xotiraga yozishga ruxsat berilmadi")
        }
      }
    }
  }

  /** Android 10+: MediaStore orqali, ruxsat kerak emas; nom band bo'lsa tizim " (1)" qo'shadi */
  private fun saveMediaStore(file: File) {
    try {
      val resolver = activity.contentResolver
      val values = ContentValues().apply {
        put(MediaStore.MediaColumns.DISPLAY_NAME, file.name)
        put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
      }
      val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
        ?: throw IllegalStateException("Download papkasiga yozib bo'lmadi")
      resolver.openOutputStream(uri).use { out -> file.inputStream().use { it.copyTo(out!!) } }
      saved("Download/${file.name}")
    } catch (e: Exception) {
      done(false, "save", "Saqlanmadi: ${e.message}")
    }
  }

  /** Android 8/9: Download papkasiga to'g'ridan-to'g'ri; nom band bo'lsa "Nom (1).pdf" */
  @Suppress("DEPRECATION")
  private fun saveLegacy(file: File) {
    try {
      val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).apply { mkdirs() }
      var target = File(dir, file.name)
      var n = 1
      while (target.exists()) target = File(dir, "${file.nameWithoutExtension} (${n++}).pdf")
      file.copyTo(target)
      // Fayl menejeri va "Yuklamalar"da darhol ko'rinsin
      MediaScannerConnection.scanFile(activity, arrayOf(target.absolutePath), arrayOf("application/pdf"), null)
      saved("Download/${target.name}")
    } catch (e: Exception) {
      done(false, "save", "Saqlanmadi: ${e.message}")
    }
  }

  private fun saved(path: String) {
    Toast.makeText(activity, "PDF saqlandi: $path", Toast.LENGTH_LONG).show()
    done(true, "save", path)
  }

  private fun done(ok: Boolean, action: String, message: String) {
    if (!ok) Toast.makeText(activity, message, Toast.LENGTH_LONG).show()
    val result = JSONObject().put("ok", ok).put("action", action).put("message", message)
    webView.evaluateJavascript("window.__khoPdfDone && window.__khoPdfDone($result)", null)
  }
}

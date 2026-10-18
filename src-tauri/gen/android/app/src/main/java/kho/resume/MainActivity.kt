package kho.resume

import android.os.Bundle
import android.view.View
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    /*
     * Ilova tizim panellari (tepadagi status bar, pastki tugmalar) va klaviatura ostiga kirmasin.
     * enableEdgeToEdge oynani butun ekranga cho'zadi, WebView esa CSS safe-area-inset qiymatlarini
     * bermaydi — shuning uchun sahifa ular orasiga ichki joy (padding) bilan joylashtiriladi.
     * Android 15+ da butun ekranga cho'zish majburiy, bu yechim u yerda ham ishlaydi.
     */
    val content = findViewById<View>(android.R.id.content)
    // Panellar ostidagi joy ilova foni rangida (yorug'/qorong'i rejim: values/values-night)
    content.setBackgroundColor(ContextCompat.getColor(this, R.color.app_background))
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      // Klaviatura ochilsa, sahifa uning ustida tugaydi (maydonlar klaviatura ostida qolmaydi)
      val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
      view.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
      WindowInsetsCompat.CONSUMED
    }
  }

  /** PDF yuklab olish va ulashish uchun JS ko'prigi: window.KhoAndroid (PdfBridge.kt) */
  override fun onWebViewCreate(webView: WebView) {
    webView.addJavascriptInterface(PdfBridge(this, webView), "KhoAndroid")
  }
}

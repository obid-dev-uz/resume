package android.print

import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import java.io.File

/*
 * WebView'ning chop etish adapteridan (PrintDocumentAdapter) PDF faylni to'g'ridan-to'g'ri
 * yozadi — tizimning chop etish oynasi ochilmaydi. PDF vektorli: matn tanlanadi, havolalar
 * bosiladi (desktopdagi "PDF sifatida saqlash" bilan bir xil, chunki print CSS ishlatiladi).
 *
 * LayoutResultCallback / WriteResultCallback konstruktorlari SDK'da yashirin (@hide) va
 * paket ichida ko'rinadi — shuning uchun bu klass `android.print` paketida turadi.
 */
class PdfPrint(private val attributes: PrintAttributes) {

  fun write(adapter: PrintDocumentAdapter, file: File, onDone: (error: String?) -> Unit) {
    adapter.onStart()
    adapter.onLayout(null, attributes, CancellationSignal(), object : PrintDocumentAdapter.LayoutResultCallback() {
      override fun onLayoutFinished(info: PrintDocumentInfo?, changed: Boolean) {
        val fd = try {
          ParcelFileDescriptor.open(
            file,
            ParcelFileDescriptor.MODE_CREATE or ParcelFileDescriptor.MODE_TRUNCATE or ParcelFileDescriptor.MODE_READ_WRITE,
          )
        } catch (e: Exception) {
          adapter.onFinish()
          onDone("Faylni ochib bo'lmadi: ${e.message}")
          return
        }
        adapter.onWrite(arrayOf(PageRange.ALL_PAGES), fd, CancellationSignal(), object : PrintDocumentAdapter.WriteResultCallback() {
          override fun onWriteFinished(pages: Array<out PageRange>?) {
            fd.close()
            adapter.onFinish()
            onDone(null)
          }

          override fun onWriteFailed(error: CharSequence?) {
            fd.close()
            adapter.onFinish()
            onDone(error?.toString() ?: "PDF yozilmadi")
          }

          override fun onWriteCancelled() {
            fd.close()
            adapter.onFinish()
            onDone("Bekor qilindi")
          }
        })
      }

      override fun onLayoutFailed(error: CharSequence?) {
        adapter.onFinish()
        onDone(error?.toString() ?: "Sahifalar tayyorlanmadi")
      }

      override fun onLayoutCancelled() {
        adapter.onFinish()
        onDone("Bekor qilindi")
      }
    }, Bundle())
  }
}

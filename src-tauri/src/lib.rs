// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/*
 * PDF (chop etish) oynasi. Linux'da WebKitGTK `window.print()` CSS'dagi `@page { margin: 0 }` ni
 * hisobga olmaydi va GTK'ning standart chetini (~6 mm) qo'yadi — rezyume varaq chetigacha yetmaydi.
 * Shuning uchun Linux'da chop etish WebKit'ning o'zi orqali, chetlari 0 bo'lgan A4 bilan ochiladi.
 * Boshqa tizimlarda oddiy window.print() (u yerda @page qoidasi ishlaydi).
 */
#[tauri::command]
fn print_page(window: tauri::WebviewWindow, title: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        window
            .with_webview(move |webview| {
                use gtk::prelude::*;
                use webkit2gtk::PrintOperationExt;

                let page = gtk::PageSetup::new();
                page.set_paper_size(&gtk::PaperSize::new(Some(&gtk::PAPER_NAME_A4)));
                page.set_orientation(gtk::PageOrientation::Portrait);
                page.set_top_margin(0.0, gtk::Unit::Mm);
                page.set_bottom_margin(0.0, gtk::Unit::Mm);
                page.set_left_margin(0.0, gtk::Unit::Mm);
                page.set_right_margin(0.0, gtk::Unit::Mm);

                // "Faylga chop etish" da taklif qilinadigan fayl nomi — rezyume nomi
                let settings = gtk::PrintSettings::new();
                settings.set(&gtk::PRINT_SETTINGS_OUTPUT_BASENAME, Some(title.as_str()));

                let operation = webkit2gtk::PrintOperation::builder()
                    .web_view(&webview.inner())
                    .page_setup(&page)
                    .print_settings(&settings)
                    .build();
                let parent = webview.inner().toplevel().and_then(|w| w.downcast::<gtk::Window>().ok());
                operation.run_dialog(parent.as_ref());
            })
            .map_err(|e| e.to_string())
    }
    #[cfg(all(desktop, not(target_os = "linux")))]
    {
        let _ = title;
        window.print().map_err(|e| e.to_string())
    }
    // Android'da PDF Kotlin tomonida yaratiladi (PdfBridge.kt); WebviewWindow::print() faqat desktopda bor
    #[cfg(mobile)]
    {
        let _ = (window, title);
        Err("Mobil ilovada bu buyruq ishlatilmaydi".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, print_page])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

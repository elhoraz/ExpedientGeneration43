package com.expedient43.app;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable HTML5 features: Geolocation, LocalStorage, Media, File Access
            settings.setGeolocationEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Enable cookies & third-party cookies for seamless authentication
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            // Register Native Download & MediaStore Bridge for direct in-app saving
            webView.addJavascriptInterface(new NativeDownloadBridge(), "ExpedientNativeBridge");

            // Handle file downloads (Photobooth photos/live videos, vCard, receipts, attachments)
            webView.setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                    try {
                        if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                            
                            String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                            if (filename == null || filename.trim().isEmpty() || filename.endsWith(".bin")) {
                                filename = "Expedient_Download_" + System.currentTimeMillis();
                                if (mimetype != null && mimetype.contains("video")) {
                                    filename += ".mp4";
                                } else {
                                    filename += ".png";
                                }
                            }

                            if (mimetype != null && !mimetype.isEmpty()) {
                                request.setMimeType(mimetype);
                            }

                            request.setTitle(filename);
                            request.setDescription("Menyimpan ke Galeri / Download Expedient 43...");
                            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                            
                            try {
                                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
                            } catch (Exception destEx) {
                                try {
                                    request.setDestinationInExternalFilesDir(MainActivity.this, Environment.DIRECTORY_DOWNLOADS, filename);
                                } catch (Exception ignored) {}
                            }

                            // Cookie & User Agent forwarding
                            String cookies = CookieManager.getInstance().getCookie(url);
                            if (cookies != null) {
                                request.addRequestHeader("cookie", cookies);
                            }
                            if (userAgent != null) {
                                request.addRequestHeader("User-Agent", userAgent);
                            }

                            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                            if (dm != null) {
                                dm.enqueue(request);
                                Toast.makeText(MainActivity.this, "📥 Mulai mengunduh: " + filename, Toast.LENGTH_SHORT).show();
                                return;
                            }
                        }

                        // Fallback: Open in external browser or handler only if DownloadManager failed completely
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception e) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW);
                            intent.setData(Uri.parse(url));
                            startActivity(intent);
                        } catch (Exception ignored) {}
                    }
                }
            });
        }
    }

    /**
     * Native Javascript Interface for direct in-app saving to Android Gallery & MediaStore
     */
    public class NativeDownloadBridge {
        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        @JavascriptInterface
        public boolean saveBase64(String base64Data, String filename, String mimeType) {
            try {
                if (base64Data == null || base64Data.trim().isEmpty()) return false;
                String cleanBase64 = base64Data;
                if (cleanBase64.contains(",")) {
                    cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                }
                byte[] bytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                if (bytes == null || bytes.length == 0) return false;

                boolean isVideo = (mimeType != null && mimeType.contains("video")) || 
                                  filename.endsWith(".mp4") || filename.endsWith(".webm");
                String actualMime = mimeType != null && !mimeType.isEmpty() ? mimeType : (isVideo ? "video/mp4" : "image/png");

                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, actualMime);

                Uri collection;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    String folder = isVideo ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES;
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, folder + "/Expedient");
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                    collection = isVideo ?
                        MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) :
                        MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                } else {
                    collection = isVideo ?
                        MediaStore.Video.Media.EXTERNAL_CONTENT_URI :
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                }

                Uri itemUri = getContentResolver().insert(collection, values);
                if (itemUri != null) {
                    try (OutputStream out = getContentResolver().openOutputStream(itemUri)) {
                        if (out != null) {
                            out.write(bytes);
                            out.flush();
                        }
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        values.clear();
                        values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                        getContentResolver().update(itemUri, values, null, null);
                    }

                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "✅ Tersimpan di Galeri HP (" + (isVideo ? "Video" : "Foto") + ")", Toast.LENGTH_LONG).show();
                    });
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

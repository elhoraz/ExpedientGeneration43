package com.expedient43.app;

import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable HTML5 features: Geolocation, LocalStorage, Media
            settings.setGeolocationEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Enable cookies & third-party cookies for seamless authentication
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

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
                            request.setDescription("Mengunduh file dari Expedient 43...");
                            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);

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
                                Toast.makeText(MainActivity.this, "Mulai mengunduh: " + filename, Toast.LENGTH_SHORT).show();
                                return;
                            }
                        }

                        // Fallback: Open in external browser or handler
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

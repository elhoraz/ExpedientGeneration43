package com.expedient43.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import java.util.Calendar;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
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
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    public static final String NOTIFICATION_CHANNEL_ID = "expedient_main_channel";
    public static final String NOTIFICATION_CHANNEL_NAME = "Notifikasi Expedient 43";
    private static final int NOTIF_PERMISSION_CODE = 101;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Create High-Priority Notification Channel (Android 8.0+)
        createNotificationChannel();

        // 2. Request Notification Permission on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    NOTIF_PERMISSION_CODE
                );
            }
        }

        // 3. Handle Notification Intent if opened from notification tap
        handleNotificationIntent(getIntent());

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

        @JavascriptInterface
        public boolean hasNotificationPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                return checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            }
            return true;
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                runOnUiThread(() -> {
                    ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        NOTIF_PERMISSION_CODE
                    );
                });
            }
        }

        @JavascriptInterface
        public void showNotification(String title, String message, String targetUrl) {
            runOnUiThread(() -> {
                try {
                    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                    if (manager == null) return;

                    Intent intent = new Intent(MainActivity.this, MainActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    if (targetUrl != null && !targetUrl.trim().isEmpty()) {
                        intent.putExtra("navigate_to", targetUrl);
                    }

                    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        flags |= PendingIntent.FLAG_IMMUTABLE;
                    }

                    PendingIntent pendingIntent = PendingIntent.getActivity(
                        MainActivity.this,
                        (int) (System.currentTimeMillis() % 100000),
                        intent,
                        flags
                    );

                    NotificationCompat.Builder builder = new NotificationCompat.Builder(MainActivity.this, NOTIFICATION_CHANNEL_ID)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle(title != null ? title : "Expedient 43")
                        .setContentText(message != null ? message : "Pemberitahuan baru")
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(message != null ? message : ""))
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setDefaults(NotificationCompat.DEFAULT_ALL)
                        .setAutoCancel(true)
                        .setContentIntent(pendingIntent);

                    manager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        @JavascriptInterface
        public void schedulePrayerAlarm(String prayerName, int hour, int minute, String title, String message) {
            try {
                AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
                if (alarmManager == null) return;

                Calendar calendar = Calendar.getInstance();
                calendar.set(Calendar.HOUR_OF_DAY, hour);
                calendar.set(Calendar.MINUTE, minute);
                calendar.set(Calendar.SECOND, 0);
                calendar.set(Calendar.MILLISECOND, 0);

                // If alarm time has already passed today, schedule for tomorrow
                if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                    calendar.add(Calendar.DAY_OF_YEAR, 1);
                }

                Intent intent = new Intent(MainActivity.this, PrayerAlarmReceiver.class);
                intent.putExtra("title", title);
                intent.putExtra("message", message);
                intent.putExtra("prayerName", prayerName);
                intent.putExtra("targetUrl", "/kiblat");

                int requestCode = Math.abs(prayerName.hashCode());
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }

                PendingIntent pendingIntent = PendingIntent.getBroadcast(MainActivity.this, requestCode, intent, flags);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public int getAppVersionCode() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    return (int) getPackageManager().getPackageInfo(getPackageName(), 0).getLongVersionCode();
                } else {
                    return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
                }
            } catch (Exception e) {
                return 1;
            }
        }

        @JavascriptInterface
        public String getAppVersionName() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "1.0.0";
            }
        }

        @JavascriptInterface
        public void installApk(String apkUrl) {
            runOnUiThread(() -> {
                try {
                    if (apkUrl == null || apkUrl.trim().isEmpty()) return;

                    Toast.makeText(MainActivity.this, "📥 Mengunduh pembaruan APK Expedient 43...", Toast.LENGTH_SHORT).show();

                    DownloadManager downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    Uri downloadUri = Uri.parse(apkUrl);

                    DownloadManager.Request request = new DownloadManager.Request(downloadUri);
                    request.setTitle("Expedient 43 Update");
                    request.setDescription("Mengunduh versi terbaru...");
                    request.setMimeType("application/vnd.android.package-archive");

                    File destFile = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "expedient_update.apk");
                    if (destFile.exists()) {
                        destFile.delete();
                    }
                    request.setDestinationInExternalFilesDir(MainActivity.this, Environment.DIRECTORY_DOWNLOADS, "expedient_update.apk");
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

                    long downloadId = downloadManager.enqueue(request);

                    BroadcastReceiver onComplete = new BroadcastReceiver() {
                        @Override
                        public void onReceive(Context context, Intent intent) {
                            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                            if (id == downloadId) {
                                try {
                                    unregisterReceiver(this);
                                } catch (Exception ignored) {}

                                try {
                                    File file = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "expedient_update.apk");
                                    if (file.exists()) {
                                        Uri contentUri = FileProvider.getUriForFile(
                                            MainActivity.this,
                                            getPackageName() + ".fileprovider",
                                            file
                                        );

                                        Intent installIntent = new Intent(Intent.ACTION_VIEW);
                                        installIntent.setDataAndType(contentUri, "application/vnd.android.package-archive");
                                        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                                        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                            if (!getPackageManager().canRequestPackageInstalls()) {
                                                Toast.makeText(MainActivity.this, "Silakan aktifkan izin pasang aplikasi tidak dikenal untuk memperbarui", Toast.LENGTH_LONG).show();
                                                Intent settingsIntent = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                                                settingsIntent.setData(Uri.parse("package:" + getPackageName()));
                                                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                                startActivity(settingsIntent);
                                                return;
                                            }
                                        }

                                        startActivity(installIntent);
                                    }
                                } catch (Exception e) {
                                    e.printStackTrace();
                                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl));
                                    browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(browserIntent);
                                }
                            }
                        }
                    };

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        ContextCompat.registerReceiver(
                            MainActivity.this,
                            onComplete,
                            new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                            ContextCompat.RECEIVER_EXPORTED
                        );
                    } else {
                        registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    try {
                        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl));
                        browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(browserIntent);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            });
        }
    }

    /**
     * Create high-importance Android Notification Channel with sound, vibration, and gold LED
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifikasi resmi alumni, pesan chat, jadwal adzan, dan pengumuman angkatan.");
            channel.enableLights(true);
            channel.setLightColor(0xFFD4AF37); // Golden color
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 150, 250});
            channel.setShowBadge(true);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleNotificationIntent(intent);
    }

    private void handleNotificationIntent(Intent intent) {
        if (intent != null && intent.hasExtra("navigate_to")) {
            String url = intent.getStringExtra("navigate_to");
            if (url != null && !url.trim().isEmpty()) {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    if (url.startsWith("/")) {
                        webView.loadUrl("https://expedientgeneration.vercel.app" + url);
                    } else {
                        webView.loadUrl(url);
                    }
                }
            }
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

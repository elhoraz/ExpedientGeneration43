package com.expedient43.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Native Firebase Messaging Service to wake up Android device
 * and show incoming Call / Chat notifications even when app is killed/closed.
 */
public class ExpedientFirebaseService extends FirebaseMessagingService {
    private static final String TAG = "ExpedientFCM";
    public static final String CALLS_CHANNEL_ID = "expedient_incoming_calls_channel";
    public static final String CALLS_CHANNEL_NAME = "Panggilan Masuk (Voice & Video)";
    public static final String CHAT_CHANNEL_ID = "expedient_chat_channel";
    public static final String CHAT_CHANNEL_NAME = "Pesan Chat & Komunitas";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM Token generated: " + token);
        // Persist token in SharedPreferences
        SharedPreferences prefs = getSharedPreferences("expedient_fcm_prefs", Context.MODE_PRIVATE);
        prefs.edit().putString("fcm_token", token).apply();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "FCM Message received from: " + remoteMessage.getFrom());

        String title = "Expedient 43";
        String body = "Pemberitahuan baru";
        String targetUrl = "/beranda";
        String type = "general";
        String callerId = "";

        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            if (data.containsKey("title")) title = data.get("title");
            if (data.containsKey("body")) body = data.get("body");
            if (data.containsKey("message")) body = data.get("message");
            if (data.containsKey("url")) targetUrl = data.get("url");
            if (data.containsKey("type")) type = data.get("type");
            if (data.containsKey("callerId")) callerId = data.get("callerId");
        }

        displayPushNotification(title, body, targetUrl, type, callerId);
    }

    private void displayPushNotification(String title, String body, String targetUrl, String type, String callerId) {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            boolean isCall = "call".equalsIgnoreCase(type) || "video_call".equalsIgnoreCase(type) || "voice_call".equalsIgnoreCase(type);
            String channelId = isCall ? CALLS_CHANNEL_ID : CHAT_CHANNEL_ID;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (isCall) {
                    NotificationChannel callChannel = new NotificationChannel(
                        CALLS_CHANNEL_ID,
                        CALLS_CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    callChannel.setDescription("Pemberitahuan panggilan suara dan video masuk.");
                    callChannel.enableLights(true);
                    callChannel.setLightColor(0xFF00FF7F);
                    callChannel.enableVibration(true);
                    callChannel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000});

                    Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .build();
                    callChannel.setSound(ringtoneUri, audioAttributes);
                    callChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                    callChannel.setBypassDnd(true);
                    manager.createNotificationChannel(callChannel);
                } else {
                    NotificationChannel chatChannel = new NotificationChannel(
                        CHAT_CHANNEL_ID,
                        CHAT_CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    chatChannel.setDescription("Pemberitahuan pesan chat masuk dan alumni.");
                    chatChannel.enableLights(true);
                    chatChannel.setLightColor(0xFFD4AF37);
                    chatChannel.enableVibration(true);
                    chatChannel.setVibrationPattern(new long[]{0, 250, 150, 250});
                    chatChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                    manager.createNotificationChannel(chatChannel);
                }
            }

            Intent launchIntent = new Intent(this, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            if (targetUrl != null && !targetUrl.trim().isEmpty()) {
                launchIntent.putExtra("navigate_to", targetUrl);
            }

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent contentPendingIntent = PendingIntent.getActivity(
                this,
                (int) (System.currentTimeMillis() % 100000),
                launchIntent,
                flags
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setAutoCancel(true)
                .setContentIntent(contentPendingIntent);

            if (isCall) {
                builder.setCategory(NotificationCompat.CATEGORY_CALL)
                       .setFullScreenIntent(contentPendingIntent, true)
                       .setOngoing(true)
                       .addAction(R.mipmap.ic_launcher, "📞 Jawab Panggilan", contentPendingIntent);
            } else {
                builder.setCategory(NotificationCompat.CATEGORY_MESSAGE);
            }

            int notifId = isCall ? 888 : (int) (System.currentTimeMillis() % 100000);
            manager.notify(notifId, builder.build());
        } catch (Exception e) {
            Log.e(TAG, "Error showing push notification: " + e.getMessage(), e);
        }
    }
}

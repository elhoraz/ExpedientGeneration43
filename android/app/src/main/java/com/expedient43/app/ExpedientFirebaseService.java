package com.expedient43.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Native Firebase Messaging Service to wake up Android device
 * and show WhatsApp-style incoming Call / Chat notifications with Accept and Decline actions.
 */
public class ExpedientFirebaseService extends FirebaseMessagingService {
    private static final String TAG = "ExpedientFCM";
    public static final String CALLS_CHANNEL_ID = "expedient_incoming_calls_v3";
    public static final String CALLS_CHANNEL_NAME = "Panggilan Masuk (Voice & Video)";
    public static final String CHAT_CHANNEL_ID = "expedient_chat_channel";
    public static final String CHAT_CHANNEL_NAME = "Pesan Chat & Komunitas";

    private static Ringtone activeRingtone = null;
    private static Handler ringtoneTimeoutHandler = null;
    private static Runnable ringtoneTimeoutRunnable = null;

    public static synchronized void playCallRingtone(Context context) {
        try {
            stopCallRingtone();
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (ringtoneUri == null) {
                ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            activeRingtone = RingtoneManager.getRingtone(context.getApplicationContext(), ringtoneUri);
            if (activeRingtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    activeRingtone.setAudioAttributes(audioAttributes);
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    activeRingtone.setLooping(true);
                }
                activeRingtone.play();
                Log.d(TAG, "Incoming call ringtone started playing.");
            }

            // Auto-stop after 35 seconds (missed call timeout)
            if (ringtoneTimeoutHandler == null) {
                ringtoneTimeoutHandler = new Handler(Looper.getMainLooper());
            }
            ringtoneTimeoutRunnable = () -> {
                Log.d(TAG, "Incoming call ringing timeout reached (35s).");
                stopCallRingtone();
                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.cancel(888);
                }
            };
            ringtoneTimeoutHandler.postDelayed(ringtoneTimeoutRunnable, 35000);
        } catch (Exception e) {
            Log.e(TAG, "Error playing call ringtone: " + e.getMessage(), e);
        }
    }

    public static synchronized void stopCallRingtone() {
        try {
            if (ringtoneTimeoutHandler != null && ringtoneTimeoutRunnable != null) {
                ringtoneTimeoutHandler.removeCallbacks(ringtoneTimeoutRunnable);
            }
            if (activeRingtone != null) {
                if (activeRingtone.isPlaying()) {
                    activeRingtone.stop();
                }
                activeRingtone = null;
                Log.d(TAG, "Incoming call ringtone stopped.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping call ringtone: " + e.getMessage(), e);
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM Token generated: " + token);
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
            if (data.containsKey("path")) targetUrl = data.get("path");
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

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            if (isCall) {
                // 1. Wake screen up immediately (turn on screen even if device is asleep/locked)
                try {
                    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                    if (pm != null) {
                        PowerManager.WakeLock wakeLock = pm.newWakeLock(
                            PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                            PowerManager.ACQUIRE_CAUSES_WAKEUP |
                            PowerManager.ON_AFTER_RELEASE,
                            "expedient:incoming_call_wake"
                        );
                        wakeLock.acquire(30000); // 30s wake lock
                    }
                } catch (Exception wakeEx) {
                    Log.w(TAG, "Call WakeLock notice: " + wakeEx.getMessage());
                }

                // 2. Play continuous ringtone
                playCallRingtone(this);

                // 3. Action: Terima (Answer Call)
                Intent acceptIntent = new Intent(this, MainActivity.class);
                acceptIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                if (targetUrl != null && !targetUrl.trim().isEmpty()) {
                    acceptIntent.putExtra("navigate_to", targetUrl);
                }
                acceptIntent.putExtra("callAction", "accept");
                acceptIntent.putExtra("callerId", callerId);

                PendingIntent acceptPendingIntent = PendingIntent.getActivity(
                    this,
                    8881,
                    acceptIntent,
                    flags
                );

                // 4. Action: Tolak (Decline Call)
                Intent declineIntent = new Intent(this, CallActionReceiver.class);
                declineIntent.setAction("ACTION_DECLINE_CALL");
                declineIntent.putExtra("callerId", callerId);

                PendingIntent declinePendingIntent = PendingIntent.getBroadcast(
                    this,
                    8882,
                    declineIntent,
                    flags
                );

                // 5. WhatsApp-style Heads-Up Banner with FullScreenIntent & Dual Action Buttons
                NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_CALL)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setOngoing(true)
                    .setAutoCancel(true)
                    .setContentIntent(acceptPendingIntent)
                    .setFullScreenIntent(acceptPendingIntent, true)
                    .addAction(R.mipmap.ic_launcher, "❌ Tolak", declinePendingIntent)
                    .addAction(R.mipmap.ic_launcher, "📞 Terima", acceptPendingIntent);

                manager.notify(888, builder.build());
            } else {
                // Regular chat or announcement notification
                Intent launchIntent = new Intent(this, MainActivity.class);
                launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                if (targetUrl != null && !targetUrl.trim().isEmpty()) {
                    launchIntent.putExtra("navigate_to", targetUrl);
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
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setAutoCancel(true)
                    .setContentIntent(contentPendingIntent);

                int notifId = (int) (System.currentTimeMillis() % 100000);
                manager.notify(notifId, builder.build());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error showing push notification: " + e.getMessage(), e);
        }
    }
}

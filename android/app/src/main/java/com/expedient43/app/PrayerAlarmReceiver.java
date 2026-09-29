package com.expedient43.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * Native Android BroadcastReceiver to wake up device and fire prayer alerts
 * with authentic Adzan audio even when the screen is locked and app is closed (Doze Mode).
 */
public class PrayerAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "ExpedientAdzan";
    private static MediaPlayer activeMediaPlayer = null;

    public static synchronized void playAdzanAudio(Context context) {
        try {
            stopAdzanAudio();
            activeMediaPlayer = MediaPlayer.create(context.getApplicationContext(), R.raw.adzan);
            if (activeMediaPlayer != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build();
                    activeMediaPlayer.setAudioAttributes(audioAttributes);
                } else {
                    activeMediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                }
                activeMediaPlayer.setVolume(1.0f, 1.0f);
                activeMediaPlayer.setOnCompletionListener(mp -> {
                    Log.d(TAG, "Adzan playback completed.");
                    stopAdzanAudio();
                });
                activeMediaPlayer.start();
                Log.d(TAG, "Adzan audio playback started on ALARM stream.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing adzan audio: " + e.getMessage(), e);
        }
    }

    public static synchronized void stopAdzanAudio() {
        try {
            if (activeMediaPlayer != null) {
                if (activeMediaPlayer.isPlaying()) {
                    activeMediaPlayer.stop();
                }
                activeMediaPlayer.release();
                activeMediaPlayer = null;
                Log.d(TAG, "Adzan audio stopped and released.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping adzan audio: " + e.getMessage(), e);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            Log.d(TAG, "Prayer alarm broadcast received!");

            // 1. Wake screen up immediately (turn on screen even if device is asleep/locked)
            try {
                PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    PowerManager.WakeLock wakeLock = pm.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                        PowerManager.ACQUIRE_CAUSES_WAKEUP |
                        PowerManager.ON_AFTER_RELEASE,
                        "expedient:prayer_alarm_wake"
                    );
                    wakeLock.acquire(90000); // 1.5 minutes wake lock
                }
            } catch (Exception wakeEx) {
                Log.w(TAG, "WakeLock notice: " + wakeEx.getMessage());
            }

            // 2. Play Adzan audio directly using MediaPlayer on ALARM stream
            playAdzanAudio(context);

            // 3. Prepare notification details and intents
            String title = intent.getStringExtra("title");
            String message = intent.getStringExtra("message");
            String targetUrl = intent.getStringExtra("targetUrl");
            if (targetUrl == null || targetUrl.trim().isEmpty()) {
                targetUrl = "/kiblat";
            }

            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            launchIntent.putExtra("navigate_to", targetUrl);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent contentPendingIntent = PendingIntent.getActivity(
                context,
                7771,
                launchIntent,
                flags
            );

            // Action: Hentikan Adzan button
            Intent stopIntent = new Intent(context, AdzanActionReceiver.class);
            stopIntent.setAction("ACTION_STOP_ADZAN");
            PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
                context,
                7772,
                stopIntent,
                flags
            );

            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.adzan);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel channel = new NotificationChannel(
                        MainActivity.ADZAN_CHANNEL_ID,
                        MainActivity.ADZAN_CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.setDescription("Kumandang suara adzan merdu dan pengingat waktu shalat 5 waktu.");
                    channel.enableLights(true);
                    channel.setLightColor(0xFF00FF7F);
                    channel.enableVibration(true);
                    channel.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 500});

                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build();
                    channel.setSound(soundUri, audioAttributes);
                    channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                    channel.setBypassDnd(true);
                    channel.setShowBadge(true);
                    manager.createNotificationChannel(channel);
                }

                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, MainActivity.ADZAN_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title != null ? title : "🕌 Waktu Shalat Telah Masuk")
                    .setContentText(message != null ? message : "Allahu Akbar, Allahu Akbar... Mari tunaikan shalat tepat waktu.")
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message != null ? message : ""))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setOngoing(false)
                    .setAutoCancel(true)
                    .setContentIntent(contentPendingIntent)
                    .setFullScreenIntent(contentPendingIntent, true)
                    .addAction(R.mipmap.ic_launcher, "⏹ Hentikan Adzan", stopPendingIntent)
                    .addAction(R.mipmap.ic_launcher, "🕌 Buka Kiblat", contentPendingIntent);

                manager.notify(777, builder.build());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in PrayerAlarmReceiver: " + e.getMessage(), e);
        }
    }
}

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
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;

/**
 * Native Android BroadcastReceiver to wake up device and fire prayer alerts
 * with authentic Adzan audio even when the screen is locked and app is closed (Doze Mode).
 */
public class PrayerAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String title = intent.getStringExtra("title");
            String message = intent.getStringExtra("message");
            String targetUrl = intent.getStringExtra("targetUrl");

            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            if (targetUrl != null && !targetUrl.trim().isEmpty()) {
                launchIntent.putExtra("navigate_to", targetUrl);
            }

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                (int) (System.currentTimeMillis() % 100000),
                launchIntent,
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
                    .setSound(soundUri, AudioManager.STREAM_ALARM)
                    .setVibrate(new long[]{0, 500, 250, 500, 250, 500})
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

                manager.notify(777, builder.build());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

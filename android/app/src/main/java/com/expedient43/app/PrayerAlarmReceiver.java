package com.expedient43.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.Calendar;

/**
 * Native Android BroadcastReceiver to wake up device and fire prayer alerts.
 * Strictly respects device Silent / Vibrate / Do Not Disturb (DND) modes so loud audio
 * is NEVER blasted during meetings, classes, or when the user has muted their device.
 * Audio is exclusively handled via MediaPlayer to prevent dual audio / echo playback.
 */
public class PrayerAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "ExpedientAdzan";
    private static MediaPlayer activeMediaPlayer = null;

    /**
     * Comprehensive check if device is in Silent mode, Vibrate mode, or Do Not Disturb (DND).
     */
    public static boolean isDeviceSilent(Context context) {
        if (context == null) return false;
        try {
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int ringerMode = audioManager.getRingerMode();
                // 1. Check Standard Ringer Mode (Silent or Vibrate)
                if (ringerMode == AudioManager.RINGER_MODE_SILENT || ringerMode == AudioManager.RINGER_MODE_VIBRATE) {
                    Log.d(TAG, "Device is in Silent or Vibrate ringer mode (" + ringerMode + ")");
                    return true;
                }

                // 2. Check if Notification or Ring stream is explicitly muted (API 23+)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (audioManager.isStreamMute(AudioManager.STREAM_NOTIFICATION) ||
                        audioManager.isStreamMute(AudioManager.STREAM_RING)) {
                        Log.d(TAG, "Notification or Ring stream is muted via isStreamMute()");
                        return true;
                    }
                }

                // 3. Check if notification volume or ring volume is 0
                int notifVol = audioManager.getStreamVolume(AudioManager.STREAM_NOTIFICATION);
                int ringVol = audioManager.getStreamVolume(AudioManager.STREAM_RING);
                if (notifVol == 0 || ringVol == 0) {
                    Log.d(TAG, "Notification volume (" + notifVol + ") or Ring volume (" + ringVol + ") is 0");
                    return true;
                }

                // 4. In-call check: never blast adzan if user is actively on a phone call or meeting
                int mode = audioManager.getMode();
                if (mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION) {
                    Log.d(TAG, "Device is actively in a phone or communication call (" + mode + ")");
                    return true;
                }
            }

            // 5. Check Do Not Disturb (DND) Interruption Filter on Android 6.0+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    int filter = nm.getCurrentInterruptionFilter();
                    // Any filter other than INTERRUPTION_FILTER_ALL means DND is active (Priority, None, Alarms)
                    if (filter != NotificationManager.INTERRUPTION_FILTER_ALL && filter != 0) {
                        Log.d(TAG, "Device Do Not Disturb (DND) filter active: " + filter);
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "isDeviceSilent check notice: " + e.getMessage());
        }
        return false;
    }

    /**
     * Checks if device is specifically in Vibrate mode.
     */
    public static boolean isDeviceVibrate(Context context) {
        if (context == null) return false;
        try {
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                if (audioManager.getRingerMode() == AudioManager.RINGER_MODE_VIBRATE) {
                    return true;
                }
                // Also check if ring/notif volume is 0 and not silent
                int notifVol = audioManager.getStreamVolume(AudioManager.STREAM_NOTIFICATION);
                if (notifVol == 0 && audioManager.getRingerMode() != AudioManager.RINGER_MODE_SILENT) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    /**
     * Plays the adzan audio exactly once.
     * Guaranteed to NEVER play if device is in Silent, Vibrate, or DND mode.
     * MediaPlayer is configured with AudioAttributes BEFORE prepare() to ensure
     * Android hardware-level audio routing to Notification stream.
     */
    public static synchronized void playAdzanAudio(Context context) {
        try {
            stopAdzanAudio();

            // Strict silence check: Never blast sound if device is silent, vibrate, or DND
            if (isDeviceSilent(context)) {
                Log.d(TAG, "Device is in Silent/Vibrate/DND mode. Suppressing adzan audio playback.");
                return;
            }

            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager == null) return;

            int currentVol = audioManager.getStreamVolume(AudioManager.STREAM_NOTIFICATION);
            int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_NOTIFICATION);
            if (currentVol <= 0) {
                Log.d(TAG, "Notification volume is 0. Aborting adzan audio playback.");
                return;
            }

            MediaPlayer mp = new MediaPlayer();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                mp.setAudioAttributes(audioAttributes);
            } else {
                mp.setAudioStreamType(AudioManager.STREAM_NOTIFICATION);
            }

            AssetFileDescriptor afd = context.getResources().openRawResourceFd(R.raw.adzan);
            if (afd == null) {
                Log.e(TAG, "Raw resource adzan not found in APK.");
                return;
            }

            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();

            float volumeFactor = maxVol > 0 ? ((float) currentVol / (float) maxVol) : 0.8f;
            mp.setVolume(volumeFactor, volumeFactor);

            mp.setOnCompletionListener(mediaPlayer -> {
                Log.d(TAG, "Adzan playback completed.");
                stopAdzanAudio();
            });

            mp.prepare();
            mp.start();
            activeMediaPlayer = mp;
            Log.d(TAG, "Single adzan audio playback started successfully (proportional volumeFactor: " + volumeFactor + ").");
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

    public static void rescheduleForNextDay(Context context, String prayerName, int hour, int minute, String title, String message) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, hour);
            calendar.set(Calendar.MINUTE, minute);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            // Tambahkan 1 hari (24 jam ke depan)
            calendar.add(Calendar.DAY_OF_YEAR, 1);

            Intent intent = new Intent(context, PrayerAlarmReceiver.class);
            intent.putExtra("title", title);
            intent.putExtra("message", message);
            intent.putExtra("prayerName", prayerName);
            intent.putExtra("hour", hour);
            intent.putExtra("minute", minute);
            intent.putExtra("targetUrl", "/kiblat");

            int requestCode = Math.abs(prayerName.hashCode());
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                alarmManager.setAlarmClock(
                    new AlarmManager.AlarmClockInfo(calendar.getTimeInMillis(), pendingIntent),
                    pendingIntent
                );
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
            }
            Log.d(TAG, "Auto-rescheduled " + prayerName + " for tomorrow at " + hour + ":" + minute);
        } catch (Exception e) {
            Log.e(TAG, "Error auto-rescheduling prayer for next day: " + e.getMessage(), e);
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

            // 2. Strict Silent & Vibrate mode detection
            boolean isSilent = isDeviceSilent(context);
            boolean isVibrate = isDeviceVibrate(context);

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
                // Channel must be SILENT (sound = null) to prevent dual audio playback
                // and to guarantee silent mode is never overridden by Android's notification sound engine.
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel channel = new NotificationChannel(
                        MainActivity.ADZAN_CHANNEL_ID,
                        MainActivity.ADZAN_CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.setDescription("Pemberitahuan waktu shalat resmi dan kumandang adzan.");
                    channel.enableLights(true);
                    channel.setLightColor(0xFF00FF7F);
                    channel.enableVibration(!isSilent);
                    channel.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 500});
                    channel.setSound(null, null); // Strictly SILENT channel
                    channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                    channel.setBypassDnd(false);
                    channel.setShowBadge(true);
                    manager.createNotificationChannel(channel);
                }

                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, MainActivity.ADZAN_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title != null ? title : "🕌 Waktu Shalat Telah Masuk")
                    .setContentText(message != null ? message : "Allahu Akbar, Allahu Akbar... Mari tunaikan shalat tepat waktu.")
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message != null ? message : ""))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_EVENT)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setOngoing(false)
                    .setAutoCancel(true)
                    .setSound(null) // STRICTLY NO notification channel sound!
                    .setContentIntent(contentPendingIntent)
                    .setFullScreenIntent(contentPendingIntent, true);

                if (isSilent && !isVibrate) {
                    // Total silence: No sound, no vibration
                    Log.d(TAG, "Device is in Silent/DND mode. Suppressing audio and vibration.");
                    builder.setVibrate(new long[]{0});
                } else if (isVibrate) {
                    // Vibrate mode: No sound, gentle vibration
                    Log.d(TAG, "Device is in Vibrate mode. Suppressing audio, keeping vibration.");
                    builder.setVibrate(new long[]{0, 500, 250, 500, 250, 500});
                } else {
                    // Normal mode: Play adzan audio exactly ONCE via MediaPlayer
                    Log.d(TAG, "Device is in Normal mode. Playing single adzan audio.");
                    playAdzanAudio(context);
                    builder.setVibrate(new long[]{0, 500, 250, 500, 250, 500})
                           .addAction(R.mipmap.ic_launcher, "⏹ Hentikan Adzan", stopPendingIntent);
                }

                builder.addAction(R.mipmap.ic_launcher, "🕌 Buka Kiblat", contentPendingIntent);

                manager.notify(777, builder.build());
            }

            // 4. Auto-Reschedule this prayer for tomorrow (+24 hours)
            int hour = intent.getIntExtra("hour", -1);
            int minute = intent.getIntExtra("minute", -1);
            String prayerName = intent.getStringExtra("prayerName");
            if (hour >= 0 && minute >= 0 && prayerName != null && !prayerName.isEmpty()) {
                rescheduleForNextDay(context, prayerName, hour, minute, title, message);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in PrayerAlarmReceiver: " + e.getMessage(), e);
        }
    }
}

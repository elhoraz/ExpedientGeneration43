package com.expedient43.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;

/**
 * Native Android BootReceiver to automatically restore all 5 prayer alarms
 * when the phone finishes booting or restarts.
 * Ensures the user NEVER has to manually open the app after restarting their device.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "ExpedientBoot";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            Log.d(TAG, "Device rebooted or package replaced (" + action + "). Restoring all prayer alarms...");
            restoreSavedPrayerAlarms(context);
        }
    }

    public static void restoreSavedPrayerAlarms(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("expedient_prayer_prefs", Context.MODE_PRIVATE);
            String savedJson = prefs.getString("saved_prayer_schedule", null);

            if (savedJson == null || savedJson.trim().isEmpty()) {
                Log.d(TAG, "No saved prayer schedule found in SharedPreferences.");
                return;
            }

            JSONArray prayers = new JSONArray(savedJson);
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            long now = System.currentTimeMillis();

            for (int i = 0; i < prayers.length(); i++) {
                JSONObject prayer = prayers.getJSONObject(i);
                String name = prayer.optString("name");
                String timeStr = prayer.optString("time");

                if (name == null || timeStr == null || !timeStr.contains(":")) continue;

                String[] parts = timeStr.split(":");
                int hour = Integer.parseInt(parts[0].trim());
                int minute = Integer.parseInt(parts[1].trim());

                Calendar calendar = Calendar.getInstance();
                calendar.set(Calendar.HOUR_OF_DAY, hour);
                calendar.set(Calendar.MINUTE, minute);
                calendar.set(Calendar.SECOND, 0);
                calendar.set(Calendar.MILLISECOND, 0);

                if (calendar.getTimeInMillis() <= now) {
                    calendar.add(Calendar.DAY_OF_YEAR, 1);
                }

                String title = "🕌 Waktu Shalat " + name + " (" + timeStr + " WIB)";
                String message = "Allahu Akbar, Allahu Akbar... Telah masuk waktu shalat " + name + " resmi Kemenag RI. Mari tunaikan shalat tepat waktu.";

                Intent alarmIntent = new Intent(context, PrayerAlarmReceiver.class);
                alarmIntent.putExtra("title", title);
                alarmIntent.putExtra("message", message);
                alarmIntent.putExtra("prayerName", name);
                alarmIntent.putExtra("hour", hour);
                alarmIntent.putExtra("minute", minute);
                alarmIntent.putExtra("targetUrl", "/kiblat");

                int requestCode = Math.abs(name.hashCode());
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }

                PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, alarmIntent, flags);

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

                Log.d(TAG, "Restored alarm for " + name + " at " + hour + ":" + minute + " (timestamp=" + calendar.getTimeInMillis() + ")");
            }
            Log.d(TAG, "Successfully restored all saved prayer alarms after boot.");
        } catch (Exception e) {
            Log.e(TAG, "Error restoring prayer alarms after boot: " + e.getMessage(), e);
        }
    }
}

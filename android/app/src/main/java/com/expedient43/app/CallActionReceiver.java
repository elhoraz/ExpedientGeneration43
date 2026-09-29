package com.expedient43.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

/**
 * Handles incoming call actions directly from notification buttons (e.g. Tolak / Decline).
 */
public class CallActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            // 1. Stop continuous call ringtone
            ExpedientFirebaseService.stopCallRingtone();

            // 2. Dismiss incoming call notification
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.cancel(888);
            }

            // 3. Stop any active adzan audio if playing
            PrayerAlarmReceiver.stopAdzanAudio();

            Toast.makeText(context, "Panggilan ditolak", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

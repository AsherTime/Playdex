package com.gamedex.app.plugins;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@CapacitorPlugin(name = "GameUsage")
public class GameUsagePlugin extends Plugin {

    private boolean hasUsageAccessInternal() {
        Context context = getContext();
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        if (appOps == null) {
            return false;
        }
        int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.getPackageName());
        if (mode == AppOpsManager.MODE_DEFAULT) {
            return context.checkCallingOrSelfPermission("android.permission.PACKAGE_USAGE_STATS")
                    == android.content.pm.PackageManager.PERMISSION_GRANTED;
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private Set<String> packageSetFromCall(PluginCall call) throws JSONException {
        Set<String> packages = new HashSet<>();
        JSArray jsArray = call.getArray("packageNames");
        if (jsArray == null) {
            return packages;
        }
        JSONArray jsonArray = jsArray.toJSONArray();
        for (int i = 0; i < jsonArray.length(); i++) {
            String value = jsonArray.optString(i, "").trim();
            if (!value.isEmpty()) {
                packages.add(value);
            }
        }
        return packages;
    }

    private Map<String, Long> countForegroundSessions(
            UsageStatsManager manager,
            long startTime,
            long endTime,
            Set<String> packageFilter) {
        Map<String, Long> counts = new HashMap<>();
        UsageEvents events = manager.queryEvents(startTime, endTime);
        UsageEvents.Event event = new UsageEvents.Event();
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            if (event.getEventType() != UsageEvents.Event.MOVE_TO_FOREGROUND) {
                continue;
            }
            String pkg = event.getPackageName();
            if (pkg == null || !packageFilter.contains(pkg)) {
                continue;
            }
            counts.put(pkg, counts.getOrDefault(pkg, 0L) + 1L);
        }
        return counts;
    }

    @PluginMethod
    public void hasUsageAccess(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasUsageAccessInternal());
        call.resolve(result);
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void getGameUsage(PluginCall call) {
        if (!hasUsageAccessInternal()) {
            call.reject("Usage access has not been granted.");
            return;
        }

        Long startTime = call.getLong("startTime");
        Long endTime = call.getLong("endTime");
        if (startTime == null || endTime == null || endTime <= startTime) {
            call.reject("Invalid startTime/endTime range.");
            return;
        }

        try {
            Set<String> packageFilter = packageSetFromCall(call);
            if (packageFilter.isEmpty()) {
                call.reject("packageNames must include at least one package ID.");
                return;
            }

            UsageStatsManager manager =
                    (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
            if (manager == null) {
                call.reject("UsageStatsManager is unavailable on this device.");
                return;
            }

            List<UsageStats> statsList =
                    manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime);
            Map<String, Long> foregroundByPackage = new HashMap<>();
            Map<String, Long> lastUsedByPackage = new HashMap<>();
            if (statsList != null) {
                for (UsageStats stats : statsList) {
                    if (stats == null) {
                        continue;
                    }
                    String pkg = stats.getPackageName();
                    if (!packageFilter.contains(pkg)) {
                        continue;
                    }
                    foregroundByPackage.put(
                            pkg,
                            foregroundByPackage.getOrDefault(pkg, 0L)
                                    + stats.getTotalTimeInForeground());
                    long lastUsed = stats.getLastTimeUsed();
                    if (lastUsed > lastUsedByPackage.getOrDefault(pkg, 0L)) {
                        lastUsedByPackage.put(pkg, lastUsed);
                    }
                }
            }

            Map<String, Long> sessionCounts =
                    countForegroundSessions(manager, startTime, endTime, packageFilter);

            JSArray records = new JSArray();
            for (String pkg : packageFilter) {
                long foregroundMs = foregroundByPackage.getOrDefault(pkg, 0L);
                long lastUsed = lastUsedByPackage.getOrDefault(pkg, 0L);
                long sessions = sessionCounts.getOrDefault(pkg, 0L);

                if (foregroundMs <= 0L && lastUsed <= 0L && sessions <= 0L) {
                    continue;
                }

                JSObject row = new JSObject();
                row.put("packageName", pkg);
                row.put("foregroundMs", foregroundMs);
                row.put("lastUsed", lastUsed);
                row.put("sessionCount", sessions);
                records.put(row);
            }

            JSObject result = new JSObject();
            result.put("records", records);
            result.put("periodStart", startTime);
            result.put("periodEnd", endTime);
            call.resolve(result);
        } catch (JSONException error) {
            call.reject("Failed to parse packageNames.", error);
        } catch (Exception error) {
            call.reject("Failed to query game usage.", error);
        }
    }
}

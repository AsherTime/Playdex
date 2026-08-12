package com.gamedex.app;

import android.os.Bundle;

import com.gamedex.app.plugins.GameUsagePlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GameUsagePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

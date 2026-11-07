package com.shanks.vpn;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.shanks.vpn.core.ShanksVpnPlugin;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShanksVpnPlugin.class);
        super.onCreate(savedInstanceState);
        activateImmersiveMode();
    }

    private void activateImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(
                getWindow(),
                getWindow().getDecorView()
            );

        controller.hide(WindowInsetsCompat.Type.systemBars());

        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);

        if (hasFocus) {
            activateImmersiveMode();
        }
    }
}

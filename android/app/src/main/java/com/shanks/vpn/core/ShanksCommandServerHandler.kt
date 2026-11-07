package com.shanks.vpn.core

import android.util.Log
import io.nekohasekai.libbox.CommandServerHandler
import io.nekohasekai.libbox.SystemProxyStatus

class ShanksCommandServerHandler(
    private val onReload: () -> Unit,
    private val onStop: () -> Unit
) : CommandServerHandler {

    override fun connectSSHAgent(): Int = -1

    override fun getSystemProxyStatus(): SystemProxyStatus {
        return SystemProxyStatus().apply {
            available = false
            enabled = false
        }
    }

    override fun serviceReload() {
        onReload()
    }

    override fun serviceStop() {
        onStop()
    }

    override fun setSystemProxyEnabled(isEnabled: Boolean) {
        onReload()
    }

    override fun triggerNativeCrash() {
        Log.w("SHANKS VPN", "Demande de crash natif ignorée")
    }

    override fun writeDebugMessage(message: String?) {
        Log.d("SHANKS VPN", message ?: "")
    }
}

package com.shanks.vpn.core

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Build
import androidx.activity.result.ActivityResult
import com.getcapacitor.*
import com.getcapacitor.annotation.*

@CapacitorPlugin(name = "ShanksVpn")
class ShanksVpnPlugin : Plugin() {

    private var stateReceiverRegistered = false

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != ShanksVpnService.ACTION_STATE) return

            val data = JSObject()
            data.put("state", intent.getStringExtra(ShanksVpnService.EXTRA_STATE) ?: "ERROR")
            data.put("message", intent.getStringExtra(ShanksVpnService.EXTRA_MESSAGE) ?: "")
            notifyListeners("vpnState", data)
        }
    }

    override fun load() {
        super.load()
        val filter = IntentFilter(ShanksVpnService.ACTION_STATE)
        if (Build.VERSION.SDK_INT >= 33) {
            context.registerReceiver(stateReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(stateReceiver, filter)
        }
        stateReceiverRegistered = true
    }

    override fun handleOnDestroy() {
        if (stateReceiverRegistered) {
            try {
                context.unregisterReceiver(stateReceiver)
            } catch (_: Exception) {
            }
            stateReceiverRegistered = false
        }
        super.handleOnDestroy()
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        val intent = VpnService.prepare(context)

        if (intent == null) {
            call.resolve(JSObject().put("granted", true))
            return
        }

        startActivityForResult(call, intent, "vpnPermissionResult")
    }

    @ActivityCallback
    private fun vpnPermissionResult(
        call: PluginCall,
        result: ActivityResult
    ) {
        val granted = result.resultCode == Activity.RESULT_OK
        call.resolve(JSObject().put("granted", granted))
    }

    @PluginMethod
    fun startTunnel(call: PluginCall) {
        val config = call.getString("config")

        if (config.isNullOrBlank()) {
            call.reject("Configuration VPN absente")
            return
        }

        if (VpnService.prepare(context) != null) {
            call.reject("Autorisation VPN Android non accordée")
            return
        }

        try {
            val intent = Intent(context, ShanksVpnService::class.java).apply {
                action = ShanksVpnService.ACTION_START
                putExtra(ShanksVpnService.EXTRA_CONFIG, config)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }

            call.resolve(JSObject().put("started", true))
        } catch (e: Exception) {
            call.reject(
                "Impossible de démarrer le service VPN : ${e.message}"
            )
        }
    }

    @PluginMethod
    fun stopTunnel(call: PluginCall) {
        try {
            val intent = Intent(context, ShanksVpnService::class.java).apply {
                action = ShanksVpnService.ACTION_STOP
            }

            context.startService(intent)

            call.resolve(JSObject().put("stopRequested", true))
        } catch (e: Exception) {
            call.reject(
                "Impossible de demander l'arrêt du VPN : ${e.message}"
            )
        }
    }
}

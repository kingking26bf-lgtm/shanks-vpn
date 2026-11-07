package com.shanks.vpn.core

import android.net.ConnectivityManager
import android.net.LinkProperties
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.system.OsConstants
import android.util.Log
import io.nekohasekai.libbox.*
import java.net.NetworkInterface as JavaNetworkInterface
import java.util.Collections

class ShanksPlatformInterface(
    private val service: ShanksVpnService
) : PlatformInterface {

    private val connectivity =
        service.getSystemService(ConnectivityManager::class.java)

    private val callbackHandler = Handler(Looper.getMainLooper())
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var monitoredListener: InterfaceUpdateListener? = null

    override fun usePlatformAutoDetectInterfaceControl(): Boolean = true

    override fun autoDetectInterfaceControl(fd: Int) {
        if (!service.protect(fd)) {
            throw IllegalStateException("Impossible de protéger le socket VPN")
        }
    }

    override fun openTun(options: TunOptions): Int =
        service.establishTun(options)

    override fun findConnectionOwner(
        ipProtocol: Int,
        sourceAddress: String,
        sourcePort: Int,
        destinationAddress: String,
        destinationPort: Int
    ): ConnectionOwner {
        throw UnsupportedOperationException("Identification du propriétaire non disponible")
    }

    override fun startDefaultInterfaceMonitor(listener: InterfaceUpdateListener) {
        networkCallback?.let {
            runCatching { connectivity.unregisterNetworkCallback(it) }
        }
        networkCallback = null
        monitoredListener = listener

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_RESTRICTED)
            .build()

        var activeNetwork: Network? = null

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                activeNetwork = network
                updateInterface(network, connectivity.getLinkProperties(network))
            }

            override fun onLinkPropertiesChanged(
                network: Network,
                linkProperties: LinkProperties
            ) {
                if (activeNetwork == network) {
                    updateInterface(network, linkProperties)
                }
            }

            override fun onLost(network: Network) {
                if (activeNetwork == network) {
                    activeNetwork = null
                    monitoredListener?.updateDefaultInterface("", -1, false, false)
                }
            }
        }

        try {
            when {
                Build.VERSION.SDK_INT >= 31 ->
                    connectivity.registerBestMatchingNetworkCallback(
                        request, callback, callbackHandler
                    )
                Build.VERSION.SDK_INT >= 28 ->
                    connectivity.requestNetwork(request, callback, callbackHandler)
                Build.VERSION.SDK_INT >= 26 ->
                    connectivity.registerDefaultNetworkCallback(callback, callbackHandler)
                else ->
                    connectivity.registerDefaultNetworkCallback(callback)
            }
            networkCallback = callback
        } catch (e: Exception) {
            Log.e("SHANKS VPN", "Erreur du suivi réseau", e)
            monitoredListener?.updateDefaultInterface("", -1, false, false)
        }
    }

    private fun updateInterface(network: Network, properties: LinkProperties?) {
        val name = properties?.interfaceName
        if (name.isNullOrBlank()) return

        try {
            val index = JavaNetworkInterface.getByName(name)?.index ?: -1
            if (index >= 0) {
                monitoredListener?.updateDefaultInterface(name, index, false, false)
            }
        } catch (e: Exception) {
            Log.w("SHANKS VPN", "Interface réseau introuvable : $name", e)
        }
    }

    override fun closeDefaultInterfaceMonitor(listener: InterfaceUpdateListener) {
        if (monitoredListener != null && monitoredListener !== listener) return

        networkCallback?.let {
            runCatching { connectivity.unregisterNetworkCallback(it) }
        }
        networkCallback = null
        monitoredListener = null
    }

    override fun getInterfaces(): NetworkInterfaceIterator {
        val result = mutableListOf<io.nekohasekai.libbox.NetworkInterface>()
        val interfaces = Collections.list(JavaNetworkInterface.getNetworkInterfaces())

        for (network in interfaces) {
            val item = io.nekohasekai.libbox.NetworkInterface()
            item.name = network.name
            item.index = network.index
            item.type = Libbox.InterfaceTypeOther
            item.addresses = StringArray(
                network.interfaceAddresses.map {
                    "${it.address.hostAddress}/${it.networkPrefixLength}"
                }.iterator()
            )
            item.dnsServer = StringArray(emptyList<String>().iterator())
            item.flags = try {
                var flags = 0
                if (network.isUp) flags = flags or OsConstants.IFF_UP or OsConstants.IFF_RUNNING
                if (network.isLoopback) flags = flags or OsConstants.IFF_LOOPBACK
                if (network.isPointToPoint) flags = flags or OsConstants.IFF_POINTOPOINT
                if (network.supportsMulticast()) flags = flags or OsConstants.IFF_MULTICAST
                flags
            } catch (_: Exception) {
                0
            }
            item.mtu = try { network.mtu } catch (_: Exception) { 1500 }
            item.metered = false
            result.add(item)
        }

        return InterfaceArray(result.iterator())
    }

    override fun underNetworkExtension(): Boolean = false
    override fun includeAllNetworks(): Boolean = false
    override fun clearDNSCache() {}
    override fun readWIFIState(): WIFIState? = null
    override fun localDNSTransport(): LocalDNSTransport? = null
    override fun startNeighborMonitor(listener: NeighborUpdateListener?) {}
    override fun closeNeighborMonitor(listener: NeighborUpdateListener?) {}
    override fun usePlatformShell(): Boolean = false

    override fun checkPlatformShell() {
        throw UnsupportedOperationException("Shell système non utilisé")
    }

    override fun openShellSession(
        user: PlatformUser?,
        command: String?,
        environ: StringIterator?,
        term: String?,
        rows: Int,
        cols: Int
    ): ShellSession {
        throw UnsupportedOperationException("Shell système non disponible")
    }

    override fun readSystemSSHHostKey(): String = ""
    override fun lookupSFTPServer(): String = ""
    override fun tailscaleHostname(): String = ""
    override fun usePlatformBridge(): Boolean = false

    override fun createBridge(options: BridgeOptions?): BridgeSession {
        throw UnsupportedOperationException("Bridge non disponible")
    }

    override fun lookupUser(username: String?): PlatformUser {
        throw UnsupportedOperationException("Utilisateurs système non disponibles")
    }

    override fun cancelNotification(id: String?, type: Int) {}
    override fun sendNotification(notification: Notification?) {}
    override fun useProcFS(): Boolean = false
    override fun registerMyInterface(name: String?) {}
}

private class StringArray(iterator: Iterator<String>) : StringIterator {
    private val values = iterator.asSequence().toList()
    private var index = 0

    override fun len(): Int = values.size
    override fun hasNext(): Boolean = index < values.size
    override fun next(): String = values[index++]
}

private class InterfaceArray(
    private val iterator: Iterator<io.nekohasekai.libbox.NetworkInterface>
) : NetworkInterfaceIterator {
    override fun hasNext(): Boolean = iterator.hasNext()
    override fun next(): io.nekohasekai.libbox.NetworkInterface = iterator.next()
}

package com.shanks.vpn

import android.content.Context
import io.nekohasekai.libbox.Libbox
import io.nekohasekai.libbox.SetupOptions

object LibboxInitializer {

    @Volatile
    private var initialized = false

    @Synchronized
    fun initialize(context: Context): String {
        if (initialized) {
            return Libbox.version()
        }

        val appContext = context.applicationContext

        val options = SetupOptions().apply {
            setBasePath(appContext.filesDir.absolutePath)
            setWorkingPath(appContext.filesDir.absolutePath)
            setTempPath(appContext.cacheDir.absolutePath)
            setFixAndroidStack(true)
            setLogMaxLines(3000)
            setDebug(false)
            setAppVersion("1.0")
            setAppMarketingVersion("1.0")
        }

        Libbox.setup(options)
        initialized = true

        return Libbox.version()
    }
}

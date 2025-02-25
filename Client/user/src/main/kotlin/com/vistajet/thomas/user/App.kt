package com.vistajet.thomas.user

import android.app.Application
import com.google.firebase.Firebase
import com.google.firebase.initialize
import io.github.aakira.napier.DebugAntilog
import io.github.aakira.napier.Napier

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        Napier.base(DebugAntilog())
        Firebase.initialize(this)
    }
}
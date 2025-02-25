package com.vistajet.thomas.state

import com.motorro.commonstatemachine.coroutines.CoroutineState
import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import io.github.aakira.napier.Napier

abstract class MainScreenState(context: MainScreenContext) : CoroutineState<MainScreenGesture, MainScreenUiState>(), MainScreenContext by context {
    /**
     * A part of [process] template to process UI gesture
     */
    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        is MainScreenGesture.Back -> {
            Napier.d { "Back gesture. Terminating..." }
            setMachineState(factory.terminated())
        }
        else -> Napier.w { "Unsupported gesture $gesture" }
    }
}
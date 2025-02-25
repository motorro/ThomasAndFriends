package com.vistajet.thomas

import com.motorro.commonstatemachine.coroutines.FlowStateMachine
import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.state.MainScreenStateFactory
import com.vistajet.thomas.state.MainScreenStateFactoryImpl

class Model {
    private val factory: MainScreenStateFactory = MainScreenStateFactoryImpl()
    private val machine = FlowStateMachine(MainScreenUiState.Loading("Loading")){ factory.preChecking() }

    val uiState get() = machine.uiState
    fun onGesture(gesture: MainScreenGesture) = machine.process(gesture)
}
package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenUiState

class Terminated(context: MainScreenContext) : MainScreenState(context) {
    /**
     * A part of [start] template to initialize state
     */
    override fun doStart() {
        setUiState(MainScreenUiState.Terminated)
    }
}
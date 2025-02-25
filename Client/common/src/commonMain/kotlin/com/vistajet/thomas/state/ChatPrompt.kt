package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import io.github.aakira.napier.Napier

class ChatPrompt(context: MainScreenContext, message: String?) : MainScreenState(context) {
    private var message: String = message ?: "Hello! I want to book a trip to London."

    override fun doStart() {
        render()
    }

    override fun doProcess(gesture: MainScreenGesture) {
        when (gesture) {
            is MainScreenGesture.Text -> {
                message = gesture.text
                render()
            }
            is MainScreenGesture.Action -> onAction()
            is MainScreenGesture.Back -> {
                Napier.d { "Back button pressed. Back to chat list..." }
                setMachineState(factory.chatList())
            }
            else -> super.doProcess(gesture)
        }
    }

    private fun onAction() {
        if (message.isNotBlank()) {
            Napier.d { "Moving to chat creation..." }
            setMachineState(factory.creatingChat(message))
        }
    }

    private fun render() {
        setUiState(MainScreenUiState.Prompt(message, message.isNotBlank()))
    }
}
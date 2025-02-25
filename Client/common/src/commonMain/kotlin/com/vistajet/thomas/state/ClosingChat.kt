package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.data.domain.CloseOrderRequest
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class ClosingChat(context: MainScreenContext, private val document: String, functions: FirebaseFunctions) : MainScreenState(context) {
    private val closeCommand = functions.httpsCallable("closeChat")

    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Closing chat..."))
        closeChat()
    }

    private fun closeChat() {
        Napier.d { "Closing chat..." }
        stateScope.launch {
            try {
                closeCommand(CloseOrderRequest(document))
                setMachineState(factory.chatList())
            } catch (e: Throwable) {
                Napier.e(e) { "Error closing chat" }
                setMachineState(factory.chatList())
            }
        }
    }
}
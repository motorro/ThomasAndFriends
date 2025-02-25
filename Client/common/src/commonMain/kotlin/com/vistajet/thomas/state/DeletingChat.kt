package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.data.domain.CloseOrderRequest
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class DeletingChat(context: MainScreenContext, private val document: String, functions: FirebaseFunctions) : MainScreenState(context) {
    private val deleteCommand = functions.httpsCallable("deleteChat")

    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Deleting chat..."))
        closeChat()
    }

    private fun closeChat() {
        Napier.d { "Deleting chat..." }
        stateScope.launch {
            try {
                deleteCommand(CloseOrderRequest(document))
                setMachineState(factory.chatList())
            } catch (e: Throwable) {
                Napier.e(e) { "Error deleting chat" }
                setMachineState(factory.chatList())
            }
        }
    }
}
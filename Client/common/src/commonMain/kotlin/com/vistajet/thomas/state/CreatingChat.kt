package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.data.domain.OrderChatResponse
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class CreatingChat(
    context: MainScreenContext,
    private val message: String,
    private val create: CreateChat
) : MainScreenState(context) {
    /**
     * A part of [start] template to initialize state
     */
    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Creating chat..."))
        createChat()
    }

    private fun createChat() {
        Napier.d { "Creating chat..." }
        stateScope.launch {
            try {
                val path = create(message)
                Napier.d { "Chat created: $path" }
                setMachineState(factory.chat(path))
            } catch (e: Throwable) {
                Napier.e(e) { "Error creating chat" }
                setMachineState(factory.chatCreationError(e, message))
            }
        }
    }

    /**
     * A part of [process] template to process UI gesture
     */
    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        MainScreenGesture.Back -> {
            Napier.d { "Back pressed. Returning to prompt..."}
            setMachineState(factory.chatPrompt(message))
        }
        else -> super.doProcess(gesture)
    }
}

interface CreateChat {
    suspend operator fun invoke(message: String): String

    class Impl(functions: FirebaseFunctions) : CreateChat {
        private val createChatCommand = functions.httpsCallable("startChat")

        override suspend operator fun invoke(message: String): String {
            val result: OrderChatResponse = createChatCommand(com.vistajet.thomas.data.domain.OrderChatRequest(message)).data()
            return result.chatDocument
        }
    }
}
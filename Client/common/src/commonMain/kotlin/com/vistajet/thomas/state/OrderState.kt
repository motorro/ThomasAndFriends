package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.data.domain.ChatState
import com.vistajet.thomas.data.domain.ChatStatus
import com.vistajet.thomas.data.domain.OrderChatData
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.firestore.DocumentReference
import dev.gitlive.firebase.firestore.firestore
import io.github.aakira.napier.Napier
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

class OrderState(
    context: MainScreenContext,
    private val chatDocumentPath: String,
    private val chatData: ChatStateData
) : MainScreenState(context) {
    private val chatDocument: DocumentReference = Firebase.firestore.document(chatDocumentPath)
    private var stateData: OrderChatData = chatData.data

    override fun doStart() {
        render()
        subscribeDocument()
    }

    private fun subscribeDocument() {
        chatDocument.snapshots
            .onEach { snapshot ->
                val data: ChatState = snapshot.data()
                if (ChatStatus.failed == data.status) {
                    Napier.e { "Chat failed: ${data.lastError}" }
                    setMachineState(factory.chatError(IllegalStateException("Chat failed: ${data.lastError}"), chatDocument.path))
                    return@onEach
                }
                stateData = data.data
                render()
            }
            .catch {
                Napier.e(it) { "Error subscribing to chat" }
                setMachineState(factory.chatError(it, chatDocument.path))
            }
            .launchIn(stateScope)
    }

    /**
     * A part of [process] template to process UI gesture
     */
    override fun doProcess(gesture: MainScreenGesture) = when(gesture) {
        MainScreenGesture.Back, MainScreenGesture.ToggleOrderView -> setMachineState(factory.chat(chatDocumentPath, chatData))
        else -> super.doProcess(gesture)
    }

    private fun render() {
        setUiState(MainScreenUiState.ChatData(stateData))
    }
}
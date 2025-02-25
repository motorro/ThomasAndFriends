package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState.Chat
import com.vistajet.thomas.data.domain.ChatMessage
import com.vistajet.thomas.data.domain.ChatState
import com.vistajet.thomas.data.domain.ChatStatus
import com.vistajet.thomas.data.domain.EMPTY_ORDER_CHAT_DATA
import com.vistajet.thomas.data.domain.OrderChatData
import com.vistajet.thomas.data.domain.PostOrderRequest
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import dev.gitlive.firebase.firestore.Direction
import dev.gitlive.firebase.firestore.DocumentReference
import dev.gitlive.firebase.firestore.firestore
import dev.gitlive.firebase.firestore.orderBy
import dev.gitlive.firebase.firestore.where
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class Chat(context: MainScreenContext, documentPath: String, functions: FirebaseFunctions, data: ChatStateData? = null) : MainScreenState(context) {
    private val chatDocument: DocumentReference = Firebase.firestore.document(documentPath)
    private val userId = requireNotNull(Firebase.auth.currentUser?.uid) { "User not logged in" }
    private val postMessage = functions.httpsCallable("postToChat")

    private var stateData: ChatStateData = data ?: ChatStateData(
        ChatStatus.processing,
        EMPTY_ORDER_CHAT_DATA,
        emptyList()
    )

    private var message: String = ""
    private var sending: Boolean = false

    override fun doStart() {
        render()
        subscribe()
    }

    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        MainScreenGesture.CloseChat -> {
            Napier.d { "Closing chat..." }
            setMachineState(factory.closingChat(chatDocument.path))
        }
        MainScreenGesture.DeleteChat -> {
            Napier.d { "Deleting chat..." }
            setMachineState(factory.deletingChat(chatDocument.path))
        }
        MainScreenGesture.Back -> {
            Napier.d { "Back pressed. Back to chat list..." }
            setMachineState(factory.chatList())
        }
        is MainScreenGesture.Text -> {
            message = gesture.text
            render()
        }
        MainScreenGesture.Action -> onSend()
        MainScreenGesture.ToggleOrderView -> {
            setMachineState(factory.orderState(chatDocument.path, stateData))
        }
        else -> super.doProcess(gesture)
    }

    private fun subscribe() {
        Napier.d { "Subscribing to chat..." }
        subscribeDocument()
        subscribeMessages()
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
                stateData = stateData.copy(
                    status = data.status,
                    data = data.data
                )
                render()
            }
            .catch {
                Napier.e(it) { "Error subscribing to chat" }
                setMachineState(factory.chatError(it, chatDocument.path))
            }
            .launchIn(stateScope)
    }

    private fun subscribeMessages() {
        chatDocument.collection("messages")
            .where { "userId".equalTo(userId) }
            .orderBy("createdAt", Direction.ASCENDING)
            .orderBy("inBatchSortIndex", Direction.ASCENDING)
            .snapshots
            .onEach { snapshots ->
                stateData = stateData.copy(
                    messages = snapshots.documents.map { document ->
                        val data: ChatMessage = document.data()
                        Pair(document.id, data)
                    }
                )
                render()
            }
            .catch {
                Napier.e(it) { "Error subscribing to chat messages" }
                setMachineState(factory.chatError(it, chatDocument.path))
            }
            .launchIn(stateScope)
    }

    private fun onSend() {
        if (message.isBlank()) return

        stateScope.launch {
            Napier.d { "Sending message: $message" }
            val toSend = message
            message = ""
            sending = true
            render()
            try {
                postMessage(PostOrderRequest(chatDocument.path, toSend))
                sending = false
                render()
            } catch (e: Throwable) {
                Napier.e(e) { "Error sending message" }
                setMachineState(factory.chatError(e, chatDocument.path))
            }
        }
    }

    private fun render() {
        setUiState(
            Chat(
                status = stateData.status,
                currentState = stateData.data,
                messages = stateData.messages,
                message = message,
                sending = sending,
                closeEnabled = sending.not() && ChatStatus.userInput == stateData.status,
                deleteEnabled = sending.not() && ChatStatus.processing != stateData.status
            )
        )
    }
}

data class ChatStateData(
    val status: ChatStatus,
    val data: OrderChatData,
    val messages: List<Pair<String, ChatMessage>>
)
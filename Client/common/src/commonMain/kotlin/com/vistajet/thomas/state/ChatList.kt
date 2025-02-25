package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.data.domain.ChatState
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import dev.gitlive.firebase.firestore.Direction
import dev.gitlive.firebase.firestore.firestore
import dev.gitlive.firebase.firestore.orderBy
import dev.gitlive.firebase.firestore.where
import dev.gitlive.firebase.functions.FirebaseFunctions
import io.github.aakira.napier.Napier
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

class ChatList(context: MainScreenContext, functions: FirebaseFunctions) : MainScreenState(context) {
    /**
     * A part of [start] template to initialize state
     */
    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Loading chats..."))
        subscribeMessages(requireNotNull(Firebase.auth.currentUser?.uid) { "User not logged in" })
    }

    private fun subscribeMessages(userId: String) {
        Firebase.firestore.collection("chats")
            .where { "userId".equalTo(userId) }
            .orderBy("createdAt", Direction.ASCENDING)
            .snapshots
            .onEach { snapshots ->
                render(snapshots.documents.map { document -> document.id to document.data() })
            }
            .catch {
                Napier.e(it) { "Error subscribing to chats" }
                setMachineState(factory.chatListError(it))
            }
            .launchIn(stateScope)
    }

    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        MainScreenGesture.Back -> {
            Napier.d { "Back pressed. Terminating..." }
            setMachineState(factory.terminated())
        }
        is MainScreenGesture.ChatSelected -> {
            Napier.d { "Chat selected: ${gesture.id}" }
            setMachineState(factory.chat("/chats/${gesture.id}"))
        }
        MainScreenGesture.Action -> {
            Napier.d { "Action pressed. Moving to chat prompt..." }
            setMachineState(factory.chatPrompt())
        }
        else -> super.doProcess(gesture)
    }

    private fun render(chats: List<Pair<String, ChatState>>) {
        setUiState(MainScreenUiState.Chats(chats))
    }
}
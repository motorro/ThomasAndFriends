package com.vistajet.thomas.data

import androidx.compose.runtime.Immutable
import com.vistajet.thomas.data.domain.ChatMessage
import com.vistajet.thomas.data.domain.ChatState
import com.vistajet.thomas.data.domain.ChatStatus
import com.vistajet.thomas.data.domain.OrderChatData

sealed class MainScreenUiState {
    data class Loading(val message: String): MainScreenUiState()
    data class LoginPassword(val credentials: Credentials): MainScreenUiState()
    @Immutable
    data class Chats(val chats: List<Pair<String, ChatState>>): MainScreenUiState()
    data class Prompt(val message: String, val actionEnabled: Boolean): MainScreenUiState()
    @Immutable
    data class Chat(
        val status: ChatStatus,
        val currentState: OrderChatData,
        val messages: List<Pair<String, ChatMessage>>,
        val message: String,
        val sending: Boolean,
        val closeEnabled: Boolean,
        val deleteEnabled: Boolean
    ): MainScreenUiState()
    data class ChatData(val data: OrderChatData): MainScreenUiState()
    data class Error(val error: Throwable): MainScreenUiState()
    data object Terminated: MainScreenUiState()
}

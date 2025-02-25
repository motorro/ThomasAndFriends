package com.vistajet.thomas.data.domain

import dev.gitlive.firebase.firestore.Timestamp
import kotlinx.serialization.Serializable

@Serializable
data class ChatState(
    val userId: String,
    val status: ChatStatus,
    val dispatchId: String? = null,
    val data: OrderChatData,
    val lastMessageId: String? = null,
    val createdAt: Timestamp,
    val updatedAt: Timestamp,
    val lastError: String? = null,
    val meta: OrderChatMeta? = null
)

package com.vistajet.thomas.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class OrderChatResponse(
    val chatDocument: String,
    val status: ChatStatus
)
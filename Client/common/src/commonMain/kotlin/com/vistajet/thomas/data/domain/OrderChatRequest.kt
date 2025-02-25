package com.vistajet.thomas.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class OrderChatRequest(
    val message: String
)
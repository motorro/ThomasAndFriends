package com.vistajet.thomas.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class CloseOrderRequest(
    val chatDocument: String
)
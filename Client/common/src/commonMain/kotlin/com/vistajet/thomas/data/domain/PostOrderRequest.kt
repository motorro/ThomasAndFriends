package com.vistajet.thomas.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class PostOrderRequest(
    val chatDocument: String,
    val message: String
)
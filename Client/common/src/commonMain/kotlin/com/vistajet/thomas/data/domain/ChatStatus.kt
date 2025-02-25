package com.vistajet.thomas.data.domain

import kotlinx.serialization.Serializable

@Serializable
enum class ChatStatus {
    userInput,
    processing,
    complete,
    failed
}
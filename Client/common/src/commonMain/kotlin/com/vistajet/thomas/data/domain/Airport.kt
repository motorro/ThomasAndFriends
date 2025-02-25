package com.vistajet.thomas.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class Airport(
    val id: String,
    val value: String,
    val location: Location,
    val types: List<String>? = null
)
package com.vistajet.thomas.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class Plane(
    val id: Int,
    val name: String,
    val default: Boolean = false
)
package com.vistajet.thomas.data.domain

import kotlinx.serialization.Serializable

@Serializable
data class Location(val latitude: Double, val longitude: Double)
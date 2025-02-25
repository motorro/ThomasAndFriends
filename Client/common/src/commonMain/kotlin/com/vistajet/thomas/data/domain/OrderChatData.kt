package com.vistajet.thomas.data.domain

import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.LocalTime
import kotlinx.serialization.Serializable

@Serializable
data class FlightDetails(
    val flightId: Int,
    val fromAirport: Airport,
    val toAirport: Airport,
    @Serializable(with = SafeLocalTimeSerializer::class)
    val departureTime: LocalTime,
    val paxNumber: Int,
    val flightTimeMinutes: Int
)

@Serializable
data class FlightOrder(
    val from: Waypoint,
    val to: Waypoint,
    val departureDate: LocalDate,
    val plane: Plane,
    val details: FlightDetails? = null
)

@Serializable
data class CateringItem(
    val name: String,
    val quantity: Int,
    val comment: String? = null
)

@Serializable
data class CateringDetails(val items: List<CateringItem>)

@Serializable
data class TransferOrder(
    val departureWaypoint: Waypoint,
    val destinationWaypoint: Waypoint,
    val pickupDateTime : LocalDateTime
)

@Serializable
data class TransferDetails(
    val departureTransfer: TransferOrder? = null,
    val arrivalTransfer: TransferOrder? = null
)

@Serializable
data class OrderChatData(
    val flightOrder : FlightOrder? = null,
    val cateringDetails : CateringDetails? = null,
    val transferDetails: TransferDetails? = null
)

val EMPTY_ORDER_CHAT_DATA = OrderChatData()
package com.vistajet.thomas.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.data.domain.CateringDetails
import com.vistajet.thomas.data.domain.FlightOrder
import com.vistajet.thomas.data.domain.OrderChatData
import com.vistajet.thomas.data.domain.TransferDetails
import com.vistajet.thomas.data.domain.TransferOrder

@Composable
fun OrderState(padding: PaddingValues, state: MainScreenUiState.ChatData, onGesture: (gesture: MainScreenGesture) -> Unit) {
    Box(modifier = Modifier.padding(padding)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .imePadding()
                .navigationBarsPadding()
        ) {
            TabRow(1, Modifier.fillMaxWidth()) {
                Tab(text = { Text("Order chat") },
                    selected = false,
                    onClick = { onGesture(MainScreenGesture.ToggleOrderView) }
                )
                Tab(text = { Text("Order state") },
                    selected = true,
                    onClick = {  }
                )
            }
            if (isEmptyOrder(state.data)) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No active order so far")
                }
            } else {
                Column(modifier = Modifier) {
                    if (null != state.data.flightOrder) {
                        FlightDetails(state.data.flightOrder)
                    }
                    if (null != state.data.cateringDetails) {
                        CateringDetails(state.data.cateringDetails)
                    }
                    if (null != state.data.transferDetails) {
                        TransferDetails(state.data.transferDetails)
                    }
                }
            }
        }
    }
}

private fun isEmptyOrder(order: OrderChatData): Boolean {
    return null == order.flightOrder && null == order.cateringDetails && null == order.transferDetails
}

@Composable
private fun OrderSection(text: String, content: @Composable () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(8.dp)) {
        Box(
            modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.primaryContainer).padding(8.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(text, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
        }
        content()
    }
}

@Composable
private fun OderField(name: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
        Text(
            "$name:",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}

@Composable
private fun FlightDetails(order: FlightOrder) {
    OrderSection("Flight") {
        Column(Modifier.fillMaxWidth()) {
            OderField("From", order.from.value)
            OderField("To", order.to.value)
            OderField("Departure date", order.departureDate.toString())
            OderField("Plane", order.plane.name)
        }
    }
    if (null != order.details) {
        OrderSection("Flight details") {
            Column(Modifier.fillMaxWidth()) {
                OderField("Departure from", order.details.fromAirport.value)
                OderField("Arrival to", order.details.toAirport.value)
                OderField("Departure time", order.details.departureTime.toString())
                OderField("Pax", order.details.paxNumber.toString())
            }
        }
    }
}

@Composable
private fun CateringDetails(details: CateringDetails) {
    OrderSection("Catering") {
        LazyColumn(Modifier.fillMaxWidth(), userScrollEnabled = false) {
            items(details.items) {
                OderField(it.name, it.quantity.toString())
            }
        }
    }
}

@Composable
private fun TransferDetails(details: TransferDetails) {
    if (null != details.departureTransfer) {
        TransferOrder("Departure transfer", details.departureTransfer)
    }
    if (null != details.arrivalTransfer) {
        TransferOrder("Arrival transfer", details.arrivalTransfer)
    }
}

@Composable
private fun TransferOrder(name: String, order: TransferOrder) {
    OrderSection(name) {
        Column(Modifier.fillMaxWidth()) {
            OderField("From", order.departureWaypoint.value)
            OderField("To", order.departureWaypoint.value)
            OderField("Pickup", order.pickupDateTime.toString())
        }
    }
}
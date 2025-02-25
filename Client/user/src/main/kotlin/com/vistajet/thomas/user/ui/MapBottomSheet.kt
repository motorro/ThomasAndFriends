package com.vistajet.thomas.user.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Done
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.DefaultMapProperties
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapBottomSheet(onDismiss: () -> Unit, onSavePosition: (LatLng) -> Unit) {
    val modalBottomSheetState = rememberModalBottomSheetState(
        skipPartiallyExpanded = true,
        confirmValueChange = { false }
    )

    var selectedLocation by remember { mutableStateOf<LatLng?>(null) }

    ModalBottomSheet(
        modifier = Modifier,
        onDismissRequest = { onDismiss() },
        sheetState = modalBottomSheetState,
        dragHandle = { MapDragHandler(selectedLocation) { onSavePosition(selectedLocation!!) } },
    ) {
        MapContent(selectedLocation) {
            selectedLocation = it
        }
    }
}

@Composable
private fun MapContent(
    selectedPosition: LatLng?,
    onUpdateLocation: (LatLng?) -> Unit
) {
    val locationServices = LocationServices.getFusedLocationProviderClient(LocalContext.current)

    val cameraPositionState = rememberCameraPositionState {
        // here we can camera to default position or to preselected position on first launch without location permissions
//        position = CameraPosition.fromLatLngZoom(defaultLocation, 15f)
    }

    var locationPermissionIsGranted by remember { mutableStateOf(false) }

    LaunchedEffect(locationPermissionIsGranted) {
        getLastUserLocation(
            locationPermissionGranted = locationPermissionIsGranted,
            fusedLocationProviderClient = locationServices,
            onGetLastLocationSuccess = {
                cameraPositionState.position =
                    CameraPosition.fromLatLngZoom(LatLng(it.latitude, it.longitude), 15f)
            },
            onGetLastLocationFailed = { /*noting to do*/ }
        )
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .fillMaxHeight(0.8f)
    ) {
        GoogleMap(
            cameraPositionState = cameraPositionState,
            properties = DefaultMapProperties.copy(
                isMyLocationEnabled = locationPermissionIsGranted
            ),
            onMapClick = {
                onUpdateLocation(it)
            }
        ) {
            selectedPosition?.let {
                Marker(state = MarkerState(position = it))
            }
        }

        LocationPermission(
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            locationPermissionIsGranted = it
        }
    }
}

@Composable
private fun MapDragHandler(
    selectedPosition: LatLng?,
    onSave: () -> Unit
) {
    Box(
        Modifier
            .fillMaxWidth()
            .wrapContentHeight()
            .background(Color.LightGray)
            .padding(horizontal = 15.dp)
    ) {
        Text(
            modifier = Modifier
                .align(Alignment.Center)
                .padding(vertical = 15.dp),
            text = "Select location",
            style = MaterialTheme.typography.titleSmall.copy(
                color = Color.Black
            )
        )

        if (selectedPosition != null) {
            IconButton(
                modifier = Modifier
                    .align(Alignment.CenterEnd),
                onClick = onSave
            ) {
                Icon(
                    imageVector = Icons.Default.Done,
                    contentDescription = null
                )
            }
        }
    }
}
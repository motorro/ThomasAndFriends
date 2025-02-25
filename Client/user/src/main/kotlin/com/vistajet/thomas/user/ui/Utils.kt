package com.vistajet.thomas.user.ui

import android.annotation.SuppressLint
import android.location.Location
import com.google.android.gms.location.FusedLocationProviderClient

@SuppressLint("MissingPermission")
internal fun getLastUserLocation(
    locationPermissionGranted: Boolean,
    fusedLocationProviderClient: FusedLocationProviderClient,
    onGetLastLocationSuccess: (Location) -> Unit,
    onGetLastLocationFailed: (Exception) -> Unit
) {
    // Check if location permissions are granted
    if (locationPermissionGranted) {
        // Retrieve the last known location
        fusedLocationProviderClient.lastLocation
            .addOnSuccessListener { location ->
                location?.let {
                    onGetLastLocationSuccess(it)
                }
            }
            .addOnFailureListener { exception ->
                onGetLastLocationFailed(exception)
            }
    }
}
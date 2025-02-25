package com.vistajet.thomas.user

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import com.vistajet.thomas.Model
import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.ui.MainScreen
import com.vistajet.thomas.user.ui.MapBottomSheet
import com.vistajet.thomas.user.ui.theme.ThomasTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val viewModel: MainViewModel by viewModels()
        setContent {
            ThomasTheme {
                val state by viewModel.uiState.collectAsState()
                var showMapSheet by remember { mutableStateOf(false) }

                MainScreen(
                    state = state,
                    onComplete = { finish() },
                    showMap = {
                        showMapSheet = true
                    },
                    onGesture = { viewModel.onGesture(it) }
                )

                if (showMapSheet) {
                    MapBottomSheet(
                        onDismiss = { showMapSheet = false }
                    ) {
                        // process new LatLng
                        showMapSheet = false
                        viewModel.onGesture(MainScreenGesture.Text("Latitude: ${it.latitude}, Longitude ${it.longitude}"))
                    }
                }
            }
        }
    }
}

class MainViewModel : ViewModel() {
    private val model = Model()

    val uiState get() = model.uiState
    fun onGesture(gesture: MainScreenGesture) = model.onGesture(gesture)
}
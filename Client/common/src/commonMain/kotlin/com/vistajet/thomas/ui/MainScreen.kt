package com.vistajet.thomas.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.RowScope
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.text.style.TextOverflow
import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState

@Composable
fun MainScreen(
    state: MainScreenUiState,
    onComplete: () -> Unit,
    showMap: () -> Unit,
    onGesture: (MainScreenGesture) -> Unit
) {
    when(state) {
        is MainScreenUiState.Loading -> MainScreenScaffold(
            title = "Loading...",
            withBackButton = false,
            onGesture = onGesture,
            content = { padding, _ -> Loading(padding, state) }
        )
        is MainScreenUiState.LoginPassword -> MainScreenScaffold(
            title = "Login",
            withBackButton = true,
            onGesture = onGesture,
            content = { padding, _ -> Login(padding, state, onGesture) }
        )
        is MainScreenUiState.Chats -> MainScreenScaffold(
            title = "Chats",
            withBackButton = true,
            onGesture = onGesture,
            content = { padding, _ -> ChatList(padding, state, onGesture) }
        )
        is MainScreenUiState.Prompt -> MainScreenScaffold(
            title = "Enter starting message...",
            withBackButton = true,
            onGesture = onGesture,
            content = { padding, g -> Prompt(padding, state, g) }
        )
        is MainScreenUiState.Chat -> MainScreenScaffold(
            title = "Order chat",
            withBackButton = true,
            onGesture = onGesture,
            content = { padding, g -> Chat(padding, state, showMap, g) },
            actions = {
                IconButton(
                    onClick = { onGesture(MainScreenGesture.CloseChat) },
                    enabled = state.closeEnabled
                ) {
                    Icon(
                        imageVector = Icons.Filled.Close,
                        contentDescription = "Close chat"
                    )
                }
                IconButton(
                    onClick = { onGesture(MainScreenGesture.DeleteChat) },
                    enabled = state.deleteEnabled
                ) {
                    Icon(
                        imageVector = Icons.Filled.Delete,
                        contentDescription = "Delete chat"
                    )
                }
            }
        )
        is MainScreenUiState.ChatData -> MainScreenScaffold(
            title = "Order state",
            withBackButton = true,
            onGesture = onGesture,
            content = { padding, g -> OrderState(padding, state, g) }
        )
        is MainScreenUiState.Error -> MainScreenScaffold(
            title = "Error",
            withBackButton = true,
            onGesture = onGesture,
            content = { padding, g ->
                FatalError(state.error, padding) { g(MainScreenGesture.Action) }
            }
        )
        MainScreenUiState.Terminated -> {
            LaunchedEffect(state) {
                onComplete()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScreenScaffold(
    title: String,
    withBackButton: Boolean,
    onGesture: (MainScreenGesture) -> Unit,
    content: @Composable (PaddingValues, (MainScreenGesture) -> Unit) -> Unit,
    actions: @Composable RowScope.() -> Unit = {}
) {
    val snackbarHostState = remember { SnackbarHostState() }
    BackHandler { onGesture(MainScreenGesture.Back) }
    Scaffold(
        snackbarHost = {
            SnackbarHost(hostState = snackbarHostState)
        },
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = title,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    if (withBackButton) {
                        IconButton(onClick = { onGesture(MainScreenGesture.Back) }) {
                            Icon(
                                imageVector = Icons.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    }
                },
                actions = actions
            )
        },
        content = { contentPadding ->
            content(contentPadding, onGesture)
        }
    )
}
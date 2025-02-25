package com.vistajet.thomas.data

sealed class MainScreenGesture {
    data object Back: MainScreenGesture()
    data object Action: MainScreenGesture()
    data class ChatSelected(val id: String): MainScreenGesture()
    data class UserNameChanged(val userName: String): MainScreenGesture()
    data class PasswordChanged(val password: String): MainScreenGesture()
    data class Text(val text: String): MainScreenGesture()
    data object CloseChat: MainScreenGesture()
    data object DeleteChat: MainScreenGesture()
    data object ToggleOrderView: MainScreenGesture()
}
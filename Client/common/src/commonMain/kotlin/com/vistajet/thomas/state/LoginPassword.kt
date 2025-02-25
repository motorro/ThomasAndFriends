package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState

class LoginPassword(context: MainScreenContext, private var credentials: com.vistajet.thomas.data.Credentials) : MainScreenState(context) {
    override fun doStart() {
        render()
    }

    override fun doProcess(gesture: MainScreenGesture) = when (gesture) {
        is MainScreenGesture.UserNameChanged -> {
            credentials = credentials.copy(login = gesture.userName)
            render()
        }
        is MainScreenGesture.PasswordChanged -> {
            credentials = credentials.copy(password = gesture.password)
            render()
        }
        is MainScreenGesture.Action -> {
            setMachineState(factory.loggingInUser(credentials))
        }
        is MainScreenGesture.Back -> {
            setMachineState(factory.terminated())
        }
        else -> super.doProcess(gesture)
    }

    private fun render() {
        setUiState(MainScreenUiState.LoginPassword(credentials))
    }
}
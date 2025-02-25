package com.vistajet.thomas.state

import com.vistajet.thomas.data.MainScreenUiState
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import io.github.aakira.napier.Napier
import kotlinx.coroutines.launch

class LogginInUser(context: MainScreenContext, private val credentials: com.vistajet.thomas.data.Credentials) : MainScreenState(context) {
    override fun doStart() {
        setUiState(MainScreenUiState.Loading("Creating user..."))
        loginUser()
    }

    private fun loginUser() {
        stateScope.launch {
            Napier.d { "Creating anonymous user..." }
            val result = try {
                Firebase.auth.signInWithEmailAndPassword(credentials.login, credentials.password)
            } catch (e: Throwable) {
                Napier.e(e) { "Error creating user" }
                setMachineState(factory.loginError(e, credentials))
                return@launch
            }

            val user = result.user
            if (null == user) {
                Napier.e { "User not logged-in" }
                setMachineState(factory.loginError(IllegalStateException("User not created"), credentials))
                return@launch
            }

            Napier.d { "User created: ${user.uid}" }
            setMachineState(factory.chatList())
        }
    }
}
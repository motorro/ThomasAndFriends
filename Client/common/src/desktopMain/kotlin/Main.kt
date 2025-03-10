import android.app.Application
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import com.google.firebase.Firebase
import com.google.firebase.FirebaseOptions
import com.google.firebase.FirebasePlatform
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.firestore
import com.google.firebase.initialize
import com.vistajet.thomas.ui.MainScreen
import io.github.aakira.napier.LogLevel
import io.github.aakira.napier.Napier

// Configure firebase:
// https://github.com/GitLiveApp/firebase-java-sdk?tab=readme-ov-file#initializing-the-sdk
val options: FirebaseOptions
    get() = TODO()

fun main() = application {

    FirebasePlatform.initializeFirebasePlatform(object : FirebasePlatform() {
        val storage = mutableMapOf<String, String>()
        override fun store(key: String, value: String) = storage.set(key, value)
        override fun retrieve(key: String) = storage[key]
        override fun clear(key: String) { storage.remove(key) }
        override fun log(msg: String) = Napier.log(LogLevel.INFO, message = msg)
    })

    val app = Firebase.initialize(Application(), options)
    val db = Firebase.firestore(app)
    val settings = FirebaseFirestoreSettings.Builder(db.firestoreSettings)
        .setPersistenceEnabled(false)
        .build()
    db.firestoreSettings = settings

    val windowState = rememberWindowState(
        width = 500.dp, height = 700.dp
    )
    val viewModel = com.vistajet.thomas.Model()

    Window(
        onCloseRequest = ::exitApplication,
        resizable = false,
        title = "AI Chat",
        state = windowState
    ) {
        val viewState by viewModel.uiState.collectAsState()
        MainScreen(
            state = viewState,
            onComplete = { exitApplication() },
            showMap = {},
            onGesture = { viewModel.onGesture(it) }
        )
    }
}
package com.vistajet.thomas.state

import com.vistajet.thomas.Constants.REGION
import com.vistajet.thomas.data.Credentials
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.functions.FirebaseFunctions
import dev.gitlive.firebase.functions.functions

interface MainScreenStateFactory {
    fun preChecking(): MainScreenState
    fun loginPassword(credentials: Credentials = Credentials()): MainScreenState
    fun loggingInUser(credentials: Credentials): MainScreenState
    fun loginError(error: Throwable, credentials: Credentials): MainScreenState
    fun preCheckError(error: Throwable): MainScreenState
    fun chatList(): MainScreenState
    fun chatListError(error: Throwable): MainScreenState
    fun chatPrompt(message: String? = null): MainScreenState
    fun creatingChat(message: String): MainScreenState
    fun chatCreationError(error: Throwable, message: String): MainScreenState
    fun chat(chatDocumentPath: String, chatData: ChatStateData? = null): MainScreenState
    fun orderState(chatDocumentPath: String, chatData: ChatStateData): MainScreenState
    fun chatError(error: Throwable, chatDocumentPath: String): MainScreenState
    fun closingChat(chatDocumentPath: String): MainScreenState
    fun deletingChat(chatDocumentPath: String): MainScreenState
    fun terminated(): MainScreenState
}

class MainScreenStateFactoryImpl : MainScreenStateFactory {

    private val functions: FirebaseFunctions = Firebase.functions(region = REGION)
    private val context: MainScreenContext = object : MainScreenContext {
        override val factory: MainScreenStateFactory = this@MainScreenStateFactoryImpl
    }

    override fun preChecking(): MainScreenState = PreChecking(context)
    override fun preCheckError(error: Throwable): MainScreenState = Error(
        context = context,
        error = error,
        onBack = { terminated() },
        onAction = { preChecking() }
    )
    override fun loginPassword(credentials: Credentials): MainScreenState = LoginPassword(context, credentials)
    override fun loggingInUser(credentials: Credentials): MainScreenState = LogginInUser(context, credentials)
    override fun loginError(error: Throwable, credentials: Credentials): MainScreenState = Error(
        context,
        error,
        { terminated() },
        { loginPassword(credentials) }
    )

    override fun chatList(): MainScreenState = ChatList(context, functions)
    override fun chatListError(error: Throwable): MainScreenState = Error(
        context,
        error,
        { terminated() },
        { chatList() }
    )

    override fun chatPrompt(message: String?): MainScreenState = ChatPrompt(context, message)
    override fun creatingChat(message: String): MainScreenState = CreatingChat(
        context,
        message,
        CreateChat.Impl(functions)
    )
    override fun chatCreationError(error: Throwable, message: String): MainScreenState = Error(
        context,
        error,
        { chatPrompt(message) },
        { creatingChat(message) }
    )
    override fun chat(chatDocumentPath: String, chatData: ChatStateData?): MainScreenState = Chat(
        context,
        chatDocumentPath,
        functions,
        chatData
    )
    override fun orderState(chatDocumentPath: String, chatData: ChatStateData): MainScreenState = OrderState(
        context,
        chatDocumentPath,
        chatData
    )
    override fun chatError(error: Throwable, chatDocumentPath: String): MainScreenState = Error(
        context,
        error,
        { chatList() },
        { chat(chatDocumentPath) }
    )
    override fun closingChat(chatDocumentPath: String): MainScreenState = ClosingChat(
        context,
        chatDocumentPath,
        functions
    )
    override fun deletingChat(chatDocumentPath: String): MainScreenState = DeletingChat(
        context,
        chatDocumentPath,
        functions
    )
    override fun terminated(): MainScreenState = Terminated(context)
}
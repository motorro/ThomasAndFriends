package com.vistajet.thomas.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.capitalize
import androidx.compose.ui.text.intl.Locale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.data.domain.ChatMessage
import com.vistajet.thomas.data.domain.ChatMessageAuthor
import com.vistajet.thomas.data.domain.ChatStatus
import com.vistajet.thomas.data.domain.ReplyWith
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.vectorResource
import thomasandfriends.common.generated.resources.Res
import thomasandfriends.common.generated.resources.map_24px

@Composable
fun Chat(
    padding: PaddingValues,
    state: MainScreenUiState.Chat,
    showMap: () -> Unit,
    onGesture: (MainScreenGesture) -> Unit
) {
    val chatScrollState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    fun scrollToMaxValue() {
        scope.launch {
            chatScrollState.scrollToItem(Int.MAX_VALUE)
        }
    }
    KeyboardStateHandler {
        scrollToMaxValue()
    }

    Box(modifier = Modifier.padding(padding)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .imePadding()
                .navigationBarsPadding()
        ) {
            TabRow(0, Modifier.fillMaxWidth()) {
                Tab(text = { Text("Order chat") },
                    selected = true,
                    onClick = {  }
                )
                Tab(text = { Text("Order state") },
                    selected = false,
                    onClick = { onGesture(MainScreenGesture.ToggleOrderView) }
                )
            }
            LazyColumn(
                modifier = Modifier.weight(1f),
                state = chatScrollState
            ) {
                items(
                    items = state.messages,
                    key = { it.first }
                ) {
                    ChatItem(message = it.second)
                }

                if (state.isWaiting()) {
                    item {
                        AwaitAssistant()
                    }
                }
            }

            ChatBox(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                text = state.message,
                isSendEnable = state.isSendEnable(),
                isMapEnable = state.containLocation(),
                onUpdate = { onGesture(MainScreenGesture.Text(it)) },
                showMap = showMap,
                onSend = {
                    onGesture(MainScreenGesture.Action)
                    scrollToMaxValue()
                }
            )
        }

        scrollToMaxValue()
    }
}

@Composable
private fun ChatItem(message: ChatMessage) {
    when {
        message.isAssistant() -> AiItem(message)
        else -> UserItem(message)
    }
}

@Composable fun UserItem(message: ChatMessage) {
    val name =  "You"

    val bgColor = MaterialTheme.colorScheme.secondary
    val textColor = MaterialTheme.colorScheme.onSecondary

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 5.dp)
    ) {
        Column(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .clip(
                    RoundedCornerShape(
                        topStart = 48f,
                        topEnd = 48f,
                        bottomStart = 48f,
                        bottomEnd = 0f
                    )
                )
                .background(bgColor)
                .padding(16.dp)
        ) {
            Text(
                modifier = Modifier.fillMaxWidth(),
                text = name.capitalize(Locale.current),
                style = MaterialTheme.typography.labelLarge,
                textAlign = TextAlign.End,
                color = textColor
            )
            Text(
                text = message.text,
                style = MaterialTheme.typography.bodyMedium,
                color = textColor
            )
        }
    }
}

@Composable
private fun AiItem(message: ChatMessage) {
    val name = if (null != message.meta) {
        message.meta.assistantName
    } else {
        "AI"
    }

    val bgColor = MaterialTheme.colorScheme.primary
    val textColor = MaterialTheme.colorScheme.onPrimary

    Row(
        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.Bottom
    ) {
        Image(
            bitmap = getAvatar(message.meta?.assistantId),
            contentDescription = name,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(48.dp)
                .border(
                    BorderStroke(1.dp, bgColor),
                    CircleShape
                )
                .clip(CircleShape)
        )
        Box(modifier = Modifier.fillMaxWidth().padding(start = 5.dp)) {
            Column(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .clip(
                        RoundedCornerShape(
                            topStart = 48f,
                            topEnd = 48f,
                            bottomStart = 0f,
                            bottomEnd = 48f
                        )
                    )
                    .background(bgColor)
                    .padding(16.dp)
            ) {
                Text(
                    modifier = Modifier.fillMaxWidth(),
                    text = name.capitalize(Locale.current),
                    style = MaterialTheme.typography.labelLarge,
                    textAlign = TextAlign.Start,
                    color = textColor
                )
                Text(
                    text = message.text,
                    style = MaterialTheme.typography.bodyMedium,
                    color = textColor
                )
            }
        }
    }
}

@Composable
private fun ChatBox(
    modifier: Modifier,
    text: String,
    isSendEnable: Boolean,
    isMapEnable: Boolean,
    onUpdate: (String) -> Unit,
    showMap: () -> Unit,
    onSend: () -> Unit
) {
    Row(modifier = modifier) {
        OutlinedTextField(
            value = text,
            modifier = Modifier
                .defaultMinSize(minHeight = 52.dp)
                .weight(1f),
            onValueChange = { newText ->
                onUpdate(newText)
            },
            placeholder = {
                Text(text = "Type your question here")
            },
            trailingIcon = {
                Row {
                    if (isMapEnable) {
                        MapButton {
                            showMap()
                        }
                    }

                    if (text.isNotEmpty()) {
                        Icon(
                            modifier = Modifier
                                .padding(horizontal = 5.dp)
                                .clickable {
                                    onUpdate("")
                                },
                            imageVector = Icons.Filled.Clear,
                            contentDescription = "Clear"
                        )
                    }
                }
            }
        )

        IconButton(
            modifier = Modifier,
            enabled = isSendEnable,
            content = {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Send button",
                    tint = if (isSendEnable) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.surfaceVariant
                )
            },
            onClick = {
                onSend()
            }
        )
    }
}

@Composable
private fun MapButton(showMap: () -> Unit) {
    Icon(
        modifier = Modifier
            .padding(horizontal = 5.dp)
            .clickable {
                showMap()
            },
        imageVector = vectorResource(Res.drawable.map_24px),
        contentDescription = "Open map"
    )
}

@Composable
private fun AwaitAssistant() {
    val shimmerColors = listOf(
        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.8f),
        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f),
        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.8f),
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 2.5.dp)
    ) {
        SkeletonAnimation(
            shimmerColors = shimmerColors
        ) { skeletonBrush ->
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .clip(
                        RoundedCornerShape(
                            topStart = 48f,
                            topEnd = 48f,
                            bottomEnd = 48f,
                            bottomStart = 0f
                        )
                    )
                    .background(skeletonBrush)
                    .padding(16.dp)
            ) {
                Text(
                    text = "...",
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}
private fun ChatMessage.isAssistant(): Boolean {
    return author == ChatMessageAuthor.ai
}

private val userEnabledStates = setOf(
    ChatStatus.userInput
)
private fun MainScreenUiState.Chat.isSendEnable(): Boolean {
    return sending.not() && userEnabledStates.contains(status)
}
private fun MainScreenUiState.Chat.isWaiting(): Boolean {
    return sending || status == ChatStatus.processing
}

private fun MainScreenUiState.Chat.containLocation(): Boolean {
    return messages.lastOrNull()?.second?.meta?.replyWith == ReplyWith.Location
}
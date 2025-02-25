package com.vistajet.thomas.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
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
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import com.vistajet.thomas.data.MainScreenGesture
import com.vistajet.thomas.data.MainScreenUiState
import com.vistajet.thomas.data.domain.ChatState
import dev.gitlive.firebase.firestore.toMilliseconds
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.format
import kotlinx.datetime.format.Padding
import kotlinx.datetime.format.char
import kotlinx.datetime.toLocalDateTime

@Composable
fun ChatList(
    padding: PaddingValues,
    state: MainScreenUiState.Chats,
    onGesture: (MainScreenGesture) -> Unit
) {
    val chatScrollState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.padding(padding)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .imePadding()
                .navigationBarsPadding()
        ) {
            LazyColumn(
                modifier = Modifier.weight(1f),
                state = chatScrollState
            ) {
                items(
                    items = state.chats,
                    key = { it.first }
                ) {
                    ChatItem(it.first, it.second) { onGesture(MainScreenGesture.ChatSelected(it) ) }
                }
            }

            Button(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                onClick = { onGesture(MainScreenGesture.Action) }
            ) {
                Text(text = "Create chat")
            }
        }

        LaunchedEffect(state) {
            chatScrollState.scrollToItem(Int.MAX_VALUE)
        }
    }
}

@Composable
private fun ChatItem(id: String, chat: ChatState, onItemClicked: (String) -> Unit) {
    fun formatChatDate(instant: Instant): String {
        val now = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())
        val ofInstant = instant.toLocalDateTime(TimeZone.currentSystemDefault())
        return when {
            now.date == ofInstant.date -> ofInstant.time.format(LocalTime.Format {
                hour(Padding.ZERO)
                char(':')
                minute(Padding.ZERO)
            })
            else -> ofInstant.date.format(LocalDate.Format {
                dayOfMonth(Padding.ZERO)
                char('-')
                monthNumber(Padding.ZERO)
                char('-')
                year(Padding.NONE)
            })
        }
    }

    val assistantId = chat.meta?.aiMessageMeta?.assistantId
    val assistantName = chat.meta?.aiMessageMeta?.assistantName ?: "Order chat"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 8.dp)
            .clip(MaterialTheme.shapes.small)
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .clickable { onItemClicked(id) },
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            bitmap = getAvatar(assistantId),
            contentDescription = assistantName,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .padding(8.dp)
                .size(48.dp)
                .border(
                    BorderStroke(1.dp, MaterialTheme.colorScheme.onSurfaceVariant),
                    CircleShape
                )
                .clip(CircleShape)
        )

        Column(
            modifier = Modifier.padding(horizontal = 8.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                modifier = Modifier.padding(vertical = 4.dp, horizontal = 8.dp),
                text = assistantName,
                style = MaterialTheme.typography.labelLarge
            )
            Text(
                modifier = Modifier.padding(vertical = 4.dp, horizontal = 8.dp),
                text = formatChatDate(Instant.fromEpochMilliseconds(chat.createdAt.toMilliseconds().toLong()))
            )
        }
    }
}

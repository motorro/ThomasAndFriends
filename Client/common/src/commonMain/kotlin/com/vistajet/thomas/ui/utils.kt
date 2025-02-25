package com.vistajet.thomas.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.ImageBitmap
import org.jetbrains.compose.resources.imageResource
import thomasandfriends.common.generated.resources.Res
import thomasandfriends.common.generated.resources.ace_ico
import thomasandfriends.common.generated.resources.emerson_ico
import thomasandfriends.common.generated.resources.harold_ico
import thomasandfriends.common.generated.resources.lady_ico
import thomasandfriends.common.generated.resources.logo_ico
import thomasandfriends.common.generated.resources.thomas_ico
import thomasandfriends.common.generated.resources.topham_ico

@Composable
fun getAvatar(assistantId: String?): ImageBitmap = when (assistantId) {
    "thomas" -> imageResource(Res.drawable.thomas_ico)
    "flight" -> imageResource(Res.drawable.emerson_ico)
    "flightOptions" -> imageResource(Res.drawable.harold_ico)
    "catering" -> imageResource(Res.drawable.topham_ico)
    "transfer" -> imageResource(Res.drawable.ace_ico)
    "waypoints" -> imageResource(Res.drawable.lady_ico)
    else -> imageResource(Res.drawable.logo_ico)
}

@Composable
expect fun KeyboardStateHandler(onChanged: (Boolean) -> Unit)
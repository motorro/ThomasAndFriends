package com.vistajet.thomas.data.domain

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable
data class MessageMeta(
    val assistantId: String,
    val assistantName: String,
    val engine: String,
    val replyWith: ReplyWith = ReplyWith.TEXT
)

@Serializable(with = ReplyWith.Companion::class)
enum class ReplyWith(private val value: String) {
    TEXT("text"),
    Location("location");

    companion object Companion : KSerializer<ReplyWith> {
        override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor(
            "ReplyWith",
            PrimitiveKind.STRING
        )

        override fun deserialize(decoder: Decoder): ReplyWith {
            val value = decoder.decodeString()
            return entries.find { it.value == value } ?: TEXT
        }

        override fun serialize(encoder: Encoder, value: ReplyWith) {
            encoder.encodeString(value.value)
        }
    }
}
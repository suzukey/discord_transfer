const command = async (clients, message, args) => {
  const channels = message.guild.channels.cache.array()
  const voice_channels = channels.filter((channel) => channel.type === "voice")

  if (voice_channels.length < 2) {
    message.channel.send("error: Requires at least two voice channels")
    return
  }

  let targets = null
  // Recognized as specifying a channel name with two arguments
  if (args.length === 2) {
    targets = await select_channels_from_args(message, voice_channels, args[0], args[1])
  } else {
    targets = await emoji_channel_selector(message, voice_channels)
  }

  if (!targets) {
    return
  }

  const { from_ch, to_ch } = targets

  // Assign a channel to each client
  const conn_from = await clients.from.channels.cache.get(from_ch.id).join()
  const conn_to = await clients.to.channels.cache.get(to_ch.id).join()

  clients.connect(conn_from, conn_to)
  message.channel.send(`Transfer voice from \`${from_ch.name}\` to \`${to_ch.name}\``)
}

const select_channels_from_args = async (
  message,
  voice_channels,
  target_from_name,
  target_to_name
) => {
  const from_ch = voice_channels.find((channel) => channel.name === target_from_name)
  if (!from_ch) {
    message.channel.send("error: From channel is not exist")
    return
  }
  const remain_vc = voice_channels.filter((channel) => channel !== from_ch)
  const to_ch = remain_vc.find((channel) => channel.name === target_to_name)
  if (!to_ch) {
    message.channel.send("error: To channel is not exist")
    return
  }

  return { from_ch, to_ch }
}

const emoji_channel_selector = async (message, voice_channels) => {
  let remain_vc = voice_channels
  const from_ch = remain_vc
  if (!from_ch) {
    message.channel.send("error: No channel selected")
    return
  }
  remain_vc = remain_vc.filter((channel) => channel !== from_ch)
  const to_ch = await question_channels(message, remain_vc, `from '${from_ch.name}' to`)
  if (!to_ch) {
    message.channel.send("error: No channel selected")
    return
  }

  return { from_ch, to_ch }
}

const question_channels = async (message, channels, direction) => {
  const emojis = require("../config/emojis")
  const ch_count = channels.length

  if (emojis.length < ch_count) {
    message.channel.send("error: Too many voice channels")
    return
  }

  // Prepare as many emoji as their channels
  const ch_emojis = emojis.slice(0, ch_count)
  const question = {
    embed: {
      color: 0xe2b618,
      title: "Select Channel",
      description: `Voice transfer ${direction}`,
      fields: []
    }
  }

  for (let i = 0; i < ch_count; i++) {
    const field = {
      name: ch_emojis[i],
      value: channels[i].name,
      inline: true
    }
    question.embed.fields.push(field)
  }

  const reaction = await question_react(message, ch_emojis, question)
  if (!reaction) return

  const selected_channel = channels[emojis.indexOf(reaction)]
  return selected_channel
}

// Ask a question and wait for a reaction
const question_react = async (message, emojis, question) => {
  const question_msg = await message.channel.send("wait...")
  const wait_reaction_setting = await question_msg.react("⏳")

  const config = require("../config/settings")

  await Promise.all(
    emojis.map((emoji) => {
      question_msg.react(emoji)
    })
  )

  await wait_reaction_setting.remove()
  await question_msg.edit(`<@${message.author.id}>`, question)

  const filter = (reaction, user) => {
    if (user.id !== message.author.id) return false
    return emojis.includes(reaction.emoji.name)
  }

  const answer_reaction = await question_msg.awaitReactions(filter, {
    max: 1,
    time: config.wait_reaction_sec * 1000
  })
  await question_msg.delete()

  if (answer_reaction.size) return answer_reaction.first()._emoji.name
}

module.exports = command

const command = async (clients, message, args) => {
  const channels = message.guild.channels.cache.array()
  const voice_channels = channels.filter((channel) => channel.type === "voice")

  if (voice_channels.length < 2) {
    message.channel.send("error: Requires at least two voice channels")
    return
  }

  let remain_vc = voice_channels
  const from_ch = await question_channels(message, remain_vc, "from")
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

  // Assign a channel to each client
  const conn_from = await clients.from.channels.cache.get(from_ch.id).join()
  const conn_to = await clients.to.channels.cache.get(to_ch.id).join()

  clients.connect(conn_from, conn_to)
  message.channel.send(`Transfer voice from \`${from_ch.name}\` to \`${to_ch.name}\``)
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
  let question = {
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

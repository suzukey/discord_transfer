// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform you.
if (Number(process.version.slice(1).split(".")[0]) < 12)
  throw new Error("Node 12.0.0 or higher is required. Update Node on your system.")

// Load up the discord.js library
const discord = require("discord.js")

const secrets = require("./config/secrets")
const config = require("./config/settings")

const clients = {
  from: new discord.Client(),
  to: new discord.Client()
}

const login = async () => {
  clients.from.login(secrets.from_token)
  clients.to.login(secrets.to_token)
}

clients.from.once("ready", () => {
  console.log(`transfer_from: ${clients.from.user.tag} on ready`)
})

clients.to.once("ready", () => {
  console.log(`transfer_to: ${clients.to.user.tag} on ready`)
})

clients.from.on("message", async (message) => {
  if (message.content.indexOf(config.prefix) !== 0) return

  const command_extraction = message.content.slice(config.prefix.length).trim()
  const args = command_extraction.split(/ +/g)
  const command = args.shift().toLowerCase()

  if (command === "trans" || command === "transfer") {
    message.delete()

    const channels = message.guild.channels.cache.array()
    const voice_channels = channels.filter((channel) => channel.type === "voice")

    if (voice_channels.length < 2) {
      message.channel.send("error: Requires at least two voice channels")
      return
    }

    let remain_vc = voice_channels
    const from_ch = await question_channels(message, remain_vc, "from")
    if (!from_ch) return

    remain_vc = remain_vc.filter((channel) => channel !== from_ch)
    const to_ch = await question_channels(message, remain_vc, `from ${from_ch.name} to`)
    if (!to_ch) return

    // Assign a channel to each client
    const conn_from = await clients.from.channels.cache.get(from_ch.id).join()
    const conn_to = await clients.to.channels.cache.get(to_ch.id).join()
  }
})

const question_channels = async (message, channels, direction) => {
  const emojis = require("./config/emojis")

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

  await Promise.all(
    emojis.map((emoji) => {
      question_msg.react(emoji)
    })
  )

  await wait_reaction_setting.remove()
  await question_msg.edit(question)

  const filter = (reaction, user) => {
    if (user.id !== message.author.id) return false
    return emojis.includes(reaction.emoji.name)
  }

  const answer_reaction = await question_msg.awaitReactions(filter, {
    max: 1,
    time: 15000
  })
  await question_msg.delete()

  if (answer_reaction.size) return answer_reaction.first()._emoji.name
}

login()

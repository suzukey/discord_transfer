const discord = require("discord.js")
const { Silence } = require("./audio")

class Transfer {
  from = null
  to = null
  guilds = {}

  constructor() {
    this.from = new discord.Client()
    this.to = new discord.Client()
  }

  login = async (from_token, to_token) => {
    this.from.login(from_token)
    this.to.login(to_token)
  }

  connect = (from_connection, to_connection) => {
    const guild = new Guild(from_connection, to_connection)
    this.guilds[guild.id] = guild
  }

  leave = (guild_id) => {
    if (!(guild_id in this.guilds)) return
    this.guilds[guild_id].leave()
    delete this.guilds[guild_id]
  }
}

class Guild {
  id = ""
  connection = {
    from: null,
    to: null
  }
  volumes = {}

  constructor(from_connection, to_connection) {
    const from_ch = from_connection.channel
    const to_ch = to_connection.channel

    if (from_ch.guild.id !== to_ch.guild.id) throw "construct error"
    if (from_ch.id === to_ch.id) throw "construct error"

    this.id = from_ch.guild.id
    this.connection = {
      from: from_connection,
      to: to_connection
    }

    this.connection.from.play(new Silence(), { type: "opus" })
    this.connection.to.play(new Silence(), { type: "opus" })

    this.connection.from.on("speaking", (user, speaking) => {
      if (speaking.bitfield !== 1) return
      const stream = this.connection.from.receiver.createStream(user.id)
      this.connection.to.play(stream, { type: "opus" })
    })
  }

  leave = async () => {
    this.connection.from.disconnect()
    this.connection.to.disconnect()
  }
}

module.exports = {
  Transfer
}

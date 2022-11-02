const discord = require("discord.js")
const { Silence } = require("./audio")
const AudioMixer = require("audio-mixer")
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
  audioMixer = null

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

    const mixer = new AudioMixer.Mixer({
      channels: 2,
      bitDepth: 16,
      sampleRate: 48000
    })

    this.connection.to.play(mixer, { type: "converted" })
    this.audioMixer = mixer

    this.connection.from.on("speaking", (user, speaking) => {
      if (speaking) {
        if (this.audioMixer == null) {
          throw "audioMixer is null"
        } else {
          const stream = this.connection.from.receiver.createStream(user, {
            mode: "pcm"
          })
          const standaloneInput = new AudioMixer.Input({
            channels: 2,
            bitDepth: 16,
            sampleRate: 48000,
            volume: 80
          })
          this.audioMixer.addInput(standaloneInput)
          const p = stream.pipe(standaloneInput)
          stream.on("end", () => {
            if (this.audioMixer != null) {
              this.audioMixer.removeInput(standaloneInput)
              standaloneInput.destroy()
              stream.destroy()
              p.destroy()
            }
          })
        }
      }
    })
  }

  leave = async () => {
    this.connection.from.disconnect()
    this.connection.to.disconnect()
    this.audioMixer.close()
  }
}

module.exports = {
  Transfer
}

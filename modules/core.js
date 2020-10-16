const discord = require("discord.js")

class Transfer {
  constructor() {
    this.from = new discord.Client()
    this.to = new discord.Client()
  }

  guilds = []

  login = async (from_token, to_token) => {
    this.from.login(from_token)
    this.to.login(to_token)
  }
}

class Guild {
  constructor(from_connection, to_connection) {
    this.connection = {
      from: from_connection,
      to: to_connection
    }
  }

  volumes = {}
}

module.exports = {
  Transfer,
  Guild
}

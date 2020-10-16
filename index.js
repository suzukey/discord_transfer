// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform you.
if (Number(process.version.slice(1).split(".")[0]) < 12)
  throw new Error("Node 12.0.0 or higher is required. Update Node on your system.")

// Load up the discord.js library
const discord = require("discord.js")

const secrets = require("./config/secrets.json")

const transfer_bots = {
  from: new discord.Client(),
  to: new discord.Client()
}

const init = async () => {
  transfer_bots.from.login(secrets.from_token)
  transfer_bots.to.login(secrets.to_token)
}

init()

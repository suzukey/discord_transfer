// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform you.
if (Number(process.version.slice(1).split(".")[0]) < 12)
  throw new Error("Node 12.0.0 or higher is required. Update Node on your system.")

const transfer = require("./modules/core")

const secrets = require("./config/secrets")
const config = require("./config/settings")

const clients = new transfer.Transfer()

const init = async () => {
  clients.login(secrets.from_token, secrets.to_token)
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
    require("./commands/transfer")(clients, message, args)
  }

  if (command == "leave") {
    clients.leave(message.guild.id)
  }
})

init()

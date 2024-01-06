const path = require("path")
require("dotenv").config({path: path.join(__dirname, ".env")})
const { TelegramClient} = require("telegram")
const { StringSession } = require("telegram/sessions")
module.exports = new TelegramClient(new StringSession(process.env.stringSession), Number(process.env.appId), process.env.appHash); // https://my.telegram.org/apps => login => create app
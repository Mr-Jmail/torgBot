const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events"); // npm i input
const genStringSession = require("./genStringSession");
const configClient = require("./configClient");
const client = configClient

// const idOfNeededChannel = 2069599112 // Test. Переслать сообщение из канала в @getmyid_bot из "Forwarded from chat" убрать -100
const idOfNeededChannel = 1853036360 // Переслать сообщение из канала в @getmyid_bot из "Forwarded from chat" убрать -100

const alertsToChannelId = {
    "1-2": -1002106630709,
    "3-8": -1002106630709,
    "10": -1002106630709,
    "other": -1002106630709
}
;(async function() {
    await client.start()
    client.addEventHandler(async function(event) {
        var message = event?.message
        var channelId = message?.peerId?.channelId
        var text = message?.message

        if(channelId != idOfNeededChannel) return

        console.log(text);

        if(!text.includes("Buys")) return
        var alerts = text.split("Alerts in this hour: ")[1].split(" ")[0]
        try {alerts = Number(alerts)}
        catch(err) {return console.log(err)}

        const match = text.match(/\$(\w+)/);
        const namOfCurrency = match ? match[1] : undefined;

        var channelIdToReposte = getChannelIdToRepost(alerts)
        var textToReposte = text.replace("Price:", "Enter above:").replace(`$${namOfCurrency}`, `${namOfCurrency}/USDT`)

        await client.sendMessage(channelIdToReposte, { message: `Ориг\n${text}` })
        await client.sendMessage(channelIdToReposte, { message: `Измененный\n${textToReposte}` })
        
        // console.log(`new message: ${text}`)
        // console.log("\n\n\n")
        // console.log(message)
    }, new NewMessage())
})()


function getChannelIdToRepost(alerts) {
    for (var key in alertsToChannelId) {
        if(key == "other") return alertsToChannelId[key]
        if(Number(key) && Number(key) == alerts) return alertsToChannelId[key]
        var [ startNumber, endNumber ] = key.split("-")
        if(alerts >= startNumber && alerts <= endNumber) return alertsToChannelId[key]
    }
}

// genStringSession()
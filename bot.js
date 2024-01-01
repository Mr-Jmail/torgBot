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
    "3-8": -1002106630709
}

;(async function() {
    await client.start()
    client.addEventHandler(async function(event) {
        var message = event?.message
        var channelId = message?.peerId?.channelId
        var text = message?.message

        if(channelId != idOfNeededChannel) return


        if(!text.includes("Buys")) return
        var alerts = text.split("Alerts in this hour: ")[1].split(" ")[0]
        try {alerts = Number(alerts)}
        catch(err) {return console.log(err)}

        const match = text.match(/\$(\w+)/);
        const namOfCurrency = match ? match[1] : undefined;

        console.log(alerts)
        var channelIdToReposte = getChannelIdToRepost(alerts)
        if(channelIdToReposte == 0) return
        var textToReposte = text.replace("Price:", "Enter above:").replace(`$${namOfCurrency}`, `${namOfCurrency}/USDT`)

        const caption = `Измененный\n${textToReposte}`;
        
        await client.sendFile(-1002106630709, {
            file: new Api.InputMediaPhoto({
                id: new Api.InputPhoto({
                    id: message.photo.id,
                    accessHash: message.photo.accessHash,
                    fileReference: message.photo.fileReference
                })
            }),
            caption
        })

        console.log(channelIdToReposte)

        await client.sendMessage(channelIdToReposte, { message: `Ориг\n${text}` })
    }, new NewMessage())
})()


function getChannelIdToRepost(alerts) {
    for (var key in alertsToChannelId) {
        if(Number(key) && Number(key) == alerts) return alertsToChannelId[key]
        if(!key.includes("-")) return 0
        var [ startNumber, endNumber ] = key.split("-")
        if(alerts >= startNumber && alerts <= endNumber) return alertsToChannelId[key]
    }
    return 0
}

// genStringSession()
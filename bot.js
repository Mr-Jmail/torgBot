const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events"); // npm i input
const genStringSession = require("./genStringSession");
const fs = require("fs")
const configClient = require("./configClient");
const path = require("path");
const client = configClient

// const idOfNeededChannel = 2069599112 // Test. Переслать сообщение из канала в @getmyid_bot из "Forwarded from chat" убрать -100
const idOfNeededChannel = 1853036360 // Переслать сообщение из канала в @getmyid_bot из "Forwarded from chat" убрать -100

const alertsToChannelIdFilePath = path.join(__dirname, "alertsToChannelId.json")
const alertsToChannelId = getAlertsToChannelIdJson()

;(async function() {
    await client.start()
    client.addEventHandler(async function(event) {
        var message = event?.message
        var channelId = message?.peerId?.channelId
        var text = message?.message

        if(text == "/getConfig") return client.sendFile(message.peerId.userId, {file: alertsToChannelIdFilePath})
        if(message?.file?.media?.mimeType == "application/json" && message?.message == "/updateConfig") {
            var newFilePath = path.join(__dirname, "alertsToChannelId2.json")
            await client.downloadFile(
                new Api.InputDocumentFileLocation({
                    id: message.file.media.id,
                    accessHash: message.file.media.accessHash,
                    fileReference: message.file.media.fileReference,
                    thumbSize: message.file.media.size.toString()
                }),
                {
                    outputFile: newFilePath
                }
            )
            try {
                JSON.parse(fs.readFileSync(newFilePath, "utf-8"))
                fs.renameSync(newFilePath, alertsToChannelIdFilePath)
                await client.sendMessage(message.peerId.userId, {message: "Configuration is successfully updated"})
            } 
            catch (err) {
                await client.sendMessage(message.peerId.userId, {message: "Config has incorrect format. Configuration was not updated"})
                fs.rmSync(newFilePath, { force: true })
            }
        }

        if(channelId != idOfNeededChannel) return


        if(!text.includes("Buys")) return console.log(`Message https://t.me/CoinSonarV2/${message.id}\nDon't contain "Buys"`)
        var alerts = text.split("Alerts in this hour: ")[1].split(" ")[0]
        try {alerts = Number(alerts)}
        catch(err) {return console.log(`Message https://t.me/CoinSonarV2/${message.id}\nAlert is not a number: ${alerts}`);}

        const match = text.match(/\$(\w+)/);
        const namOfCurrency = match ? match[1] : undefined;

        var channelIdToReposte = getChannelIdToRepost(alerts)
        if(channelIdToReposte == 0) return console.log(`Message https://t.me/CoinSonarV2/${message.id}\nCant find channelId to resend. Alerts: ${alerts}`)
        var textToReposte = text.replace("Price:", "Enter above:").replace(`$${namOfCurrency}`, `${namOfCurrency}/USDT`)

        const caption = `Измененный\n${textToReposte}`;
        
        if(!message.photo) return await client.sendMessage(channelIdToReposte, {message: caption})

        await client.sendFile(channelIdToReposte, {
            file: new Api.InputMediaPhoto({
                id: new Api.InputPhoto({
                    id: message.photo.id,
                    accessHash: message.photo.accessHash,
                    fileReference: message.photo.fileReference
                })
            }),
            caption
        })
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

function getAlertsToChannelIdJson() {
    return JSON.parse(fs.readFileSync(alertsToChannelIdFilePath))
}
const { Api } = require("telegram");
const { NewMessage } = require("telegram/events"); // npm i input
const genStringSession = require("./genStringSession");
const fs = require("fs")
const configClient = require("./configClient");
const path = require("path");
const client = configClient

// const idOfNeededChannel = 2069599112 // Test. Переслать сообщение из канала в @getmyid_bot из "Forwarded from chat" убрать -100
const idOfNeededChannel = 1853036360 // Переслать сообщение из канала в @getmyid_bot из "Forwarded from chat" убрать -100

const alertsToChannelIdFilePath = path.join(__dirname, "alertsToChannelId.json")

;(async function() {
    await client.start()
    client.addEventHandler(async function(event) {
        var message = event?.message
        var channelId = message?.peerId?.channelId
        var text = message?.message

        if(text == "/getConfig") return client.sendFile(await message.getInputSender(), {file: alertsToChannelIdFilePath})
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
                await client.sendMessage(await message.getInputSender(), {message: "Configuration is successfully updated"})
            } 
            catch (err) {
                await client.sendMessage(await message.getInputSender(), {message: "Config has incorrect format. Configuration was not updated"})
                fs.rmSync(newFilePath, { force: true })
            }
        }

        if(channelId != idOfNeededChannel) return


        if(!text.includes("Buys")) return console.log(`Message https://t.me/CoinSonarV2/${message.id}\nDon't contain "Buys"`)
        var alerts = text.split("Alerts in this hour: ")[1].split(" ")[0]
        try {alerts = Number(alerts)}
        catch(err) {return console.log(`Message https://t.me/CoinSonarV2/${message.id}\nAlert is not a number: ${alerts}`);}

        const matchForNameOfCurrency = text.match(/\$(\w+)/);
        const nameOfCurrency = matchForNameOfCurrency ? matchForNameOfCurrency[1] : undefined;

        var channelIdToReposte = getChannelIdToRepost(alerts)
        if(channelIdToReposte == 0) return console.log(`Message https://t.me/CoinSonarV2/${message.id}\nCant find channelId to resend. Alerts: ${alerts}`)
        const matchForPriceValue = text.match(/Price: (\d+\.\d+)/);
        const priceValue = matchForPriceValue ? matchForPriceValue[1] : undefined;
        var textToReposte = `${nameOfCurrency}/USDT\nEnter above: ${priceValue}`

        
        if(!message.photo) await client.sendMessage(channelIdToReposte, {message: text}) // Репост ориг сообщения
        else {
            await client.sendFile(channelIdToReposte, { // Репост ориг сообщения
                file: new Api.InputMediaPhoto({
                    id: new Api.InputPhoto({
                        id: message.photo.id,
                        accessHash: message.photo.accessHash,
                        fileReference: message.photo.fileReference
                    })
                }),
                caption: text
            })
        }
        
        return client.sendMessage(channelIdToReposte, {message: textToReposte}) // Пересылка измененного сообщения
    }, new NewMessage())
})()


function getChannelIdToRepost(alerts) {
    var alertsToChannelId = getAlertsToChannelIdJson()
    for (var key in alertsToChannelId) {
        if(Number(key) && Number(key) == alerts) return alertsToChannelId[key]
        if(!key.includes("-")) continue
        var [ startNumber, endNumber ] = key.split("-")
        if(alerts >= startNumber && alerts <= endNumber) return alertsToChannelId[key]
    }
    return 0
}

// genStringSession()

function getAlertsToChannelIdJson() {
    return JSON.parse(fs.readFileSync(alertsToChannelIdFilePath))
}
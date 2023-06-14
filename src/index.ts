import {FlowScanner} from '@rayvin-flow/flow-scanner-lib'
import {MemorySettingsService} from '@rayvin-flow/flow-scanner-lib/lib/settings/memory-settings-service'
import {ConfigProvider} from '@rayvin-flow/flow-scanner-lib/lib/providers/config-provider'
import {EventBroadcasterInterface} from '@rayvin-flow/flow-scanner-lib/lib/broadcaster/event-broadcaster'
import {FlowEvent} from '@rayvin-flow/flow-scanner-lib/lib/flow/models/flow-event'
import { log } from 'console'
import axios from 'axios';


// create provider for configuration (these are the minimum required values)
const configProvider: ConfigProvider = () => ({
    defaultStartBlockHeight: undefined, // this is the block height that the scanner will start from on the very first run (undefined to start at the latest block)
    flowAccessNode: 'https://access-mainnet-beta.onflow.org', // access node to use for Flow API requests
    maxFlowRequestsPerSecond: 10, // maximum number of requests to make to the Flow API per second
})

// create the service that will persist settings (in this case, it is just in-memory)
const settingsService = new MemorySettingsService()

// the broadcaster that will handle all monitored events
class CustomEventBroadcaster implements EventBroadcasterInterface {
    async broadcastEvents(blockHeight: number, events: FlowEvent[]): Promise<void> {
        // this method will be called for any monitored events
        // you can perform your own application logic here (ie: persist to database, etc)
        var myStr = JSON.stringify(events)
        // console.log(myStr)
        getPrice(myStr)
    }
}

// create the scanner instance
const flowScanner = new FlowScanner(
    // event types to monitor
    [
        'A.4eb8a10cb9f87357.NFTStorefrontV2.ListingCompleted',
        'A.4eb8a10cb9f87357.NFTStorefront.ListingCompleted',
        'A.ead892083b3e2c6c.DapperUtilityCoin.TokensWithdrawn',
    ],
    // pass in the configured providers
    {
        configProvider: configProvider,
        eventBroadcasterProvider: async () => new CustomEventBroadcaster(),
        settingsServiceProvider: async () => settingsService,
    }
)

const main = async () => {
    // start the scanner
    // this method will return as soon as the scanner has started and continue to run in the background using setTimeout calls
    // the scanner is a very I/O constrained process and not very CPU intensive, so as long as you are not bottlenecking the CPU with
    // your own application logic there should be plenty of room for it to process
    console.log('Starting scanner')
    await flowScanner.start()

    // wait for interrupt signal
    await new Promise<void>(resolve => {
        // listen for SIGTERM to stop the scanner
        process.on('SIGTERM', () => {
            console.log('Received SIGTERM')
            resolve()
        })

        process.on('SIGINT', () => {
            console.log('Received SIGINT')
            resolve()
        })
    })

    // when you are ready to stop the scanner, you can call the stop() method
    console.log('Stopping scanner')
    await flowScanner.stop()
}

main()

async function getPrice(myStr: String){
    if (myStr.includes("A.eee6bdee2b2bdfc8.Basketballs.NFT")) {
    } else if (myStr.includes("false")) {
    } else if (myStr.includes("A.e4cf4bdc1751c65d.PackNFT.NFT")) {
    } else if (myStr.includes("NFTStorefrontV2")){
        var nameOfNft = myStr.split('.NFT"')[0].split('.').at(-1)
        var salePrice = myStr.split('salePrice":"')[1].split('000000"').at(0)

        if (myStr.includes('A.1654653399040a61.FlowToken.Vault')){
            var currency = "flow"
            console.log(myStr)
        } else if (myStr.includes('A.ead892083b3e2c6c.FlowUtilityToken')){
            var currency = "flow (dapper)"
        } else {
            currency = "usd"
        }

        var txId = myStr.split('"')[13]
        var tx = "https://flowscan.org/transaction/" + txId

        var message = nameOfNft + " purchased for " + salePrice + " " + currency
        console.log(message)
        sendToBot(message, tx)

    } else {
        if (myStr.includes('.NFT"')){
            var nameOfNft = myStr.split('.NFT"')[0].split('.').at(-1)
        } else {
            nameOfNft = "TopShot"    
        } 
        
        var price = Number(myStr.split('"')[27])
        var txId = myStr.split('"')[13]
        var tx = "https://flowscan.org/transaction/" + txId

        


        var message = nameOfNft + " purchased for " + price + " usd "
        
        if ((nameOfNft == "TopShot")||(nameOfNft == "UFC_NFT")||(nameOfNft == "AllDay")||(nameOfNft == "CricketMoments")){
            // console.log(message)
        } else{
            console.log(message)
            sendToBot(message, tx)
        }
        
        
    }
}

async function sendToBot(msg: string, tx: string) {
    const url: string = 'https://api.telegram.org/bot6270718207:AAE5IQqKKstM4XlUKCs8hlsrIYvPrqf38GM/sendMessage?parse_mode=HTML&chat_id=350436333&text=' + msg + '. <a href="' + tx + '">tx</a>'

    try {
        await axios.post(url);
        } catch (exception) {
        process.stderr.write(`ERROR received from ${url}: ${exception}\n`);
    }
}
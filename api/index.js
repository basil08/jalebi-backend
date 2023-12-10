import express from "express";
import { config } from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
config();

const app = express();


const PORT = process.env.PORT || 8080;

app.use(cors({ origin: "*" }))

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })


app.get('/', (req, res) => {
    return res.json({ health: "ok" });
});



const getHeaders = () => {
    return { "Authorization": `Bearer ${process.env.ONE_INCH_DEV_API_KEY}` }
}

app.get('/getTokenList', jsonParser, async (req, res) => {
    const chainId = req.chainId || 1; // chainId defaults to Ethereum

    const url = `https://api.1inch.dev/token/v1.2/${chainId}/token-list`;


    try {
        const resp = await fetch(url, {
            headers: getHeaders()
        });
        const data = await resp.json();
        if (resp.ok) {
            return res.json({ status: 0, data: { address: data.tokens.map(elem => elem.address), list: data.tokens.map((elem => [elem.symbol, elem.name].join(" - "))) } });
        } else {
            console.error(resp.error);
            return res.json({ status: 1, error: resp.error })
        }
    } catch (err) {
        console.error(err);
        return res.json({ status: 1, error: err })
    }
});


app.post("/getWalletBalances", jsonParser, urlencodedParser, async (req, res) => {
    const chainId = req.body.chainId || 1; // chainId defaults to Ethereum
    // buggy so defaults to Eth anyways
    const walletAddress = req.body.walletAddress;

    if (!walletAddress) {
        return res.json({ status: 1, error: "You need to specify a wallet adddress" });
    }

    const url = `https://api.1inch.dev/balance/v1.2/1/balances/${walletAddress}`;

    try {
        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            return res.json({ status: 0, data: data })
        } else {
            console.error(response.error);
            return res.json({ status: 1, error: response.error })
        }
    } catch (err) {
        console.error(err);
        return res.json({ status: 1, error: err })
    }

})



app.post("/getTokenInfo", jsonParser, async (req, res) => {
    console.log(req.body);

    const symbol = req.body.symbol;

    if (!symbol) {
        return res.json({ status: 1, error: "You need to specify a symbol" });
    }

    const url = `https://api.1inch.dev/token/v1.2/search?query=${symbol}`;

    try {
        const resp = await fetch(url, {
            headers: getHeaders()
        });
        if (resp.ok) {
            const data = await resp.json();
            console.log(data);
            return res.json({ status: 0, data: data[0] })
        } else {
            console.error(resp.error);
            return res.json({ status: 1, error: resp.error })
        }
    } catch (err) {
        console.error(err);
        return res.json({ status: 1, error: err })
    }
})


app.post('/getBestGasPrices', jsonParser, async (req, res) => {

    const chainId = req.body.chainId || 1;

    const Auth = Buffer.from(
        process.env.INFURA_API_KEY + ":" + process.env.INFURA_SECRET_KEY,
    ).toString("base64");

    try {
        const { data } = await fetch(
            `https://gas.api.infura.io/networks/${chainId}/suggestedGasFees`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${Auth}`,
                },
            },
        );
        console.log("Suggested gas fees:", data);
        return res.json({
            status: 0,
            data: data
        })
    } catch (error) {
        console.log("Server responded with:", error);
        return res.json({ status: 1, error: error })
    }
}
);

app.post('/getBaseFeeHistory', jsonParser, async (req, res) => {

    const chainId = req.body.chainId || 1;

    const Auth = Buffer.from(
        process.env.INFURA_API_KEY + ":" + process.env.INFURA_SECRET_KEY,
    ).toString("base64");

    try {
        const { data } = await fetch(
            `https://gas.api.infura.io/networks/${chainId}/baseFeeHistory`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${Auth}`,
                },
            },
        );

        // const res = await data.json();
        console.log("Gas history:", data);
        return res.json({
            status: 0,
            data: data
        })
    } catch (error) {
        console.log("Server responded with:", error);
        return res.json({ status: 1, error: error })
    }
}
);


app.get("/gas-price", async (req, res) => {
    try {
        const response = await fetch("https://api.1inch.dev/gas-price/v1.4/1", {
            method: "GET",
            headers: getHeaders()
        });
        // console.log(await response.json());
        const data = await response.json();
        return res.json({ status: 0, data: data });
    } catch (error) {
        console.error(error);
        res.json({ status: 1, message: "Error fetching gas prices" });
    }
});

app.post('/get-fusion-quote', urlencodedParser, jsonParser, async (req, res) => {
    const chainId = req.body.chainId || 1;

    const fromTokenAddress = req.body.fromTokenAddress
    const toTokenAddress = req.body.toTokenAddress;
    const amount = req.body.amount;
    const walletAddress = req.body.walletAddress;
    const enableEstimate = false;

    console.log(fromTokenAddress, toTokenAddress, amount, walletAddress);

    try {
        const response = await fetch(`https://api.1inch.dev/fusion/quoter/v1.0/${chainId}/quote/receive?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&walletAddress=${walletAddress}&enableEstimate=${enableEstimate}`, {
            method: "GET",
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            console.log(data);
            return res.json({ status: 0, data: data });
        } else {
            const err = await response.json();
            console.log(err);
            return res.json({ status: 1, error: err });
        }
    } catch (error) {
        console.error(error);
        res.json({ status: 1, message: "Error fetching quote data " })
    }
});

app.post("/place-order", async (req, res) => {

    // "order": {
    //     "salt": "string",
    //     "makerAsset": "string",
    //     "takerAsset": "string",
    //     "maker": "string",
    //     "receiver": "0x0000000000000000000000000000000000000000",
    //     "allowedSender": "string",
    //     "makingAmount": "string",
    //     "takingAmount": "string",
    //     "offsets": "0x",
    //     "interactions": "0"
    //   },
    //   "signature": "string",
    //   "quoteId": "string"

    const makerAsset = req.body.makerAsset;
    const takerAsset = req.body.takerAsset;
    const makingAmount = req.body.makingAmount;
    const takingAmount = req.body.takingAmount;
    const maker = req.body.maker;
    const quoteId = req.body.quoteId;
    const signature = req.body.signature;

    try {

        const url = "https://api.1inch.dev/fusion/relayer/v1.0/1/order/submit";
        const response = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                order: {
                    salt: process.env.SALT,
                    makerAsset: makerAsset,
                    takerAsset: takerAsset,
                    maker: maker,
                    makingAmount: makingAmount,
                    takingAmount: takingAmount,
                },
                signature: signature,
                quoteId: quoteId
            })

        });

        const data = await response.json();

        return res.json({ status: 0, data: "Your order was placed successfully!"});

    } catch(err) {
        console.error(err);
        return res.json({status: 1, error: err})
    }

});

export default app;

import express from "express";
import { config } from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
config();

const app = express();


const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    return res.json({ health: "ok" });
});


app.use(cors({ origin: "*"}))

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })



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
            return res.json({ status: 0, data: data.tokens.map((elem => [elem.symbol, elem.name].join(" - "))) });
        } else {
            console.error(resp.error);
            return res.json({ status: 1, error: resp.error })
        }
    } catch (err) {
        console.error(err);
        return res.json({ status: 1, error: err })
    }
});


app.get("/getWalletBalances", urlencodedParser, async (req, res) => {
    console.log(req.body);
    const chainId = req.body.chainId || 1; // chainId defaults to Ethereum
    const walletAddress = req.body.walletAddress;

    if (!walletAddress) {
        return res.json({ status: 1, error: "You need to specify a wallet adddress"});
    }

    const url = `https://api.1inch.dev/balance/v1.2/${chainId}/balances/${walletAddress}`;

    try {
        const resp = await fetch(url, {
            headers: getHeaders()
        });
        const data = await resp.json();
        console.log(data);
        if (resp.ok) {
            return res.json({ status: 0, data: data })
            // return res.json({ status: 0, data: data.tokens.map((elem => [elem.symbol, elem.name].join(" - "))) });
        } else {
            console.error(resp.error);
            return res.json({ status: 1, error: resp.error })
        }
    } catch (err) {
        console.error(err);
        return res.json({ status: 1, error: err })
    }

})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
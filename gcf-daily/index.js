"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coinbase_pro_1 = require("coinbase-pro");
const key = process.env.CBPRO_KEY || "";
const secret = process.env.CBPRO_SECRET || "";
const passphrase = process.env.CBPRO_PASSPHRASE || "";
const apiURI = "https://api.pro.coinbase.com";
const sandboxURI = "https://api-public.sandbox.pro.coinbase.com";
const authedClient = new coinbase_pro_1.AuthenticatedClient(key, secret, passphrase, sandboxURI);
exports.daily = (req, res) => {
    const order = {
        type: "market",
        side: "buy",
        product_id: "BTC-EUR",
        size: null,
        funds: "10"
    };
    authedClient.placeOrder(order).then(orderResult => {
        res.status(200).send(JSON.stringify(orderResult));
    });
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coinbase_pro_1 = require("coinbase-pro");
const key = process.env.CBPRO_KEY || "";
const secret = process.env.CBPRO_SECRET || "";
const passphrase = process.env.CBPRO_PASSPHRASE || "";
const funds = process.env.FUNDS || "";
const apiURI = "https://api.pro.coinbase.com";
const sandboxURI = "https://api-public.sandbox.pro.coinbase.com";
const authedClient = new coinbase_pro_1.AuthenticatedClient(key, secret, passphrase, apiURI);
exports.daily = async (req, res) => {
    const order = {
        type: "market",
        side: "buy",
        product_id: "BTC-EUR",
        size: null,
        funds
    };
    const cbProResponse = await authedClient.placeOrder(order);
    res.send(cbProResponse);
};

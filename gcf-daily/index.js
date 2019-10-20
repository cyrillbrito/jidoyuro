"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var coinbase_pro_1 = require("coinbase-pro");
var key = process.env.CBPRO_KEY;
var secret = process.env.CBPRO_SECRET;
var passphrase = process.env.CBPRO_PASSPHRASE;
var apiURI = "https://api.pro.coinbase.com";
var sandboxURI = "https://api-public.sandbox.pro.coinbase.com";
var authedClient = new coinbase_pro_1.AuthenticatedClient(key ? key : "", secret ? secret : "", passphrase ? passphrase : "", sandboxURI);
exports.daily = function (req, res) {
    var order = {
        type: "market",
        side: "buy",
        product_id: "BTC-EUR",
        size: null,
        funds: "10"
    };
    authedClient.placeOrder(order).then(function (orderResult) {
        res.status(200).send(JSON.stringify(orderResult));
    });
};

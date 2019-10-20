import { Request, Response } from "express";
import { AuthenticatedClient, MarketOrder } from "coinbase-pro";

const key = process.env.CBPRO_KEY;
const secret = process.env.CBPRO_SECRET;
const passphrase = process.env.CBPRO_PASSPHRASE;

const apiURI = "https://api.pro.coinbase.com";
const sandboxURI = "https://api-public.sandbox.pro.coinbase.com";

const authedClient = new AuthenticatedClient(
  key ? key : "",
  secret ? secret : "",
  passphrase ? passphrase : "",
  sandboxURI
);

exports.daily = (req: Request, res: Response) => {
  const order: MarketOrder = {
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

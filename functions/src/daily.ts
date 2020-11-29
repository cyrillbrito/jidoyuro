import * as functions from 'firebase-functions';
import { AuthenticatedClient, MarketOrder } from "coinbase-pro";

const key = process.env.CBPRO_KEY || "";
const secret = process.env.CBPRO_SECRET || "";
const passphrase = process.env.CBPRO_PASSPHRASE || "";
const funds = process.env.FUNDS || "";

const apiURI = "https://api.pro.coinbase.com";
// const sandboxURI = "https://api-public.sandbox.pro.coinbase.com";

const authedClient = new AuthenticatedClient(
  key,
  secret,
  passphrase,
  apiURI
);

export const daily = functions.https.onRequest(async (req, res) => {

  const order: MarketOrder = {
    type: "market",
    side: "buy",
    product_id: "BTC-EUR",
    size: null,
    funds
  };

  const cbProResponse = await authedClient.placeOrder(order);

  res.send(cbProResponse);
});

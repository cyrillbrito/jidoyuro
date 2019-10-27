import * as express from "express";
import * as puppeteer from "puppeteer";
import * as ynab from "ynab";

interface Movement {
  date1: string;
  date2: string;
  description: string;
  amount: number;
  amount2: string;
}

const mbcpUserCode = process.env.MBCP_USER_CODE || "";
const mbcpAccessCode = process.env.MBCP_ACCESS_CODE || "";
const ynabAccessToken = process.env.YNAB_ACCESS_TOKEN || "";
const ynabAccountId = process.env.YNAB_ACCOUNT_ID || "";

const browserPromise = puppeteer.launch({
  headless: false,
  // defaultViewport: { width: 900, height: 900 },
  args: ["--no-sandbox"]
});

const ynabApi = new ynab.API(ynabAccessToken);

let page: puppeteer.Page;

// (async function() {
exports.ynab = async (req: express.Request, res: express.Response) => {

  // all: 19922.161ms
  // all: 22837.539ms ??
  console.time('all');

  const browser = await browserPromise;
  const browserContext = await browser.createIncognitoBrowserContext();
  page = await browserContext.newPage();

  sReport("open-login");
  await page.goto("https://ind.millenniumbcp.pt/_layouts/BCP.SDC.FEP.Foundation.Presentation/Login.aspx");
  await eReport();

  sReport("cookies");
  await page.click("#btnAcceptS1CookiesV2");
  await eReport();

  sReport("fill-user-code");
  await page.$eval("#TextBoxLogin_txField", (el: any, userCode) => el.value = userCode, mbcpUserCode);
  await eReport();

  sReport("open-access-code");
  await page.click("#btnPositions");
  await eReport();

  sReport("wait-a-bit");
  await page.waitFor(3000);
  await eReport();

  sReport("fill-access-code");
  for (let i = 1; i < 4; i++) {
    const lblHandle = await page.$("#lblPosition_" + i);
    if (!lblHandle) {
      return;
    }
    const lbl = await lblHandle.evaluate(el => el.textContent);
    if (!lbl) {
      return;
    }
    const pos = +lbl.charAt(0) - 1;
    const code = mbcpAccessCode.charAt(pos);

    const txtHandle = await page.$("#txtPosition_" + i);
    if (!txtHandle) {
      return;
    }
    await txtHandle.evaluate((el: any, code) => (el.value = code), code);
  }
  await eReport();

  sReport("click-validate");
  await page.click("#btnValidate");
  await eReport();

  sReport("wait-more-moves");
  await page.waitForSelector(
    "#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos"
  );
  await eReport();

  sReport("click-more-moves");
  await page.click(
    "#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos"
  );
  await eReport();

  sReport("wait-csv");
  await page.waitForSelector(
    "#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements"
  );
  await eReport();

  sReport("wait-a-bit-cenas");
  await page.waitFor(3000);
  await eReport();

  sReport("read-movements");
  const table = await page.$(
    "#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements"
  );
  if (!table) {
    return;
  }
  let movements = await table.evaluate(t => {
    const tbody = t.childNodes[1];

    const all: Movement[] = [];
    for (let i = 1; i < tbody.childNodes.length - 1; i++) {
      const itemNode = tbody.childNodes[i];
      all.push({
        date1: itemNode.childNodes[1] ? (itemNode.childNodes[1].textContent || "").trim() : "",
        date2: itemNode.childNodes[2] ? (itemNode.childNodes[2].textContent || "").trim() : "",
        description: itemNode.childNodes[3] ? (itemNode.childNodes[3].textContent || "").trim() : "",
        amount: itemNode.childNodes[4]
          ? +(itemNode.childNodes[4].textContent || "")
            .trim()
            .replace(".", "")
            .replace(",", ".")
          : 0,
        amount2: itemNode.childNodes[4] ? (itemNode.childNodes[4].textContent || "").trim() : "--22"
      });
    }

    return all;
  });

  console.log(JSON.stringify(movements));
  await eReport();

  movements = [...movements, ...movements, ...movements];

  const transactions: ynab.SaveTransaction[] = [];
  for (const movement of movements) {
    const importNumber =
      transactions.filter(
        t => t.date === movement.date1 && t.payee_name === movement.description && t.amount === movement.amount
      ).length + 1;
    transactions.push({
      account_id: ynabAccountId,
      date: movement.date1,
      amount: movement.amount,
      payee_name: movement.description,
      cleared: ynab.SaveTransaction.ClearedEnum.Cleared,
      import_id: `${movement.date1}:${movement.description}:${movement.amount}:${importNumber}`
    });
  }

  res.send(transactions);

  console.timeEnd('all');

  // ynabApi.transactions.createTransactions("default", { transactions: transactions });

  // await browserContext.close();
};
// })();

let report: string;
let reportNumber = 0;

function sReport(s: string): void {
  report = s;
  console.log("[S]", s);
}

async function eReport(): Promise<void> {
  console.log("[E]", report);
  await page.screenshot({ path: reportNumber + "-" + report + ".png" });
  reportNumber++;
}

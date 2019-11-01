import * as express from 'express';
import * as puppeteer from 'puppeteer';
import * as ynab from 'ynab';

interface Movement {
  date: string;
  description: string;
  amount: string;
  balance: string;
}

const mbcpUserCode = process.env.MBCP_USER_CODE || '';
const mbcpAccessCode = process.env.MBCP_ACCESS_CODE || '';
const ynabAccessToken = process.env.YNAB_ACCESS_TOKEN || '';
const ynabBudgetId = process.env.YNAB_BUDGET_ID || '';
const ynabAccountId = process.env.YNAB_ACCOUNT_ID || '';

const browserPromise = puppeteer.launch({
  args: ['--no-sandbox']
});

const ynabApi = new ynab.API(ynabAccessToken);

let page: puppeteer.Page;

exports.ynab = async (req: express.Request, res: express.Response) => {

  const browser = await browserPromise;
  const browserContext = await browser.createIncognitoBrowserContext();
  page = await browserContext.newPage();

  sReport('open-login');
  await page.goto('https://ind.millenniumbcp.pt/_layouts/BCP.SDC.FEP.Foundation.Presentation/Login.aspx');
  await eReport();

  sReport('cookies');
  await page.click('#btnAcceptS1CookiesV2');
  await eReport();

  sReport('fill-user-code');
  await page.$eval('#TextBoxLogin_txField', (el: any, userCode) => el.value = userCode, mbcpUserCode);
  await eReport();

  sReport('open-access-code');
  await page.click('#btnPositions');
  await eReport();

  sReport('wait-for-labels');
  await page.waitForSelector('#lblPosition_1');
  await eReport();

  sReport('fill-access-code');
  for (let i = 1; i < 4; i++) {
    const lbl = await page.$eval('#lblPosition_' + i, el => el.textContent);
    if (!lbl) {
      return;
    }
    const pos = +lbl.charAt(0) - 1;
    const code = mbcpAccessCode.charAt(pos);
    await page.$eval('#txtPosition_' + i, (el: any, code) => { el.value = code }, code);
  }
  await eReport();

  sReport('click-validate');
  await page.click('#btnValidate');
  await eReport();

  sReport('wait-more-movements');
  await page.waitForSelector('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos');
  await eReport();

  sReport('click-more-movements');
  await page.click('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos');
  await eReport();

  sReport('wait-movements');
  await page.waitForSelector('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements');
  await eReport();

  sReport('read-movements');
  const movements = await page.$eval('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements tbody', tbody => {
    const movements: Movement[] = [];
    for (let i = 1; i < tbody.childNodes.length - 1; i++) {
      const cells = tbody.childNodes[i].childNodes;
      movements.push({
        date: (cells[1].textContent || "").trim(),
        description: (cells[3].textContent || "").trim(),
        amount: (cells[4].textContent || "").trim(),
        balance: (cells[5].textContent || "").trim()
      });
    }
    return movements;
  });
  await eReport();


  sReport('map-movements');
  const transactions: ynab.SaveTransaction[] = [];
  for (const movement of movements) {

    movement.date = movement.date.substring(6, 10) + movement.date.substring(2, 6) + movement.date.substring(0, 2);

    const iidDate = movement.date.replace(/-/g, '');
    const iidDescription = movement.description.replace(/[^A-Za-z]|COMPRA|CONTACTLESS/g, '');
    const iidAmount = movement.amount.replace(/\.|,/g, '');
    const iidBalance = movement.balance.replace(/\.|,/g, '');

    transactions.push({
      account_id: ynabAccountId,
      date: movement.date,
      amount: +iidAmount * 10,
      payee_name: movement.description,
      cleared: ynab.SaveTransaction.ClearedEnum.Cleared,
      import_id: `${iidDate}${iidAmount}${iidBalance}${iidDescription}`.substring(0, 36)
    });
  }
  await eReport();

  sReport('send-ynab');
  let response;
  try {
    response = await ynabApi.transactions.createTransactions(ynabBudgetId, { transactions: transactions });
  } catch (e) {
    console.log(e);
  }
  await eReport();

  res.send({ movements, transactions, response });

  await browserContext.close();
};

let report: string;
let reportNumber = 0;

function sReport(s: string): void {
  report = s;
  console.log('[S]', s);
}

async function eReport(): Promise<void> {
  console.log('[E]', report);
  // await page.screenshot({ path: reportNumber + '-' + report + '.png' });
  reportNumber++;
}

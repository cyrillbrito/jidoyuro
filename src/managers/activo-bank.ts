import { launchChromium } from 'playwright-aws-lambda';
import { SaveTransactionsResponseData } from 'ynab';
import { GetEnvBoolean, GetEnvString } from './environment';
import { BankMovement, CreateYnabTransactions } from './ynab';


export async function AbImport(): Promise<SaveTransactionsResponseData> {

  const debug = await GetEnvBoolean('debug');

  // Browser initialization
  const options = debug ? { headless: false, slowMo: 100 } : {};
  const browser = await launchChromium(options);
  const context = await browser.newContext();
  const page = await context.newPage();

  // Open login page
  await page.goto('https://ind.activobank.pt/_loginV2/BlueMainLoginCdm.aspx?ReturnUrl=https%3a%2f%2find.activobank.pt%2fpt%2fprivate%2fdia-a-dia%2fPages%2fdia-a-dia.aspx')

  // Fill user code
  const userCode = await GetEnvString('activo-bank-user-code');
  await page.fill('#BlueMainLoginControlCdm1_txtUserCode', userCode);
  await page.press('#lnkBtnShort', 'Enter');

  // Fill multichannel code
  await page.waitForSelector('#BlueMainLoginControlCdm1_lbl_1_position');
  const multichannelCode = await GetEnvString('activo-bank-multichannel-code');
  for (let i = 1; i <= 3; i++) {

    const labelElement = await page.$(`#BlueMainLoginControlCdm1_lbl_${i}_position`);
    const label = await labelElement?.textContent();

    if (!label) { return; }

    const pos = +label[0] - 1;
    const n = multichannelCode[pos];

    await page.fill(`#BlueMainLoginControlCdm1_txt_${i}_position`, n.toString());
  }

  // Press login
  await page.press('#lnkBtnLogOn', 'Enter');

  // Skip modal
  await page.waitForSelector('#_lnkBtnConfirm');
  await page.press('#_lnkBtnConfirm', 'Enter');

  // Read table
  await page.waitForSelector('#ctl02_gvMoviments');
  const trs = await page.$$(`#ctl02_gvMoviments tbody tr`);
  const bankMovements: BankMovement[] = [];

  // Parse each line of the table
  for (const tr of trs) {

    const tds = await tr.$$('td');

    bankMovements.push({
      date: parseDate(await tds[0].innerText()),
      description: await tds[2].innerText(),
      amount: parseNumber(await tds[3].innerText()),
      balance: parseNumber(await tds[4].innerText()),
    });
  }

  // Insert movements on YNAB
  const accountId = await GetEnvString('ynab-account-id');
  const response = await CreateYnabTransactions(bankMovements, accountId);

  await browser.close();

  return response;
}

function parseDate(s: string): Date {
  const ss = s.split('/');
  const year = Number(ss[2]);
  const month = Number(ss[1]) - 1;
  const date = Number(ss[0]);
  return new Date(year, month, date);
}

function parseNumber(s: string): number {
  return Number(s.replace('.', '').replace(',', '.'));
}


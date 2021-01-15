import { chromium } from 'playwright-chromium';
import { Configuration } from './configuration';
import { BankMovement, Ynab } from './ynab';

export class BcpImporter {

  constructor(
    private config: Configuration,
    private ynab: Ynab,
  ) { }

  public async import(): Promise<any> {

    const debug = await this.config.getBoolean('debug');

    // Browser initialization
    const options = debug ? { headless: false, slowMo: 100 } : {};
    const browser = await chromium.launch(options);
    const context = await browser.newContext();
    const page = await context.newPage();

    // Open login page
    await page.goto('https://ind.millenniumbcp.pt/_layouts/BCP.SDC.FEP.Foundation.Presentation/Login.aspx');

    // Accepts cookies
    await page.click('#btnAcceptS1CookiesV2');

    // Fill user code
    const userCode = await this.config.get('bcp-user-code');
    await page.fill('#TextBoxLogin_txField', userCode);
    await page.press('#btnPositions', 'Enter');

    // Fill multichannel code
    await page.waitForSelector('#lblPosition_1');
    const multichannelCode = await this.config.get('bcp-multichannel-code');
    for (let i = 1; i <= 3; i++) {

      const labelElement = await page.$(`#lblPosition_${i}`);
      const label = await labelElement?.textContent();

      if (!label) { return; }

      const pos = +label[0] - 1;
      const n = multichannelCode[pos];

      await page.fill(`#txtPosition_${i}`, n.toString());
    }

    // Press login
    await page.press('#btnValidate', 'Enter');

    // Click more movements
    await page.waitForSelector('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos');
    await page.click('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos');

    // Read table
    await page.waitForSelector('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements');
    const trs = await page.$$(`#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements tbody tr`);
    const bankMovements: BankMovement[] = [];

    // Parse each line of the table
    for (const tr of trs) {

      // Skip the first tr because it is the header
      if (tr === trs[0]) { continue }

      const tds = await tr.$$('td');

      bankMovements.push({
        date: this.parseDate(await tds[0].innerText()),
        description: await tds[2].innerText(),
        amount: this.parseNumber(await tds[3].innerText()),
        balance: this.parseNumber(await tds[4].innerText()),
      });
    }

    // Insert movements on YNAB
    const accountId = await this.config.get('ynab-bcp-account-id');
    const response = await this.ynab.createTransactions(bankMovements, accountId);

    await browser.close();

    return response;
  }

  private parseDate(s: string): Date {
    const ss = s.split('-');
    const year = Number(ss[2]);
    const month = Number(ss[1]) - 1;
    const date = Number(ss[0]);
    return new Date(year, month, date);
  }

  private parseNumber(s: string): number {
    return Number(s.replace('.', '').replace(',', '.'));
  }
}

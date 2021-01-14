import { chromium } from 'playwright-chromium';
import { Configuration } from './configuration';
import { BankMovement, Ynab } from './ynab';

export class ActivoImporter {

  constructor(
    private config: Configuration,
    private ynab: Ynab,
  ) { }

  public async import(): Promise<any> {

    const debug = await this.config.get('debug');

    // Browser initialization
    const options = debug ? { headless: false, slowMo: 100 } : {};
    const browser = await chromium.launch(options);
    const context = await browser.newContext();
    const page = await context.newPage();

    // Open login page
    await page.goto('https://ind.activobank.pt/_loginV2/BlueMainLoginCdm.aspx?ReturnUrl=https%3a%2f%2find.activobank.pt%2fpt%2fprivate%2fdia-a-dia%2fPages%2fdia-a-dia.aspx')

    const userCode = await this.config.get('activo-bank-user-code');

    // Fill user code
    await page.fill('#BlueMainLoginControlCdm1_txtUserCode', userCode);
    await page.press('#lnkBtnShort', 'Enter');

    // Fill multichannel code
    await page.waitForSelector('#BlueMainLoginControlCdm1_lbl_1_position');
    const multichannelCode = await this.config.get('activo-bank-multichannel-code');
    for (let i = 1; i <= 3; i++) {

      const labelElement = await page.$(`#BlueMainLoginControlCdm1_lbl_${i}_position`);
      const label = await labelElement?.textContent();

      if (!label) { return; }

      const multichannelPos = +label.charAt(0) - 1;
      const n = multichannelCode[multichannelPos];

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
        date: this.parseDate(await tds[0].innerText()),
        description: await tds[2].innerText(),
        amount: this.parseNumber(await tds[3].innerText()),
        balance: this.parseNumber(await tds[4].innerText()),
      });
    }

    // Insert movements on YNAB
    const response = await this.ynab.createTransactions(bankMovements);

    await browser.close();

    return response;
  }

  private parseDate(s: string): Date {
    const ss = s.split('/');
    const year = Number(ss[2]);
    const month = Number(ss[1]) - 1;
    const date = Number(ss[0]);
    return new Date(year, month, date);
  }

  private parseNumber(s: string): number {
    return Number(s.replace('.', '').replace(',', '.'));
  }
}

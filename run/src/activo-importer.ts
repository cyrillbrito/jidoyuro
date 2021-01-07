import { chromium, ElementHandle, Page } from 'playwright';
import { BankMovement, JidoyuroYnab, JidoyuroYnabConfig } from 'jidoyuro-ynab';

export interface Config {
  userCode: string;
  multichannelCode: string;
  debug?: boolean;
  ynab: JidoyuroYnabConfig;
}

export class ActivoImporter {

  private ynab: JidoyuroYnab;

  constructor(private config: Config) {
    this.ynab = new JidoyuroYnab(this.config.ynab);
  }

  public async import(): Promise<void> {

    // Browser initialization
    const options = this.config.debug ? { headless: false, slowMo: 100 } : {};
    const browser = await chromium.launch(options);
    const context = await browser.newContext();
    const page = await context.newPage();

    // Open login page
    await page.goto('https://ind.activobank.pt/_loginV2/BlueMainLoginCdm.aspx?ReturnUrl=https%3a%2f%2find.activobank.pt%2fpt%2fprivate%2fdia-a-dia%2fPages%2fdia-a-dia.aspx')

    // Fill user code
    await page.fill('#BlueMainLoginControlCdm1_txtUserCode', this.config.userCode);
    await page.press('#lnkBtnShort', 'Enter');

    await page.waitForTimeout(3000);

    for (let i = 1; i <= 3; i++) {
      const labelElement = await page.$(`#BlueMainLoginControlCdm1_lbl_${i}_position`);
      const label = await labelElement?.textContent();

      if (!label) { return; }

      const multichannelPos = +label.charAt(0) - 1;
      const n = this.config.multichannelCode[multichannelPos];
      await page.fill(`#BlueMainLoginControlCdm1_txt_${i}_position`, n.toString());
    }

    await page.waitForTimeout(3000);

    await page.press('#lnkBtnLogOn', 'Enter');

    await page.waitForTimeout(5000);

    await page.press('#_lnkBtnConfirm', 'Enter');

    await page.waitForTimeout(8000);

    const trs = await page.$$(`#ctl02_gvMoviments tbody tr`);
    const bankMovements: BankMovement[] = [];

    for (const tr of trs) {

      const tds = await tr.$$('td');

      console.log(await tds[0].innerText());

      bankMovements.push({
        date: this.parseDate(await tds[0].innerText()),
        description: await tds[2].innerText(),
        amount: this.parseNumber(await tds[3].innerText()),
        balance: this.parseNumber(await tds[4].innerText()),
      });
    }


    console.log('bm', JSON.stringify(bankMovements));

    this.ynab.createTransactions(bankMovements);



    await browser.close();
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

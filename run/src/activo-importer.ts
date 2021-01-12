import { webkit } from 'playwright-webkit';
import { BankMovement, JidoyuroYnab, JidoyuroYnabConfig } from './ynab';

export interface ActivoImporterConfig {
  userCode: string;
  multichannelCode: string;
  debug?: boolean;
  ynab: JidoyuroYnabConfig;
}

export class ActivoImporter {

  private ynab: JidoyuroYnab;

  constructor(private config: ActivoImporterConfig) {
    this.ynab = new JidoyuroYnab(this.config.ynab);
  }

  public async import(): Promise<void> {

    console.log('traceeee', 1, this.config);

    // Browser initialization
    const options = this.config.debug ? { headless: false, slowMo: 100 } : {};
    console.log('traceeee', 1.1);
    const browser = await webkit.launch(options);
    console.log('traceeee', 1.2);
    const context = await browser.newContext();
    console.log('traceeee', 1.3);
    const page = await context.newPage();

    console.log('traceeee', 2);

    // Open login page
    await page.goto('https://ind.activobank.pt/_loginV2/BlueMainLoginCdm.aspx?ReturnUrl=https%3a%2f%2find.activobank.pt%2fpt%2fprivate%2fdia-a-dia%2fPages%2fdia-a-dia.aspx')

    console.log('traceeee', 3);

    // Fill user code
    await page.fill('#BlueMainLoginControlCdm1_txtUserCode', this.config.userCode);

    console.log('traceeee', 4);

    await page.press('#lnkBtnShort', 'Enter');

    console.log('traceeee', 5);

    // Fill multichannel code
    await page.waitForSelector('#BlueMainLoginControlCdm1_lbl_1_position');
    console.log('traceeee', 6);

    for (let i = 1; i <= 3; i++) {

      console.log('traceeee', 7, i);

      const labelElement = await page.$(`#BlueMainLoginControlCdm1_lbl_${i}_position`);
      const label = await labelElement?.textContent();

      if (!label) { return; }


      console.log('traceeee', 8, i);


      const multichannelPos = +label.charAt(0) - 1;
      const n = this.config.multichannelCode[multichannelPos];

      console.log('traceeee', 9, i);

      await page.fill(`#BlueMainLoginControlCdm1_txt_${i}_position`, n.toString());
    }

    console.log('traceeee', 10);

    // Press login
    await page.press('#lnkBtnLogOn', 'Enter');

    console.log('traceeee', 11);

    // Skip modal
    await page.waitForSelector('#_lnkBtnConfirm');
    await page.press('#_lnkBtnConfirm', 'Enter');

    console.log('traceeee', 12);

    // Read table
    await page.waitForSelector('#ctl02_gvMoviments');
    const trs = await page.$$(`#ctl02_gvMoviments tbody tr`);
    const bankMovements: BankMovement[] = [];

    console.log('traceeee', 13);

    // Parse each line of the table
    for (const tr of trs) {

      console.log('traceeee', 14);

      const tds = await tr.$$('td');
      bankMovements.push({
        date: this.parseDate(await tds[0].innerText()),
        description: await tds[2].innerText(),
        amount: this.parseNumber(await tds[3].innerText()),
        balance: this.parseNumber(await tds[4].innerText()),
      });

      console.log('traceeee', 15);

    }

    console.log('traceeee', 16);

    // Insert movements on YNAB
    this.ynab.createTransactions(bankMovements);

    console.log('traceeee', 17);


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

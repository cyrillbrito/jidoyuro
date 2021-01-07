import { chromium, ElementHandle, Page } from 'playwright';

export interface Config {
  userCode: string;
  multichannelCode: string;
  debug?: boolean;
}

export class ActivoImporter {

  constructor(private config: Config) { }

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

    await page.waitForTimeout(5000);

    const trs = await page.$$(`#ctl02_gvMoviments tbody tr`);
    const table: string[][] = [];

    for (const tr of trs) {

      const tds = await tr.$$('td');
      const line: string[] = [];
      table.push(line);

      for (const td of tds) {
        const text = await td.textContent() ?? '';
        line.push(text);
      }
    }

    console.log(JSON.stringify(table));

    await browser.close();
  }
}

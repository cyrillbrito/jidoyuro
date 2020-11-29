import * as puppeteer from 'puppeteer';
import * as ynab from 'ynab';
import { YnabConfig } from './config';
import { Movement } from './movement';

export class YnabImporter {

  private browserPromise: Promise<puppeteer.Browser>;
  private ynabApi: ynab.API;
  //@ts-ignore
  private page: puppeteer.Page;

  constructor(private config: YnabConfig) {

    const options = config.debug ? { headless: false } : { args: ['--no-sandbox'] };
    this.browserPromise = puppeteer.launch(options);

    this.ynabApi = new ynab.API(this.config.ynab.access_token);
  }

  public async call(): Promise<ynab.SaveTransactionsResponse | undefined> {

    const browser = await this.browserPromise;
    const browserContext = await browser.createIncognitoBrowserContext();
    this.page = await browserContext.newPage();

    this.sReport('open-login');
    await this.page.goto('https://ind.millenniumbcp.pt/_layouts/BCP.SDC.FEP.Foundation.Presentation/Login.aspx');
    await this.eReport();

    this.sReport('cookies');
    await this.page.click('#btnAcceptS1CookiesV2');
    await this.eReport();

    await this.page.waitForTimeout(1000);

    this.sReport('fill-user-code');
    await this.page.$eval('#TextBoxLogin_txField', (el: any, userCode: any) => el.value = userCode, this.config.mbcp.user);
    await this.eReport();

    this.sReport('open-access-code');
    await this.page.click('#btnPositions');
    await this.eReport();

    this.sReport('wait-for-labels');
    await this.page.waitForSelector('#lblPosition_1');
    await this.eReport();

    this.sReport('fill-access-code');
    for (let i = 1; i < 4; i++) {
      const lbl = await this.page.$eval('#lblPosition_' + i, el => el.textContent);
      if (!lbl) {
        return;
      }
      const pos = +lbl.charAt(0) - 1;
      const code = this.config.mbcp.code.charAt(pos);
      await this.page.$eval('#txtPosition_' + i, (el: any, code2: any) => { el.value = code2 }, code);
    }
    await this.eReport();

    this.sReport('click-validate');
    await this.page.click('#btnValidate');
    await this.eReport();

    this.sReport('wait-more-movements');
    await this.page.waitForSelector('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos');
    await this.eReport();

    this.sReport('click-more-movements');
    await this.page.click('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos');
    await this.eReport();

    this.sReport('wait-movements');
    await this.page.waitForSelector('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements');
    await this.eReport();

    this.sReport('read-movements');
    const movements = await this.page.$eval('#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements tbody', (tbody: any) => {
      const movements2: Movement[] = [];
      for (let i = 1; i < tbody.childNodes.length - 1; i++) {
        const cells = tbody.childNodes[i].childNodes;
        movements2.push({
          date: (cells[1].textContent || "").trim(),
          description: (cells[3].textContent || "").trim(),
          amount: (cells[4].textContent || "").trim(),
          balance: (cells[5].textContent || "").trim(),
        });
      }
      return movements2;
    });
    await this.eReport();


    this.sReport('map-movements');
    const transactions: ynab.SaveTransaction[] = [];
    for (const movement of movements) {

      movement.date = movement.date.substring(6, 10) + movement.date.substring(2, 6) + movement.date.substring(0, 2);

      // Fresh budget
      if (new Date(movement.date) < new Date(2020, 11, 1)) { continue; }

      const iidDate = movement.date.replace(/-/g, '');
      const iidDescription = movement.description.replace(/[^A-Za-z]|COMPRA|CONTACTLESS/g, '');
      const iidAmount = movement.amount.replace(/\.|,/g, '');
      const iidBalance = movement.balance.replace(/\.|,/g, '');

      console.log(movement.date);

      transactions.push({
        account_id: this.config.ynab.account_id,
        date: movement.date,
        amount: +iidAmount * 10,
        payee_name: movement.description,
        cleared: ynab.SaveTransaction.ClearedEnum.Cleared,
        import_id: `${iidDate}${iidAmount}${iidBalance}${iidDescription}`.substring(0, 36),
      });
    }
    await this.eReport();

    this.sReport('send-ynab');
    let response;
    try {
      response = await this.ynabApi.transactions.createTransactions(this.config.ynab.budget_id, { transactions: transactions });
    } catch (e) {
      console.log(e);
    }
    await this.eReport();

    await browserContext.close();

    return response;
  }

  // @ts-ignore
  private report: string;
  // @ts-ignore
  private reportNumber = 0;

  private sReport(s: string): void {
    this.report = s;
    console.log('[S]', s);
  }

  private async eReport(): Promise<void> {
    console.log('[E]', this.report);
    if (this.config.debug) {
      await this.page.screenshot({ path: this.reportNumber + '-' + this.report + '.png' });
    }
    this.reportNumber++;
  }
}



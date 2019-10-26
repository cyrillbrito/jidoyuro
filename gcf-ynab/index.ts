import { launch, Page } from "puppeteer";

interface Movement {
  date1: string;
  date2: string;
  description: string;
  amount: number;
}

const userCode = process.env.MBCP_USERCODE || "";
const accessCode = process.env.MBCP_ACCESSCODE || "";

let page: Page;
(async function() {
  const browser = await launch({ headless: true, defaultViewport: { width: 800, height: 800 } });
  page = await browser.newPage();

  sReport("open-login");
  await page.goto("https://ind.millenniumbcp.pt/_layouts/BCP.SDC.FEP.Foundation.Presentation/Login.aspx");
  await eReport();

  sReport("fill-user-code");
  await page.$eval("#TextBoxLogin_txField", (el: any, userCode) => (el.value = userCode), userCode);
  await eReport();

  sReport("open-access-code");
  await page.click("#btnPositions");
  await eReport();

  sReport("wait-a-bit");
  await page.waitFor(8000);
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
    const code = accessCode.charAt(pos);

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
  const inner = await table.evaluate(t => {
    const tbody = t.childNodes[1];

    const all: Movement[] = [];
    tbody.childNodes.forEach(itemNode => {
      all.push({
        date1: itemNode.childNodes[1] ? (itemNode.childNodes[1].textContent || "").trim() : "",
        date2: itemNode.childNodes[2] ? (itemNode.childNodes[2].textContent || "").trim() : "",
        description: itemNode.childNodes[3] ? (itemNode.childNodes[3].textContent || "").trim() : "",
        amount: itemNode.childNodes[4] ? +(itemNode.childNodes[4].textContent || "").trim() : 0
      });
    });

    return all;
  });

  console.log(JSON.stringify(inner));
  await eReport();

  await browser.close();
})();

let report: string;
let reportNumber = 0;

function sReport(s: string): void {
  report = s;
  console.log("[S]", s);
}

async function eReport(): Promise<void> {
  console.log("[E]", report);
  // await page.screenshot({ path: reportNumber + "-" + report + ".png" });
  reportNumber++;
}

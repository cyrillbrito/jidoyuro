"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require("puppeteer");
const ynab = require("ynab");
const mbcpUserCode = process.env.MBCP_USER_CODE || "";
const mbcpAccessCode = process.env.MBCP_ACCESS_CODE || "";
const ynabAccessToken = process.env.YNAB_ACCESS_TOKEN || "";
const ynabAccountId = process.env.YNAB_ACCOUNT_ID || "";
const browserPromise = puppeteer.launch({
    args: ["--no-sandbox"]
});
const ynabApi = new ynab.API(ynabAccessToken);
let page;
exports.ynab = async (req, res) => {
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
    await page.$eval("#TextBoxLogin_txField", (el, userCode) => el.value = userCode, mbcpUserCode);
    await eReport();
    sReport("open-access-code");
    await page.click("#btnPositions");
    await eReport();
    sReport("wait-for-labels");
    await page.waitForSelector("#lblPosition_1");
    await eReport();
    sReport("fill-access-code");
    for (let i = 1; i < 4; i++) {
        const lbl = await page.$eval("#lblPosition_" + i, el => el.textContent);
        if (!lbl) {
            return;
        }
        const pos = +lbl.charAt(0) - 1;
        const code = mbcpAccessCode.charAt(pos);
        await page.$eval("#txtPosition_" + i, (el, code) => { el.value = code; }, code);
    }
    await eReport();
    sReport("click-validate");
    await page.click("#btnValidate");
    await eReport();
    sReport("wait-more-movements");
    await page.waitForSelector("#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos");
    await eReport();
    sReport("click-more-movements");
    await page.click("#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos");
    await eReport();
    sReport("wait-movements");
    await page.waitForSelector("#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements");
    await eReport();
    sReport("read-movements");
    let movements = await page.$eval("#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements tbody", tbody => {
        const movements = [];
        for (let i = 1; i < tbody.childNodes.length - 1; i++) {
            const cells = tbody.childNodes[i].childNodes;
            movements.push({
                date1: (cells[1].textContent || "").trim(),
                date2: (cells[2].textContent || "").trim(),
                description: (cells[3].textContent || "").trim(),
                amount: +(cells[4].textContent || "").trim().replace(".", "").replace(",", ".")
            });
        }
        return movements;
    });
    await eReport();
    movements = [...movements, ...movements, ...movements];
    sReport("map-movements");
    const transactions = [];
    for (const movement of movements) {
        const importNumber = transactions.filter(t => t.date === movement.date1 && t.payee_name === movement.description && t.amount === movement.amount).length + 1;
        transactions.push({
            account_id: ynabAccountId,
            date: movement.date1,
            amount: movement.amount,
            payee_name: movement.description,
            cleared: ynab.SaveTransaction.ClearedEnum.Cleared,
            import_id: `${movement.date1}:${movement.description}:${movement.amount}:${importNumber}`
        });
    }
    await eReport();
    sReport("send-ynab");
    const response = await ynabApi.transactions.createTransactions("default", { transactions: transactions });
    await eReport();
    res.send({ transactions, response });
    await browserContext.close();
};
let report;
let reportNumber = 0;
function sReport(s) {
    report = s;
    console.log("[S]", s);
}
async function eReport() {
    console.log("[E]", report);
    // await page.screenshot({ path: reportNumber + "-" + report + ".png" });
    reportNumber++;
}

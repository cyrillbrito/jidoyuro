"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("puppeteer");
const userCode = process.env.MBCP_USERCODE || "";
const accessCode = process.env.MBCP_ACCESSCODE || "";
const browserPromise = puppeteer_1.launch({
    headless: true,
    defaultViewport: { width: 800, height: 800 },
    args: ["--no-sandbox"]
});
const url = "https://ind.millenniumbcp.pt/_layouts/BCP.SDC.FEP.Foundation.Presentation/Login.aspx";
// let page: Page;
// (async function() {
exports.ynab = async (req, res) => {
    const browser = await browserPromise;
    const browserContext = await browser.createIncognitoBrowserContext();
    const page = await browserContext.newPage();
    sReport("open-login");
    await page.goto("http://ind.millenniumbcp.pt/");
    // await page.goto("https://ind.millenniumbcp.pt/");
    await page.goto(url);
    await eReport();
    sReport("fill-user-code");
    await page.$eval("#TextBoxLogin_txField", (el, userCode) => (el.value = userCode), userCode);
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
        await txtHandle.evaluate((el, code) => (el.value = code), code);
    }
    await eReport();
    sReport("click-validate");
    await page.click("#btnValidate");
    await eReport();
    sReport("wait-more-moves");
    await page.waitForSelector("#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos");
    await eReport();
    sReport("click-more-moves");
    await page.click("#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_UltimosMovimentos_divOperationInfo_hlMaisMovimentos");
    await eReport();
    sReport("wait-csv");
    await page.waitForSelector("#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements");
    await eReport();
    sReport("wait-a-bit-cenas");
    await page.waitFor(3000);
    await eReport();
    sReport("read-movements");
    const table = await page.$("#ctl00_ctl00_PlaceHolderMainBase_PlaceHolderMain__bcpTransactionContainer_ctl01_divOperationInfo_gridMovements");
    if (!table) {
        return;
    }
    const inner = await table.evaluate(t => {
        const tbody = t.childNodes[1];
        const all = [];
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
    res.send(inner);
    await eReport();
    await browserContext.close();
};
// })();
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

import { chromium } from 'playwright';

export class ActivoImporter {

  // constructor() { }

  public async import(): Promise<void> {

    // Browser initialization
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://scraping-target.niels.codes');

    await page.waitForTimeout(1000);

    await browser.close();
  }
}

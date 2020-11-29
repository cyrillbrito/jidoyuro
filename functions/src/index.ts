import * as functions from 'firebase-functions';
import { YnabImporter } from './ynab/importer';
import { YnabConfig } from './ynab/config';
import { dailyFn } from './daily';

export const cryptoBuyer = functions.region('europe-west2').runWith({ timeoutSeconds: 300, memory: '1GB' }).https.onRequest(dailyFn);

const ynabImportObj = new YnabImporter(<YnabConfig>functions.config());
export const ynabImporter = functions.region('europe-west2').runWith({ timeoutSeconds: 300, memory: '1GB' }).https.onRequest(async (req, resp) => {
    const result = await ynabImportObj.call();
    resp.send(result);
});

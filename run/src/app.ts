import express, { Request, Response } from 'express';
import { ActivoImporter, ActivoImporterConfig } from './activo-importer';
import { ConfigurationManager } from './configuration-manager';

const configManager = new ConfigurationManager();
const PORT = process.env.PORT || 8080;
const app = express();


app.get('/', async (request: Request, response: Response) => {

  try {
    const config: ActivoImporterConfig = {
      userCode: await configManager.get('activo-bank-user-code'),
      multichannelCode: await configManager.get('activo-bank-multichannel-code'),
      ynab: {
        accessToken: await configManager.get('ynab-access-token'),
        accountId: await configManager.get('ynab-account-id'),
      },
    };

    new ActivoImporter(config).import();

    response.send('OK!');

  } catch (e) {
    console.log('ERROR-001', e);
    response.send('ERROR-001' + e);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

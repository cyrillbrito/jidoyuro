import express, { Request, Response } from 'express';
// import { ActivoImporter } from './activo-importer';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';


const smsc = new SecretManagerServiceClient();
const PORT = process.env.PORT || 8080;
const app = express();

app.get('/', async (request: Request, response: Response) => {
  // await new ActivoImporter({ multichannelCode: '', userCode: '', ynab: { accessToken: '', accountId: '' } }).import();
  const [secret] = await smsc.getSecret({
    name: 'sample-test',
  });

  console.log(secret);

  response.send('OK ' + secret);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

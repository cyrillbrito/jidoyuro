import express, { Request, Response } from 'express';
import { Container } from './container';
import { ActivoImporter } from './managers/activo-importer';
import { BcpImporter } from './managers/bcp-importer';

const PORT = process.env.PORT || 8080;
const app = express();

app.get('/ynab/activo-import', async (request: Request, response: Response) => {
  const activoImporter = Container.get<ActivoImporter>('ActivoImporter');
  response.send(await activoImporter.import());
});

app.get('/ynab/bcp-import', async (request: Request, response: Response) => {
  const bcpImporter = Container.get<BcpImporter>('BcpImporter');
  response.send(await bcpImporter.import());
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

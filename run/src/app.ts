import express, { Request, Response } from 'express';
import { ActivoImporter } from './activo-importer';

const PORT = process.env.PORT || 8080;
const app = express();

app.get('/', async (request: Request, response: Response) => {
  await new ActivoImporter().import();
  response.send('OK');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import { Request, Response } from 'express';
import { AbImport } from './managers/activo-bank';
import { BcpImport } from './managers/millennium-bcp';


export async function ynab(req: Request, resp: Response) {
  const ab = await BcpImport();
  const bcp = await AbImport();
  resp.send({ ab, bcp });
}


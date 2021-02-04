import { AbImport } from './managers/activo-bank';
import { SetEnv } from './managers/environment';
import { BcpImport } from './managers/millennium-bcp';

async function ynab() {
  const ab = await BcpImport();
  const bcp = await AbImport();
  console.log(JSON.stringify(ab));
  console.log(JSON.stringify(bcp));
}

SetEnv('local');
ynab();

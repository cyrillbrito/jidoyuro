import { Configuration } from './configuration';
import { Ynab } from './ynab';

export class BcpImporter {

  constructor(
    private config: Configuration,
    private ynab: Ynab,
  ) { }

  public async import(): Promise<any> {
    return 'test';
  }
}

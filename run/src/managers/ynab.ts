import { API as YnabApi, SaveTransaction, } from 'ynab';
import { Configuration } from './configuration';

export interface BankMovement {
  date: Date;
  description: string;
  amount: number;
  balance: number;
}

export class Ynab {

  private ynabApi$: Promise<YnabApi>;

  constructor(private config: Configuration) {
    this.ynabApi$ = this.config.get('ynab-access-token').then(accessToken => {
      return new YnabApi(accessToken);
    });
  }

  public async createTransactions(movements: BankMovement[], accountId: string): Promise<any> {

    const transactions: SaveTransaction[] = [];

    for (const movement of movements) {

      const date = movement.date.toISOString().split('T')[0];

      transactions.push({
        account_id: accountId,
        date,
        amount: movement.amount * 1000,
        payee_name: movement.description,
        cleared: SaveTransaction.ClearedEnum.Cleared,
        import_id: this.importId(movement),
      });
    }

    const ynabApi = await this.ynabApi$;
    const budgetId = await this.config.get('ynab-budget-id');

    const response = await ynabApi.transactions.createTransactions(budgetId, { transactions });
    return response.data;
  }

  private importId(movement: BankMovement): string {
    const date = movement.date.toISOString().split('T')[0].replace(/-/g, '');
    const description = movement.description.replace(/[^A-Za-z]|COMPRA|CONTACTLESS/g, '');
    const amount = movement.amount.toString().replace('.', '');
    const balance = movement.balance.toString().replace('.', '');
    return `${date}${amount}${balance}${description}`.substring(0, 36);
  }
}

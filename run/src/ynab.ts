import { API as YnabApi, SaveTransaction, } from 'ynab';

export interface JidoyuroYnabConfig {
  accessToken: string;
  budgetId: string;
  accountId: string;
}

export interface BankMovement {
  date: Date;
  description: string;
  amount: number;
  balance: number;
}

export class JidoyuroYnab {

  private ynabApi: YnabApi;

  constructor(private config: JidoyuroYnabConfig) {
    this.ynabApi = new YnabApi(this.config.accessToken);
  }

  public async createTransactions(movements: BankMovement[]): Promise<any> {

    const transactions: SaveTransaction[] = [];

    for (const movement of movements) {

      // const date = `${movement.date.getFullYear()}-${movement.date.getMonth() + 1}-${movement.date.getDate()}`;
      const date = movement.date.toISOString().split('T')[0];

      transactions.push({
        account_id: this.config.accountId,
        date,
        amount: movement.amount * 1000,
        // amount: +movement.amount,
        payee_name: movement.description,
        cleared: SaveTransaction.ClearedEnum.Cleared,
        import_id: this.importId(movement),
      });
    }

    const response = await this.ynabApi.transactions.createTransactions(this.config.budgetId, { transactions });
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

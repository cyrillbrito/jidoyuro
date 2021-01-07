import { API as YnabApi, SaveTransaction, } from 'ynab';

export interface JidoyuroYnabConfig {
  accessToken: string;
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

  public async createTransactions(movements: BankMovement[]): Promise<void> {

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
        import_id: `${date}${movement.amount}${movement.balance}${movement.description}`.substring(0, 36),
      });
    }

    console.log(JSON.stringify(transactions));

    // let response;
    // try {
    //   response = await this.ynabApi.transactions.createTransactions(this.config.ynab.budget_id, { transactions: transactions });
    // } catch (e) {
    //   console.log(e);
    // }
  }

}
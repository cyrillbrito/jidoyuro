import { API, SaveTransaction, SaveTransactionsResponseData, } from 'ynab';
import { GetEnvString } from './environment';

export interface BankMovement {
  date: Date;
  description: string;
  amount: number;
  balance: number;
}

export async function CreateYnabTransactions(movements: BankMovement[], accountId: string): Promise<SaveTransactionsResponseData> {

  const accessToken = await GetEnvString('ynab-access-token');
  const budgetId = await GetEnvString('ynab-budget-id');

  const api = new API(accessToken);

  const transactions = movements.map(movement => ({
    account_id: accountId,
    date: movement.date.toISOString().split('T')[0],
    amount: movement.amount * 1000,
    payee_name: movement.description,
    cleared: SaveTransaction.ClearedEnum.Cleared,
    import_id: importId(movement),
  }));

  const response = await api.transactions.createTransactions(budgetId, { transactions });

  return response.data;
}

function importId(movement: BankMovement): string {
  const date = movement.date.toISOString().split('T')[0].replace(/-/g, '');
  const description = movement.description.replace(/[^A-Za-z]|COMPRA|CONTACTLESS/g, '');
  const amount = movement.amount.toString().replace('.', '');
  const balance = movement.balance.toString().replace('.', '');
  return `${date}${amount}${balance}${description}`.substring(0, 36);
}

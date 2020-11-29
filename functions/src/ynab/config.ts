
export interface YnabConfig {
  debug?: boolean;
  mbcp: {
    user: string,
    code: string,
  };
  ynab: {
    budget_id: string,
    account_id: string,
    access_token: string,
  };
}

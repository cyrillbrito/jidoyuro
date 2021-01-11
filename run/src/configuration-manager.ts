import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export class ConfigurationManager {

  private smsc: SecretManagerServiceClient;
  private cache: { [key: string]: string };

  constructor() {
    this.smsc = new SecretManagerServiceClient();
    this.cache = {};
  }

  public async get(key: string): Promise<string> {

    if (this.cache[key]) {
      return this.cache[key];
    }

    const result = await this.smsc.accessSecretVersion({ name: `projects/47980551395/secrets/${key}/versions/latest` });
    const secret = result[0].payload?.data;

    if (typeof secret === "string") {
      this.cache[key] = secret;
      return secret;
    } else {
      return '';
    }
  }
}

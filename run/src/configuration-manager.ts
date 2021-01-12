import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export class ConfigurationManager {

  private smsc: SecretManagerServiceClient;
  private cache: { [key: string]: string };

  constructor(local?: string) {
    this.smsc = new SecretManagerServiceClient();
    if (local) {
      console.log('ENVIROMENT ÇLOCAL?', local);
      this.cache = require(`../environment/${local}`);
    } else {
      this.cache = {};
    }
  }

  public async get(key: string): Promise<string> {

    if (this.cache[key]) {
      console.log('ConfigurationManager', key, this.cache[key]);
      return this.cache[key];
    }

    const result = await this.smsc.accessSecretVersion({ name: `projects/47980551395/secrets/${key}/versions/latest` });
    const secret = result[0].payload?.data;

    console.log('result', JSON.stringify(result));
    console.log('result2', result);

    if (typeof secret === "string") {
      console.log('ConfigurationManager', key, result);
      this.cache[key] = secret;
      return secret;
    } else {
      console.log('ConfigurationManager', key, '404');
      return '';
    }
  }
}

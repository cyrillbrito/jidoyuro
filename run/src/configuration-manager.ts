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

    const [version] = await this.smsc.accessSecretVersion({ name: `projects/47980551395/secrets/${key}/versions/latest` });
    const secret = version.payload?.data?.toString();

    if (secret) {
      console.log('ConfigurationManager', key, secret);
      this.cache[key] = secret;
      return secret;
    } else {
      console.log('ConfigurationManager', key, '404', version);
      return '';
    }
  }
}

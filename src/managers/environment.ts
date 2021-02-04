import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let cache: { [key: string]: string } = {};
const smsc = new SecretManagerServiceClient();

export function SetEnv(environment: string): void {
  cache = require(`../../environment/${environment}`);
}

export async function GetEnvString(key: string): Promise<string> {

  if (cache[key]) {
    return cache[key];
  }

  const [version] = await smsc.accessSecretVersion({ name: `projects/47980551395/secrets/${key}/versions/latest` });
  const secret = version.payload?.data?.toString();

  if (secret) {
    cache[key] = secret;
    return secret;
  } else {
    return '';
  }
}

export async function GetEnvBoolean(key: string): Promise<boolean> {
  return await GetEnvString(key) === 'true';
}

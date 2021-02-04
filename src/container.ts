import { ActivoImporter } from "./managers/activo-importer";
import { BcpImporter } from "./managers/bcp-importer";
import { Configuration } from "./managers/configuration";
import { Ynab } from "./managers/ynab";

interface Dependency<T> {
  instance?: T;
  fn: () => T;
}

/** Dependency injection container */
class ContainerCore {

  private dependencies: { [name: string]: Dependency<any> };

  constructor() {
    this.dependencies = {};
  }

  public register<T>(name: string, fn: () => T): Dependency<T> {
    const dependency = { fn }
    this.dependencies[name] = dependency;
    return dependency;
  }

  public get<T>(arg: string | Dependency<T>): T {

    let dependency: Dependency<T>;
    if (typeof arg === 'string') {
      dependency = this.dependencies[arg];
      if (!arg) {
        throw new Error('Dependency ' + arg + ' is not registered');
      }
    } else {
      dependency = arg;
    }

    if (!dependency.instance) {
      dependency.instance = dependency.fn();
    }

    return dependency.instance;
  }
}

export const Container = new ContainerCore();

const configuration = Container.register<Configuration>('Configuration', () => new Configuration());
const ynab = Container.register('Ynab', () => new Ynab(Container.get(configuration)));
Container.register('ActivoImporter', () => new ActivoImporter(Container.get(configuration), Container.get(ynab)));
Container.register('BcpImporter', () => new BcpImporter(Container.get(configuration), Container.get(ynab)));

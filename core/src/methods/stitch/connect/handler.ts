import type { ConnectSpec, ConnectInput, ConnectResult } from './spec.js';
import type { StitchMCPClient } from '../../../client.js';
import { ok, failFromError } from '../../../result.js';

export class ConnectHandler implements ConnectSpec {
  constructor(private client: StitchMCPClient) { }

  async execute(_input: ConnectInput): Promise<ConnectResult> {
    try {
      await this.client.connect();
      return ok(undefined);
    } catch (error) {
      return failFromError(error);
    }
  }
}

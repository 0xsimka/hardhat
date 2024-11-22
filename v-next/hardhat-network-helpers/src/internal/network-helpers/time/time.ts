import type {
  NetworkHelpers,
  NumberLike,
  Time as TimeI,
} from "../../../types.js";
import type { EthereumProvider } from "@ignored/hardhat-vnext/types/providers";

import { Duration } from "../duration/duration.js";

import { increaseTo } from "./helpers/increase-to.js";
import { increase } from "./helpers/increase.js";
import { latestBlock } from "./helpers/latest-block.js";
import { latest } from "./helpers/latest.js";
import { setNextBlockTimestamp } from "./helpers/set-next-block-timestamp.js";

export class Time implements TimeI {
  readonly #networkHelpers: NetworkHelpers;
  readonly #provider: EthereumProvider;

  public readonly duration: Duration;

  constructor(networkHelpers: NetworkHelpers, provider: EthereumProvider) {
    this.#networkHelpers = networkHelpers;
    this.#provider = provider;

    this.duration = new Duration();
  }

  public async increase(amountInSeconds: NumberLike): Promise<number> {
    return increase(this.#provider, this.#networkHelpers, amountInSeconds);
  }

  public async increaseTo(timestamp: NumberLike | Date): Promise<void> {
    return increaseTo(
      this.#provider,
      this.#networkHelpers,
      timestamp,
      this.duration,
    );
  }

  public async latest(): Promise<number> {
    return latest(this.#provider);
  }

  public async latestBlock(): Promise<number> {
    return latestBlock(this.#provider);
  }

  public async setNextBlockTimestamp(
    timestamp: NumberLike | Date,
  ): Promise<void> {
    return setNextBlockTimestamp(this.#provider, timestamp, this.duration);
  }
}
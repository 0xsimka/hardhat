import type { EthereumProvider } from "@ignored/hardhat-vnext/types/providers";

import { createHardhatRuntimeEnvironment } from "@ignored/hardhat-vnext/hre";
import { assertHardhatInvariant } from "@ignored/hardhat-vnext-errors";

import { NetworkHelpers } from "../../src/internal/network-helpers/network-helpers.js";

export async function initializeNetwork(): Promise<{
  provider: EthereumProvider;
  networkHelpers: NetworkHelpers;
}> {
  const hre = await createHardhatRuntimeEnvironment({});
  const connection = await hre.network.connect();
  const provider = connection.provider;

  const networkHelpers = new NetworkHelpers(provider);

  return { provider, networkHelpers };
}

export function rpcQuantityToNumber(quantity: string): number {
  return parseInt(quantity, 16);
}

export async function getBalance(
  provider: EthereumProvider,
  address: string,
): Promise<number> {
  const balance = await provider.request({
    method: "eth_getBalance",
    params: [address],
  });

  assertHardhatInvariant(
    typeof balance === "string",
    "Balance should be a string",
  );

  return rpcQuantityToNumber(balance);
}

export async function getBlockNumber(
  provider: EthereumProvider,
): Promise<number> {
  const blockNumber = await provider.request({
    method: "eth_blockNumber",
  });

  assertHardhatInvariant(
    typeof blockNumber === "string",
    "Block number should be a string",
  );

  return rpcQuantityToNumber(blockNumber);
}
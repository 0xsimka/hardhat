import type { HttpNetworkHDAccountsConfig } from "../../../../../../../src/types/config.js";

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HardhatError } from "@ignored/hardhat-vnext-errors";
import { assertRejectsWithHardhatError } from "@nomicfoundation/hardhat-test-utils";

import { getJsonRpcRequest } from "../../../../../../../src/internal/builtin-plugins/network-manager/json-rpc.js";
import { createMockedNetworkHre } from "../../hooks-mock.js";

const HD_ACCOUNT: HttpNetworkHDAccountsConfig = {
  mnemonic:
    "couch hunt wisdom giant regret supreme issue sing enroll ankle type husband",
  path: "m/44'/60'/0'/0/",
  initialIndex: 0,
  count: 2,
  passphrase: "",
};

// Test that the request and its additional sub-request (when present)
// are correctly modified or resolved in the "onRequest" hook handler.
// These tests simulate a real scenario where the user calls "await connection.provider.request(jsonRpcRequest)".
describe("e2e - HDWallet", () => {
  it("should generate 2 accounts", async () => {
    const hre = await createMockedNetworkHre(
      {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            accounts: HD_ACCOUNT,
          },
        },
      },
      {
        eth_chainId: "0x7a69",
      },
    );

    const connection = await hre.network.connect("localhost");

    const jsonRpcRequest = getJsonRpcRequest(1, "eth_accounts");

    const res = await connection.provider.request(jsonRpcRequest);

    assert.ok(Array.isArray(res), "res should be an array");

    assert.deepEqual(res, [
      "0x4f3e91d2cacd82fffd1f33a0d26d4078401986e9",
      "0x2a97a65d5673a2c61e95ce33cecadf24f654f96d",
    ]);
  });

  it("should throw if the path is invalid", async () => {
    const hre = await createMockedNetworkHre(
      {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            accounts: { ...HD_ACCOUNT, path: "m/" },
          },
        },
      },
      {
        eth_chainId: "0x7a69",
      },
    );

    const connection = await hre.network.connect("localhost");

    const jsonRpcRequest = getJsonRpcRequest(1, "eth_accounts");

    await assertRejectsWithHardhatError(
      () => connection.provider.request(jsonRpcRequest),
      HardhatError.ERRORS.NETWORK.INVALID_HD_PATH,
      { path: "m/" },
    );
  });
});
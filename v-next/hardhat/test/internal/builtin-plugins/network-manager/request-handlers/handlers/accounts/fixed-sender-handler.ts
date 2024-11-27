import type { JsonRpcTransactionData } from "../../../../../../../src/internal/builtin-plugins/network-manager/request-handlers/handlers/accounts/types.js";

import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { numberToHexString } from "@ignored/hardhat-vnext-utils/hex";

import {
  getJsonRpcRequest,
  getRequestParams,
} from "../../../../../../../src/internal/builtin-plugins/network-manager/json-rpc.js";
import { FixedSenderHandler } from "../../../../../../../src/internal/builtin-plugins/network-manager/request-handlers/handlers/accounts/fixed-sender-handler.js";
import { EthereumMockedProvider } from "../../ethereum-mocked-provider.js";

describe("FixedSenderHandler", function () {
  let fixedSenderHandler: FixedSenderHandler;
  let mockedProvider: EthereumMockedProvider;
  let tx: JsonRpcTransactionData;

  before(() => {
    mockedProvider = new EthereumMockedProvider();

    fixedSenderHandler = new FixedSenderHandler(
      mockedProvider,
      "0x2a97a65d5673a2c61e95ce33cecadf24f654f96d",
    );

    tx = {
      to: "0xb5bc06d4548a3ac17d72b372ae1e416bf65b8ead",
      gas: numberToHexString(21000),
      gasPrice: numberToHexString(678912),
      nonce: numberToHexString(0),
      value: numberToHexString(1),
    };
  });

  it("should set the from value into the transaction", async () => {
    const jsonRpcRequest = getJsonRpcRequest(1, "eth_sendTransaction", [tx]);

    await fixedSenderHandler.handle(jsonRpcRequest);

    assert.equal(
      getRequestParams(jsonRpcRequest)[0].from,
      "0x2a97a65d5673a2c61e95ce33cecadf24f654f96d",
    );
  });

  it("should not replace transaction's from", async () => {
    tx.from = "0x000006d4548a3ac17d72b372ae1e416bf65b8ead";

    const jsonRpcRequest = getJsonRpcRequest(1, "eth_sendTransaction", [tx]);

    await fixedSenderHandler.handle(jsonRpcRequest);

    assert.equal(
      getRequestParams(jsonRpcRequest)[0].from,
      "0x000006d4548a3ac17d72b372ae1e416bf65b8ead",
    );
  });
});

import type { MatchersContract } from "../contracts.js";
import type { EthereumProvider } from "@ignored/hardhat-vnext/types/providers";
import type { HardhatEthers } from "@ignored/hardhat-vnext-ethers/types";

import path from "node:path";
import { beforeEach, describe, it } from "node:test";
import util from "node:util";

import { createHardhatRuntimeEnvironment } from "@ignored/hardhat-vnext/hre";
import hardhatEthersPlugin from "@ignored/hardhat-vnext-ethers";
import { useFixtureProject } from "@nomicfoundation/hardhat-test-utils";
import { AssertionError, expect } from "chai";

import { runSuccessfulAsserts, runFailedAsserts } from "../helpers.js";

import "../../src/internal/add-chai-matchers";

describe("INTEGRATION: Reverted without reason", () => {
  describe("with the in-process hardhat network", () => {
    useFixtureProject("hardhat-project");
    runTests();
  });

  // TODO: when V3 node is ready, add this functionality
  // describe("connected to a hardhat node", ()=>{
  //   useEnvironmentWithNode("hardhat-project");
  //   runTests();
  // });

  function runTests() {
    // deploy Matchers contract before each test
    let matchers: MatchersContract;

    let provider: EthereumProvider;
    let ethers: HardhatEthers;

    beforeEach(async () => {
      const hre = await createHardhatRuntimeEnvironment({
        paths: {
          artifacts: `${process.cwd()}/artifacts`,
        },
        plugins: [hardhatEthersPlugin],
      });

      ({ ethers, provider } = await hre.network.connect());

      const Matchers = await ethers.getContractFactory<[], MatchersContract>(
        "Matchers",
      );
      matchers = await Matchers.deploy();
    });

    // helpers
    describe("calling a method that succeeds", () => {
      it("successful asserts", async () => {
        await runSuccessfulAsserts({
          matchers,
          method: "succeeds",
          successfulAssert: (x) =>
            expect(x).not.to.be.revertedWithoutReason(ethers),
        });
      });

      it("failed asserts", async () => {
        await runFailedAsserts({
          matchers,
          method: "succeeds",
          failedAssert: (x) => expect(x).to.be.revertedWithoutReason(ethers),
          failedAssertReason:
            "Expected transaction to be reverted without a reason, but it didn't revert",
        });
      });
    });

    // depends on a bug being fixed on ethers.js
    // see https://github.com/NomicFoundation/hardhat/issues/3446
    describe.skip("calling a method that reverts without a reason", () => {
      it("successful asserts", async () => {
        await runSuccessfulAsserts({
          matchers,
          method: "revertsWithoutReason",
          args: [],
          successfulAssert: (x) =>
            expect(x).to.be.revertedWithoutReason(ethers),
        });
      });

      it("failed asserts", async () => {
        await runFailedAsserts({
          matchers,
          method: "revertsWithoutReason",
          args: [],
          failedAssert: (x) =>
            expect(x).to.not.be.revertedWithoutReason(ethers),
          failedAssertReason:
            "Expected transaction NOT to be reverted without a reason, but it was",
        });
      });
    });

    describe("calling a method that reverts with a reason", () => {
      it("successful asserts", async () => {
        await runSuccessfulAsserts({
          matchers,
          method: "revertsWith",
          args: ["some reason"],
          successfulAssert: (x) =>
            expect(x).to.not.be.revertedWithoutReason(ethers),
        });
      });

      it("failed asserts", async () => {
        await runFailedAsserts({
          matchers,
          method: "revertsWith",
          args: ["some reason"],
          failedAssert: (x) => expect(x).to.be.revertedWithoutReason(ethers),
          failedAssertReason:
            "Expected transaction to be reverted without a reason, but it reverted with reason 'some reason'",
        });
      });
    });

    describe("calling a method that reverts with a panic code", () => {
      it("successful asserts", async () => {
        await runSuccessfulAsserts({
          matchers,
          method: "panicAssert",
          successfulAssert: (x) =>
            expect(x).to.not.be.revertedWithoutReason(ethers),
        });
      });

      it("failed asserts", async () => {
        await runFailedAsserts({
          matchers,
          method: "panicAssert",
          failedAssert: (x) => expect(x).to.be.revertedWithoutReason(ethers),
          failedAssertReason:
            "Expected transaction to be reverted without a reason, but it reverted with panic code 0x01 (Assertion error)",
        });
      });
    });

    describe("calling a method that reverts with a custom error", () => {
      it("successful asserts", async () => {
        await runSuccessfulAsserts({
          matchers,
          method: "revertWithSomeCustomError",
          successfulAssert: (x) =>
            expect(x).to.not.be.revertedWithoutReason(ethers),
        });
      });

      it("failed asserts", async () => {
        await runFailedAsserts({
          matchers,
          method: "revertWithSomeCustomError",
          failedAssert: (x) => expect(x).to.be.revertedWithoutReason(ethers),
          failedAssertReason:
            "Expected transaction to be reverted without a reason, but it reverted with a custom error",
        });
      });
    });

    describe("invalid values", () => {
      it("non-errors as subject", async () => {
        await expect(
          expect(Promise.reject({})).to.be.revertedWithoutReason(ethers),
        ).to.be.rejectedWith(AssertionError, "Expected an Error object");
      });

      it("errors that are not related to a reverted transaction", async () => {
        // use an address that almost surely doesn't have balance
        const randomPrivateKey =
          "0xc5c587cc6e48e9692aee0bf07474118e6d830c11905f7ec7ff32c09c99eba5f9";

        const signer = new ethers.Wallet(randomPrivateKey, ethers.provider);
        const matchersFromSenderWithoutFunds = matchers.connect(
          signer,
        ) as MatchersContract;

        // this transaction will fail because of lack of funds, not because of a
        // revert
        await expect(
          expect(
            matchersFromSenderWithoutFunds.revertsWithoutReason({
              gasLimit: 1_000_000,
            }),
          ).to.not.be.revertedWithoutReason(ethers),
        ).to.be.eventually.rejectedWith(
          "Sender doesn't have enough funds to send tx",
        );
      });
    });

    describe("stack traces", () => {
      // smoke test for stack traces
      it("includes test file", async () => {
        try {
          await expect(
            matchers.revertsWithoutReason(),
          ).to.not.be.revertedWithoutReason(ethers);
        } catch (e: any) {
          const errorString = util.inspect(e);
          expect(errorString).to.include(
            "Expected transaction NOT to be reverted without a reason, but it was",
          );
          expect(errorString).to.include(
            path.join("test", "reverted", "revertedWithoutReason.ts"),
          );
          return;
        }
        expect.fail("Expected an exception but none was thrown");
      });
    });
  }
});
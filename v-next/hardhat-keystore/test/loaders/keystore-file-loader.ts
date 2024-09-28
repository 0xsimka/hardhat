import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { HardhatError } from "@ignored/hardhat-vnext-errors";
import { assertRejectsWithHardhatError } from "@nomicfoundation/hardhat-test-utils";

import { UnencryptedKeystore } from "../../src/internal/keystores/unencrypted-keystore.js";
import { KeystoreFileLoader } from "../../src/internal/loaders/keystore-file-loader.js";
import { MockFileManager } from "../helpers/mock-file-manager.js";

const fakeKeystoreFilePath = "./fake-keystore-path.json";

describe("KeystoreFileLoader", () => {
  describe("keystore file validation", () => {
    describe("when the keystore file is valid on disk", () => {
      let keystoreLoader: KeystoreFileLoader;

      beforeEach(async () => {
        const mockFileManager = new MockFileManager();

        mockFileManager.setupExistingKeystoreFile({ myKey: "myValue" });

        keystoreLoader = new KeystoreFileLoader(
          fakeKeystoreFilePath,
          mockFileManager,
        );
      });

      it("should load the keystore", async () => {
        const keystore = await keystoreLoader.loadKeystore();

        const value = await keystore.readValue("myKey");

        assert.equal(value, "myValue");
      });
    });

    describe("when the keystore file is invalid on disk", () => {
      let keystoreLoader: KeystoreFileLoader;

      beforeEach(async () => {
        const mockFileManager = new MockFileManager();

        const invalidKeystore =
          UnencryptedKeystore.createEmptyUnencryptedKeystoreFile();
        invalidKeystore._format =
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- testing invalid format
          "invalid" as unknown as "hh-unencrypted-keystore";

        mockFileManager.setKeystoreFile(invalidKeystore);

        keystoreLoader = new KeystoreFileLoader(
          fakeKeystoreFilePath,
          mockFileManager,
        );
      });

      it("should throw on attempted load", async () => {
        await assertRejectsWithHardhatError(
          async () => keystoreLoader.loadKeystore(),
          HardhatError.ERRORS.KEYSTORE.INVALID_KEYSTORE_FILE_FORMAT,
          {},
        );
      });
    });
  });

  describe("keystore caching", () => {
    describe("when the keystore has not been loaded", () => {
      let keystoreLoader: KeystoreFileLoader;
      let mockFileManager: MockFileManager;

      beforeEach(async () => {
        mockFileManager = new MockFileManager();

        mockFileManager.setupExistingKeystoreFile({ myKey: "myValue" });

        keystoreLoader = new KeystoreFileLoader(
          fakeKeystoreFilePath,
          mockFileManager,
        );
      });

      it("should determine if the keystore exists based on the file system", async () => {
        assert.ok(
          await keystoreLoader.isKeystoreInitialized(),
          "keystore should exist",
        );

        assert.equal(mockFileManager.fileExists.mock.callCount(), 1);
      });
    });

    describe("when the keystore has been loaded from file", () => {
      let keystoreLoader: KeystoreFileLoader;
      let mockFileManager: MockFileManager;

      beforeEach(async () => {
        mockFileManager = new MockFileManager();

        mockFileManager.setupExistingKeystoreFile({ myKey: "myValue" });

        keystoreLoader = new KeystoreFileLoader(
          fakeKeystoreFilePath,
          mockFileManager,
        );
      });

      it("should return the same keystore no matter how many loads", async () => {
        const load1 = await keystoreLoader.loadKeystore();
        const load2 = await keystoreLoader.loadKeystore();

        assert.equal(load1, load2, "keystores should be the same instance");
      });
    });

    describe("when the keystore is initialized in memory", () => {
      let keystoreLoader: KeystoreFileLoader;
      let mockFileManager: MockFileManager;

      beforeEach(async () => {
        mockFileManager = new MockFileManager();

        mockFileManager.setupNoKeystoreFile();

        keystoreLoader = new KeystoreFileLoader(
          fakeKeystoreFilePath,
          mockFileManager,
        );
      });

      it("should return the same keystore for subsequent loads", async () => {
        const createdVersion = await keystoreLoader.createUnsavedKeystore();
        const loadedVersion = await keystoreLoader.loadKeystore();

        assert.equal(
          createdVersion,
          loadedVersion,
          "keystores should be the same instance",
        );
      });
    });
  });
});
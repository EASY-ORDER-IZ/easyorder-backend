import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  //   setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"], // setup file
  verbose: true,
};

export default config;

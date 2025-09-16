// src/services/execProvider/index.ts
import { ExecProvider } from "./types.js";
import { mockExecProvider } from "./mock.js";

export function getExecProvider(): ExecProvider {
  const kind = process.env.EXEC_PROVIDER || "mock";
  switch (kind) {
    case "mock":
      return mockExecProvider;
    // case "stellar_dex": return stellarProvider;
    default:
      return mockExecProvider;
  }
}

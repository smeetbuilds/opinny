import { expect, test } from "bun:test";
import { createWalletAdapter } from "./wallet";

test("wallet registry fails closed for an unknown production adapter", () => {
  expect(() => createWalletAdapter("unregistered-production-adapter")).toThrow("No wallet adapter is registered");
});

test("reference wallet validates prepared transaction requests", async () => {
  const wallet = createWalletAdapter("mock");
  const session = await wallet.connect("Browser wallet");
  expect(session.reference).toBe(true);
  expect(session.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

  const accepted = await wallet.execute({
    chainId: 137,
    to: "0x0000000000000000000000000000000000000001",
    data: "0x",
    value: "0x0"
  });
  expect(accepted.status).toBe("accepted");

  const rejected = await wallet.execute({
    chainId: 0,
    to: "0x0000000000000000000000000000000000000001",
    data: "0x",
    value: "0x0"
  });
  expect(rejected.status).toBe("rejected");
});

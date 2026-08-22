import type { CommandResult, WalletTransactionRequest } from "@/core/contracts/domain";
import { appConfig } from "@/lib/config";

export interface WalletSession {
  address: string;
  provider: string;
  chainId: number;
  reference: boolean;
}

export interface WalletAdapter {
  connect(provider: string): Promise<WalletSession>;
  disconnect(): Promise<void>;
  execute(request: WalletTransactionRequest): Promise<CommandResult>;
}

const referenceAddress = "0x19B60F0A4218D3E54A6FBD7A42C8B8F0D9E7A42A";

const mockWalletAdapter: WalletAdapter = {
  async connect(provider) {
    return {
      address: referenceAddress,
      provider,
      chainId: appConfig.chainId,
      reference: true
    };
  },
  async disconnect() {},
  async execute(request) {
    if (!Number.isSafeInteger(request.chainId) || request.chainId <= 0) {
      return { id: "wallet-request", status: "rejected", message: "Wallet request has an invalid chain ID." };
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(request.to)) {
      return { id: "wallet-request", status: "rejected", message: "Wallet request has an invalid destination." };
    }
    if (!/^0x[a-fA-F0-9]*$/.test(request.data) || !/^0x[a-fA-F0-9]+$/.test(request.value)) {
      return { id: "wallet-request", status: "rejected", message: "Wallet request contains invalid transaction data." };
    }
    return { id: `wallet-${Date.now()}`, status: "accepted", message: "Reference wallet request approved for this session." };
  }
};

const walletAdapters = {
  mock: mockWalletAdapter
} satisfies Record<string, WalletAdapter>;

export function createWalletAdapter(name = appConfig.adapter): WalletAdapter {
  const adapter = walletAdapters[name as keyof typeof walletAdapters];
  if (!adapter) {
    throw new Error(
      `No wallet adapter is registered for NEXT_PUBLIC_OPINNY_DATA_ADAPTER="${name}". Register a wallet integration before deployment.`
    );
  }
  return adapter;
}

export const walletAdapter = createWalletAdapter();

"use client";

import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useState } from "react";
import { useApp } from "./app-provider";

const assets = [
  { symbol: "USDC", mark: "$" },
  { symbol: "USDT", mark: "₮" },
  { symbol: "DAI", mark: "D" }
] as const;

type AssetSymbol = (typeof assets)[number]["symbol"];

export function FundingButtons() {
  const { connected, setWalletOpen, notify } = useApp();
  const [open, setOpen] = useState<"deposit" | "withdraw" | null>(null);
  const [asset, setAsset] = useState<AssetSymbol>("USDC");
  const [amount, setAmount] = useState("500");

  const launch = (type: "deposit" | "withdraw") => {
    if (!connected) return setWalletOpen(true);
    setOpen(type);
  };

  const selectedAsset = assets.find((item) => item.symbol === asset) ?? assets[0];

  return (
    <>
      <button className="secondary-button compact" onClick={() => launch("withdraw")}><ArrowUpFromLine size={15} />Withdraw</button>
      <button className="primary-button compact" onClick={() => launch("deposit")}><ArrowDownToLine size={15} />Deposit crypto</button>
      {open ? (
        <div className="overlay" onMouseDown={() => setOpen(null)}>
          <section className="funding-dialog" role="dialog" aria-modal="true" aria-labelledby="funding-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <span className="eyebrow">{open === "deposit" ? "Add funds" : "Move funds"}</span>
            <h2 id="funding-title">{open === "deposit" ? "Deposit crypto" : "Withdraw crypto"}</h2>
            <p>{open === "deposit" ? "Send a supported stablecoin from your wallet or another exchange." : "Send available collateral to a compatible wallet address."}</p>
            <div className="asset-selector" aria-label="Select collateral asset">
              {assets.map((item) => (
                <button className={asset === item.symbol ? "active" : ""} aria-pressed={asset === item.symbol} key={item.symbol} onClick={() => setAsset(item.symbol)}>
                  <span className="token-mark">{item.mark}</span>
                  <span><strong>{item.symbol}</strong><small>Polygon</small></span>
                  {asset === item.symbol ? <em>Selected</em> : null}
                </button>
              ))}
            </div>
            <label className="dialog-field">
              <span>Amount</span>
              <div className="amount-input"><span>{selectedAsset.mark}</span><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /><em>{asset}</em></div>
            </label>
            <div className="network-notice"><i /><span><strong>Polygon network</strong><small>Only send supported assets on the selected network.</small></span></div>
            <button className="primary-button full-width" onClick={() => {
              notify(`${open === "deposit" ? "Deposit" : "Withdrawal"} flow prepared`, `${amount || "0"} ${asset} is ready for the connected backend to request in the wallet.`);
              setOpen(null);
            }}>Continue in wallet</button>
            <button className="text-button full-width" onClick={() => setOpen(null)}>Cancel</button>
          </section>
        </div>
      ) : null}
    </>
  );
}

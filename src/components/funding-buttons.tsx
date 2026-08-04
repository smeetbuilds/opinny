"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, CheckCircle2, ExternalLink, LoaderCircle, ShieldCheck, WalletCards, X } from "lucide-react";
import { useApp } from "./app-provider";
import { appConfig } from "@/lib/config";
import { dataAdapter } from "@/lib/data";
import type { PreparedFundingAction } from "@/core/contracts/domain";
import { shortAddress } from "@/lib/format";

const availableBalance = 3842.16;
const marks: Record<string, string> = { USDC: "$", USDT: "₮", DAI: "D" };

type FundingType = "deposit" | "withdrawal";
type Step = "form" | "prepared";

export function FundingButtons() {
  const { connected, setWalletOpen, notify, walletAddress } = useApp();
  const [open, setOpen] = useState<FundingType | null>(null);
  const [asset, setAsset] = useState(appConfig.collateral);
  const [amount, setAmount] = useState("500");
  const [destination, setDestination] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [prepared, setPrepared] = useState<PreparedFundingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const launch = (type: FundingType) => {
    if (!connected) return setWalletOpen(true);
    setOpen(type);
    setStep("form");
    setPrepared(null);
    setError("");
    setDestination(type === "withdrawal" ? walletAddress : "");
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const numericAmount = Number(amount);
  const amountValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const addressValid = /^0x[a-fA-F0-9]{40}$/.test(destination);
  const valid = amountValid && (open !== "withdrawal" || (addressValid && numericAmount <= availableBalance));
  const selectedMark = marks[asset] ?? asset.slice(0, 1);
  const feeEstimate = useMemo(() => Math.max(numericAmount * 0.0005, 0.01), [numericAmount]);

  async function prepare() {
    if (!open || !valid) {
      setError(!amountValid ? "Enter an amount greater than zero." : open === "withdrawal" && numericAmount > availableBalance ? "Amount exceeds the available balance." : "Enter a valid EVM wallet address.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await dataAdapter.prepareFunding({
        type: open,
        asset,
        amount: numericAmount,
        chainId: appConfig.chainId,
        destination: open === "withdrawal" ? destination : undefined
      });
      setPrepared(result);
      setStep("prepared");
    } catch {
      setError("The funding request could not be prepared. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function approve() {
    if (!open || !prepared) return;
    notify(
      `${open === "deposit" ? "Deposit" : "Withdrawal"} request ready`,
      `${numericAmount.toLocaleString()} ${asset} is ready for wallet approval on ${appConfig.chainName}.`,
      "funding"
    );
    setOpen(null);
  }

  return (
    <>
      <button className="secondary-button compact" onClick={() => launch("withdrawal")}><ArrowUpFromLine size={15} />Withdraw</button>
      <button className="primary-button compact" onClick={() => launch("deposit")}><ArrowDownToLine size={15} />Deposit crypto</button>
      {open ? (
        <div className="overlay" onMouseDown={() => setOpen(null)}>
          <section className="funding-dialog enhanced-funding-dialog" role="dialog" aria-modal="true" aria-labelledby="funding-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <header className="funding-head">
              <div>
                <span className="eyebrow">Crypto-only funding</span>
                <h2 id="funding-title">{open === "deposit" ? "Deposit crypto" : "Withdraw crypto"}</h2>
                <p>{open === "deposit" ? "Move a supported stablecoin from the connected wallet." : "Send available collateral to a compatible wallet address."}</p>
              </div>
              <button className="icon-button" aria-label="Close funding dialog" onClick={() => setOpen(null)}><X size={18} /></button>
            </header>

            {step === "form" ? (
              <>
                <div className="funding-network-bar"><span><i />{appConfig.chainName}</span><strong>Chain {appConfig.chainId}</strong></div>
                <div className="asset-selector" aria-label="Select collateral asset">
                  {appConfig.supportedAssets.map((symbol) => (
                    <button type="button" className={asset === symbol ? "active" : ""} aria-pressed={asset === symbol} key={symbol} onClick={() => setAsset(symbol)}>
                      <span className="token-mark">{marks[symbol] ?? symbol.slice(0, 1)}</span>
                      <span><strong>{symbol}</strong><small>{appConfig.chainName}</small></span>
                      {asset === symbol ? <em>Selected</em> : null}
                    </button>
                  ))}
                </div>
                <label className="dialog-field">
                  <span>Amount</span>
                  <div className="amount-input"><span>{selectedMark}</span><input value={amount} onChange={(event) => { setAmount(event.target.value.replace(/[^0-9.]/g, "")); setError(""); }} inputMode="decimal" aria-invalid={Boolean(error && !amountValid)} /><em>{asset}</em></div>
                  {open === "withdrawal" ? <small className="field-hint">Available {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {asset} <button type="button" onClick={() => setAmount(String(availableBalance))}>Use max</button></small> : null}
                </label>
                {open === "withdrawal" ? <label className="dialog-field"><span>Destination wallet</span><input className="address-input" value={destination} onChange={(event) => { setDestination(event.target.value.trim()); setError(""); }} placeholder="0x…" spellCheck={false} autoCapitalize="none" aria-invalid={Boolean(error && !addressValid)} /></label> : null}
                <div className="funding-summary">
                  <span><small>Network</small><strong>{appConfig.chainName}</strong></span>
                  <span><small>Estimated network fee</small><strong>~{amountValid ? feeEstimate.toFixed(2) : "0.00"} {asset}</strong></span>
                  <span><small>Funding method</small><strong>Connected wallet</strong></span>
                </div>
                {error ? <p className="dialog-error" role="alert">{error}</p> : null}
                <div className="network-notice"><ShieldCheck size={17} /><span><strong>Verify asset and network</strong><small>Only use supported crypto on {appConfig.chainName}. Incorrect transfers may be unrecoverable.</small></span></div>
                <button className="primary-button full-width" disabled={busy || !valid} onClick={prepare}>{busy ? <><LoaderCircle className="spin" size={17} />Preparing request</> : <>Review in wallet <WalletCards size={17} /></>}</button>
                <button className="text-button full-width" onClick={() => setOpen(null)}>Cancel</button>
              </>
            ) : prepared ? (
              <div className="funding-prepared">
                <span className="prepared-icon"><CheckCircle2 size={25} /></span>
                <h3>Wallet request prepared</h3>
                <p>Review the asset, network and destination before approving the transaction.</p>
                <div className="prepared-summary">
                  <span><small>Action</small><strong>{open === "deposit" ? "Deposit" : "Withdrawal"}</strong></span>
                  <span><small>Amount</small><strong>{numericAmount.toLocaleString()} {asset}</strong></span>
                  <span><small>Network</small><strong>{appConfig.chainName}</strong></span>
                  <span><small>Contract</small><strong className="mono">{shortAddress(prepared.walletRequest.to)}</strong></span>
                  <span><small>Request ID</small><strong className="mono">{prepared.requestId}</strong></span>
                </div>
                <button className="primary-button full-width" onClick={approve}>Continue in wallet <ExternalLink size={16} /></button>
                <button className="text-button full-width" onClick={() => setStep("form")}><ArrowLeft size={15} />Back</button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

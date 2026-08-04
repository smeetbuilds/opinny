"use client";

import { Send, Wallet } from "lucide-react";
import { useState } from "react";
import { useApp } from "./app-provider";

export function MarketCommentComposer() {
  const { connected, setWalletOpen, notify } = useApp();
  const [message, setMessage] = useState("");

  if (!connected) {
    return (
      <div className="comment-composer locked">
        <span className="profile-avatar">MP</span>
        <div><strong>Share your market view</strong><span>Connect your wallet to join the discussion and build reputation.</span></div>
        <button className="secondary-button compact" type="button" onClick={() => setWalletOpen(true)}><Wallet size={14} />Connect to comment</button>
      </div>
    );
  }

  const submit = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    notify("Comment prepared", "Discussion publishing is represented locally in this demo.");
    setMessage("");
  };

  return (
    <form className="comment-composer active-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <span className="profile-avatar">MP</span>
      <label><span className="sr-only">Comment</span><textarea maxLength={280} rows={2} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share evidence, explain your reasoning or ask a focused question…" /></label>
      <div className="composer-actions"><small>{message.length}/280</small><button className="primary-button compact" type="submit" disabled={!message.trim()}><Send size={14} />Post</button></div>
    </form>
  );
}

"use client";

import { MessageCircle, Reply, Send, ThumbsUp, Wallet, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { MarketComment } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { useApp } from "./app-provider";

function commentTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  }).format(date)} UTC`;
}

export function MarketDiscussion({ marketId, initialComments }: { marketId: string; initialComments: MarketComment[] }) {
  const { connected, setWalletOpen, notify } = useApp();
  const [comments, setComments] = useState(initialComments);
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<MarketComment | null>(null);
  const [useful, setUseful] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalReplies = useMemo(() => comments.reduce((sum, comment) => sum + comment.replyCount, 0), [comments]);

  async function submit() {
    const body = message.trim();
    if (!body || busy) return;
    if (!connected) {
      setWalletOpen(true);
      return;
    }

    setBusy(true);
    try {
      const created = await dataAdapter.createMarketComment({
        marketId,
        body,
        replyToId: replyTo?.id
      });
      setComments((current) => [created, ...current]);
      setMessage("");
      setReplyTo(null);
      notify("Comment posted", "Your market view is now visible in this discussion.", "market");
    } catch {
      notify("Comment not posted", "The discussion service did not accept the comment. Try again.", "system");
    } finally {
      setBusy(false);
    }
  }

  async function toggleUseful(comment: MarketComment) {
    const nextUseful = !useful.has(comment.id);
    setUseful((current) => {
      const next = new Set(current);
      if (nextUseful) next.add(comment.id);
      else next.delete(comment.id);
      return next;
    });

    try {
      const result = await dataAdapter.markCommentUseful(comment.id, nextUseful);
      if (result.status === "rejected") throw new Error("rejected");
    } catch {
      setUseful((current) => {
        const next = new Set(current);
        if (nextUseful) next.delete(comment.id);
        else next.add(comment.id);
        return next;
      });
      notify("Reaction not saved", "The discussion service did not accept the update.", "system");
    }
  }

  function startReply(comment: MarketComment) {
    if (!connected) {
      setWalletOpen(true);
      return;
    }
    setReplyTo(comment);
    textareaRef.current?.focus();
  }

  return (
    <section className="comments-card" id="discussion" aria-labelledby="discussion-title">
      <div className="table-title discussion-titlebar">
        <div>
          <h3 id="discussion-title">Discussion</h3>
          <span>{comments.length} comments · {totalReplies} replies · Community analysis</span>
        </div>
        <MessageCircle size={17} />
      </div>

      {!connected ? (
        <div className="comment-composer locked">
          <span className="profile-avatar">OP</span>
          <div><strong>Share your market view</strong><span>Connect a wallet to post evidence, reasoning or a focused question.</span></div>
          <button className="secondary-button compact" type="button" onClick={() => setWalletOpen(true)}><Wallet size={14} />Connect to comment</button>
        </div>
      ) : (
        <form className="comment-composer active-composer" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <span className="profile-avatar">MP</span>
          <label>
            <span className="sr-only">Comment</span>
            {replyTo ? <span className="reply-context">Replying to @{replyTo.authorHandle}<button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}><X size={12} /></button></span> : null}
            <textarea ref={textareaRef} maxLength={280} rows={2} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share evidence, explain your reasoning or ask a focused question…" />
          </label>
          <div className="composer-actions"><small>{message.length}/280</small><button className="primary-button compact" type="submit" disabled={!message.trim() || busy}><Send size={14} />{busy ? "Posting…" : "Post"}</button></div>
        </form>
      )}

      <div className="discussion-list">
        {comments.map((comment) => {
          const markedUseful = useful.has(comment.id);
          const usefulCount = Math.max(0, comment.usefulCount + (markedUseful ? 1 : 0));
          return (
            <article className="comment" key={comment.id}>
              <span className="profile-avatar">{comment.initials}</span>
              <div>
                <header><strong>{comment.authorDisplayName}</strong><span>@{comment.authorHandle} · {commentTime(comment.createdAt)}</span></header>
                <p>{comment.body}</p>
                <footer>
                  <button type="button" onClick={() => startReply(comment)}><Reply size={14} />Reply{comment.replyCount ? ` · ${comment.replyCount}` : ""}</button>
                  <button className={markedUseful ? "comment-useful active" : "comment-useful"} type="button" aria-pressed={markedUseful} onClick={() => void toggleUseful(comment)}><ThumbsUp size={13} />Useful · {usefulCount}</button>
                </footer>
              </div>
            </article>
          );
        })}
        {!comments.length ? <div className="discussion-empty"><MessageCircle size={22} /><strong>No discussion yet</strong><span>Start the conversation with evidence or a focused market view.</span></div> : null}
      </div>
    </section>
  );
}

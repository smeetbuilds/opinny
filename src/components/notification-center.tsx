"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Bell, CheckCheck, CircleDollarSign, Radio, Trash2, X } from "lucide-react";
import { useApp, type PlatformNotification } from "./app-provider";

const icons = {
  trade: Activity,
  market: Radio,
  funding: CircleDollarSign,
  system: Bell
} satisfies Record<PlatformNotification["kind"], typeof Bell>;

export function NotificationCenter() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button className="icon-button notification-trigger" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={open} onClick={() => setOpen(true)}>
        <Bell size={18} />
        {unreadCount ? <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>
      {open ? (
        <div className="notification-layer">
          <button className="notification-backdrop" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <aside className="notification-center" role="dialog" aria-modal="true" aria-labelledby="notification-title">
            <div className="sheet-handle" />
            <header>
              <div><span className="eyebrow">Account activity</span><h2 id="notification-title">Notifications</h2><p>{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You are all caught up"}</p></div>
              <button className="icon-button" aria-label="Close notifications" onClick={() => setOpen(false)}><X size={18} /></button>
            </header>
            {notifications.length ? (
              <>
                <div className="notification-tools">
                  <button type="button" onClick={markAllNotificationsRead} disabled={!unreadCount}><CheckCheck size={15} />Mark all read</button>
                  <button type="button" onClick={clearNotifications}><Trash2 size={15} />Clear</button>
                </div>
                <div className="notification-list">
                  {notifications.map((item) => {
                    const Icon = icons[item.kind];
                    const content = <><span className={`notification-kind ${item.kind}`}><Icon size={16} /></span><span className="notification-copy"><strong>{item.title}</strong><small>{item.description}</small><time>{item.time}</time></span>{!item.read ? <i className="unread-dot" /> : null}</>;
                    return item.href ? (
                      <Link className={item.read ? "read" : ""} href={item.href} key={item.id} onClick={() => { markNotificationRead(item.id); setOpen(false); }}>{content}</Link>
                    ) : (
                      <button className={item.read ? "read" : ""} type="button" key={item.id} onClick={() => markNotificationRead(item.id)}>{content}</button>
                    );
                  })}
                </div>
              </>
            ) : <div className="notification-empty"><Bell size={24} /><strong>No notifications</strong><span>Order, market, funding and resolution updates will appear here.</span></div>}
            <footer><Link href="/settings" onClick={() => setOpen(false)}>Notification preferences</Link></footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}

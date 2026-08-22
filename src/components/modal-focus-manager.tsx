"use client";

import { useEffect } from "react";
import { getFocusWrapTarget } from "@/lib/focus";

const modalSelector = '[role="dialog"][aria-modal="true"]';
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])'
].join(",");

type FocusLayer = {
  modal: HTMLElement;
  opener: HTMLElement | null;
  addedTabIndex: boolean;
};

function isVisible(element: HTMLElement) {
  if (element.hasAttribute("hidden") || element.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
}

function getVisibleModals() {
  return Array.from(document.querySelectorAll<HTMLElement>(modalSelector)).filter(isVisible);
}

function getTopModal() {
  return getVisibleModals().at(-1) ?? null;
}

function getFocusableElements(modal: HTMLElement) {
  return Array.from(modal.querySelectorAll<HTMLElement>(focusableSelector)).filter(isVisible);
}

function focusInitial(modal: HTMLElement) {
  if (!modal.isConnected || modal.contains(document.activeElement)) return;
  const preferred = modal.querySelector<HTMLElement>("[data-modal-initial-focus]");
  const target = preferred && isVisible(preferred) ? preferred : getFocusableElements(modal)[0] ?? modal;
  target.focus({ preventScroll: true });
}

export function ModalFocusManager() {
  useEffect(() => {
    const layers: FocusLayer[] = [];
    const lastFocusedInside = new WeakMap<HTMLElement, HTMLElement>();
    let lastFocusedOutside = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let frame = 0;

    const scheduleInitialFocus = (modal: HTMLElement) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => focusInitial(modal));
    };

    const restoreFocus = (layer: FocusLayer) => {
      const opener = layer.opener;
      queueMicrotask(() => {
        if (!opener?.isConnected) return;
        const top = getTopModal();
        if (!top || top.contains(opener)) opener.focus({ preventScroll: true });
      });
    };

    const reconcile = () => {
      const visibleModals = getVisibleModals();
      const visibleSet = new Set(visibleModals);

      while (layers.length && !visibleSet.has(layers.at(-1)!.modal)) {
        const closed = layers.pop()!;
        if (closed.addedTabIndex) closed.modal.removeAttribute("tabindex");
        restoreFocus(closed);
      }

      const top = visibleModals.at(-1) ?? null;
      const current = layers.at(-1)?.modal ?? null;
      if (!top || top === current) return;

      const parent = current;
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const opener = parent
        ? lastFocusedInside.get(parent) ?? (active && parent.contains(active) ? active : parent)
        : lastFocusedOutside;
      const addedTabIndex = !top.hasAttribute("tabindex");
      if (addedTabIndex) top.tabIndex = -1;
      layers.push({ modal: top, opener, addedTabIndex });
      scheduleInitialFocus(top);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const modal = getTopModal();
      if (!modal) return;

      const focusable = getFocusableElements(modal);
      if (!focusable.length) {
        event.preventDefault();
        modal.focus({ preventScroll: true });
        return;
      }

      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const activeIndex = active ? focusable.indexOf(active) : -1;
      const wrapTarget = getFocusWrapTarget(focusable.length, activeIndex, event.shiftKey);
      if (wrapTarget === null) return;

      event.preventDefault();
      focusable[wrapTarget].focus({ preventScroll: true });
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const registeredTop = layers.at(-1)?.modal ?? null;
      if (registeredTop?.contains(target)) {
        lastFocusedInside.set(registeredTop, target);
        return;
      }

      const domTop = getTopModal();
      if (!domTop) {
        lastFocusedOutside = target;
        return;
      }

      // React may autofocus an element in a newly mounted dialog before the
      // MutationObserver has registered that dialog. Do not overwrite the
      // opener in that window; reconcile() will use the previous focus state.
      if (domTop.contains(target) && domTop !== registeredTop) return;

      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const top = getTopModal();
        if (top && !top.contains(document.activeElement)) focusInitial(top);
      });
    };

    const observer = new MutationObserver(reconcile);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-hidden", "style", "class"] });
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    reconcile();

    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      window.cancelAnimationFrame(frame);
      for (const layer of layers) {
        if (layer.addedTabIndex) layer.modal.removeAttribute("tabindex");
      }
    };
  }, []);

  return null;
}

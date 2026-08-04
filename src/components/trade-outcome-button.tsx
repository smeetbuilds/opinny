"use client";

export function TradeOutcomeButton({
  outcomeId,
  label,
  className
}: {
  outcomeId: string;
  label: string;
  className: string;
}) {
  const openTicket = () => {
    window.dispatchEvent(new CustomEvent("opinny:trade", { detail: { outcomeId } }));
  };

  return (
    <button className={className} type="button" onClick={openTicket}>
      Trade {label}
    </button>
  );
}

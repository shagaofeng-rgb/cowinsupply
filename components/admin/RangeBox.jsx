"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { getAdminDateRange, getAdminRangeLabel } from "@/lib/adminDateRange";

const RANGE_LABELS = { day: "日", week: "周", month: "月", custom: "自定义" };

export default function RangeBox() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const selected = getAdminDateRange(Object.fromEntries(searchParams.entries()));
  const [customFrom, setCustomFrom] = useState(selected.from);
  const [customTo, setCustomTo] = useState(selected.to);

  function updateRange(range, values = {}) {
    const next = getAdminDateRange({ range, ...values });
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next.range);
    params.set("from", next.from);
    params.set("to", next.to);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function submitCustom(event) {
    event.preventDefault();
    if (customFrom && customTo && customFrom <= customTo) updateRange("custom", { from: customFrom, to: customTo });
  }

  return (
    <section className="range-box" aria-label="时间范围">
      <small>时间范围</small>
      <span>当前查看：{getAdminRangeLabel(selected)}</span>
      <div className="range-options">
        {Object.entries(RANGE_LABELS).map(([range, label]) => (
          <button
            className={selected.range === range ? "is-active" : ""}
            type="button"
            aria-pressed={selected.range === range}
            key={range}
            onClick={() => updateRange(range, range === "custom" ? { from: customFrom, to: customTo } : {})}
          >
            {label}
          </button>
        ))}
      </div>
      {selected.range === "custom" ? (
        <form className="range-custom" onSubmit={submitCustom}>
          <label>开始<input type="date" value={customFrom} max={customTo} onChange={(event) => setCustomFrom(event.target.value)} /></label>
          <label>结束<input type="date" value={customTo} min={customFrom} onChange={(event) => setCustomTo(event.target.value)} /></label>
          <button type="submit">应用</button>
        </form>
      ) : null}
      <button className="range-refresh" type="button" onClick={() => startTransition(() => router.refresh())} disabled={isPending}>
        {isPending ? "刷新中..." : "刷新当前范围"}
      </button>
    </section>
  );
}

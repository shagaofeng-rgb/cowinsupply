"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { getAdminDateRange, getAdminRangeLabel } from "@/lib/adminDateRange";

const RANGE_LABELS = { day: "今天", week: "本周", month: "本月", ninety: "90天", custom: "自定义" };

export default function RangeBox() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const selected = getAdminDateRange(Object.fromEntries(searchParams.entries()));
  const [customFrom, setCustomFrom] = useState(selected.from);
  const [customTo, setCustomTo] = useState(selected.to);
  const [showCustom, setShowCustom] = useState(selected.range === "custom");

  function updateRange(range, values = {}) {
    const next = getAdminDateRange({ range, ...values });
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next.range);
    params.set("from", next.from);
    params.set("to", next.to);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function submitCustom(event) {
    event.preventDefault();
    if (customFrom && customTo && customFrom <= customTo) updateRange("custom", { from: customFrom, to: customTo });
  }

  function selectRange(range) {
    if (range === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    updateRange(range);
  }

  return (
    <section className="range-box" aria-label="时间范围">
      <small>时间范围</small>
      <span>当前查看：{getAdminRangeLabel(selected)}（北京时间）</span>
      <div className="range-options">
        {Object.entries(RANGE_LABELS).map(([range, label]) => (
          <button
            className={selected.range === range ? "is-active" : ""}
            type="button"
            aria-pressed={selected.range === range}
            key={range}
            disabled={isPending}
            onClick={() => selectRange(range)}
          >
            {label}
          </button>
        ))}
      </div>
      {showCustom ? (
        <form className="range-custom" onSubmit={submitCustom}>
          <label>开始<input type="date" value={customFrom} max={customTo} required onChange={(event) => setCustomFrom(event.target.value)} /></label>
          <label>结束<input type="date" value={customTo} min={customFrom} max={getAdminDateRange().to} required onChange={(event) => setCustomTo(event.target.value)} /></label>
          <button type="submit">应用</button>
        </form>
      ) : null}
      <button className="range-refresh" type="button" onClick={() => startTransition(() => router.refresh())} disabled={isPending}>
        {isPending ? "刷新中..." : "刷新当前范围"}
      </button>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPriceEUR } from "@/lib/utils";

// Fallbacks mirror the defaults in lib/settings/config.ts. In practice the product
// page passes the admin-managed values (Настройки → Лизинг и финансиране) as props,
// so editing the rate there updates every calculator site-wide.
const DEFAULT_RATE_PCT = 6.9;
const DEFAULT_DOWN_PCT = 20;
const DEFAULT_TERM = 60;
const DEFAULT_TERMS = [12, 24, 36, 48, 60, 72, 84];

export function FinancingCalculator({
  price,
  annualRatePct = DEFAULT_RATE_PCT,
  downPaymentPct = DEFAULT_DOWN_PCT,
  termMonths = DEFAULT_TERM,
  terms = DEFAULT_TERMS,
}: {
  price: number;
  /** Indicative annual interest rate, in percent (e.g. 6.9). */
  annualRatePct?: number;
  /** Initial down-payment, in percent. */
  downPaymentPct?: number;
  /** Initially-selected loan term, in months. */
  termMonths?: number;
  /** Loan terms offered as quick-select buttons. */
  terms?: number[];
}) {
  const [downPct, setDownPct] = useState(downPaymentPct);
  const [term, setTerm] = useState(termMonths);

  // Let the down-payment slider always reach the configured starting value.
  const sliderMax = Math.max(60, downPaymentPct);

  const { down, financed, monthly } = useMemo(() => {
    const down = Math.round((price * downPct) / 100);
    const financed = price - down;
    const r = annualRatePct / 100 / 12;
    const n = term;
    const monthly =
      financed > 0 && r > 0
        ? (financed * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
        : financed > 0
          ? financed / n // 0% interest → straight-line
          : 0;
    return { down, financed, monthly: Math.round(monthly) };
  }, [price, downPct, term, annualRatePct]);

  return (
    <div className="panel-metal edge-light rounded-[1.25rem] p-6 md:p-10">
      <p className="label-fine text-fg-subtle">Калкулатор лизинг</p>
      <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg md:text-3xl">
        Ориентировъчна месечна вноска
      </h3>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="range-accent space-y-8">
          {/* Down payment */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="down" className="text-sm text-fg-muted">
                Първоначална вноска
              </label>
              <span className="text-sm font-medium text-fg">
                {downPct}% · {formatPriceEUR(down)}
              </span>
            </div>
            <input
              id="down"
              type="range"
              min={0}
              max={sliderMax}
              step={5}
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="mt-4 w-full accent-[var(--color-accent)]"
            />
          </div>

          {/* Term */}
          <div>
            <label htmlFor="term" className="text-sm text-fg-muted">
              Срок (месеци)
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {terms.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerm(t)}
                  style={
                    term === t
                      ? { background: "linear-gradient(180deg,var(--va,var(--color-accent)),var(--va-deep,var(--color-accent-deep)))" }
                      : undefined
                  }
                  className={
                    "rounded-full border px-4 py-2 text-sm tabular-nums transition-colors " +
                    (term === t
                      ? "border-accent text-ink"
                      : "border-line-strong text-fg-muted hover:border-accent hover:text-fg")
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result — champagne */}
        <div className="panel-gold flex flex-col justify-between rounded-xl p-6">
          <div>
            <p className="label-fine" style={{ color: "var(--vg-deep, var(--color-fg-subtle))" }}>
              Месечна вноска от
            </p>
            <p className="text-gold-num mt-2 font-display text-display-2xs font-extrabold tabular-nums">
              {formatPriceEUR(monthly)}
            </p>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt style={{ color: "var(--vg-deep, var(--color-fg-muted))" }}>Финансирана сума</dt>
                <dd className="tabular-nums" style={{ color: "var(--vg-pale, var(--color-fg))" }}>{formatPriceEUR(financed)}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "var(--vg-deep, var(--color-fg-muted))" }}>Лихва (год.)</dt>
                <dd style={{ color: "var(--vg-pale, var(--color-fg))" }}>{annualRatePct.toFixed(1)}%</dd>
              </div>
            </dl>
          </div>
          <Link
            href="/lizing"
            className="group mt-6 inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
            style={{ color: "var(--vg, var(--color-accent))" }}
          >
            Пълно лизингово запитване
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-fg-subtle">
        * Изчислението е ориентировъчно и не представлява обвързваща оферта. Точните условия се определят индивидуално.
      </p>
    </div>
  );
}

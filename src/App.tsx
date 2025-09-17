import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Sun, Moon, Download, Globe2 } from "lucide-react";

// ---------------- i18n ----------------
const dict = {
  ru: {
    title: "Снижаем вход (DCA с профита)",
    sectionA: "Котировка, которую понижаем",
    entryPrice: "Цена входа",
    qty: "Количество монет",
    sectionB: "За счёт чего понижаем",
    profit: "Профит",
    buyPrice: "Цена откупа",
    formula: "Формула",
    calc: "Посчитать",
    newEntry: "Новая цена входа",
    buyFor: "Откупаем на",
    atPrice: "по",
    newQty: "Новое количество монет",
    memo: "Памятка",
    memo1: "Используем только прибыль S.",
    memo2: "Снижение из-за роста количества монет при прежней сумме затрат.",
    memo3: "Если Pᵦ ≥ P₀ — эффект минимален.",
    memo4: "Учтите комиссии биржи.",
    theme: "Тема",
    light: "Светлая",
    dark: "Тёмная",
    lang: "Язык",
    currency: "Валюта",
    screenshot: "Скриншот‑памятка",
    prices: "Текущие цены (Bitfinex)",
    date: "Дата",
  },
  en: {
    title: "Lower Entry (DCA from Profit)",
    sectionA: "Position to Average Down",
    entryPrice: "Entry Price",
    qty: "Quantity",
    sectionB: "How We Lower Entry",
    profit: "Profit",
    buyPrice: "Buy Price",
    formula: "Formula",
    calc: "Calculate",
    newEntry: "New Average Entry",
    buyFor: "Buy for",
    atPrice: "at",
    newQty: "New Quantity",
    memo: "Notes",
    memo1: "Use profit S only.",
    memo2: "Entry drops because quantity increases.",
    memo3: "If Pᵦ ≥ P₀ — effect is tiny.",
    memo4: "Include exchange fees.",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    lang: "Language",
    currency: "Currency",
    screenshot: "Screenshot memo",
    prices: "Live Prices (Bitfinex)",
    date: "Date",
  },
};

// -------------- Helpers ---------------
const num = (v: string | number, d = 8) => {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
};

const fmtQty = (v: number, coin: string, locale = "en-US") =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: coin === "BTC" ? 8 : 6 }).format(v);

const currencyFmt = (ccy: string, locale: string, frac = 2) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: ccy, maximumFractionDigits: frac });

function calcNewEntry(P0: number, Q0: number, S: number, Pb: number) {
  const buyQty = Pb > 0 ? S / Pb : 0;
  const Q1 = Q0 + buyQty;
  const newEntryUSD = Q1 > 0 ? (P0 * Q0) / Q1 : 0;
  const dropPct = P0 > 0 ? (1 - newEntryUSD / P0) * 100 : 0;
  return { buyQty, Q1, newEntryUSD, dropPct };
}

export default function AveragingCalculator() {
  const [coin, setCoin] = useState<"BTC" | "ETH">("BTC");
  const [lang, setLang] = useState<"ru" | "en">("ru");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ccy, setCcy] = useState<"USD" | "RUB" | "AUD">("USD");

  // Canonical USD
  const [entryPriceUSD, setEntryPriceUSD] = useState<number>(110000);
  const [entryQty, setEntryQty] = useState<number>(0.24);
  const [spendUSD, setSpendUSD] = useState<number>(357);
  const [buyPriceUSD, setBuyPriceUSD] = useState<number>(107000);

  // FX & prices
  const [fx, setFx] = useState<{ [k: string]: number }>({ USD: 1, RUB: 90, AUD: 1.5 });
  const [px, setPx] = useState<{ BTC: number; ETH: number }>({ BTC: 0, ETH: 0 });

  const t = dict[lang];
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  const fmt = currencyFmt(ccy, locale, ccy === "RUB" ? 0 : 2);
  const toDisplay = (usdVal: number) => usdVal * fx[ccy];
  const fromDisplay = (valDisp: number) => (fx[ccy] ? valDisp / fx[ccy] : 0);

  // Theme (inline, без okLCH)
  const isDark = theme === "dark";
  const surface = {
    bg: isDark ? "#0a0a0a" : "#ffffff",
    text: isDark ? "#e5e7eb" : "#0f172a",
    sub: isDark ? "#9ca3af" : "#475569",
    border: isDark ? "#1f2937" : "#e5e7eb",
    muted: isDark ? "#111827" : "#f8fafc",
    accent: isDark ? "#22c55e" : "#16a34a",
    highlight: isDark ? "#facc15" : "#ca8a04",
    inputBg: isDark ? "#0b0f19" : "#ffffff",
    inputText: isDark ? "#e5e7eb" : "#0f172a",
  } as const;

  useEffect(() => {
    async function fetchFx() {
      try {
        const r = await fetch("https://open.er-api.com/v6/latest/USD");
        const j = await r.json();
        const rates = j?.rates || {};
        if (rates.RUB && rates.AUD) setFx({ USD: 1, RUB: rates.RUB, AUD: rates.AUD });
      } catch (_) {}
    }
    fetchFx();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [btc, eth] = await Promise.all([
          fetch("https://api-pub.bitfinex.com/v2/ticker/tBTCUSD").then(r => r.json()),
          fetch("https://api-pub.bitfinex.com/v2/ticker/tETHUSD").then(r => r.json()),
        ]);
        setPx({ BTC: Number(btc?.[6] || 0), ETH: Number(eth?.[6] || 0) });
      } catch (_) {}
    }
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const entryPriceDisp = toDisplay(entryPriceUSD);
  const buyPriceDisp = toDisplay(buyPriceUSD);
  const spendDisp = toDisplay(spendUSD);

  const outcome = useMemo(
    () => calcNewEntry(num(entryPriceUSD, 2), num(entryQty, 8), num(spendUSD, 2), num(buyPriceUSD, 2)),
    [entryPriceUSD, entryQty, spendUSD, buyPriceUSD]
  );

  const shotRef = useRef<HTMLDivElement | null>(null);
  const savePng = async () => {
    if (!shotRef.current) return;
    const canvas = await html2canvas(shotRef.current, { backgroundColor: surface.bg });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `averaging-memo-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <main style={{ background: surface.bg, color: surface.text, minHeight: "100vh" }} className="mx-auto max-w-5xl p-6 md:p-10">
      {/* Header */}
      <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3 items-center">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{t.title}</h1>

        <div className="flex items-center gap-2">
          <span style={{ color: surface.sub }} className="text-sm">{t.lang}</span>
          <Select value={lang} onValueChange={(v: any) => setLang(v)}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">RU</SelectItem>
              <SelectItem value="en">EN</SelectItem>
            </SelectContent>
          </Select>

          <span style={{ color: surface.sub }} className="ml-3 text-sm">{t.theme}</span>
          <Button variant="outline" className="gap-2" onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
            {isDark ? t.light : t.dark}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: surface.sub }} className="text-sm">{t.currency}</span>
          <Select value={ccy} onValueChange={(v: any) => setCcy(v)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="RUB">RUB</SelectItem>
              <SelectItem value="AUD">AUD</SelectItem>
            </SelectContent>
          </Select>
          <span style={{ color: surface.sub }} className="ml-3 text-xs flex items-center gap-1"><Globe2 className="h-3.5 w-3.5"/> {t.prices}</span>
        </div>
      </div>

      {/* Live prices */}
      <div style={{ borderColor: surface.border, background: surface.muted }} className="mb-4 rounded-xl border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 text-sm">
          <div className="font-medium">BTC</div>
          <div>{fmt.format(px.BTC * fx[ccy])}</div>
          <div className="font-medium">ETH</div>
          <div>{fmt.format(px.ETH * fx[ccy])}</div>
        </div>
        <div style={{ color: surface.sub }} className="px-4 pb-3 text-xs">{t.date}: {new Date().toLocaleString(locale)}</div>
      </div>

      {/* Inputs */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card style={{ background: surface.bg, borderColor: surface.border }} className="shadow-sm border">
          <CardContent className="p-6 space-y-4">
            <p className="text-base font-semibold">{t.sectionA}</p>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: surface.sub }}>
                <Label className="text-sm font-medium" style={{ color: surface.text }}>{t.entryPrice}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ border: `1px solid ${surface.border}` }}>
                      <Info className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">{lang === 'ru' ? 'Текущая средняя цена входа по позиции.' : 'Current average entry for your position.'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input inputMode="decimal" value={Number.isFinite(entryPriceDisp) ? String(Number(entryPriceDisp.toFixed(ccy==='RUB'?0:2))) : ''}
                     onChange={(e) => setEntryPriceUSD(fromDisplay(parseFloat(e.target.value.replace(",", ".")) || 0))}
                     style={{ background: surface.inputBg, color: surface.inputText, borderColor: surface.border }} />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: surface.sub }}>
                <Label className="text-sm font-medium" style={{ color: surface.text }}>{t.qty}</Label>
              </div>
              <Input inputMode="decimal" value={String(entryQty)} onChange={(e) => setEntryQty(parseFloat(e.target.value.replace(",", ".")) || 0)}
                     style={{ background: surface.inputBg, color: surface.inputText, borderColor: surface.border }} />
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: surface.bg, borderColor: surface.border }} className="shadow-sm border">
          <CardContent className="p-6 space-y-4">
            <p className="text-base font-semibold">{t.sectionB}</p>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: surface.sub }}>
                <Label className="text-sm font-medium" style={{ color: surface.text }}>{t.profit} ({ccy})</Label>
              </div>
              <Input inputMode="decimal" value={Number.isFinite(spendDisp) ? String(Number(spendDisp.toFixed(ccy==='RUB'?0:2))) : ''}
                     onChange={(e) => setSpendUSD(fromDisplay(parseFloat(e.target.value.replace(",", ".")) || 0))}
                     style={{ background: surface.inputBg, color: surface.inputText, borderColor: surface.border }} />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: surface.sub }}>
                <Label className="text-sm font-medium" style={{ color: surface.text }}>{t.buyPrice}</Label>
              </div>
              <Input inputMode="decimal" value={Number.isFinite(buyPriceDisp) ? String(Number(buyPriceDisp.toFixed(ccy==='RUB'?0:2))) : ''}
                     onChange={(e) => setBuyPriceUSD(fromDisplay(parseFloat(e.target.value.replace(",", ".")) || 0))}
                     style={{ background: surface.inputBg, color: surface.inputText, borderColor: surface.border }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3 items-center justify-between">
        <div className="text-sm flex items-center gap-2" style={{ color: surface.sub }}>
          <Info className="h-4 w-4"/> {t.formula}: <code className="rounded px-1 py-0.5 text-xs" style={{ background: surface.muted }}>P₁ = (P₀×Q₀) / (Q₀ + S/Pᵦ)</code>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={savePng}><Download className="h-4 w-4"/>{t.screenshot}</Button>
          <Button variant="outline" className="gap-2" onClick={() => setCoin(coin === 'BTC' ? 'ETH' : 'BTC')}>{coin}</Button>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card style={{ background: surface.bg, borderColor: surface.border }} className="md:col-span-2 shadow-sm border">
          <CardContent className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <p style={{ color: surface.sub }}>{t.newEntry}</p>
              <div className="flex items-end gap-3">
                <div className="text-4xl font-bold leading-none" style={{ color: surface.highlight, background: surface.muted, border: `1px solid ${surface.border}`, padding: '8px 12px', borderRadius: 12 }}>
                  {fmt.format(outcome.newEntryUSD * fx[ccy])}
                </div>
                <div style={{ color: surface.accent, fontWeight: 600 }} className="text-lg">−{outcome.dropPct.toFixed(1)}%</div>
              </div>

              <div className="pt-4 space-y-2">
                <p style={{ color: surface.sub }}>
                  {t.buyFor} <span style={{ color: surface.text, fontWeight: 600 }}>{fmt.format(spendUSD * fx[ccy])}</span>
                </p>
                <div className="text-2xl font-semibold" style={{ color: surface.text }}>
                  {fmtQty(outcome.buyQty, coin, locale)} {coin} <span className="text-sm align-super" style={{ color: surface.sub }}>{t.atPrice} {fmt.format(buyPriceUSD * fx[ccy])}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <p style={{ color: surface.sub }}>{t.newQty}</p>
                <div className="text-2xl font-semibold" style={{ color: surface.text }}>{fmtQty(outcome.Q1, coin, locale)} {coin}</div>
              </div>
            </div>

            <div style={{ borderColor: surface.border, background: surface.muted }} className="rounded-2xl border p-4">
              <p style={{ color: surface.sub }} className="text-sm">
                {lang === 'ru' ? (
                  <>Не забудь сразу сделать откуп на сумму профита и записать <b>новую цену входа</b> и <b>новое количество монет</b> в свою таблицу учёта.</>
                ) : (
                  <>Buy immediately with profit and record the <b>new entry price</b> and <b>new quantity</b> in your tracker.</>
                )}
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: surface.border }}>
                <table className="w-full text-sm">
                  <thead style={{ background: surface.muted }}>
                    <tr>
                      <th className="p-2 text-left font-semibold">Coin</th>
                      <th className="p-2 text-left font-semibold">{t.newEntry}</th>
                      <th className="p-2 text-left font-semibold">{t.qty}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2">{coin}</td>
                      <td className="p-2">{fmt.format(outcome.newEntryUSD * fx[ccy])}</td>
                      <td className="p-2">{fmtQty(outcome.Q1, coin, locale)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: surface.bg, borderColor: surface.border }} className="shadow-sm border">
          <CardContent className="p-6 space-y-4">
            <p className="font-semibold">{t.memo}</p>
            <ul className="list-disc pl-5 text-sm" style={{ color: surface.sub }}>
              <li>{t.memo1}</li>
              <li>{t.memo2}</li>
              <li>{t.memo3}</li>
              <li>{t.memo4}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Screenshot memo (safe inline colors) */}
      <div ref={shotRef} style={{ background: surface.bg, color: surface.text, border: `1px solid ${surface.border}`, borderRadius: 16, padding: 16, marginTop: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          {t.title} — {coin}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14 }}>
          <div>
            <div style={{ color: surface.sub }}>{t.entryPrice}</div>
            <div>{fmt.format(entryPriceUSD * fx[ccy])}</div>
          </div>
          <div>
            <div style={{ color: surface.sub }}>{t.qty}</div>
            <div>{fmtQty(entryQty, coin, locale)} {coin}</div>
          </div>
          <div>
            <div style={{ color: surface.sub }}>{t.buyFor}</div>
            <div>{fmt.format(spendUSD * fx[ccy])}</div>
          </div>
          <div>
            <div style={{ color: surface.sub }}>{t.buyPrice}</div>
            <div>{fmt.format(buyPriceUSD * fx[ccy])}</div>
          </div>
        </div>
        <hr style={{ border: 0, borderTop: `1px solid ${surface.border}`, margin: "12px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ color: surface.sub }}>{t.newEntry}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt.format(outcome.newEntryUSD * fx[ccy])}</div>
          </div>
          <div>
            <div style={{ color: surface.sub }}>{t.newQty}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtQty(outcome.Q1, coin, locale)} {coin}</div>
          </div>
          <div style={{ color: surface.accent, fontWeight: 600 }}>{`−${outcome.dropPct.toFixed(1)}%`}</div>
          <div style={{ textAlign: "right", color: surface.sub, fontSize: 12 }}>
            {new Date().toLocaleString(locale)}
          </div>
        </div>
      </div>

      <div style={{ color: surface.sub }} className="mt-10 text-xs">
        {lang === 'ru' ? (
          <>Инструмент для обучения. Курс валют — open.er-api.com, цены — Bitfinex. Не является финансовой рекомендацией.</>
        ) : (
          <>Educational tool. FX from open.er-api.com, prices from Bitfinex. Not financial advice.</>
        )}
      </div>
    </main>
  );
}

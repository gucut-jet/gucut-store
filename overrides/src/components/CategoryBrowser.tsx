"use client";

import { useEffect, useMemo, useState } from "react";
import { type Product, type CategoryRef } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

const priceRanges = [
  { label: "ทุกราคา", min: 0, max: Infinity },
  { label: "ต่ำกว่า ฿100", min: 0, max: 100 },
  { label: "฿100 – ฿1,000", min: 100, max: 1000 },
  { label: "฿1,000 – ฿10,000", min: 1000, max: 10000 },
  { label: "฿10,000 ขึ้นไป", min: 10000, max: Infinity },
];

const PAGE_SIZE = 30;

// หน้าหมวดหมู่ + ตัวกรองราคา — หมวดหมู่มาจากคอลเลคชันจริงใน Shopify (props.categories)
export default function CategoryBrowser({
  products,
  categories,
}: {
  products: Product[];
  categories: (CategoryRef & { count: number })[];
}) {
  const [tab, setTab] = useState<string>("all");
  const [range, setRange] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [q, setQ] = useState("");

  // อ่าน ?tab=handle จาก URL ฝั่ง client (รองรับ static export ที่ไม่มีเซิร์ฟเวอร์อ่าน searchParams)
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("tab");
    if (initial) setTab(initial);
  }, []);

  const filtered = useMemo(() => {
    const r = priceRanges[range];
    const query = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (tab === "all" || p.categories.some((c) => c.handle === tab)) &&
        p.price >= r.min &&
        p.price <= r.max &&
        (query === "" || p.title.toLowerCase().includes(query))
    );
  }, [tab, range, q, products]);

  const shown = filtered.slice(0, visible);

  return (
    <main>
      <header className="sticky top-0 z-40 bg-steel-900/95 backdrop-blur">
        <h1 className="px-4 pt-3 font-heading text-lg font-bold">หมวดหมู่สินค้า</h1>

        {/* ค้นหาในหมวดหมู่ */}
        <div className="px-3 pt-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            type="search"
            placeholder="ค้นหาในหมวดหมู่นี้…"
            className="w-full rounded-full border border-steel-700 bg-steel-800 px-3.5 py-2 text-sm text-gray-100 placeholder-steel-300 outline-none"
          />
        </div>

        {/* แท็บหมวด — ไดนามิกจากคอลเลคชันจริง */}
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-3 pb-2">
          <button
            onClick={() => {
              setTab("all");
              setVisible(PAGE_SIZE);
            }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === "all" ? "bg-safety font-semibold text-white" : "bg-steel-800 text-gray-200"
            }`}
          >
            ทั้งหมด ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.handle}
              onClick={() => {
                setTab(c.handle);
                setVisible(PAGE_SIZE);
              }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                tab === c.handle ? "bg-safety font-semibold text-white" : "bg-steel-800 text-gray-200"
              }`}
            >
              {c.title} ({c.count})
            </button>
          ))}
        </div>

        {/* ตัวกรองราคา */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-steel-800 px-3 pb-2.5">
          {priceRanges.map((r, i) => (
            <button
              key={r.label}
              onClick={() => {
                setRange(i);
                setVisible(PAGE_SIZE);
              }}
              className={`shrink-0 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                range === i
                  ? "border-safety bg-safety/15 font-semibold text-safety"
                  : "border-steel-700 text-steel-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-sm text-steel-300">
          ไม่มีสินค้าในเงื่อนไขนี้ ลองปรับตัวกรองดูครับ
        </p>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2 px-3">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="px-4 py-4 text-center">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-full border border-steel-700 bg-steel-800 px-5 py-2 text-sm font-medium text-gray-100"
              >
                โหลดเพิ่ม ({filtered.length - visible} รายการ)
              </button>
            </div>
          )}
        </>
      )}
      <p className="px-4 py-3 text-center text-xs text-steel-600">
        {shown.length} / {filtered.length} รายการ
      </p>
    </main>
  );
}

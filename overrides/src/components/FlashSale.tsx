"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, discountPercent, type Product } from "@/lib/products";

// นับถอยหลังถึงเที่ยงคืนวันนี้
function useCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => {
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      setLeft(Math.max(0, end.getTime() - Date.now()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor(left / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return [pad(Math.floor(s / 3600)), pad(Math.floor((s % 3600) / 60)), pad(s % 60)];
}

export default function FlashSale({ products }: { products: Product[] }) {
  const [h, m, s] = useCountdown();

  if (products.length === 0) return null;

  return (
    <section className="mt-3">
      {/* หัวแถบ + ตัวนับถอยหลัง */}
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-lg font-bold italic text-safety">⚡ FLASH SALE</h2>
          <div className="flex items-center gap-0.5 text-xs font-bold">
            {[h, m, s].map((v, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-safety">:</span>}
                <span className="rounded bg-steel-800 px-1.5 py-0.5 tabular-nums">{v}</span>
              </span>
            ))}
          </div>
        </div>
        <Link href="/categories" className="text-xs text-steel-300">
          ดูทั้งหมด ›
        </Link>
      </div>

      {/* แถวสินค้าเลื่อนแนวนอน */}
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-3 pb-1">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${encodeURIComponent(p.handle)}`}
            className="w-28 shrink-0 overflow-hidden rounded-lg bg-steel-800 active:scale-[0.97]"
          >
            <div className="relative aspect-square bg-white">
              <Image src={p.image} alt={p.title} fill sizes="112px" className="object-contain" />
              <span className="absolute left-0 top-0 rounded-br-lg bg-safety px-1.5 py-0.5 text-[10px] font-bold">
                -{discountPercent(p)}%
              </span>
            </div>
            <div className="p-1.5 text-center">
              <p className="font-heading text-sm font-semibold text-safety">{formatPrice(p.price)}</p>
              <p className="mt-1 truncate text-[10px] text-steel-300">{p.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

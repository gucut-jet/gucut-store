"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice, discountPercent, type Product } from "@/lib/products";
import { addToCart, cartCount } from "@/lib/cart";

// ลิงก์แชทของร้าน — เปลี่ยนเป็น LINE OA หรือ Messenger จริงได้ที่นี่
const CHAT_URL = "https://m.me/gucut1";

// หน้าสินค้าเต็ม: รูปสไลด์ / variant / วิดีโอ / สเปก / ปุ่มซื้อติดล่างจอ
export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const [img, setImg] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const variants = product.variants ?? [{ title: "มาตรฐาน", price: product.price, stock: 99 }];
  const [vIdx, setVIdx] = useState(0);
  const [toast, setToast] = useState("");
  const [count, setCount] = useState(0);
  const v = variants[vIdx];
  const off = discountPercent(product);

  // badge จำนวนในตะกร้า
  useEffect(() => {
    const load = () => setCount(cartCount());
    load();
    window.addEventListener("cart-updated", load);
    return () => window.removeEventListener("cart-updated", load);
  }, []);

  const add = () => {
    addToCart({
      productId: product.id,
      handle: product.handle,
      title: product.title,
      variant: v.title,
      price: v.price,
      image: product.image,
    });
    setToast("เพิ่มลงตะกร้าแล้ว ✓");
    setTimeout(() => setToast(""), 1600);
  };

  const buyNow = () => {
    add();
    router.push("/cart");
  };

  return (
    <main className="pb-36">
      {/* ปุ่มย้อนกลับลอยบนรูป */}
      <Link
        href="/"
        className="absolute left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
        aria-label="ย้อนกลับ"
      >
        ‹
      </Link>

      {/* รูปสไลด์ — ปัดดูได้ + จุดบอกตำแหน่ง */}
      <div className="relative">
        <div
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setImg(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {product.images.map((src, i) => (
            <div key={i} className="relative aspect-square w-full shrink-0 snap-center bg-white">
              <Image
                src={src}
                alt={`${product.title} รูปที่ ${i + 1}`}
                fill
                sizes="(max-width: 512px) 100vw, 512px"
                className="object-contain"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        <span className="absolute bottom-2 right-3 rounded-full bg-black/50 px-2 py-0.5 text-xs">
          {img + 1}/{product.images.length}
        </span>
      </div>

      {/* ราคา + ชื่อ */}
      <section className="px-4 pt-3">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-2xl font-bold text-safety">{formatPrice(v.price)}</span>
          {product.compareAtPrice && (
            <>
              <span className="text-sm text-steel-300 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
              <span className="rounded bg-safety/15 px-1.5 py-0.5 text-xs font-bold text-safety">
                -{off}%
              </span>
            </>
          )}
        </div>
        <h1 className="mt-1.5 font-heading text-lg font-semibold leading-snug">{product.title}</h1>
        <div className="mt-1 flex items-center gap-3 text-xs text-steel-300">
          {product.sold ? (
            <>
              <span>ขายแล้ว {product.sold.toLocaleString("th-TH")} ชิ้น</span>
              <span>·</span>
            </>
          ) : null}
          <span>{v.stock > 0 ? `คงเหลือ ${v.stock.toLocaleString("th-TH")}` : "สินค้าหมดชั่วคราว — สั่งจองได้"}</span>
        </div>
      </section>

      {/* ปุ่มวิดีโอ YouTube */}
      <section className="mt-3 px-4">
        {product.youtubeId ? (
          <>
            <button
              onClick={() => setShowVideo((s) => !s)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-600/60 bg-red-600/10 py-2.5 text-sm font-medium text-red-400"
            >
              ▶ {showVideo ? "ซ่อนวิดีโอ" : "ดูวิดีโอรีวิวสินค้านี้"}
            </button>
            {showVideo && (
              <div className="mt-2 aspect-video overflow-hidden rounded-lg">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${product.youtubeId}`}
                  title="วิดีโอรีวิว"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </>
        ) : (
          <a
            href="https://www.youtube.com/results?search_query=NEWWAVE+Legends"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-600/60 bg-red-600/10 py-2.5 text-sm font-medium text-red-400"
          >
            ▶ ชมรีวิวที่ช่อง NEWWAVE Legends
          </a>
        )}
      </section>

      {/* ตัวเลือกรุ่น/ขนาด */}
      {variants.length > 1 && (
        <section className="mt-4 px-4">
          <h2 className="font-heading text-sm font-semibold text-steel-300">
            เลือกรุ่น / ขนาด ({variants.length} ตัวเลือก)
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((vt, i) => (
              <button
                key={vt.title}
                onClick={() => setVIdx(i)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  i === vIdx
                    ? "border-safety bg-safety/15 font-semibold text-safety"
                    : "border-steel-700 bg-steel-800 text-gray-200"
                }`}
              >
                {vt.title} · {formatPrice(vt.price)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* สเปกตาราง */}
      <section className="mt-4 px-4">
        <h2 className="font-heading text-sm font-semibold text-steel-300">ข้อมูลสินค้า</h2>
        <table className="mt-2 w-full overflow-hidden rounded-lg text-sm">
          <tbody>
            {specRows(product).map(([k, val]) => (
              <tr key={k} className="border-b border-steel-900 bg-steel-800 last:border-0">
                <td className="w-1/3 px-3 py-2 text-steel-300">{k}</td>
                <td className="px-3 py-2">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* รายละเอียด */}
      {product.description && (
        <section className="mt-4 px-4">
          <h2 className="font-heading text-sm font-semibold text-steel-300">รายละเอียด</h2>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-gray-200">
            {product.description.split("•").map(
              (part, i) =>
                part.trim() && (
                  <li key={i} className={i === 0 ? "font-medium" : "flex gap-2"}>
                    {i > 0 && <span className="text-safety">•</span>}
                    {part.trim()}
                  </li>
                )
            )}
          </ul>
        </section>
      )}

      {/* toast แจ้งเพิ่มตะกร้า */}
      {toast && (
        <div className="fixed inset-x-0 bottom-36 z-50 flex justify-center">
          <span className="rounded-full bg-black/80 px-4 py-2 text-sm text-white">{toast}</span>
        </div>
      )}

      {/* แถบซื้อสไตล์ TikTok Shop — แทนที่ bottom nav ในหน้าสินค้า */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-steel-700 bg-steel-800/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-1.5 px-3 py-2">
          {/* ร้านค้า → หน้าแรก */}
          <Link href="/" className="flex w-11 shrink-0 flex-col items-center gap-0.5 text-[10px] text-steel-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5 5 4h14l2 5.5M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M4.5 12v8h15v-8M9.5 20v-5h5v5" />
            </svg>
            ร้านค้า
          </Link>
          {/* แชทกับร้าน */}
          <a
            href={CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-11 shrink-0 flex-col items-center gap-0.5 text-[10px] text-steel-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12Z" />
            </svg>
            แชท
          </a>
          {/* เพิ่มลงตะกร้า (ไอคอนกลม + badge) */}
          <button
            onClick={add}
            aria-label="เพิ่มลงตะกร้า"
            className="relative flex h-11 w-14 shrink-0 items-center justify-center rounded-full bg-safety/15 text-safety active:scale-95"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.76L21 8H6" />
              <circle cx="10" cy="20" r="1.4" fill="currentColor" />
              <circle cx="17.5" cy="20" r="1.4" fill="currentColor" />
              <path strokeLinecap="round" d="M13.5 10.5h4M15.5 8.5v4" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
          {/* ซื้อเลย + ราคา */}
          <button
            onClick={buyNow}
            className="flex-1 rounded-full bg-safety px-4 py-1.5 text-center active:scale-[0.98]"
          >
            <span className="block font-heading text-base font-bold leading-tight text-white">ซื้อเลย</span>
            <span className="block text-[11px] font-medium leading-tight text-white/90">{formatPrice(v.price)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}

// แถวสเปกจากข้อมูลจริง (ไม่แต่งสเปกเครื่องเอง)
function specRows(p: Product): [string, string][] {
  const brand = /kingkong/i.test(p.title) ? "KingKong" : /newwave/i.test(p.title) ? "NEWWAVE" : "GUCUT";
  const rows: [string, string][] = [
    ["แบรนด์", brand],
    ["หมวดหมู่", p.categories.map((c) => c.title).join(", ") || "อะไหล่/อุปกรํ"],
  ];
  if (p.title.includes("มีทะเบียน")) rows.push(["เอกสาร", "มีเอกสารพร้อมขึ้นทะเบียน (ลซ.1)"]);
  if (p.variants && p.variants.length > 1)
    rows.push(["ตัวเลือก", `${p.variants.length} ขนาด (${p.variants[0].title} – ${p.variants[p.variants.length - 1].title})`]);
  rows.push(["จัดส่ง", "ส่งไวทั่วไทย"]);
  return rows;
}

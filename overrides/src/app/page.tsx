import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import BannerSlider from "@/components/BannerSlider";
import FlashSale from "@/components/FlashSale";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/shopify";
import { deriveCategories, getFlashSaleProducts } from "@/lib/products";

const FEATURED_LIMIT = 24;

// หน้าแรก — feed สไตล์ Shopee ต่อกับสินค้าจริงทั้งหมดจาก Shopify
export default async function HomePage() {
  const products = await getProducts();
  const categories = deriveCategories(products);
  const flashSale = getFlashSaleProducts(products);
  const featured = products.slice(0, FEATURED_LIMIT);

  return (
    <main>
      <SearchBar />
      <BannerSlider />
      <FlashSale products={flashSale} />

      {/* หมวดหมู่ทั้งหมด — สไตล์ Shopify collection tiles */}
      {categories.length > 0 && (
        <section className="mt-4 px-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">หมวดหมู่สินค้า</h2>
            <Link href="/categories" className="text-xs text-steel-300">
              ดูทั้งหมด ›
            </Link>
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <Link
                key={c.handle}
                href={`/categories?tab=${encodeURIComponent(c.handle)}`}
                className="flex shrink-0 flex-col items-center gap-1 rounded-lg bg-steel-800 px-3 py-2.5 active:scale-[0.97]"
              >
                <span className="text-sm font-medium text-gray-100">{c.title}</span>
                <span className="text-[11px] text-steel-300">{c.count} รายการ</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* grid สินค้า 2 คอลัมน์ */}
      <section className="mt-4 px-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">
            สินค้าแนะนำ <span className="text-safety">🔥</span>
          </h2>
          {products.length > FEATURED_LIMIT && (
            <Link href="/categories" className="text-xs text-steel-300">
              ดูสินค้าทั้งหมด ({products.length}) ›
            </Link>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <footer className="mt-8 px-3 pb-4 text-center text-xs text-steel-600">
        GUCUT — เลื่อยยนต์ NEWWAVE / KingKong ของแท้ · gucut.com
      </footer>
    </main>
  );
}

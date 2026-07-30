import Image from "next/image";
import Link from "next/link";
import { formatPrice, discountPercent, type Product } from "@/lib/products";

// การ์ดสินค้าแบบ Shopee: รูป + ชื่อ + ราคา + ป้ายลด + คงเหลือ
export default function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product);
  const outOfStock = product.inventory <= 0 && !(product.variants?.some((v) => v.stock > 0));
  return (
    <Link
      href={`/products/${encodeURIComponent(product.handle)}`}
      className="overflow-hidden rounded-lg bg-steel-800 transition-transform active:scale-[0.97]"
    >
      <div className="relative aspect-square bg-white">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(max-width: 512px) 50vw, 256px"
          className="object-contain"
        />
        {off > 0 && (
          <span className="absolute right-0 top-0 rounded-bl-lg bg-safety px-1.5 py-0.5 text-xs font-bold text-white">
            -{off}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
            สินค้าหมดชั่วคราว
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="clamp-2 min-h-[2.5rem] text-[13px] leading-tight text-gray-200">
          {product.title}
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-heading text-base font-semibold text-safety">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-[11px] text-steel-300 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-steel-300">
          {product.inventory > 0 ? `คงเหลือ ${product.inventory.toLocaleString("th-TH")} ชิ้น` : "แจ้งเตือนเมื่อมีสินค้า"}
        </p>
      </div>
    </Link>
  );
}

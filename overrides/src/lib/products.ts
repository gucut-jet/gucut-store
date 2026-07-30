// ข้อมูลสินค้า — โครงสร้างกลางที่ทั้งข้อมูลจริงจาก Shopify (lib/shopify.ts) แลละ mock (ไฟล์นี้) ใช้ร่วมกัน

// หมวดหมู่ = คอลเลคชันจริงจาก Shopify (ไม่ตายตัวอีกต่อไป)
export interface CategoryRef {
  id: string;
  title: string;
  handle: string;
}

export interface Variant {
  title: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

export interface Product {
  id: string; // Shopify GID จริง
  handle: string;
  title: string;
  price: number; // ราคาเริ่มต้น (บาท)
  compareAtPrice?: number; // ราคาก่อนลด (ถ้ามีส่วนลดจริงใน Shopify)
  image: string; // รูปหลัก (ใช้ในการ์ด)
  images: string[]; // รูปทั้งหมด (สไลด์ในหน้าสินค้า)
  inventory: number; // คงเหลือรวมทุกตัวเลือก (ของจริงจาก Shopify)
  sold?: number; // demo เท่านั้น — ของจริงไม่มีฟิลด์นี้จาก Shopify
  categories: CategoryRef[]; // สินค้าหนึ่งชิ้นอยู่ได้หลายหมวดหมู่ (ตามคอลเลคชันจริง)
  flashSale?: boolean;
  description?: string; // คำอธิบายจริงจาก Shopify (คั่นด้วย •) ถ้ามี
  variants?: Variant[]; // ตัวเลือกรุ่น/ขนาดจริง
  youtubeId?: string; // วิดีโอรีวิว YouTube (ใส่ id จริงภายหลัง)
}

const CDN = "https://cdn.shopify.com/s/files/1/0905/1081/9620/files";

const CAT_CHAINSAW: CategoryRef = { id: "mock-chainsaw", title: "เลื่อยยนต์", handle: "chainsaw" };
const CAT_CHAIN: CategoryRef = { id: "mock-chain", title: "โซ่ / อะไหล่", handle: "chain" };

// ข้อมูลตัวอย่าง (mock) — ใช้เฉพาะตอนยังไม่ได้ตั้งค่า SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_TOKEN
export const products: Product[] = [
  {
    id: "gid://shopify/Product/9888885965092",
    handle: "เลื่อยยนต์-kingkong",
    title: "เลื่อยยนต์ KingKong 5800 รุ่นใหม่ปี 2025 (เฉพาะเครื่อง)",
    price: 4500,
    compareAtPrice: 5200,
    image: `${CDN}/kingkong-5800-2025-825467.webp?v=1750863081`,
    images: [
      `${CDN}/kingkong-5800-2025-825467.webp?v=1750863081`,
      `${CDN}/kingkong-5800-2025-774677.webp?v=1750863082`,
    ],
    inventory: 21,
    sold: 872,
    categories: [CAT_CHAINSAW],
    flashSale: true,
    description: "เลื่อยยนต์ King Kong 5800 ทรงพลัง คล่องตัว ตอบโจทย์ทุกงานตัด",
    variants: [{ title: "เฉพาะเครื่อง", price: 4500, stock: 21 }],
  },
  {
    id: "gid://shopify/Product/9888888586532",
    handle: "เลื่อยยนต์-newwave-7800-super-s",
    title: "เลื่อยยนต์ NEWWAVE 7800 SUPER-S",
    price: 6000,
    compareAtPrice: 6900,
    image: `${CDN}/newwave-7800-super-s-594397.webp?v=1750863107`,
    images: [`${CDN}/newwave-7800-super-s-594397.webp?v=1750863107`],
    inventory: 0,
    sold: 1204,
    categories: [CAT_CHAINSAW],
    flashSale: true,
    variants: [
      { title: "เฉพาะตัวเครื่อง", price: 6000, stock: 0 },
      { title: '11.8"', price: 7300, stock: 0 },
    ],
  },
  {
    id: "gid://shopify/Product/9887949390116",
    handle: "โซ่เลื่อยยนต์-ซอย-newwave-3623-3-8-ขนาดกลาง-titanium100-แบบเส้น",
    title: "โซ่เลื่อยยนต์ NEWWAVE 3623 (3/8) ขนาดกลาง Titanium100% (แบบซอย)",
    price: 360,
    compareAtPrice: 420,
    image: `${CDN}/newwave-3623-38-titanium100-721823.webp?v=1750862887`,
    images: [`${CDN}/newwave-3623-38-titanium100-721823.webp?v=1750862887`],
    inventory: 1026,
    sold: 5321,
    categories: [CAT_CHAIN],
    flashSale: true,
    variants: [{ title: '11.5" 22T ซอย', price: 360, stock: 1026 }],
  },
];

// รายการหมวดหมู่ mock (ใช้ตอนไม่มี Shopify connect)
export const mockCategories: CategoryRef[] = [CAT_CHAINSAW, CAT_CHAIN];

// แปลงตัวเลขเป็นราคาไทย เช่น ฿4,500
export const formatPrice = (n: number) => `฿${n.toLocaleString("th-TH")}`;

// % ส่วนลด
export const discountPercent = (p: Product) =>
  p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;

// สินค้าที่ถือว่าเป็น "Flash Sale" — มีราคาก่อนลดจริง (compareAtPrice > price)
export function getFlashSaleProducts(all: Product[], limit = 10): Product[] {
  return all.filter((p) => discountPercent(p) > 0).slice(0, limit);
}

// สร้างรายการหมวดหมู่จริงจากสินค้าที่มีอยู่ (นับจำนวนสินค้าต่อหมวด เรียงมากไปน้อย)
export function deriveCategories(all: Product[]): (CategoryRef & { count: number })[] {
  const map = new Map<string, CategoryRef & { count: number }>();
  for (const p of all) {
    for (const c of p.categories) {
      const existing = map.get(c.handle);
      if (existing) existing.count += 1;
      else map.set(c.handle, { ...c, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

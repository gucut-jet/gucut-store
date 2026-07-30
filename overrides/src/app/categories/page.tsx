import CategoryBrowser from "@/components/CategoryBrowser";
import { getProducts } from "@/lib/shopify";
import { deriveCategories } from "@/lib/products";

// หมายเหตุ: เว็บนี้ build แบบ static export (output: "export") จึงอ่าน ?tab= ฝั่ง client เท่านั้น (ดู CategoryBrowser)
export default async function CategoriesPage() {
  const products = await getProducts();
  const categories = deriveCategories(products);
  return <CategoryBrowser products={products} categories={categories} />;
}

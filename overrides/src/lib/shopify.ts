// Layer เชื่อม Shopify Admin API (GraphQL) — ดึงสินค้า "ทั้งหมด" + หมวดหมู่ (คอลเลคชัน) จริงจากร้าน
// ไม่มี SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_TOKEN → fallback เป็น mock data จาก products.ts
// ตั้งค่าที่ Vercel → gucut-store → Environment Variables:
//   SHOPIFY_STORE_DOMAIN=6891df-06.myshopify.com
//   SHOPIFY_ADMIN_TOKEN=shpat_...
// (ตัวเดียวกับที่ใช้ในโปรเจกต์ gucut-next ระบบหลังบ้าน — เป็น Admin API token ของร้านเดียวกัน)

import { products as mockProducts, mockCategories, type Product, type CategoryRef } from "./products";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = "2024-10";

const hasShopify = Boolean(domain && token);

async function adminGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token!,
    },
    body: JSON.stringify({ query, variables }),
    // build-time fetch (output: export) — cache ระหว่าง build ครั้งเดียวก็พอ
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Shopify Admin API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Collections (หมวดหมู่) ----------

const COLLECTIONS_QUERY = /* GraphQL */ `
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        cursor
        node { id title handle }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchAllCollections(): Promise<CategoryRef[]> {
  const all: CategoryRef[] = [];
  let after: string | undefined;
  for (;;) {
    type Resp = {
      collections: {
        edges: { node: { id: string; title: string; handle: string } }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };
    const data = await adminGraphQL<Resp>(COLLECTIONS_QUERY, { first: 100, after });
    all.push(...data.collections.edges.map((e) => e.node));
    if (!data.collections.pageInfo.hasNextPage) break;
    after = data.collections.pageInfo.endCursor!;
    await sleep(250);
  }
  return all;
}

// ---------- Products (สินค้าทั้งหมด) ----------

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "status:active", sortKey: TITLE) {
      edges {
        cursor
        node {
          id
          handle
          title
          descriptionHtml
          totalInventory
          featuredImage { url }
          images(first: 8) { edges { node { url } } }
          priceRangeV2 { minVariantPrice { amount } }
          variants(first: 50) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                inventoryQuantity
              }
            }
          }
          collections(first: 10) {
            edges { node { id title handle } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string | null;
  totalInventory: number | null;
  featuredImage: { url: string } | null;
  images: { edges: { node: { url: string } }[] };
  priceRangeV2: { minVariantPrice: { amount: string } };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        price: string;
        compareAtPrice: string | null;
        inventoryQuantity: number | null;
      };
    }[];
  };
  collections: { edges: { node: { id: string; title: string; handle: string } }[] };
};

function mapProduct(node: ShopifyProductNode): Product {
  const price = parseFloat(node.priceRangeV2.minVariantPrice.amount);
  const variants = node.variants.edges.map((e) => ({
    title: e.node.title,
    price: parseFloat(e.node.price),
    compareAtPrice: e.node.compareAtPrice ? parseFloat(e.node.compareAtPrice) : undefined,
    stock: e.node.inventoryQuantity ?? 0,
  }));
  const bestCompare = variants.reduce<number | undefined>((acc, v) => {
    if (v.compareAtPrice && v.compareAtPrice > v.price) return acc ? Math.max(acc, v.compareAtPrice) : v.compareAtPrice;
    return acc;
  }, undefined);
  const images = node.images.edges.map((e) => e.node.url);
  const description = node.descriptionHtml
    ? node.descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : undefined;

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    price,
    compareAtPrice: bestCompare,
    image: node.featuredImage?.url ?? images[0] ?? "/icon-512.png",
    images: images.length ? images : node.featuredImage ? [node.featuredImage.url] : ["/icon-512.png"],
    inventory: node.totalInventory ?? 0,
    categories: node.collections.edges.map((e) => e.node),
    description,
    variants: variants.length ? variants : undefined,
  };
}

async function fetchAllProducts(): Promise<Product[]> {
  const all: Product[] = [];
  let after: string | undefined;
  for (;;) {
    type Resp = {
      products: {
        edges: { node: ShopifyProductNode }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };
    const data = await adminGraphQL<Resp>(PRODUCTS_QUERY, { first: 100, after });
    all.push(...data.products.edges.map((e) => mapProduct(e.node)));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor!;
    await sleep(300);
  }
  return all;
}

// ---------- Cache ระดับโมดูล (fetch ครั้งเดียวต่อ build) ----------

let productsPromise: Promise<Product[]> | null = null;
let categoriesPromise: Promise<CategoryRef[]> | null = null;

export async function getProducts(): Promise<Product[]> {
  if (!hasShopify) return mockProducts;
  if (!productsPromise) productsPromise = fetchAllProducts();
  return productsPromise;
}

export async function getCollections(): Promise<CategoryRef[]> {
  if (!hasShopify) return mockCategories;
  if (!categoriesPromise) categoriesPromise = fetchAllCollections();
  return categoriesPromise;
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const all = await getProducts();
  return all.find((p) => p.handle === handle);
}

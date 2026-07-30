export default function TermsPage() {
  return (
    <div className="min-h-[70vh] px-4 pb-24 pt-8">
      <div className="mx-auto max-w-2xl text-neutral-200">
        <h1 className="mb-6 text-2xl font-bold text-white">ข้อกำหนดการใช้บริการ</h1>
        <p className="mb-4 text-sm text-neutral-400">ปรับปรุงล่าสุด: 2026</p>

        <section className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">การยอมรับข้อกำหนด</h2>
          <p className="text-sm leading-relaxed">
            การเข้าใช้งานเว็บไซต์และบริการของ GUCUT ถือว่าท่านยอมรับข้อกำหนดการใช้บริการ
            ฉบับนี้ หากท่านไม่ยอมรับข้อกำหนดดังกล่าว กรุณางดใช้บริการ
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">บัญชีผู้ใช้</h2>
          <p className="text-sm leading-relaxed">
            ท่านมีหน้าที่รักษาความปลอดภัยของบัญชีและข้อมูลเข้าสู่ระบบของท่าน ไม่ว่าจะเข้า
            สู่ระบบด้วยหมายเลขโทรศัพท์ อีเมล หรือผ่านผู้ให้บริการภายนอก (Google, Facebook,
            Apple, LINE) GUCUT ขอสงวนสิทธิ์ในการระงับบัญชีที่พบว่ามีการใช้งานผิดวัตถุประสงค์
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">การสั่งซื้อและการชำระเงิน</h2>
          <p className="text-sm leading-relaxed">
            ราคาสินค้าและเงื่อนไขการจัดส่งเป็นไปตามที่แสดงบนหน้าเว็บไซต์ในขณะสั่งซื้อ
            GUCUT ขอสงวนสิทธิ์ในการยกเลิกคำสั่งซื้อในกรณีที่ข้อมูลสินค้าคลาดเคลื่อนหรือ
            สินค้าหมดสต๊อก
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">ทรัพย์สินทางปัญญา</h2>
          <p className="text-sm leading-relaxed">
            เนื้อหา โลโก้ และเครื่องหมายการค้าทั้งหมดบนเว็บไซต์นี้เป็นทรัพย์สินของ GUCUT
            ห้ามคัดลอกหรือนำไปใช้โดยไม่ได้รับอนุญาต
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">ติดต่อเรา</h2>
          <p className="text-sm leading-relaxed">
            หากมีข้อสงสัยเกี่ยวกับข้อกำหนดการใช้บริการนี้ สามารถติดต่อได้ที่{" "}
            <a href="mailto:gucut@icloud.com" className="text-orange-400 hover:underline">
              gucut@icloud.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-[70vh] px-4 pb-24 pt-8">
      <div className="mx-auto max-w-2xl text-neutral-200">
        <h1 className="mb-6 text-2xl font-bold text-white">นโยบายความเป็นส่วนตัว</h1>
        <p className="mb-4 text-sm text-neutral-400">ปรับปรุงล่าสุด: 2026</p>

        <section className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">ข้อมูลที่เราเก็บรวบรวม</h2>
          <p className="text-sm leading-relaxed">
            GUCUT เก็บรวบรวมข้อมูลที่จำเป็นต่อการให้บริการ ได้แก่ ชื่อ หมายเลขโทรศัพท์
            อีเมล ที่อยู่จัดส่ง และประวัติการสั่งซื้อ เมื่อท่านเข้าสู่ระบบผ่านผู้ให้บริการ
            ภายนอก (เช่น Google, Facebook, Apple หรือ LINE) เราจะได้รับเฉพาะข้อมูล
            พื้นฐานที่จำเป็น เช่น ชื่อและอีเมล ตามสิทธิ์ที่ท่านอนุญาต
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">วัตถุประสงค์การใช้ข้อมูล</h2>
          <p className="text-sm leading-relaxed">
            เราใช้ข้อมูลของท่านเพื่อดำเนินการสั่งซื้อ จัดส่งสินค้า ติดต่อสื่อสารเกี่ยวกับ
            บัญชีและคำสั่งซื้อ และปรับปรุงคุณภาพการให้บริการ เราจะไม่ขายหรือเปิดเผยข้อมูล
            ส่วนบุคคลของท่านแก่บุคคลภายนอกโดยไม่ได้รับความยินยอม เว้นแต่ตามที่กฎหมายกำหนด
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">การเก็บรักษาและความปลอดภัย</h2>
          <p className="text-sm leading-relaxed">
            ข้อมูลของท่านถูกจัดเก็บผ่านผู้ให้บริการที่มีมาตรฐานความปลอดภัย (Firebase /
            Google Cloud) และเราจำกัดการเข้าถึงข้อมูลเฉพาะบุคลากรที่จำเป็นต้องใช้เพื่อ
            ดำเนินการตามวัตถุประสงค์ข้างต้นเท่านั้น
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">สิทธิของท่าน</h2>
          <p className="text-sm leading-relaxed">
            ท่านมีสิทธิ์ขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของท่านได้ทุกเมื่อ โดยติดต่อ
            เราผ่านช่องทางด้านล่าง
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">ติดต่อเรา</h2>
          <p className="text-sm leading-relaxed">
            หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ สามารถติดต่อได้ที่{" "}
            <a href="mailto:gucut@icloud.com" className="text-orange-400 hover:underline">
              gucut@icloud.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

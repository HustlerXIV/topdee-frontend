'use client';

import { useState } from 'react';

const UPDATED = '29 พฤษภาคม 2569'; // May 29, 2026 (BE)
const UPDATED_EN = 'May 29, 2026';

type Lang = 'th' | 'en';

export default function TermsPage() {
  const [lang, setLang] = useState<Lang>('th');

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href="https://www.top-dee.com" className="text-lg font-extrabold tracking-tight text-indigo-600">
            Topdee
          </a>
          <div className="flex overflow-hidden rounded-lg border border-slate-200 text-sm font-semibold">
            <button
              onClick={() => setLang('th')}
              className={`px-4 py-1.5 transition-colors ${lang === 'th' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ภาษาไทย
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-1.5 transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              English
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {lang === 'th' ? <ThaiContent /> : <EnglishContent />}
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Topdee ·{' '}
        <a href="mailto:legal@top-dee.com" className="underline">
          legal@top-dee.com
        </a>{' '}
        ·{' '}
        <a href="/privacy" className="underline">
          Privacy
        </a>
      </footer>
    </div>
  );
}

/* ── Shared prose styles ── */
function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">{children}</h1>;
}
function Updated({ children }: { children: React.ReactNode }) {
  return <p className="mb-10 text-sm text-slate-400">{children}</p>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-10 text-xl font-bold text-slate-900">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 leading-relaxed text-slate-600">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 space-y-1.5 pl-5 text-slate-600">{children}</ul>;
}
function LI({ children }: { children: React.ReactNode }) {
  return <li className="list-disc leading-relaxed">{children}</li>;
}
function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm leading-relaxed text-indigo-800">
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════
   THAI VERSION
══════════════════════════════════════════════ */
function ThaiContent() {
  return (
    <article>
      <H1>ข้อกำหนดและเงื่อนไขการให้บริการ</H1>
      <Updated>อัปเดตล่าสุด: {UPDATED}</Updated>

      <Box>
        <strong>สรุปสั้น ๆ:</strong> การสมัครใช้งาน Topdee ถือว่าคุณยอมรับเงื่อนไขด้านล่างนี้
        กรุณาอ่านให้ครบถ้วน หากไม่ยอมรับ กรุณางดใช้งานบริการ
      </Box>

      <H2>1. การยอมรับข้อตกลง</H2>
      <P>
        ข้อกำหนดและเงื่อนไขนี้ ("<strong>ข้อตกลง</strong>") เป็นสัญญาที่มีผลผูกพันทางกฎหมายระหว่างคุณ
        ("<strong>ผู้ใช้งาน</strong>" หรือ "<strong>คุณ</strong>") กับ Topdee ("<strong>เรา</strong>" หรือ
        "<strong>บริการ</strong>") โดยการสร้างบัญชี การเข้าถึง หรือการใช้งานบริการ
        ถือว่าคุณยอมรับและตกลงปฏิบัติตามข้อตกลงนี้ทั้งหมด
        รวมถึง{' '}
        <a href="/privacy" className="text-indigo-600 underline">
          นโยบายความเป็นส่วนตัว
        </a>{' '}
        ที่อ้างอิงไว้ในข้อตกลงนี้
      </P>

      <H2>2. นิยามคำศัพท์</H2>
      <UL>
        <LI>
          <strong>"บริการ"</strong> หมายถึง แพลตฟอร์ม Topdee ทั้งหมด รวมถึงเว็บแอปพลิเคชัน, API,
          AI Assistant, กล่องข้อความ (Inbox), และฟีเจอร์อื่น ๆ ที่ให้บริการผ่าน
          {' '}<a href="https://www.top-dee.com" className="text-indigo-600 underline">www.top-dee.com</a>
        </LI>
        <LI>
          <strong>"Workspace"</strong> หมายถึง พื้นที่ทำงานเฉพาะของลูกค้าแต่ละองค์กรในระบบ Topdee
        </LI>
        <LI>
          <strong>"สมาชิก"</strong> หมายถึง ผู้ใช้งานที่ได้รับเชิญหรือสร้างบัญชีใน Workspace
          ของคุณ ในบทบาท Owner, Admin, Agent หรือ Viewer
        </LI>
        <LI>
          <strong>"ลูกค้าปลายทาง"</strong> หมายถึง บุคคลภายนอกที่ส่งข้อความเข้ามายัง
          Workspace ของคุณผ่านช่องทางที่เชื่อมต่อไว้ (Facebook, LINE, TikTok, WhatsApp, Lazada, เว็บไซต์ ฯลฯ)
        </LI>
        <LI>
          <strong>"เนื้อหา"</strong> หมายถึง ข้อความ, รูปภาพ, ไฟล์, ฐานความรู้ (Knowledge Base),
          และข้อมูลใด ๆ ที่คุณหรือลูกค้าปลายทางป้อนเข้าสู่บริการ
        </LI>
      </UL>

      <H2>3. คุณสมบัติของผู้ใช้งาน</H2>
      <P>การใช้งานบริการต้องเป็นไปตามเงื่อนไขดังนี้:</P>
      <UL>
        <LI>คุณต้องมีอายุไม่ต่ำกว่า 20 ปีบริบูรณ์ หรือเป็นผู้ใช้งานในนามนิติบุคคล</LI>
        <LI>คุณมีอำนาจในการลงนามผูกพันองค์กรที่คุณเป็นตัวแทน</LI>
        <LI>ข้อมูลที่ใช้สมัครบัญชีเป็นข้อมูลที่ถูกต้องและเป็นปัจจุบัน</LI>
        <LI>คุณไม่ได้อยู่ในประเทศที่ถูกห้ามตามมาตรการคว่ำบาตรของไทยหรือสหประชาชาติ</LI>
      </UL>

      <H2>4. บัญชีผู้ใช้และความปลอดภัย</H2>
      <P>
        คุณรับผิดชอบในการรักษาความลับของรหัสผ่านและกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณ
        Owner ของ Workspace เป็นผู้รับผิดชอบสูงสุดในการบริหารจัดการสมาชิก, สิทธิ์การเข้าถึง,
        และการชำระค่าบริการ คุณต้องแจ้งให้เราทราบทันทีหากพบว่ามีการเข้าถึงบัญชีโดยไม่ได้รับอนุญาต
        ที่{' '}
        <a href="mailto:support@top-dee.com" className="text-indigo-600 underline">
          support@top-dee.com
        </a>
      </P>

      <H2>5. การใช้งานที่ยอมรับได้ (Acceptable Use)</H2>
      <P>ห้ามใช้บริการ Topdee เพื่อ:</P>
      <UL>
        <LI>กระทำการที่ผิดกฎหมาย หรือละเมิดสิทธิ์ของผู้อื่น</LI>
        <LI>ส่งสแปม, ข้อความหลอกลวง (Phishing), หรือเนื้อหาเชิงพาณิชย์ที่ไม่ได้รับความยินยอม</LI>
        <LI>เผยแพร่เนื้อหาที่ผิดศีลธรรม, ลามกอนาจาร, รุนแรง, หรือสนับสนุนการเลือกปฏิบัติ</LI>
        <LI>
          พยายามเจาะระบบ, ทำ Reverse Engineering, เข้าถึงโดยไม่ได้รับอนุญาต,
          หรือทำให้บริการหยุดทำงาน
        </LI>
        <LI>ใช้ Bot หรือ Script ดึงข้อมูลจากระบบของเราโดยไม่ได้รับอนุญาต</LI>
        <LI>ใช้บริการเพื่อแข่งขันโดยตรงกับ Topdee หรือสร้างผลิตภัณฑ์ที่คล้ายคลึง</LI>
        <LI>
          ละเมิดข้อกำหนดของแพลตฟอร์มที่เชื่อมต่อ (Meta Platform Terms, LINE Developer Agreement,
          TikTok Developer Terms, WhatsApp Business Solution Terms, Lazada Open Platform Agreement)
        </LI>
      </UL>
      <P>เราขอสงวนสิทธิ์ในการระงับหรือปิดบัญชีที่ละเมิดข้อกำหนดข้างต้นโดยไม่ต้องแจ้งล่วงหน้า</P>

      <H2>6. แพ็คเกจ ค่าบริการ และการชำระเงิน</H2>
      <UL>
        <LI>
          <strong>แพ็คเกจรายเดือน/รายปี</strong> — ค่าบริการเรียกเก็บล่วงหน้าตามรอบบิลที่คุณเลือก
          ผ่าน Stripe
        </LI>
        <LI>
          <strong>แพ็คเกจฟรี (Trial)</strong> — มีระยะเวลาทดลองใช้งานจำกัด
          หลังจากนั้นบัญชีจะถูกปรับเป็นแบบจำกัดฟีเจอร์จนกว่าจะอัปเกรด
        </LI>
        <LI>
          <strong>การต่ออายุอัตโนมัติ</strong> — แพ็คเกจจะต่ออายุโดยอัตโนมัติทุกรอบบิล
          คุณสามารถยกเลิกได้ใน Settings ก่อนวันต่ออายุ
        </LI>
        <LI>
          <strong>การคืนเงิน</strong> — เราไม่คืนเงินสำหรับรอบบิลที่ใช้งานไปแล้ว
          ยกเว้นกรณีที่กฎหมายกำหนดหรือเป็นข้อผิดพลาดของเรา
        </LI>
        <LI>
          <strong>ภาษี</strong> — ราคาที่แสดงยังไม่รวมภาษีมูลค่าเพิ่ม (VAT) ตามกฎหมายไทย
          ที่อาจมีการเรียกเก็บเพิ่มเติม
        </LI>
        <LI>
          <strong>การเปลี่ยนแปลงราคา</strong> — เราขอสงวนสิทธิ์ในการปรับราคา
          โดยจะแจ้งล่วงหน้าอย่างน้อย 30 วันทางอีเมลของ Owner
        </LI>
      </UL>

      <H2>7. ความเป็นเจ้าของและสิทธิ์ในทรัพย์สินทางปัญญา</H2>
      <P>
        <strong>เนื้อหาของคุณ:</strong> คุณยังคงเป็นเจ้าของลิขสิทธิ์และสิทธิ์ทั้งหมดในเนื้อหา
        ที่คุณป้อนเข้าสู่บริการ ทั้งนี้ คุณให้สิทธิ์แก่ Topdee ในการจัดเก็บ, ประมวลผล, แสดงผล,
        และส่งต่อเนื้อหาดังกล่าวเท่าที่จำเป็นต่อการให้บริการ
      </P>
      <P>
        <strong>ทรัพย์สินของ Topdee:</strong> ซอฟต์แวร์, ดีไซน์, เครื่องหมายการค้า "Topdee",
        โลโก้, และเอกสารทั้งหมดเป็นทรัพย์สินของเรา คุณไม่มีสิทธิ์คัดลอก, ดัดแปลง,
        หรือสร้างผลงานสืบเนื่อง โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
      </P>
      <P>
        <strong>Feedback:</strong> หากคุณส่งข้อเสนอแนะ, รายงานบั๊ก, หรือแนวคิดให้เรา
        คุณยินยอมให้เราใช้และนำไปพัฒนาบริการได้โดยไม่มีค่าตอบแทน
      </P>

      <H2>8. AI และผลลัพธ์ที่เครื่องสร้างขึ้น</H2>
      <P>
        บริการของเรารวมถึงฟีเจอร์ AI ที่สร้างคำตอบอัตโนมัติให้กับลูกค้าปลายทาง
        คุณรับทราบและยอมรับว่า:
      </P>
      <UL>
        <LI>คำตอบที่ AI สร้างขึ้นอาจไม่ถูกต้อง 100% หรืออาจไม่เหมาะสมในบางบริบท</LI>
        <LI>คุณรับผิดชอบในการตรวจสอบและจัดการคำตอบที่ส่งให้ลูกค้า รวมถึงการตั้งค่า Guardrails</LI>
        <LI>ห้ามใช้ AI เพื่อให้คำแนะนำทางการแพทย์, กฎหมาย, หรือการเงินที่อาจส่งผลต่อชีวิตหรือทรัพย์สิน</LI>
        <LI>ข้อความของลูกค้าปลายทางอาจถูกส่งไปยังผู้ให้บริการ AI ภายนอก (เช่น Google Gemini)
        เพื่อสร้างคำตอบ ตามที่ระบุในนโยบายความเป็นส่วนตัว</LI>
      </UL>

      <H2>9. การเชื่อมต่อกับแพลตฟอร์มภายนอก</H2>
      <P>
        เมื่อคุณเชื่อมต่อ Workspace กับ Facebook Messenger, LINE, Instagram, TikTok, WhatsApp,
        Lazada หรือบริการภายนอกอื่น ๆ คุณยืนยันว่ามีสิทธิ์ในการเชื่อมต่อบัญชีนั้น ๆ
        และยอมรับเงื่อนไขของแพลตฟอร์มเหล่านั้นด้วย
      </P>
      <P>
        Topdee ไม่รับผิดชอบต่อการเปลี่ยนแปลง, ระงับ, หรือยกเลิกบริการของแพลตฟอร์มภายนอก
        ที่อยู่นอกเหนือการควบคุมของเรา
      </P>

      <H2>10. ระดับการให้บริการ (Service Level)</H2>
      <P>
        เรามุ่งมั่นในการให้บริการที่เสถียร แต่ไม่รับประกัน Uptime 100%
        เราอาจมีช่วงเวลาปิดปรับปรุงระบบเป็นครั้งคราว และจะพยายามแจ้งล่วงหน้าเมื่อเป็นไปได้
        ในกรณีที่บริการขัดข้องรุนแรงและยาวนาน เราอาจเสนอเครดิตชดเชยตามดุลยพินิจของเรา
      </P>

      <H2>11. ข้อจำกัดความรับผิด</H2>
      <P>
        ภายใต้ขอบเขตสูงสุดที่กฎหมายอนุญาต Topdee ไม่รับผิดต่อความเสียหายทางอ้อม, ความเสียหายต่อเนื่อง,
        การสูญเสียกำไร, การสูญเสียข้อมูล, หรือความเสียหายเฉพาะกรณีที่เกิดจากการใช้งานบริการ
      </P>
      <P>
        ความรับผิดสูงสุดของ Topdee ต่อความเสียหายทั้งหมดที่เกี่ยวข้องกับบริการ
        จะไม่เกินจำนวนเงินค่าบริการที่คุณชำระให้เราในช่วง 12 เดือนก่อนเหตุการณ์ที่ก่อให้เกิดความเสียหาย
      </P>

      <H2>12. การชดใช้ค่าเสียหาย (Indemnification)</H2>
      <P>
        คุณตกลงปกป้องและชดใช้ค่าเสียหายให้กับ Topdee, พนักงาน, และพันธมิตรของเรา
        จากการเรียกร้องของบุคคลภายนอกที่เกิดจาก: (ก) การละเมิดข้อตกลงนี้ของคุณ,
        (ข) เนื้อหาที่คุณป้อนเข้าสู่ระบบ, (ค) การละเมิดสิทธิ์ของบุคคลอื่น
        หรือ (ง) การใช้งานบริการในทางที่ไม่ถูกต้อง
      </P>

      <H2>13. การระงับและยกเลิกบริการ</H2>
      <UL>
        <LI>
          <strong>โดยคุณ:</strong> คุณสามารถยกเลิกบัญชีได้ทุกเมื่อใน Settings →
          Billing → Cancel subscription
        </LI>
        <LI>
          <strong>โดยเรา:</strong> เราอาจระงับหรือยกเลิกบัญชีของคุณทันทีหากพบการละเมิดข้อตกลง,
          ไม่ชำระค่าบริการเกิน 14 วัน, หรือมีการใช้งานที่ก่อให้เกิดความเสี่ยงต่อระบบ
        </LI>
        <LI>
          <strong>หลังการยกเลิก:</strong> เราจะลบข้อมูลของ Workspace ภายใน 90 วัน
          คุณสามารถขอ Export ข้อมูลก่อนการลบได้
        </LI>
      </UL>

      <H2>14. ความเป็นส่วนตัว</H2>
      <P>
        การประมวลผลข้อมูลส่วนบุคคลของคุณและลูกค้าปลายทางอยู่ภายใต้
        <a href="/privacy" className="text-indigo-600 underline">
          {' '}นโยบายความเป็นส่วนตัว
        </a>{' '}
        ของเรา ซึ่งเป็นส่วนหนึ่งของข้อตกลงนี้ การใช้บริการต่อถือว่าคุณยอมรับนโยบายดังกล่าวด้วย
      </P>

      <H2>15. การเปลี่ยนแปลงข้อตกลง</H2>
      <P>
        เราอาจปรับปรุงข้อตกลงนี้เป็นครั้งคราว สำหรับการเปลี่ยนแปลงที่สำคัญ
        เราจะแจ้งให้ Owner ของ Workspace ทราบทางอีเมลล่วงหน้าอย่างน้อย 14 วัน
        การใช้งานบริการต่อหลังจากวันที่มีผลถือว่าคุณยอมรับข้อตกลงฉบับใหม่
        หากไม่ยอมรับ คุณสามารถยกเลิกบัญชีได้ก่อนวันมีผล
      </P>

      <H2>16. กฎหมายที่ใช้บังคับและการระงับข้อพิพาท</H2>
      <P>
        ข้อตกลงนี้อยู่ภายใต้กฎหมายของราชอาณาจักรไทย ข้อพิพาทใด ๆ ที่เกิดขึ้น
        ให้อยู่ในเขตอำนาจของศาลไทย โดยคู่สัญญาตกลงจะพยายามเจรจาด้วยความสุจริตก่อนยื่นฟ้อง
      </P>

      <H2>17. ทั่วไป</H2>
      <UL>
        <LI>
          <strong>ทั้งหมดของข้อตกลง:</strong> ข้อตกลงนี้และนโยบายที่อ้างอิงเป็นข้อตกลงทั้งหมด
          ระหว่างคุณกับเรา และแทนที่ข้อตกลงหรือความเข้าใจก่อนหน้านี้
        </LI>
        <LI>
          <strong>ความสามารถในการแยกส่วน:</strong> หากข้อใดในข้อตกลงนี้ไม่มีผลบังคับใช้ทางกฎหมาย
          ข้ออื่น ๆ ยังคงมีผลสมบูรณ์
        </LI>
        <LI>
          <strong>การโอนสิทธิ์:</strong> คุณไม่สามารถโอนสิทธิ์และหน้าที่ภายใต้ข้อตกลงนี้
          โดยไม่ได้รับความยินยอมจากเรา
        </LI>
      </UL>

      <H2>18. ติดต่อเรา</H2>
      <P>
        หากมีคำถามเกี่ยวกับข้อตกลงนี้ กรุณาติดต่อ:
        <br />
        <a href="mailto:legal@top-dee.com" className="font-semibold text-indigo-600 underline">
          legal@top-dee.com
        </a>
        <br />
        หรือเยี่ยมชม{' '}
        <a href="https://www.top-dee.com" className="text-indigo-600 underline">
          www.top-dee.com
        </a>
      </P>
    </article>
  );
}

/* ══════════════════════════════════════════════
   ENGLISH VERSION
══════════════════════════════════════════════ */
function EnglishContent() {
  return (
    <article>
      <H1>Terms of Service</H1>
      <Updated>Last updated: {UPDATED_EN}</Updated>

      <Box>
        <strong>TL;DR:</strong> By signing up for Topdee, you agree to the terms below. Please
        read them carefully. If you don't agree, please don't use the service.
      </Box>

      <H2>1. Acceptance of Terms</H2>
      <P>
        These Terms of Service ("<strong>Terms</strong>") form a legally binding agreement between
        you ("<strong>you</strong>", the "<strong>customer</strong>") and Topdee ("
        <strong>we</strong>", "<strong>us</strong>", or the "<strong>Service</strong>"). By
        creating an account, accessing, or using the Service you accept these Terms in full,
        including our{' '}
        <a href="/privacy" className="text-indigo-600 underline">
          Privacy Policy
        </a>
        , which is incorporated by reference.
      </P>

      <H2>2. Definitions</H2>
      <UL>
        <LI>
          <strong>"Service"</strong> means the Topdee platform, including the web application,
          API, AI Assistant, Inbox, and other features delivered through{' '}
          <a href="https://www.top-dee.com" className="text-indigo-600 underline">
            www.top-dee.com
          </a>
          .
        </LI>
        <LI>
          <strong>"Workspace"</strong> means a customer-specific tenant within Topdee.
        </LI>
        <LI>
          <strong>"Members"</strong> means users invited to, or registered on, your Workspace in
          the roles Owner, Admin, Agent, or Viewer.
        </LI>
        <LI>
          <strong>"End Customers"</strong> means third parties who message your Workspace through
          a connected channel (Facebook, LINE, TikTok, WhatsApp, Lazada, website widget, etc.).
        </LI>
        <LI>
          <strong>"Content"</strong> means any text, image, file, knowledge base, or other data
          you or your end customers submit to the Service.
        </LI>
      </UL>

      <H2>3. Eligibility</H2>
      <P>To use the Service you must:</P>
      <UL>
        <LI>Be at least 20 years old, or use the Service on behalf of a legal entity.</LI>
        <LI>Have authority to bind that entity to these Terms.</LI>
        <LI>Provide accurate and current registration information.</LI>
        <LI>
          Not be located in a jurisdiction subject to Thai or UN sanctions that would prohibit
          your use of the Service.
        </LI>
      </UL>

      <H2>4. Accounts and Security</H2>
      <P>
        You are responsible for keeping your password confidential and for all activity that
        occurs under your account. The Workspace Owner is ultimately responsible for managing
        Members, access rights, and billing. Notify us immediately at{' '}
        <a href="mailto:support@top-dee.com" className="text-indigo-600 underline">
          support@top-dee.com
        </a>{' '}
        if you suspect unauthorized access.
      </P>

      <H2>5. Acceptable Use</H2>
      <P>You may not use Topdee to:</P>
      <UL>
        <LI>Engage in any unlawful activity or infringe the rights of others.</LI>
        <LI>Send spam, phishing, or unsolicited commercial messages.</LI>
        <LI>Publish obscene, violent, discriminatory, or otherwise objectionable content.</LI>
        <LI>
          Probe, scan, reverse-engineer, or otherwise interfere with the Service or its
          infrastructure.
        </LI>
        <LI>Scrape data from the Service using bots without our prior written permission.</LI>
        <LI>Build a competing product or substantially similar service.</LI>
        <LI>
          Violate the terms of any connected platform (Meta Platform Terms, LINE Developer
          Agreement, TikTok Developer Terms, WhatsApp Business Solution Terms, Lazada Open
          Platform Agreement).
        </LI>
      </UL>
      <P>We may suspend or terminate accounts that violate these rules without prior notice.</P>

      <H2>6. Plans, Fees, and Billing</H2>
      <UL>
        <LI>
          <strong>Paid plans</strong> — fees are billed in advance for each billing cycle through
          Stripe.
        </LI>
        <LI>
          <strong>Free trial</strong> — a limited free trial may be available; after expiry your
          Workspace is restricted to free-tier features until you upgrade.
        </LI>
        <LI>
          <strong>Auto-renewal</strong> — plans renew automatically each cycle. You may cancel any
          time in Settings before the renewal date.
        </LI>
        <LI>
          <strong>Refunds</strong> — we do not refund fees for cycles already used, except where
          required by law or where the error is ours.
        </LI>
        <LI>
          <strong>Taxes</strong> — prices shown exclude applicable VAT and other Thai taxes, which
          may be added at checkout.
        </LI>
        <LI>
          <strong>Price changes</strong> — we may adjust pricing with at least 30 days' email
          notice to the Workspace Owner.
        </LI>
      </UL>

      <H2>7. Ownership and Intellectual Property</H2>
      <P>
        <strong>Your Content:</strong> you retain all rights to the Content you submit to the
        Service. You grant Topdee a non-exclusive, worldwide licence to host, process, transmit,
        and display that Content solely as needed to operate the Service.
      </P>
      <P>
        <strong>Our Property:</strong> the Topdee software, design, "Topdee" trademark, logos, and
        documentation are owned by us. You may not copy, modify, or create derivative works
        without our written consent.
      </P>
      <P>
        <strong>Feedback:</strong> if you send us suggestions, bug reports, or ideas, you grant us
        a perpetual, royalty-free licence to use them to improve the Service.
      </P>

      <H2>8. AI and Machine-Generated Output</H2>
      <P>
        The Service includes AI features that generate replies to your end customers. You
        acknowledge that:
      </P>
      <UL>
        <LI>AI output may be inaccurate or inappropriate in some contexts.</LI>
        <LI>
          You are responsible for reviewing AI responses sent to customers and for configuring
          appropriate guardrails.
        </LI>
        <LI>
          You must not use the AI to provide medical, legal, or financial advice that could affect
          life, health, or property.
        </LI>
        <LI>
          End-customer messages may be transmitted to third-party AI providers (e.g. Google
          Gemini) to generate responses, as described in our Privacy Policy.
        </LI>
      </UL>

      <H2>9. Third-Party Integrations</H2>
      <P>
        When you connect your Workspace to Facebook Messenger, LINE, Instagram, TikTok, WhatsApp,
        Lazada, or any other external service, you represent that you have the right to bind the
        connected account and that you also accept those platforms' terms.
      </P>
      <P>
        Topdee is not responsible for changes, suspensions, or termination of any third-party
        platform outside our control.
      </P>

      <H2>10. Service Levels</H2>
      <P>
        We aim to keep the Service available and reliable, but do not guarantee 100% uptime. We
        may schedule maintenance windows from time to time and will give advance notice where
        practical. In the event of a prolonged outage we may, at our discretion, offer service
        credits.
      </P>

      <H2>11. Limitation of Liability</H2>
      <P>
        To the maximum extent permitted by law, Topdee shall not be liable for indirect,
        incidental, consequential, special, or punitive damages, including loss of profits or
        data, arising from your use of the Service.
      </P>
      <P>
        Our total aggregate liability for all claims relating to the Service shall not exceed the
        fees you have paid to us in the 12 months preceding the event giving rise to the claim.
      </P>

      <H2>12. Indemnification</H2>
      <P>
        You agree to defend and indemnify Topdee, our employees, and partners from any
        third-party claim arising out of (a) your breach of these Terms, (b) the Content you
        submit, (c) your violation of any third party's rights, or (d) misuse of the Service.
      </P>

      <H2>13. Suspension and Termination</H2>
      <UL>
        <LI>
          <strong>By you:</strong> cancel any time in Settings → Billing → Cancel subscription.
        </LI>
        <LI>
          <strong>By us:</strong> we may suspend or terminate your account immediately for
          violations of these Terms, non-payment exceeding 14 days, or activity that endangers the
          Service.
        </LI>
        <LI>
          <strong>After termination:</strong> we delete Workspace data within 90 days. You may
          export your data before deletion.
        </LI>
      </UL>

      <H2>14. Privacy</H2>
      <P>
        Processing of personal data about you and your end customers is governed by our{' '}
        <a href="/privacy" className="text-indigo-600 underline">
          Privacy Policy
        </a>
        , which forms part of these Terms. Continued use of the Service constitutes acceptance of
        that policy.
      </P>

      <H2>15. Changes to These Terms</H2>
      <P>
        We may update these Terms from time to time. For material changes we will give the
        Workspace Owner at least 14 days' email notice before they take effect. Continued use of
        the Service after the effective date constitutes acceptance of the updated Terms; if you
        do not agree, you may cancel before that date.
      </P>

      <H2>16. Governing Law and Disputes</H2>
      <P>
        These Terms are governed by the laws of the Kingdom of Thailand. Any disputes shall be
        subject to the exclusive jurisdiction of the Thai courts. The parties agree to negotiate
        in good faith before filing suit.
      </P>

      <H2>17. General</H2>
      <UL>
        <LI>
          <strong>Entire agreement:</strong> these Terms together with the documents they
          reference constitute the entire agreement between you and us and supersede any prior
          arrangement.
        </LI>
        <LI>
          <strong>Severability:</strong> if any provision is held unenforceable, the remainder
          shall remain in full force.
        </LI>
        <LI>
          <strong>Assignment:</strong> you may not assign your rights or obligations under these
          Terms without our consent.
        </LI>
      </UL>

      <H2>18. Contact</H2>
      <P>
        Questions about these Terms? Reach out to:
        <br />
        <a href="mailto:legal@top-dee.com" className="font-semibold text-indigo-600 underline">
          legal@top-dee.com
        </a>
        <br />
        or visit{' '}
        <a href="https://www.top-dee.com" className="text-indigo-600 underline">
          www.top-dee.com
        </a>
      </P>
    </article>
  );
}

'use client';

import { useState } from 'react';

const UPDATED = '17 พฤษภาคม 2568'; // May 17, 2025 (BE)
const UPDATED_EN = 'May 17, 2025';

type Lang = 'th' | 'en';

export default function PrivacyPage() {
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
        © {new Date().getFullYear()} Topdee · <a href="mailto:privacy@top-dee.com" className="underline">privacy@top-dee.com</a>
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
      <H1>นโยบายความเป็นส่วนตัว</H1>
      <Updated>อัปเดตล่าสุด: {UPDATED}</Updated>

      <Box>
        <strong>สรุปสั้น ๆ:</strong> Topdee เก็บเฉพาะข้อมูลที่จำเป็นสำหรับการให้บริการ ไม่มีการขาย
        หรือแชร์ข้อมูลส่วนตัวของคุณให้บุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาด
      </Box>

      <H2>1. ผู้ควบคุมข้อมูล (Data Controller)</H2>
      <P>
        <strong>Topdee</strong> ("<strong>เรา</strong>" หรือ "<strong>บริการ</strong>") ดำเนินการโดย Topdee
        เว็บไซต์: <a href="https://www.top-dee.com" className="text-indigo-600 underline">www.top-dee.com</a>
        <br />
        อีเมลติดต่อด้านความเป็นส่วนตัว:{' '}
        <a href="mailto:privacy@top-dee.com" className="text-indigo-600 underline">privacy@top-dee.com</a>
      </P>

      <H2>2. ข้อมูลที่เราเก็บรวบรวมและเหตุผล</H2>
      <P>เราเก็บข้อมูลเท่าที่จำเป็นสำหรับการให้บริการเท่านั้น แบ่งออกเป็นสองประเภท:</P>

      <strong className="mb-2 block text-slate-700">2.1 ข้อมูลของสมาชิก (Workspace Users)</strong>
      <UL>
        <LI>
          <strong>ชื่อและอีเมล</strong> — ใช้สำหรับสร้างบัญชีผู้ใช้, ส่งการแจ้งเตือน,
          และระบุตัวตนในระบบ
        </LI>
        <LI>
          <strong>รหัสผ่าน (เข้ารหัส)</strong> — จัดเก็บในรูปแบบ bcrypt hash
          ไม่มีการเก็บรหัสผ่านต้นฉบับ
        </LI>
        <LI>
          <strong>บทบาทในองค์กร (Role)</strong> — เช่น Owner, Admin, Agent
          เพื่อควบคุมการเข้าถึงฟีเจอร์
        </LI>
        <LI>
          <strong>โลโก้ Workspace</strong> — รูปภาพที่คุณอัปโหลดเอง เก็บบน Cloudflare R2
        </LI>
        <LI>
          <strong>การตั้งค่าการแจ้งเตือน</strong> — ว่าคุณต้องการรับอีเมลแจ้งเตือนประเภทใด
        </LI>
      </UL>

      <strong className="mb-2 mt-4 block text-slate-700">2.2 ข้อมูลของลูกค้าปลายทาง (End Customers)</strong>
      <P>
        เมื่อลูกค้าของคุณส่งข้อความผ่าน Facebook Messenger หรือ LINE
        มายัง Workspace ของคุณ เราจะประมวลผลข้อมูลดังนี้:
      </P>
      <UL>
        <LI>
          <strong>ข้อความสนทนา</strong> — เพื่อให้ระบบ AI ตอบกลับและให้ทีมของคุณดูประวัติสนทนา
        </LI>
        <LI>
          <strong>ชื่อและรูปโปรไฟล์ (ถ้ามี)</strong> — ดึงจาก Facebook Graph API
          เพื่อแสดงในกล่องข้อความ
        </LI>
        <LI>
          <strong>ID ผู้ใช้จากแพลตฟอร์ม (PSID / LINE UID)</strong> —
          ตัวระบุที่แพลตฟอร์มกำหนดให้ ใช้เพื่อส่งข้อความตอบกลับ
        </LI>
      </UL>
      <P>
        <strong>ข้อมูลที่เราไม่เก็บ:</strong> หมายเลขบัตรเครดิต, เลขบัตรประชาชน,
        ข้อมูลสุขภาพ, หรือข้อมูลอ่อนไหวอื่น ๆ ตามนิยามของ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
      </P>

      <H2>3. ฐานทางกฎหมายในการประมวลผล (Legal Basis)</H2>
      <UL>
        <LI>
          <strong>สัญญา (Contract)</strong> — เพื่อให้บริการตามที่คุณสมัครใช้งาน
          (บัญชีผู้ใช้, Inbox, AI ตอบกลับ)
        </LI>
        <LI>
          <strong>ความยินยอม (Consent)</strong> — สำหรับการส่งอีเมลแจ้งเตือน
          ซึ่งคุณสามารถปิดได้ทุกเมื่อใน Settings
        </LI>
        <LI>
          <strong>ประโยชน์โดยชอบธรรม (Legitimate Interest)</strong> — ป้องกันการฉ้อโกง,
          ดูแลความปลอดภัยของระบบ, และปรับปรุงบริการ
        </LI>
      </UL>

      <H2>4. การเชื่อมต่อกับบริการภายนอก (Third-Party Integrations)</H2>
      <P>Topdee ทำงานร่วมกับบริการภายนอกเหล่านี้:</P>
      <UL>
        <LI>
          <strong>Meta (Facebook)</strong> — รับส่งข้อความผ่าน Messenger API
          เราเก็บเฉพาะ Page Access Token ของ Page ที่คุณเชื่อมต่อ
        </LI>
        <LI>
          <strong>LINE</strong> — รับส่งข้อความผ่าน Messaging API เราเก็บ Channel Secret
          และ Channel Access Token ของคุณ
        </LI>
        <LI>
          <strong>Google</strong> — ใช้สำหรับ Sign in with Google เราได้รับเฉพาะ
          ชื่อและอีเมลจาก Google Profile
        </LI>
        <LI>
          <strong>Google Gemini / AI Provider</strong> — ข้อความของลูกค้าจะถูกส่งไปยัง AI
          เพื่อสร้างคำตอบ ข้อมูลนี้อยู่ภายใต้นโยบายความเป็นส่วนตัวของผู้ให้บริการ AI
        </LI>
        <LI>
          <strong>Cloudflare R2</strong> — เก็บไฟล์รูปภาพ (โลโก้ Workspace)
        </LI>
        <LI>
          <strong>Resend</strong> — ส่งอีเมลแจ้งเตือนและคำเชิญเข้าทีม
        </LI>
        <LI>
          <strong>Stripe</strong> — ประมวลผลการชำระเงิน เราไม่เก็บข้อมูลบัตรเครดิตโดยตรง
        </LI>
      </UL>

      <H2>5. การแชร์ข้อมูล</H2>
      <P>
        เราไม่ขายข้อมูลส่วนตัวของคุณ เราแชร์ข้อมูลเฉพาะกับผู้ให้บริการภายนอกที่ระบุใน
        ข้อ 4 ซึ่งจำเป็นต่อการให้บริการเท่านั้น และอยู่ภายใต้สัญญาประมวลผลข้อมูลที่เหมาะสม
        เราอาจเปิดเผยข้อมูลหากมีคำสั่งทางกฎหมายที่ชอบด้วยกฎหมาย
      </P>

      <H2>6. ระยะเวลาการเก็บข้อมูล</H2>
      <UL>
        <LI>
          <strong>บัญชีผู้ใช้</strong> — เก็บตลอดระยะเวลาที่ Workspace ของคุณยังใช้งานอยู่
          และจะถูกลบภายใน 90 วัน หลังจากที่คุณลบ Workspace หรือยกเลิกบัญชี
        </LI>
        <LI>
          <strong>ข้อความสนทนา</strong> — เก็บตลอดระยะเวลาการใช้งานบริการ
          เพื่อให้ทีมของคุณสามารถดูประวัติย้อนหลังได้
        </LI>
        <LI>
          <strong>Token รีเซ็ตรหัสผ่าน</strong> — ถูกลบโดยอัตโนมัติหลังใช้งานหรือหมดอายุภายใน 1 ชั่วโมง
        </LI>
        <LI>
          <strong>Log ระบบ</strong> — เก็บสูงสุด 30 วัน เพื่อการวินิจฉัยปัญหา
        </LI>
      </UL>

      <H2>7. ความปลอดภัยของข้อมูล</H2>
      <UL>
        <LI>รหัสผ่านเข้ารหัสด้วย bcrypt ก่อนจัดเก็บ</LI>
        <LI>การสื่อสารทั้งหมดผ่าน HTTPS / TLS</LI>
        <LI>Credentials ของ Facebook/LINE เข้ารหัสในฐานข้อมูล</LI>
        <LI>Token รีเซ็ตรหัสผ่านเก็บในรูปแบบ SHA-256 hash เท่านั้น</LI>
        <LI>JWT หมดอายุอัตโนมัติภายใน 24 ชั่วโมง</LI>
      </UL>

      <H2>8. สิทธิ์ของคุณตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</H2>
      <P>คุณมีสิทธิ์ดังต่อไปนี้ โดยสามารถส่งคำขอมาที่ <a href="mailto:privacy@top-dee.com" className="text-indigo-600 underline">privacy@top-dee.com</a>:</P>
      <UL>
        <LI><strong>สิทธิ์ในการเข้าถึง</strong> — ขอดูข้อมูลส่วนตัวที่เราเก็บเกี่ยวกับคุณ</LI>
        <LI><strong>สิทธิ์ในการแก้ไข</strong> — ขอแก้ไขข้อมูลที่ไม่ถูกต้อง</LI>
        <LI><strong>สิทธิ์ในการลบ</strong> — ขอให้ลบข้อมูลส่วนตัวของคุณ</LI>
        <LI><strong>สิทธิ์ในการถ่ายโอนข้อมูล</strong> — ขอรับข้อมูลในรูปแบบที่อ่านได้ด้วยเครื่อง</LI>
        <LI><strong>สิทธิ์ในการคัดค้าน</strong> — คัดค้านการประมวลผลบนฐาน Legitimate Interest</LI>
        <LI><strong>สิทธิ์ในการถอนความยินยอม</strong> — ปิดการแจ้งเตือนอีเมลได้ทันทีใน Settings</LI>
      </UL>
      <P>เราจะตอบกลับคำขอภายใน 30 วันนับจากวันที่ได้รับ</P>

      <H2>9. Cookies</H2>
      <P>
        Topdee ใช้ localStorage ของเบราว์เซอร์เพื่อเก็บ JWT Token สำหรับการเข้าสู่ระบบเท่านั้น
        เราไม่ใช้ Tracking Cookies หรือ Cookies เพื่อวัตถุประสงค์ทางการตลาด
      </P>

      <H2>10. เด็กและเยาวชน</H2>
      <P>
        บริการของเราไม่ได้มุ่งเป้าหมายไปที่บุคคลอายุต่ำกว่า 20 ปี หากคุณพบว่ามีการเก็บข้อมูล
        ของผู้เยาว์โดยไม่ได้รับความยินยอม กรุณาติดต่อเราทันทีเพื่อดำเนินการลบ
      </P>

      <H2>11. การเปลี่ยนแปลงนโยบาย</H2>
      <P>
        เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว หากมีการเปลี่ยนแปลงที่สำคัญ เราจะแจ้งให้ทราบ
        ทางอีเมลของ Owner ก่อนวันที่การเปลี่ยนแปลงมีผลบังคับใช้อย่างน้อย 14 วัน
        การใช้งานบริการต่อเนื่องหลังจากนั้นถือว่าคุณยอมรับนโยบายใหม่
      </P>

      <H2>12. ติดต่อเรา</H2>
      <P>
        หากมีคำถาม ข้อร้องเรียน หรือต้องการใช้สิทธิ์ใด ๆ กรุณาติดต่อ:
        <br />
        <a href="mailto:privacy@top-dee.com" className="font-semibold text-indigo-600 underline">
          privacy@top-dee.com
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
      <H1>Privacy Policy</H1>
      <Updated>Last updated: {UPDATED_EN}</Updated>

      <Box>
        <strong>TL;DR:</strong> Topdee only stores the minimum data needed to run the service. We
        never sell or share your personal data with third parties for marketing purposes.
      </Box>

      <H2>1. Data Controller</H2>
      <P>
        <strong>Topdee</strong> ("<strong>we</strong>", "<strong>us</strong>", or "
        <strong>the Service</strong>") is operated by Topdee.
        <br />
        Website:{' '}
        <a href="https://www.top-dee.com" className="text-indigo-600 underline">
          www.top-dee.com
        </a>
        <br />
        Privacy contact:{' '}
        <a href="mailto:privacy@top-dee.com" className="text-indigo-600 underline">
          privacy@top-dee.com
        </a>
      </P>

      <H2>2. Data We Collect and Why</H2>

      <strong className="mb-2 block text-slate-700">2.1 Workspace Members</strong>
      <UL>
        <LI>
          <strong>Name and email address</strong> — to create your account, send notifications,
          and identify you within your workspace.
        </LI>
        <LI>
          <strong>Password (hashed)</strong> — stored as a bcrypt hash. Your plaintext password
          is never saved.
        </LI>
        <LI>
          <strong>Role</strong> — Owner, Admin, Agent, or Viewer — to control access to
          features.
        </LI>
        <LI>
          <strong>Workspace logo</strong> — an image you choose to upload, stored on Cloudflare
          R2.
        </LI>
        <LI>
          <strong>Notification preferences</strong> — which email alerts you want to receive.
        </LI>
      </UL>

      <strong className="mb-2 mt-4 block text-slate-700">2.2 End Customers</strong>
      <P>
        When your customers message your business through Facebook Messenger or LINE, we process:
      </P>
      <UL>
        <LI>
          <strong>Message content</strong> — to power the AI reply and to display conversation
          history to your team.
        </LI>
        <LI>
          <strong>Display name and profile picture (if available)</strong> — fetched from the
          platform API and shown in the inbox.
        </LI>
        <LI>
          <strong>Platform user ID (Facebook PSID / LINE UID)</strong> — a platform-assigned
          identifier used solely to route outbound replies.
        </LI>
      </UL>
      <P>
        <strong>What we do NOT collect:</strong> credit card numbers, national ID numbers, health
        data, or any other sensitive categories as defined under Thailand's PDPA.
      </P>

      <H2>3. Legal Basis for Processing</H2>
      <UL>
        <LI>
          <strong>Contract</strong> — to deliver the service you signed up for (account, inbox,
          AI replies).
        </LI>
        <LI>
          <strong>Consent</strong> — for email notifications, which you can disable any time in
          Settings.
        </LI>
        <LI>
          <strong>Legitimate Interest</strong> — fraud prevention, system security, and service
          improvement.
        </LI>
      </UL>

      <H2>4. Third-Party Integrations</H2>
      <UL>
        <LI>
          <strong>Meta (Facebook)</strong> — we exchange messages via the Messenger API and store
          the Page Access Token for pages you connect.
        </LI>
        <LI>
          <strong>LINE</strong> — we exchange messages via the Messaging API and store your
          Channel Secret and Channel Access Token.
        </LI>
        <LI>
          <strong>Google</strong> — used for Sign in with Google. We receive only your name and
          email from the Google profile endpoint.
        </LI>
        <LI>
          <strong>Google Gemini / AI Provider</strong> — customer message content is sent to the
          AI to generate replies, subject to the AI provider's own privacy policy.
        </LI>
        <LI>
          <strong>Cloudflare R2</strong> — stores workspace logo images.
        </LI>
        <LI>
          <strong>Resend</strong> — sends notification emails and team invitations.
        </LI>
        <LI>
          <strong>Stripe</strong> — processes payments. We do not store card details directly.
        </LI>
      </UL>

      <H2>5. Data Sharing</H2>
      <P>
        We do not sell your personal data. We share data only with the third-party providers
        listed in Section 4, limited to what is necessary to operate the service, and under
        appropriate data-processing agreements. We may disclose data when required by a valid
        legal order.
      </P>

      <H2>6. Data Retention</H2>
      <UL>
        <LI>
          <strong>User accounts</strong> — retained while your workspace is active and deleted
          within 90 days of workspace deletion or account cancellation.
        </LI>
        <LI>
          <strong>Conversation messages</strong> — retained for the life of the workspace so your
          team can access conversation history.
        </LI>
        <LI>
          <strong>Password-reset tokens</strong> — automatically deleted after use or after
          expiry (1 hour).
        </LI>
        <LI>
          <strong>System logs</strong> — retained for up to 30 days for diagnostic purposes.
        </LI>
      </UL>

      <H2>7. Security</H2>
      <UL>
        <LI>Passwords hashed with bcrypt before storage.</LI>
        <LI>All communication encrypted with HTTPS / TLS.</LI>
        <LI>Facebook and LINE credentials encrypted in the database.</LI>
        <LI>Password-reset tokens stored only as SHA-256 hashes.</LI>
        <LI>JWT sessions expire automatically after 24 hours.</LI>
      </UL>

      <H2>8. Your Rights (PDPA / Privacy Rights)</H2>
      <P>
        You have the following rights. Submit requests to{' '}
        <a href="mailto:privacy@top-dee.com" className="text-indigo-600 underline">
          privacy@top-dee.com
        </a>
        :
      </P>
      <UL>
        <LI>
          <strong>Access</strong> — request a copy of the personal data we hold about you.
        </LI>
        <LI>
          <strong>Rectification</strong> — ask us to correct inaccurate data.
        </LI>
        <LI>
          <strong>Erasure</strong> — ask us to delete your personal data.
        </LI>
        <LI>
          <strong>Portability</strong> — receive your data in a machine-readable format.
        </LI>
        <LI>
          <strong>Objection</strong> — object to processing based on Legitimate Interest.
        </LI>
        <LI>
          <strong>Withdraw consent</strong> — disable email notifications at any time in
          Settings.
        </LI>
      </UL>
      <P>We will respond to requests within 30 days of receipt.</P>

      <H2>9. Cookies & Local Storage</H2>
      <P>
        Topdee uses your browser's localStorage to store your JWT session token. We do not use
        tracking cookies or cookies for advertising purposes.
      </P>

      <H2>10. Children</H2>
      <P>
        The Service is not directed at persons under 20 years of age. If you believe we have
        inadvertently collected data from a minor, please contact us immediately for deletion.
      </P>

      <H2>11. Policy Changes</H2>
      <P>
        We may update this policy from time to time. For material changes, we will notify the
        workspace Owner by email at least 14 days before the change takes effect. Continued use
        of the Service after that date constitutes acceptance of the updated policy.
      </P>

      <H2>12. Contact</H2>
      <P>
        For questions, complaints, or to exercise your rights, contact:
        <br />
        <a href="mailto:privacy@top-dee.com" className="font-semibold text-indigo-600 underline">
          privacy@top-dee.com
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

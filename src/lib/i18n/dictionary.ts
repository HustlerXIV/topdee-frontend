/**
 * UI string dictionary, flat-key style. Add a key here, then use it via
 * `useT()` in any component. Missing keys fall back to the key itself,
 * so it's safe to wire up a string before adding the translation.
 *
 * Keys use `area.subarea.what` shape so the file stays scan-able.
 */
import type { Locale } from "@/store/preferences";

export const dictionary = {
  // ── Brand ─────────────────────────────────────────────
  "brand.name": { th: "TopDee", en: "TopDee" },
  "brand.tagline": {
    th: "รวมแชท + AI สำหรับ SME ไทย",
    en: "Unified chat + AI for SMBs",
  },

  // ── Common ────────────────────────────────────────────
  "common.save": { th: "บันทึก", en: "Save" },
  "common.cancel": { th: "ยกเลิก", en: "Cancel" },
  "common.delete": { th: "ลบ", en: "Delete" },
  "common.edit": { th: "แก้ไข", en: "Edit" },
  "common.back": { th: "ย้อนกลับ", en: "Back" },
  "common.next": { th: "ถัดไป", en: "Next" },
  "common.send": { th: "ส่ง", en: "Send" },
  "common.loading": { th: "กำลังโหลด...", en: "Loading..." },
  "common.search": { th: "ค้นหา", en: "Search" },
  "common.connect": { th: "เชื่อมต่อ", en: "Connect" },
  "common.disconnect": { th: "ตัดการเชื่อม", en: "Disconnect" },
  "common.connected": { th: "เชื่อมต่อแล้ว", en: "Connected" },
  "common.notConnected": { th: "ยังไม่ได้เชื่อมต่อ", en: "Not connected" },
  "common.online": { th: "ออนไลน์อยู่", en: "Online" },
  "common.offline": { th: "ออฟไลน์", en: "Offline" },
  "common.optional": { th: "ไม่บังคับ", en: "optional" },
  "common.email": { th: "อีเมล", en: "Email" },
  "common.password": { th: "รหัสผ่าน", en: "Password" },
  "common.name": { th: "ชื่อ", en: "Name" },
  "common.theme.light": { th: "สว่าง", en: "Light" },
  "common.theme.dark": { th: "มืด", en: "Dark" },
  "common.lang.th": { th: "ไทย", en: "Thai" },
  "common.lang.en": { th: "อังกฤษ", en: "English" },

  // ── Sidebar / nav ─────────────────────────────────────
  "nav.inbox": { th: "Inbox", en: "Inbox" },
  "nav.bot": { th: "AI Chatbot", en: "AI Chatbot" },
  "nav.knowledge": { th: "ฐานความรู้", en: "Knowledge" },
  "nav.analytics": { th: "สถิติ", en: "Analytics" },
  "nav.channels": { th: "ช่องทาง", en: "Channels" },
  "nav.team": { th: "ทีม", en: "Team" },
  "nav.billing": { th: "การเงิน", en: "Billing" },
  "nav.settings": { th: "ตั้งค่า", en: "Settings" },

  // ── Landing ───────────────────────────────────────────
  "landing.heroTop": {
    th: "รวมแชทจากทุก Channel",
    en: "All your chats, in one place",
  },
  "landing.heroBottom": { th: "พ่วง", en: "powered by an" },
  "landing.heroEmphasis": { th: "AI Chatbot", en: "AI Chatbot" },
  "landing.heroBottomTail": { th: "ตอบอัตโนมัติ", en: "that answers for you" },
  "landing.heroSub": {
    th: "แพลตฟอร์มเดียวจัดการแชทจาก LINE, Facebook, Instagram และ Webchat — พร้อม AI ที่ SME ปรับได้เอง ราคาถูกกว่าเจ้าอื่น 3 เท่า",
    en: "One dashboard for LINE, Facebook, Instagram and Webchat — with an AI that any small business can configure on its own. 3× cheaper than the competition.",
  },
  "landing.cta.tryFree": {
    th: "ทดลองใช้ฟรี 14 วัน →",
    en: "Start free trial (14 days) →",
  },
  "landing.cta.watchVideo": { th: "ดูวิดีโอตัวอย่าง", en: "Watch demo" },
  "landing.channels.label": {
    th: "รองรับทุกช่องทาง:",
    en: "Supports every channel:",
  },
  "landing.features.title": { th: "ทำไมต้อง TopDee?", en: "Why TopDee?" },
  "landing.pricing.title": { th: "ราคาตรงไปตรงมา", en: "Simple pricing" },
  "landing.pricing.subtitle": {
    th: "ไม่มี hidden fee ทุกแผนใช้งานได้ครบทุก feature",
    en: "No hidden fees. Every plan ships every feature.",
  },
  "landing.signin": { th: "เข้าสู่ระบบ", en: "Sign in" },
  "landing.signup": { th: "สมัครฟรี", en: "Sign up" },

  // ── Auth ──────────────────────────────────────────────
  "auth.welcome": { th: "ยินดีต้อนรับสู่ TopDee", en: "Welcome to TopDee" },
  "auth.tagline": {
    th: "แพลตฟอร์มรวมแชทและ AI สำหรับ SME ไทย",
    en: "Unified chat + AI platform for small businesses.",
  },
  "auth.tab.login": { th: "เข้าสู่ระบบ", en: "Sign in" },
  "auth.tab.register": { th: "สมัครสมาชิก", en: "Create account" },
  "auth.google": { th: "เข้าสู่ระบบด้วย Google", en: "Continue with Google" },
  "auth.googleSignup": { th: "สมัครด้วย Google", en: "Sign up with Google" },
  "auth.line": { th: "เข้าสู่ระบบด้วย LINE", en: "Continue with LINE" },
  "auth.dividerEmail": { th: "หรือใช้อีเมล", en: "or use email" },
  "auth.dividerForm": { th: "หรือกรอกข้อมูล", en: "or enter details" },
  "auth.forgot": { th: "ลืมรหัสผ่าน?", en: "Forgot password?" },
  "auth.signinBtn": { th: "เข้าสู่ระบบ →", en: "Sign in →" },
  "auth.signinBusy": { th: "กำลังเข้าสู่ระบบ…", en: "Signing in…" },
  "auth.signupBtn": { th: "สมัครและเริ่มใช้งาน →", en: "Create account →" },
  "auth.signupBusy": { th: "กำลังสมัคร…", en: "Creating account…" },
  "auth.workspaceName": { th: "ชื่อร้าน / บริษัท", en: "Workspace name" },
  "auth.passwordHint": {
    th: "รหัสผ่าน (อย่างน้อย 8 ตัว)",
    en: "Password (8+ characters)",
  },
  "auth.noAccount": { th: "ยังไม่มีบัญชี?", en: "No account yet?" },
  "auth.haveAccount": {
    th: "มีบัญชีอยู่แล้ว?",
    en: "Already have an account?",
  },
  "auth.terms": {
    th: "การสมัครถือว่ายอมรับ",
    en: "By signing up you agree to our",
  },

  // ── Onboarding ────────────────────────────────────────
  "onboarding.step.account": { th: "บัญชี", en: "Account" },
  "onboarding.step.channel": { th: "Channel", en: "Channel" },
  "onboarding.step.bot": { th: "AI Bot", en: "AI Bot" },
  "onboarding.step.done": { th: "เสร็จสิ้น", en: "Done" },
  "onboarding.step2.title": {
    th: "🔌 เชื่อมต่อช่องทางแรกของคุณ",
    en: "🔌 Connect your first channel",
  },
  "onboarding.step2.sub": {
    th: "เลือกช่องทางที่อยากรับแชทก่อน (เพิ่มเติมทีหลังได้เสมอ)",
    en: "Pick the channel you want first — you can add more anytime.",
  },
  "onboarding.tip.line": {
    th: "💡 เคล็ดลับ: LINE OA เป็น channel ที่ลูกค้าใช้บ่อยที่สุดในไทย แนะนำเริ่มที่นี่ก่อน",
    en: "💡 Tip: LINE OA is the most-used channel in Thailand — start there.",
  },
  "onboarding.next.bot": {
    th: "ถัดไป: ตั้งค่า AI →",
    en: "Next: configure the AI →",
  },
  "onboarding.step3.title": {
    th: "🤖 ตั้งค่า AI Chatbot เบื้องต้น",
    en: "🤖 Set up your AI bot",
  },
  "onboarding.step3.sub": {
    th: "กำหนดบุคลิกของ AI ก่อนเริ่มใช้งาน แก้ไขได้ตลอดเวลา",
    en: "Pick the bot's personality. You can change this anytime.",
  },
  "onboarding.botName": { th: "ชื่อบอท", en: "Bot name" },
  "onboarding.business": {
    th: "ธุรกิจของคุณคือ?",
    en: "What kind of business?",
  },
  "onboarding.persona.q": {
    th: "AI ควรตอบสนองแบบไหน?",
    en: "How should the AI sound?",
  },
  "onboarding.persona.friendly": { th: "เป็นมิตร", en: "Friendly" },
  "onboarding.persona.professional": { th: "มืออาชีพ", en: "Professional" },
  "onboarding.finish": { th: "เริ่มใช้งาน! 🎉", en: "Let's go! 🎉" },

  // ── Inbox ─────────────────────────────────────────────
  "inbox.search": { th: "🔍  ค้นหาลูกค้า...", en: "🔍  Search customers..." },
  "inbox.filter.all": { th: "ทั้งหมด", en: "All" },
  "inbox.filter.ai": { th: "AI ตอบ", en: "AI replied" },
  "inbox.filter.team": { th: "รอทีม", en: "Waiting on team" },
  "inbox.empty": { th: "ไม่มีข้อความ", en: "No messages" },
  "inbox.input.placeholder": {
    th: "พิมพ์ข้อความ... (กด Enter ส่ง)",
    en: "Type a message... (Enter to send)",
  },
  "inbox.aiSuggestion.label": { th: "AI แนะนำ:", en: "AI suggestion:" },
  "inbox.aiSuggestion.use": { th: "ใช้คำตอบนี้", en: "Use this reply" },
  "inbox.aiSuggestion.body": {
    th: "ซื้อ 3 ชิ้นขึ้นไปลด 10% ครับ รวมส่วนลดจ่ายเพียง 8,073 บาท และสั่งเกิน 1,500 บาทส่งฟรีทั่วไทยครับ",
    en: "Buy 3+ items for 10% off — total ฿8,073 after discount. Free shipping nationwide on orders over ฿1,500.",
  },
  "inbox.action.history": { th: "ประวัติลูกค้า", en: "Customer history" },
  "inbox.action.tag": { th: "แท็ก", en: "Tag" },
  "inbox.action.transfer": { th: "โอนให้ทีม", en: "Transfer to team" },
  "inbox.action.close": { th: "ปิดแชท", en: "Close chat" },
  "inbox.toast.sent": { th: "ส่งข้อความแล้ว", en: "Message sent" },
  "inbox.handoff.badge": { th: "รอทีม", en: "Needs team" },
  "inbox.handoff.banner": { th: "AI ไม่สามารถตอบได้ หรือลูกค้าต้องการคุยกับทีมงาน", en: "AI couldn't answer or customer requested a team member" },
  "inbox.handoff.resolve": { th: "รับสนทนาแล้ว", en: "Mark resolved" },
  "inbox.toast.resolved": { th: "ส่งต่อให้ทีมเรียบร้อย", en: "Handed off to team" },

  // ── Bot settings ──────────────────────────────────────
  "bot.title": { th: "🤖 AI Chatbot Settings", en: "🤖 AI Chatbot Settings" },
  "bot.sub": {
    th: "ปรับแต่ง AI ให้เหมาะกับธุรกิจของคุณ ตั้งค่าได้เองทุกอย่าง",
    en: "Tune the AI to fit your business — every setting is yours to change.",
  },
  "bot.persona.section": {
    th: "บุคลิกและการตอบสนอง",
    en: "Personality & response",
  },
  "bot.field.botName": { th: "ชื่อบอท", en: "Bot name" },
  "bot.field.lang": { th: "ภาษาหลัก", en: "Primary language" },
  "bot.field.persona": { th: "บุคลิกของบอท", en: "Bot personality" },
  "bot.field.mode": { th: "โหมดตอบ", en: "Reply mode" },
  "bot.field.prompt": {
    th: "System Prompt (บอก AI ว่าตัวเองคือใคร)",
    en: "System prompt (tell the AI who it is)",
  },
  "bot.save": { th: "💾 บันทึกการตั้งค่า", en: "💾 Save settings" },
  "bot.test.section": {
    th: "ทดสอบบอทก่อน Publish",
    en: "Test the bot before publishing",
  },
  "bot.toast.saved": { th: "บันทึกการตั้งค่าแล้ว ✨", en: "Settings saved ✨" },

  // ── Knowledge ─────────────────────────────────────────
  "kb.title": { th: "📚 Knowledge Base", en: "📚 Knowledge Base" },
  "kb.sub": {
    th: "อัปโหลดไฟล์ให้ AI อ่านและใช้ตอบคำถาม รองรับ PDF, Word, Excel, TXT",
    en: "Upload files for the AI to read & cite. Supports PDF, Word, Excel, TXT.",
  },
  "kb.create.section": {
    th: "สร้าง Knowledge Base ใหม่",
    en: "Create a new knowledge base",
  },
  "kb.create.namePlaceholder": {
    th: "เช่น สินค้า FAQ, นโยบายร้าน",
    en: "e.g. Product FAQ, Store policy",
  },
  "kb.create.descLabel": {
    th: "รายละเอียด (ไม่บังคับ)",
    en: "Description (optional)",
  },
  "kb.create.btn": { th: "สร้าง Knowledge Base", en: "Create knowledge base" },
  "kb.create.busy": { th: "กำลังสร้าง…", en: "Creating…" },
  "kb.list.section": {
    th: "Knowledge Bases ของคุณ",
    en: "Your knowledge bases",
  },
  "kb.list.empty": {
    th: "ยังไม่มี Knowledge Base · สร้างอันแรกด้านบน",
    en: "No knowledge bases yet · create your first one above",
  },
  "kb.toast.created": {
    th: "สร้าง Knowledge Base แล้ว",
    en: "Knowledge base created",
  },
  "kb.upload.section": { th: "อัปโหลดไฟล์ใหม่", en: "Upload a new file" },
  "kb.upload.click": { th: "คลิกเพื่ออัปโหลด", en: "Click to upload" },
  "kb.upload.busy": {
    th: "กำลังอัปโหลด & embed…",
    en: "Uploading & embedding…",
  },
  "kb.upload.drag": { th: "หรือลากไฟล์มาวางที่นี่", en: "or drag files here" },
  "kb.upload.types": {
    th: "PDF, DOCX, XLSX, TXT · สูงสุด 10MB ต่อไฟล์",
    en: "PDF, DOCX, XLSX, TXT · 10MB max per file",
  },
  "kb.files.section": { th: "ไฟล์ในฐานข้อมูล", en: "Files in this base" },
  "kb.files.empty": {
    th: "ยังไม่มีไฟล์ — อัปโหลดด้านบน",
    en: "No files yet — upload above",
  },
  "kb.file.ready": { th: "✓ พร้อมใช้", en: "✓ Ready" },
  "kb.delete": { th: "🗑 ลบ KB", en: "🗑 Delete KB" },

  // ── Channels ──────────────────────────────────────────
  "channels.title": { th: "📡 Channel Manager", en: "📡 Channel Manager" },
  "channels.sub": {
    th: "เชื่อมต่อช่องทางแชทและจัดการการตั้งค่า",
    en: "Connect chat channels and manage their settings.",
  },
  "channels.stats.month": { th: "แชทเดือนนี้", en: "Chats this month" },
  "channels.stats.followers": { th: "Followers", en: "Followers" },
  "channels.stats.likes": { th: "Page Likes", en: "Page likes" },
  "channels.web.desc": {
    th: "ฝัง chat widget บนเว็บไซต์ของคุณ copy-paste โค้ด 1 บรรทัด",
    en: "Embed a chat widget on your website — one line of code.",
  },
  "channels.add.title": { th: "เพิ่ม Channel ใหม่", en: "Add a channel" },
  "channels.add.desc": {
    th: "WhatsApp, Shopee Chat, Lazada และอื่นๆ",
    en: "WhatsApp, Shopee Chat, Lazada and more",
  },
  "channels.connect.fb": {
    th: "เชื่อมต่อ Facebook Messenger",
    en: "Connect Facebook Messenger",
  },
  "channels.connect.line": {
    th: "เชื่อมต่อ LINE Official Account",
    en: "Connect LINE Official Account",
  },

  // ── Analytics ─────────────────────────────────────────
  "analytics.title": { th: "📊 Analytics", en: "📊 Analytics" },
  "analytics.sub": {
    th: "ภาพรวมช่วง 30 วันที่ผ่านมา",
    en: "Overview of the last 30 days",
  },
  "analytics.range.30d": { th: "30 วันล่าสุด", en: "Last 30 days" },
  "analytics.range.7d": { th: "7 วันล่าสุด", en: "Last 7 days" },
  "analytics.range.month": { th: "เดือนนี้", en: "This month" },
  "analytics.kpi.totalChats": { th: "💬 แชททั้งหมด", en: "💬 Total chats" },
  "analytics.kpi.aiResolved": {
    th: "🤖 AI ตอบได้เอง",
    en: "🤖 AI resolution rate",
  },
  "analytics.kpi.avgTime": {
    th: "⚡ เวลาตอบเฉลี่ย",
    en: "⚡ Avg response time",
  },
  "analytics.kpi.satisfaction": { th: "😊 ความพึงพอใจ", en: "😊 Satisfaction" },
  "analytics.kpi.minutes": { th: "นาที", en: "min" },
  "analytics.kpi.totalConvs": { th: "💬 การสนทนาทั้งหมด", en: "💬 Total conversations" },
  "analytics.kpi.aiResolved2": { th: "🤖 AI ตอบได้เอง", en: "🤖 AI resolved" },
  "analytics.kpi.humanTakeover": { th: "👤 Human เข้ามาช่วย", en: "👤 Human takeovers" },
  "analytics.kpi.uniqueCustomers": { th: "👥 ลูกค้าไม่ซ้ำ", en: "👥 Unique customers" },
  "analytics.bar.title": { th: "การสนทนารายวัน", en: "Conversations per day" },
  "analytics.pie.title": { th: "สัดส่วนตาม Channel", en: "Breakdown by channel" },
  "analytics.resolution.title": { th: "สรุปการแก้ไขปัญหา", en: "Resolution summary" },
  "analytics.resolution.aiDesc": { th: "AI ตอบครบ ไม่ต้องใช้ทีม", en: "Handled fully by AI" },
  "analytics.resolution.humanDesc": { th: "ทีมเข้ามาช่วยตอบ", en: "Team member stepped in" },
  "analytics.resolution.unanswered": { th: "ยังไม่มีการตอบกลับ", en: "Awaiting response" },
  "analytics.noData": { th: "ยังไม่มีข้อมูลในช่วงนี้", en: "No data for this period" },
  "analytics.loading": { th: "กำลังโหลดข้อมูล…", en: "Loading data…" },
  "analytics.change.up": { th: "↑ {n}% จากช่วงก่อน", en: "↑ {n}% vs prev period" },
  "analytics.change.down": { th: "↓ {n}% จากช่วงก่อน", en: "↓ {n}% vs prev period" },
  "analytics.change.same": { th: "เท่ากับช่วงก่อน", en: "Same as prev period" },
  "analytics.change.new": { th: "ไม่มีข้อมูลช่วงก่อน", en: "No prior period data" },
  "analytics.channel.line": { th: "LINE OA", en: "LINE OA" },
  "analytics.channel.facebook": { th: "Facebook", en: "Facebook" },
  "analytics.channel.dashboard": { th: "Playground", en: "Playground" },
  "analytics.sub2": { th: "ข้อมูลจริงจากระบบ — ไม่รวมการทดสอบใน Playground", en: "Live data from your workspace — playground tests excluded" },

  // ── Billing ───────────────────────────────────────────
  "billing.title": {
    th: "💳 Billing & Subscription",
    en: "💳 Billing & Subscription",
  },
  "billing.sub": {
    th: "จัดการแผนการใช้งานและประวัติการชำระเงิน",
    en: "Manage your plan and payment history.",
  },
  "billing.currentPlan.label": { th: "แผนปัจจุบัน", en: "Current plan" },
  "billing.currentPlan.renew": {
    th: "ต่ออายุอัตโนมัติวันที่ 17 พ.ค. 2568",
    en: "Auto-renews on May 17, 2025",
  },
  "billing.usage.label": { th: "ข้อความที่ใช้ไป", en: "Messages used" },
  "billing.usage.remaining": {
    th: "เหลือ",
    en: "remaining",
  },
  "billing.upgrade": { th: "อัปเกรดเป็น Pro →", en: "Upgrade to Pro →" },
  "billing.method.section": { th: "วิธีชำระเงิน", en: "Payment method" },
  "billing.method.expires": { th: "หมดอายุ", en: "Expires" },
  "billing.method.change": { th: "เปลี่ยน", en: "Change" },
  "billing.method.add": {
    th: "+ เพิ่มบัตร / PromptPay",
    en: "+ Add card / PromptPay",
  },
  "billing.invoice.section": {
    th: "ประวัติการชำระเงิน",
    en: "Payment history",
  },
  "billing.invoice.desc": {
    th: "ใบแจ้งหนี้ล่าสุดจาก Stripe",
    en: "Recent invoices from Stripe.",
  },
  "billing.invoice.empty": {
    th: "ยังไม่มีใบแจ้งหนี้",
    en: "No invoices yet.",
  },
  "billing.invoice.paid": { th: "ชำระแล้ว", en: "Paid" },
  "billing.cancel.warn": {
    th: "ยกเลิก subscription: จะยังใช้งานได้ถึงสิ้นรอบบิล (17 พ.ค. 68) หลังจากนั้นจะเปลี่ยนเป็น Free plan",
    en: "Cancel subscription: you keep access until the end of the billing cycle (May 17), then switch to the Free plan.",
  },
  "billing.cancel.btn": { th: "ยกเลิก plan", en: "Cancel plan" },

  // Payment methods section
  "billing.method.title": { th: "วิธีชำระเงิน", en: "Payment methods" },
  "billing.method.desc": { th: "บัตรที่บันทึกไว้สำหรับการเรียกเก็บเงินรายเดือน", en: "Cards saved to your account for recurring billing." },
  "billing.method.loading": { th: "กำลังโหลด…", en: "Loading…" },
  "billing.method.empty": { th: "ยังไม่มีบัตร สมัครแผนเพื่อเพิ่มบัตร", en: "No cards saved yet. Subscribe to a plan to add one." },
  "billing.method.default": { th: "ค่าเริ่มต้น", en: "Default" },
  "billing.method.remove": { th: "ลบบัตร", en: "Remove card" },
  "billing.method.removeConfirm": { th: "ต้องการลบบัตรนี้ออกจากบัญชีหรือไม่?", en: "Remove this card from your account?" },
  "billing.method.addChange": { th: "+ เพิ่ม / เปลี่ยนบัตร", en: "+ Add / change card" },

  // Cancel / reactivate section
  "billing.cancel.title": { th: "ยกเลิก subscription", en: "Cancel subscription" },
  "billing.cancel.desc": { th: "หากยกเลิก คุณยังใช้แผน {plan} ได้ถึง {date} ซึ่งเป็นสิ้นรอบบิลปัจจุบัน หลังจากนั้นจะเปลี่ยนเป็น Free plan โดยอัตโนมัติ ไม่มีการเรียกเก็บเงินอีก", en: "If you cancel, you keep full access to {plan} until {date} — the end of your current billing period. After that, your account moves to the Free plan automatically. You won't be charged again." },
  "billing.cancel.canceling": { th: "กำลังยกเลิก…", en: "Canceling…" },
  "billing.cancel.scheduled": { th: "Subscription จะสิ้นสุดวันที่ {date}", en: "Subscription cancels on {date}" },
  "billing.cancel.scheduledDesc": { th: "คุณยังใช้แผน {plan} ได้ถึง {date} หลังจากนั้นจะเปลี่ยนเป็น Free plan โดยอัตโนมัติ ไม่มีการเรียกเก็บเงินอีก", en: "You keep full access to {plan} until {date}. On that date your account moves to the Free plan automatically — no further charges." },
  "billing.cancel.undo": { th: "ยกเลิกการยกเลิก", en: "Undo cancellation" },
  "billing.cancel.keep": { th: "คงการสมัครสมาชิกไว้", en: "Keep subscription" },

  // Past-due warning
  "billing.pastDue.msg": { th: "การชำระเงินครั้งล่าสุดล้มเหลว อัปเดตวิธีชำระเงินเพื่อรักษาการเข้าถึง", en: "Your last payment failed. Update your payment method to avoid losing access." },
  "billing.pastDue.fix": { th: "แก้ไขการชำระเงิน", en: "Fix payment" },

  // Plan grid
  "billing.plans.title": { th: "เปลี่ยนแผน", en: "Change plan" },
  "billing.plans.desc": { th: "อัปเกรดหรือดาวน์เกรด — Stripe จัดการส่วนต่างโดยอัตโนมัติ", en: "Upgrade or downgrade — Stripe handles proration automatically." },
  "billing.plans.monthly": { th: "รายเดือน", en: "Monthly" },
  "billing.plans.yearly": { th: "รายปี", en: "Yearly" },
  "billing.plans.saveMore": { th: "ประหยัดกว่า", en: "Save more" },
  "billing.plans.loading": { th: "กำลังโหลดแผน…", en: "Loading plans…" },
  "billing.plans.empty": { th: "ไม่มีแผนที่ใช้งานได้", en: "No plans available." },
  "billing.plans.noYearly": { th: "ไม่มีตัวเลือกรายปี", en: "No yearly option" },
  "billing.plans.noMonthly": { th: "ไม่มีตัวเลือกรายเดือน", en: "No monthly option" },
  "billing.plans.current": { th: "แผนปัจจุบัน", en: "Current" },
  "billing.plans.choose": { th: "เลือก", en: "Choose" },
  "billing.plans.free": { th: "แผนฟรี", en: "Free tier" },
  "billing.plans.unavailable": { th: "ไม่พร้อมใช้งาน", en: "Not available" },
  "billing.plans.popular": { th: "ยอดนิยม", en: "Popular" },
  "billing.plans.billedAnnually": { th: "เรียกเก็บรายปี", en: "billed annually" },

  // PromptPay payment option
  "billing.promptpay.btn": { th: "จ่ายผ่าน PromptPay", en: "Pay with PromptPay" },
  "billing.promptpay.note": { th: "จ่ายครั้งเดียว ไม่ต่ออายุอัตโนมัติ", en: "One-time · no auto-renewal" },
  "billing.promptpay.renew": { th: "ต่ออายุด้วย PromptPay ก่อนหมดอายุ", en: "Renew via PromptPay before expiry" },
  // Payment method picker dialog
  "billing.payMethod.title": { th: "เลือกวิธีชำระเงิน", en: "Choose payment method" },
  "billing.payMethod.for": { th: "สำหรับแผน", en: "For plan" },
  "billing.payMethod.card.title": { th: "บัตรเครดิต / เดบิต", en: "Credit / Debit Card" },
  "billing.payMethod.card.desc": { th: "ชำระอัตโนมัติทุกรอบบิล ยกเลิกได้ตลอดเวลา", en: "Auto-charged each billing period. Cancel anytime." },
  "billing.payMethod.card.badge": { th: "ต่ออายุอัตโนมัติ", en: "Auto-renews" },
  "billing.payMethod.pp.title": { th: "PromptPay (QR Code)", en: "PromptPay (QR Code)" },
  "billing.payMethod.pp.desc": { th: "สแกน QR ผ่านแอปธนาคาร จ่ายครั้งเดียวต่อรอบ ไม่มีการเรียกเก็บอัตโนมัติ", en: "Scan QR via your banking app. Charged once per period — renew manually when it expires." },
  "billing.payMethod.pp.badge": { th: "ไม่ต่ออายุอัตโนมัติ", en: "Manual renewal" },

  // Expired callout
  "billing.expired.msg": { th: "Subscription ของคุณสิ้นสุดเมื่อวันที่ {date} และได้เปลี่ยนเป็น Free plan แล้ว เลือกแผนด้านบนเพื่อสมัครใหม่", en: "Your subscription ended on {date} and you have been moved to the Free plan. Choose a plan above to resubscribe." },

  // Stats
  "billing.stat.channels": { th: "ช่องทาง", en: "Channels" },
  "billing.stat.members": { th: "สมาชิก", en: "Members" },
  "billing.stat.aiMessages": { th: "AI messages", en: "AI messages" },
  "billing.stat.unlimited": { th: "ไม่จำกัด", en: "Unlimited" },
  "billing.stat.thisMonth": { th: "เดือนนี้", en: "this month" },
  "billing.stat.slotsLeft": { th: "ช่องว่างเหลือ {n}", en: "{n} slot(s) left" },
  "billing.stat.left": { th: "เหลือ {n}", en: "{n} left" },

  // Manage subscription button
  "billing.manage": { th: "จัดการ subscription", en: "Manage subscription" },

  // Current plan banner dynamic strings
  "billing.currentPlan.cancels": { th: "ยกเลิกวันที่ {date}", en: "Cancels on {date}" },
  "billing.currentPlan.renews": { th: "ต่ออายุวันที่ {date}", en: "Renews on {date}" },
  "billing.currentPlan.trial": { th: "ทดลองใช้สิ้นสุดวันที่ {date}", en: "Trial ends {date}" },
  "billing.price.free": { th: "ฟรี", en: "Free" },

  // ── Team ──────────────────────────────────────────────
  "team.title": { th: "👥 Team Members", en: "👥 Team Members" },
  "team.subFmt": {
    th: "จัดการสมาชิกและสิทธิ์การใช้งาน",
    en: "Manage members and permissions",
  },
  "team.invite.btn": { th: "+ Invite สมาชิก", en: "+ Invite member" },
  "team.invite.send": { th: "ส่ง Invite", en: "Send invite" },
  "team.invite.placeholder": {
    th: "กรอกอีเมลสมาชิกใหม่...",
    en: "Enter member email...",
  },
  "team.invite.toast": { th: "ส่งคำเชิญแล้ว", en: "Invite sent" },
  "team.list.section": { th: "สมาชิกทั้งหมด", en: "All members" },
  "team.pending": { th: "⏳ Pending", en: "⏳ Pending" },
  "team.resend": { th: "ส่งใหม่", en: "Resend" },
  "team.role.section": { th: "สิทธิ์ของแต่ละ Role", en: "Role permissions" },

  // ── Settings ──────────────────────────────────────────
  "settings.title": {
    th: "⚙️ Workspace Settings",
    en: "⚙️ Workspace Settings",
  },
  "settings.sub": {
    th: "ตั้งค่า workspace และบัญชีผู้ใช้",
    en: "Configure workspace and account.",
  },
  "settings.tab.workspace": { th: "Workspace", en: "Workspace" },
  "settings.tab.account": { th: "บัญชีของฉัน", en: "My account" },
  "settings.tab.notify": { th: "การแจ้งเตือน", en: "Notifications" },
  "settings.tab.api": { th: "API Keys", en: "API keys" },
  "settings.appearance.section": { th: "หน้าตา", en: "Appearance" },
  "settings.appearance.lang": { th: "ภาษา", en: "Language" },
  "settings.appearance.theme": { th: "ธีม", en: "Theme" },
  "settings.workspace.section": {
    th: "ข้อมูล Workspace",
    en: "Workspace info",
  },
  "settings.account.section": { th: "บัญชีของฉัน", en: "My account" },
  "settings.password.section": { th: "เปลี่ยนรหัสผ่าน", en: "Change password" },
  "settings.notify.section": { th: "การแจ้งเตือน", en: "Notifications" },
  "settings.api.section": { th: "API Keys", en: "API keys" },
  "settings.logout.section": { th: "ออกจากระบบ", en: "Sign out" },
  "settings.logout.desc": {
    th: "เซสชันจะถูกล้างจาก device นี้",
    en: "Your session will be cleared from this device.",
  },
  "settings.logout.btn": { th: "ออกจากระบบ", en: "Sign out" },
  "settings.toast.saved": { th: "บันทึกแล้ว", en: "Saved" },
} as const;

export type DictKey = keyof typeof dictionary;

export function translate(key: DictKey, locale: Locale): string {
  const entry = dictionary[key];
  if (!entry) return String(key);
  return entry[locale] ?? entry.th ?? String(key);
}

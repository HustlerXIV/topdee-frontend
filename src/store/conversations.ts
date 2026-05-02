/**
 * Conversations store — drives the Inbox page UI.
 *
 * The backend doesn't yet expose a multi-tenant inbox endpoint that lists
 * conversations by channel, so this store ships with a small in-memory
 * fixture matching the prototype. When the backend lands, swap `seedDemo`
 * for an `api.inbox.list()` call and keep the same shape.
 */
import { create } from 'zustand';

export type Channel = 'line' | 'fb' | 'ig' | 'web';
export type ConvKind = 'ai' | 'team';

export type ConvMessage = {
  id: string;
  direction: 'in' | 'out';
  author: 'customer' | 'ai' | 'agent';
  text: string;
  time: string; // already formatted for display
};

export type Conversation = {
  id: string;
  customerName: string;
  initials: string;
  avatarTone: 'purple' | 'blue' | 'pink' | 'yellow' | 'green' | 'gray';
  channel: Channel;
  preview: string;
  time: string;
  unread: number;
  kind: ConvKind;
  online?: boolean;
  messages: ConvMessage[];
};

type ConvFilter = 'all' | 'ai' | 'team';

type State = {
  conversations: Conversation[];
  selectedId: string | null;
  filter: ConvFilter;
  search: string;
  select: (id: string) => void;
  setFilter: (f: ConvFilter) => void;
  setSearch: (s: string) => void;
  appendMessage: (id: string, msg: ConvMessage) => void;
  seedDemo: () => void;
};

const demo: Conversation[] = [
  {
    id: 'c1',
    customerName: 'สมชาย ใจดี',
    initials: 'ส',
    avatarTone: 'purple',
    channel: 'line',
    preview: '🤖 สอบถามเรื่องราคาสินค้า...',
    time: '2 นาที',
    unread: 3,
    kind: 'ai',
    online: true,
    messages: [
      { id: 'm1', direction: 'in', author: 'customer', text: 'สวัสดีครับ อยากสอบถามเรื่องราคาสินค้ารุ่น Pro Max ครับ', time: '10:23' },
      { id: 'm2', direction: 'out', author: 'ai', text: 'สวัสดีครับคุณสมชาย! สินค้ารุ่น Pro Max ราคา 2,990 บาทครับ รวม VAT แล้ว มีทั้งสีดำและสีขาวครับ 😊', time: '10:23' },
      { id: 'm3', direction: 'in', author: 'customer', text: 'ถ้าสั่ง 3 ชิ้นมีส่วนลดไหมครับ?', time: '10:25' },
      { id: 'm4', direction: 'in', author: 'customer', text: 'และส่งฟรีไหมครับ?', time: '10:25' },
    ],
  },
  {
    id: 'c2',
    customerName: 'วิภา รักสวย',
    initials: 'ว',
    avatarTone: 'blue',
    channel: 'fb',
    preview: 'ขอบคุณค่ะ จะรอสินค้า',
    time: '15 นาที',
    unread: 0,
    kind: 'team',
    messages: [],
  },
  {
    id: 'c3',
    customerName: 'กมลา สาวสวย',
    initials: 'ก',
    avatarTone: 'pink',
    channel: 'ig',
    preview: '🤖 มีสินค้าขนาด L ไหมคะ',
    time: '32 นาที',
    unread: 1,
    kind: 'ai',
    messages: [],
  },
  {
    id: 'c4',
    customerName: 'ประเสริฐ ค้าขาย',
    initials: 'ป',
    avatarTone: 'purple',
    channel: 'line',
    preview: 'ส่งของถึงวันไหนครับ',
    time: '1 ชม.',
    unread: 0,
    kind: 'team',
    messages: [],
  },
  {
    id: 'c5',
    customerName: 'นภา ดาวเด่น',
    initials: 'น',
    avatarTone: 'yellow',
    channel: 'line',
    preview: '🤖 อยากสั่งของ 3 ชิ้น...',
    time: '2 ชม.',
    unread: 5,
    kind: 'ai',
    messages: [],
  },
  {
    id: 'c6',
    customerName: 'รัตนา ช้อปปิ้ง',
    initials: 'ร',
    avatarTone: 'green',
    channel: 'fb',
    preview: 'ได้เลยค่ะ ขอบคุณมากนะคะ',
    time: '3 ชม.',
    unread: 0,
    kind: 'team',
    messages: [],
  },
];

export const useConversations = create<State>((set) => ({
  conversations: [],
  selectedId: null,
  filter: 'all',
  search: '',
  select: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  appendMessage: (id, msg) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id
          ? { ...c, messages: [...c.messages, msg], preview: msg.text, time: 'ตอนนี้' }
          : c,
      ),
    })),
  seedDemo: () =>
    set((s) =>
      s.conversations.length === 0
        ? { conversations: demo, selectedId: demo[0].id }
        : s,
    ),
}));

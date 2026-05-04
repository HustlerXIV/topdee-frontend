/**
 * Centralised icon barrel.
 *
 * The rest of the codebase imports from here, never directly from
 * `lucide-react`. That keeps the choice of icon library a one-file
 * decision — if we ever want to swap to Heroicons or react-icons,
 * we only edit this module.
 *
 * Naming convention is semantic ("Inbox", "Trash", "Sparkles") rather
 * than visual ("Box", "Garbage", "Stars") so call sites read like English.
 *
 * Usage:
 *
 *   import { Icon } from '@/components/ui/Icon';
 *   <Icon name="inbox" className="h-5 w-5 text-brand-600" />
 *
 * Or grab the component directly when you need to type-narrow:
 *
 *   import { Inbox } from '@/components/ui/Icon';
 *   <Inbox className="h-5 w-5" />
 */
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  // ── Navigation ────────────────────────────────
  Inbox,
  Bot,
  BookOpen,
  BarChart3,
  Plug,
  Users,
  CreditCard,
  Settings,
  // ── Actions ───────────────────────────────────
  Send,
  Save,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Copy,
  Upload,
  Download,
  LogIn,
  LogOut,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  // ── Status ────────────────────────────────────
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Hourglass,
  CircleDot,
  // ── People & objects ──────────────────────────
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Lock,
  Key,
  Tag,
  Sparkles,
  Wand2,
  Bell,
  Shield,
  Star,
  Lightbulb,
  Receipt,
  FlaskConical,
  // ── Theme ─────────────────────────────────────
  Sun,
  Moon,
  Languages,
  // ── Files ─────────────────────────────────────
  File,
  FileText,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  CloudUpload,
  // ── Comms / brands ────────────────────────────
  MessageCircle,
  MessageSquare,
  Facebook,
  Instagram,
  Globe,
  // ── Misc ──────────────────────────────────────
  Building2,
  ShoppingBag,
  Palette,
  Eye,
  EyeOff,
  Share2,
  PartyPopper,
  Power,
  Sliders,
  CircleHelp,
  PieChart,
  Smile,
  Zap,
  DollarSign,
  Link as LinkIcon,
  type LucideIcon as _LucideIconType,
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-unused-vars */
type _Keep = _LucideIconType; // re-export for type-only consumers

// ── Semantic name → component map ─────────────────────────────────────
//
// Keys are semantic (what the icon means in our product), values are
// the lucide component. Add aliases here when a single icon plays
// multiple roles (e.g. "save" + "disk" both → Save).
export const ICONS = {
  // Nav
  inbox: Inbox,
  bot: Bot,
  knowledge: BookOpen,
  analytics: BarChart3,
  channels: Plug,
  team: Users,
  billing: CreditCard,
  settings: Settings,

  // Actions
  send: Send,
  save: Save,
  search: Search,
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  trash: Trash2,
  close: X,
  check: Check,
  chevronDown: ChevronDown,
  copy: Copy,
  upload: Upload,
  download: Download,
  signin: LogIn,
  signout: LogOut,
  reset: RotateCcw,
  next: ArrowRight,
  back: ArrowLeft,
  transfer: ArrowRightLeft,
  share: Share2,

  // Status
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  pending: Hourglass,
  dot: CircleDot,

  // People & misc
  user: User,
  email: Mail,
  envelope: Mail,
  phone: Phone,
  calendar: Calendar,
  clock: Clock,
  lock: Lock,
  password: Lock,
  key: Key,
  tag: Tag,
  sparkles: Sparkles,
  wand: Wand2,
  bell: Bell,
  shield: Shield,
  star: Star,
  tip: Lightbulb,
  receipt: Receipt,
  flask: FlaskConical,

  // Theme
  light: Sun,
  dark: Moon,
  language: Languages,

  // Files
  file: File,
  fileText: FileText,
  filePdf: FileText,
  fileWord: FileText,
  fileExcel: FileSpreadsheet,
  folder: Folder,
  folderOpen: FolderOpen,
  cloudUpload: CloudUpload,

  // Comms / channel brands
  chat: MessageSquare,
  message: MessageCircle,
  line: MessageCircle, // LINE — green tint at the call site
  facebook: Facebook,
  instagram: Instagram,
  web: Globe,
  globe: Globe,

  // Misc
  building: Building2,
  shop: ShoppingBag,
  palette: Palette,
  eye: Eye,
  eyeOff: EyeOff,
  party: PartyPopper,
  power: Power,
  sliders: Sliders,
  help: CircleHelp,
  pie: PieChart,
  smile: Smile,
  zap: Zap,
  money: DollarSign,
  link: LinkIcon,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/**
 * Generic icon component. Defaults: 1em sizing (so it scales with surrounding
 * text), `currentColor` (so Tailwind's `text-*` classes paint it).
 *
 *   <Icon name="inbox" className="h-5 w-5 text-brand-600" />
 */
export function Icon({
  name,
  className,
  ...rest
}: { name: IconName } & LucideProps) {
  const C = ICONS[name];
  return <C aria-hidden focusable="false" className={className} {...rest} />;
}

// Direct re-exports for places that prefer named imports.
export {
  Inbox,
  Bot,
  BookOpen,
  BarChart3,
  Plug,
  Users,
  CreditCard,
  Settings,
  Send,
  Save,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Copy,
  Upload,
  Download,
  LogIn,
  LogOut,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Hourglass,
  CircleDot,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Lock,
  Key,
  Tag,
  Sparkles,
  Wand2,
  Bell,
  Shield,
  Star,
  Lightbulb,
  Receipt,
  FlaskConical,
  Sun,
  Moon,
  Languages,
  File,
  FileText,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  CloudUpload,
  MessageCircle,
  MessageSquare,
  Facebook,
  Instagram,
  Globe,
  Building2,
  ShoppingBag,
  Palette,
  Eye,
  EyeOff,
  Share2,
  PartyPopper,
  Power,
  Sliders,
  CircleHelp,
  PieChart,
  Smile,
  Zap,
  DollarSign,
  LinkIcon,
};

/**
 * Modern Icon Mapping - Lucide React Icons
 * Replaces emoji icons with professional SVG icons
 */

import {
  Home,
  Users,
  FileCheck,
  Calendar,
  Settings,
  BarChart3,
  Scale,
  CheckSquare,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  UserPlus,
  FileText,
  Mail,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Activity,
  PieChart,
  type LucideIcon,
} from 'lucide-react';

/**
 * Navigation Icons
 */
export const NavIcons = {
  dashboard: Home,
  pilots: Users,
  certifications: FileCheck,
  leave: Calendar,
  reports: BarChart3,
  disciplinary: Scale,
  tasks: CheckSquare,
  settings: Settings,
} as const;

/**
 * Action Icons
 */
export const ActionIcons = {
  add: Plus,
  download: Download,
  upload: Upload,
  search: Search,
  filter: Filter,
  refresh: RefreshCw,
  edit: Edit,
  delete: Trash2,
  view: Eye,
  hide: EyeOff,
  more: MoreVertical,
} as const;

/**
 * Status Icons
 */
export const StatusIcons = {
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
  pending: Clock,
  trending: TrendingUp,
} as const;

/**
 * Form & Auth Icons
 */
export const FormIcons = {
  lock: Lock,
  unlock: Unlock,
  shield: Shield,
  email: Mail,
  user: Users,
  userPlus: UserPlus,
} as const;

/**
 * UI Icons
 */
export const UIIcons = {
  notification: Bell,
  logout: LogOut,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  document: FileText,
  activity: Activity,
  chart: PieChart,
} as const;

/**
 * Emoji to Icon mapping for gradual migration
 */
export const EmojiToIcon: Record<string, LucideIcon> = {
  '🏠': Home,
  '👥': Users,
  '📋': FileCheck,
  '📅': Calendar,
  '⚙️': Settings,
  '📊': BarChart3,
  '⚖️': Scale,
  '✅': CheckSquare,
  '➕': Plus,
  '📥': Download,
  '📤': Upload,
  '🔍': Search,
  '🔄': RefreshCw,
  '⚠️': AlertTriangle,
  '✔️': CheckCircle2,
  '❌': XCircle,
  '⏰': Clock,
  '📈': TrendingUp,
  '🔒': Lock,
  '🔓': Unlock,
  '🛡️': Shield,
  '📧': Mail,
  '🔔': Bell,
  '🚪': LogOut,
};

/**
 * Get icon component by name or emoji
 */
export function getIcon(identifier: string): LucideIcon | null {
  // Check if it's an emoji
  if (EmojiToIcon[identifier]) {
    return EmojiToIcon[identifier];
  }

  // Check navigation icons
  if (identifier in NavIcons) {
    return NavIcons[identifier as keyof typeof NavIcons];
  }

  // Check action icons
  if (identifier in ActionIcons) {
    return ActionIcons[identifier as keyof typeof ActionIcons];
  }

  // Check status icons
  if (identifier in StatusIcons) {
    return StatusIcons[identifier as keyof typeof StatusIcons];
  }

  // Check form icons
  if (identifier in FormIcons) {
    return FormIcons[identifier as keyof typeof FormIcons];
  }

  // Check UI icons
  if (identifier in UIIcons) {
    return UIIcons[identifier as keyof typeof UIIcons];
  }

  return null;
}

/**
 * Default icon sizes (Tailwind classes)
 */
export const IconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
} as const;

export type IconSize = keyof typeof IconSizes;

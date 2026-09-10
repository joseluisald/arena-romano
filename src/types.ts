export interface ProductPriceTier {
  quantity: number; // e.g. 1, 2, 4
  price: number;    // e.g. 8.00, 15.00, 30.00
}

export type PriceTier = ProductPriceTier;

export type ProductCategory = 'cervejas' | 'bebidas' | 'churrasco' | 'porcoes' | 'snacks' | 'diversos';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit_price: number;
  active: boolean;
  price_tiers: ProductPriceTier[]; // Progressive quantity tiers
  description?: string;
  icon?: string;
}

export type GameStatus = 'agendado' | 'em_andamento' | 'finalizado';
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';

export interface Consumption {
  id: string;
  game_id: string;
  player_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price?: number;
  calculated_total_price: number;
  applied_breakdown: string; // e.g. "4x R$ 30,00 + 2x R$ 15,00" or "1x R$ 30,00 (Avulso)"
  created_at: string; // ISO string
  time_formatted: string; // "19:42"
  is_custom?: boolean;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  name: string;
  raw_tag?: string; // e.g. "12+1"
  is_present: boolean;
  is_paid: boolean;
  payment_method?: PaymentMethod;
  paid_at?: string;
  consumptions: Consumption[];
  total_consumption: number;
}

export interface Game {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "20:00"
  end_time: string; // "21:00"
  duration_minutes: number; // 60, 90, 120
  court_price: number;
  status: GameStatus;
  notes?: string;
  players: GamePlayer[];
  created_at: string;
  updated_at: string;
}

export interface CourtScheduleSlot {
  id: string;
  time: string; // "20:00"
  duration_minutes: number;
  default_price: number;
  is_blocked: boolean;
  label?: string;
}

export interface ParsedWhatsAppResult {
  title: string;
  date: string;
  time: string;
  court_price: number;
  players: Array<{
    name: string;
    raw_tag?: string;
    original_line: string;
  }>;
  warnings?: string[];
}

export interface DailySummaryStats {
  date: string;
  games_count: number;
  active_games: number;
  finished_games: number;
  total_players: number;
  present_players: number;
  court_revenue: number;
  products_revenue: number;
  total_revenue: number;
  total_paid: number;
  total_pending: number;
  top_products: Array<{
    product_name: string;
    quantity: number;
    total_sales: number;
  }>;
}

export type UserRole = 'admin' | 'operador' | 'gerente';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  active: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface SystemLogEntry {
  id?: number | string;
  method: string;
  url: string;
  status_code: number;
  duration_ms: number;
  user_identifier?: string;
  client_ip?: string;
  timestamp: string;
}

import { CourtScheduleSlot, DailySummaryStats, Game, GamePlayer, GameStatus, PaymentMethod, Product } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SCHEDULES, generateInitialGames } from '../data/initialData';
import { calculateOptimalProductPrice } from '../utils/pricing';

const STORAGE_KEYS = {
  GAMES: 'arena_romano_games_v4',
  PRODUCTS: 'arena_romano_products_v4',
  SCHEDULES: 'arena_romano_schedules_v4',
};

class ArenaRomanoStore {
  private games: Game[] = [];
  private products: Product[] = [];
  private schedules: CourtScheduleSlot[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach(l => l());
  }

  private loadFromStorage() {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        this.products = JSON.parse(savedProducts);
      } else {
        this.products = [...INITIAL_PRODUCTS];
      }

      const savedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (savedSchedules) {
        this.schedules = JSON.parse(savedSchedules);
      } else {
        this.schedules = [...INITIAL_SCHEDULES];
      }

      const savedGames = localStorage.getItem(STORAGE_KEYS.GAMES);
      if (savedGames) {
        this.games = JSON.parse(savedGames);
      } else {
        this.games = generateInitialGames();
      }
    } catch (e) {
      console.warn('Error reading from localStorage, using initial defaults:', e);
      this.products = [...INITIAL_PRODUCTS];
      this.schedules = [...INITIAL_SCHEDULES];
      this.games = generateInitialGames();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(this.schedules));
      localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(this.games));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public resetToDefaults() {
    this.products = [...INITIAL_PRODUCTS];
    this.schedules = [...INITIAL_SCHEDULES];
    this.games = generateInitialGames();
    this.notify();
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProduct(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  public saveProduct(productData: Partial<Product> & { name: string; unit_price: number }): Product {
    if (productData.id) {
      const index = this.products.findIndex(p => p.id === productData.id);
      if (index !== -1) {
        const updated: Product = {
          ...this.products[index],
          ...productData,
          price_tiers: productData.price_tiers || this.products[index].price_tiers || [{ quantity: 1, price: productData.unit_price }],
        };
        this.products[index] = updated;
        this.notify();
        return updated;
      }
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: productData.name,
      category: productData.category || 'diversos',
      unit_price: productData.unit_price,
      active: productData.active !== undefined ? productData.active : true,
      price_tiers: productData.price_tiers && productData.price_tiers.length > 0 
        ? productData.price_tiers 
        : [{ quantity: 1, price: productData.unit_price }],
      description: productData.description || '',
      icon: productData.icon || 'Package',
    };

    this.products.push(newProduct);
    this.notify();
    return newProduct;
  }

  public deleteProduct(id: string) {
    this.products = this.products.filter(p => p.id !== id);
    this.notify();
  }

  public toggleProductActive(id: string) {
    const p = this.products.find(item => item.id === id);
    if (p) {
      p.active = !p.active;
      this.notify();
    }
  }

  // --- SCHEDULES ---
  public getSchedules(): CourtScheduleSlot[] {
    return [...this.schedules].sort((a, b) => a.time.localeCompare(b.time));
  }

  public saveSchedule(slotData: Partial<CourtScheduleSlot> & { time: string; default_price: number }): CourtScheduleSlot {
    if (slotData.id) {
      const index = this.schedules.findIndex(s => s.id === slotData.id);
      if (index !== -1) {
        const updated = { ...this.schedules[index], ...slotData };
        this.schedules[index] = updated;
        this.notify();
        return updated;
      }
    }

    const newSlot: CourtScheduleSlot = {
      id: `sch-${Date.now()}`,
      time: slotData.time,
      duration_minutes: slotData.duration_minutes || 60,
      default_price: slotData.default_price,
      is_blocked: slotData.is_blocked || false,
      label: slotData.label || '',
    };
    this.schedules.push(newSlot);
    this.notify();
    return newSlot;
  }

  public deleteSchedule(id: string) {
    this.schedules = this.schedules.filter(s => s.id !== id);
    this.notify();
  }

  // --- GAMES & SINGLE-COURT CONFLICT CHECK ---
  public getGames(): Game[] {
    return [...this.games].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.start_time.localeCompare(b.start_time);
    });
  }

  public getGame(id: string): Game | undefined {
    return this.games.find(g => g.id === id);
  }

  /**
   * Validates single-court conflict. Returns conflict description or null if available.
   */
  public checkCourtConflict(date: string, startTime: string, durationMinutes: number = 60, excludeGameId?: string): Game | null {
    const [startH, startM] = startTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = startTotal + durationMinutes;

    for (const g of this.games) {
      if (g.date === date && g.id !== excludeGameId) {
        const [gStartH, gStartM] = g.start_time.split(':').map(Number);
        const gStart = gStartH * 60 + gStartM;
        const gEnd = gStart + (g.duration_minutes || 60);

        // Check time overlap: [startTotal, endTotal) overlaps [gStart, gEnd)
        if (startTotal < gEnd && endTotal > gStart) {
          return g;
        }
      }
    }
    return null;
  }

  public createGame(gameData: {
    title: string;
    date: string;
    start_time: string;
    duration_minutes?: number;
    court_price?: number;
    notes?: string;
    players?: Array<{ name: string; raw_tag?: string }>;
  }): { game: Game; error?: string } {
    const duration = gameData.duration_minutes || 60;
    const conflict = this.checkCourtConflict(gameData.date, gameData.start_time, duration);
    if (conflict) {
      return {
        game: conflict,
        error: `Conflito de horário na Quadra! Já existe o jogo "${conflict.title}" agendado para ${conflict.start_time} às ${conflict.end_time || ''}. A Arena Romano possui apenas 1 quadra.`,
      };
    }

    const [h, m] = gameData.start_time.split(':').map(Number);
    const endMinutesTotal = h * 60 + m + duration;
    const endH = Math.floor(endMinutesTotal / 60) % 24;
    const endM = endMinutesTotal % 60;
    const end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const gameId = `game-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const createdPlayers: GamePlayer[] = (gameData.players || []).map((p, idx) => ({
      id: `p-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      game_id: gameId,
      name: p.name,
      raw_tag: p.raw_tag,
      is_present: false,
      is_paid: false,
      total_consumption: 0,
      consumptions: [],
    }));

    const newGame: Game = {
      id: gameId,
      title: gameData.title,
      date: gameData.date,
      start_time: gameData.start_time,
      end_time,
      duration_minutes: duration,
      court_price: gameData.court_price !== undefined ? gameData.court_price : 200,
      status: 'agendado',
      notes: gameData.notes || '',
      players: createdPlayers,
      created_at: now,
      updated_at: now,
    };

    this.games.push(newGame);
    this.notify();
    return { game: newGame };
  }

  public updateGame(id: string, updates: Partial<Game>): Game | null {
    const index = this.games.findIndex(g => g.id === id);
    if (index === -1) return null;

    // Check conflict if time or date changed
    const current = this.games[index];
    const newDate = updates.date || current.date;
    const newStartTime = updates.start_time || current.start_time;
    const newDuration = updates.duration_minutes || current.duration_minutes || 60;

    if (updates.date || updates.start_time || updates.duration_minutes) {
      const conflict = this.checkCourtConflict(newDate, newStartTime, newDuration, id);
      if (conflict) {
        throw new Error(`Conflito de horário com o jogo "${conflict.title}" às ${conflict.start_time}.`);
      }

      const [h, m] = newStartTime.split(':').map(Number);
      const endMinutesTotal = h * 60 + m + newDuration;
      const endH = Math.floor(endMinutesTotal / 60) % 24;
      const endM = endMinutesTotal % 60;
      updates.end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    this.games[index] = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.notify();
    return this.games[index];
  }

  public setGameStatus(id: string, status: GameStatus) {
    const game = this.games.find(g => g.id === id);
    if (game) {
      game.status = status;
      game.updated_at = new Date().toISOString();
      this.notify();
    }
  }

  public deleteGame(id: string) {
    this.games = this.games.filter(g => g.id !== id);
    this.notify();
  }

  // --- PLAYERS MANAGEMENT ---
  public addPlayer(gameId: string, name: string, rawTag?: string): GamePlayer | null {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return null;

    const newPlayer: GamePlayer = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      game_id: gameId,
      name: name.trim(),
      raw_tag: rawTag,
      is_present: true,
      is_paid: false,
      total_consumption: 0,
      consumptions: [],
    };

    game.players.push(newPlayer);
    game.updated_at = new Date().toISOString();
    this.notify();
    return newPlayer;
  }

  public removePlayer(gameId: string, playerId: string) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    game.players = game.players.filter(p => p.id !== playerId);
    game.updated_at = new Date().toISOString();
    this.notify();
  }

  public updatePlayerName(gameId: string, playerId: string, name: string) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    const p = game.players.find(item => item.id === playerId);
    if (p) {
      p.name = name.trim();
      game.updated_at = new Date().toISOString();
      this.notify();
    }
  }

  public togglePlayerPresence(gameId: string, playerId: string) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    const p = game.players.find(item => item.id === playerId);
    if (p) {
      p.is_present = !p.is_present;
      game.updated_at = new Date().toISOString();
      this.notify();
    }
  }

  public markAllPresent(gameId: string) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    game.players.forEach(p => {
      p.is_present = true;
    });
    game.updated_at = new Date().toISOString();
    this.notify();
  }

  public setPlayerPayment(gameId: string, playerId: string, isPaid: boolean, method?: PaymentMethod) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    const p = game.players.find(item => item.id === playerId);
    if (p) {
      p.is_paid = isPaid;
      p.payment_method = isPaid ? (method || p.payment_method || 'pix') : undefined;
      p.paid_at = isPaid ? new Date().toISOString() : undefined;
      game.updated_at = new Date().toISOString();
      this.notify();
    }
  }

  // --- CONSUMPTIONS & OPTIMAL TIER PRICING RECALCULATION ---
  public addConsumption(gameId: string, playerId: string, productId: string, quantityToAdd: number): void {
    if (quantityToAdd <= 0) return;
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add consumption record
    player.consumptions.push({
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      game_id: gameId,
      player_id: playerId,
      product_id: productId,
      product_name: product.name,
      quantity: quantityToAdd,
      unit_price: product.unit_price,
      calculated_total_price: 0, // will be recalculated globally below
      applied_breakdown: '',
      created_at: now.toISOString(),
      time_formatted: timeFormatted,
      is_custom: false,
    });

    // Auto-mark player as present if consumption is added
    player.is_present = true;

    // Recalculate this player's whole consumption with optimal tiered pricing per product
    this.recalculatePlayerTotals(player);

    game.updated_at = new Date().toISOString();
    this.notify();
  }

  /**
   * Adds a custom / avulso item (e.g. Churrasco R$ 30,00, Gelo, Taxa, etc.)
   */
  public addCustomConsumption(
    gameId: string, 
    playerId: string, 
    itemName: string, 
    unitPrice: number, 
    quantityToAdd: number = 1
  ): void {
    if (quantityToAdd <= 0 || unitPrice < 0) return;
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const cleanName = itemName.trim() || 'Item Avulso / Churrasco';
    const total = Math.round(unitPrice * quantityToAdd * 100) / 100;

    player.consumptions.push({
      id: `c-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      game_id: gameId,
      player_id: playerId,
      product_id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`,
      product_name: cleanName,
      quantity: quantityToAdd,
      unit_price: unitPrice,
      calculated_total_price: total,
      applied_breakdown: `${quantityToAdd}x R$ ${unitPrice.toFixed(2).replace('.', ',')} (Avulso)`,
      created_at: now.toISOString(),
      time_formatted: timeFormatted,
      is_custom: true,
    });

    player.is_present = true;
    this.recalculatePlayerTotals(player);

    game.updated_at = new Date().toISOString();
    this.notify();
  }

  /**
   * Batch adds a custom shared expense (e.g. Churrasco R$ 30,00 per player) to multiple players at once
   */
  public addBulkCustomConsumption(
    gameId: string,
    playerIds: string[],
    itemName: string,
    unitPrice: number
  ): void {
    if (playerIds.length === 0 || unitPrice <= 0) return;
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const cleanName = itemName.trim() || 'Rateio / Churrasco';

    playerIds.forEach(playerId => {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.consumptions.push({
          id: `c-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          game_id: gameId,
          player_id: playerId,
          product_id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`,
          product_name: cleanName,
          quantity: 1,
          unit_price: unitPrice,
          calculated_total_price: unitPrice,
          applied_breakdown: `1x R$ ${unitPrice.toFixed(2).replace('.', ',')} (Rateio)`,
          created_at: now.toISOString(),
          time_formatted: timeFormatted,
          is_custom: true,
        });
        player.is_present = true;
        this.recalculatePlayerTotals(player);
      }
    });

    game.updated_at = new Date().toISOString();
    this.notify();
  }

  public updateConsumptionQuantity(gameId: string, playerId: string, consumptionId: string, newQuantity: number) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    if (newQuantity <= 0) {
      this.removeConsumption(gameId, playerId, consumptionId);
      return;
    }

    const c = player.consumptions.find(item => item.id === consumptionId);
    if (c) {
      c.quantity = newQuantity;
      if (c.is_custom || c.product_id.startsWith('custom-')) {
        const unit = c.unit_price !== undefined ? c.unit_price : (c.calculated_total_price / (c.quantity || 1));
        c.calculated_total_price = Math.round(unit * newQuantity * 100) / 100;
        c.applied_breakdown = `${newQuantity}x R$ ${unit.toFixed(2).replace('.', ',')} (Avulso)`;
      }
      this.recalculatePlayerTotals(player);
      game.updated_at = new Date().toISOString();
      this.notify();
    }
  }

  public removeConsumption(gameId: string, playerId: string, consumptionId: string) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    player.consumptions = player.consumptions.filter(c => c.id !== consumptionId);
    this.recalculatePlayerTotals(player);
    game.updated_at = new Date().toISOString();
    this.notify();
  }

  /**
   * Recalculates total consumption for a player.
   * Handles both tiered catalog products and custom/avulso items!
   */
  private recalculatePlayerTotals(player: GamePlayer) {
    const productQuantities: { [productId: string]: number } = {};
    let grandTotal = 0;
    
    // Process custom items directly and sum quantities for catalog products
    player.consumptions.forEach(c => {
      const isCustomItem = c.is_custom || c.product_id.startsWith('custom-') || !this.products.some(p => p.id === c.product_id);
      
      if (isCustomItem) {
        const unit = c.unit_price !== undefined ? c.unit_price : (c.calculated_total_price / (c.quantity || 1));
        c.calculated_total_price = Math.round(unit * c.quantity * 100) / 100;
        c.applied_breakdown = `${c.quantity}x R$ ${unit.toFixed(2).replace('.', ',')} (Avulso)`;
        grandTotal += c.calculated_total_price;
      } else {
        productQuantities[c.product_id] = (productQuantities[c.product_id] || 0) + c.quantity;
      }
    });

    // Calculate optimal price per catalog product
    for (const [productId, totalQty] of Object.entries(productQuantities)) {
      const product = this.products.find(p => p.id === productId);
      if (product) {
        const result = calculateOptimalProductPrice(product, totalQty);
        grandTotal += result.total;
      }
    }

    // Update individual consumption rows breakdown for catalog products
    player.consumptions.forEach(c => {
      const isCustomItem = c.is_custom || c.product_id.startsWith('custom-') || !this.products.some(p => p.id === c.product_id);
      if (!isCustomItem) {
        const product = this.products.find(p => p.id === c.product_id);
        if (product) {
          const itemResult = calculateOptimalProductPrice(product, c.quantity);
          c.calculated_total_price = itemResult.total;
          c.applied_breakdown = itemResult.breakdown;
        }
      }
    });

    player.total_consumption = Math.round(grandTotal * 100) / 100;
  }

  // --- STATS & REPORTING ---
  public getDailyStats(dateStr?: string): DailySummaryStats {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const gamesToday = this.games.filter(g => g.date === targetDate);

    let activeCount = 0;
    let finishedCount = 0;
    let totalPlayers = 0;
    let presentPlayers = 0;
    let courtRevenue = 0;
    let productsRevenue = 0;
    let totalPaid = 0;
    let totalPending = 0;

    const productSalesMap: { [prodName: string]: { quantity: number; total_sales: number } } = {};

    gamesToday.forEach(game => {
      if (game.status === 'em_andamento') activeCount++;
      if (game.status === 'finalizado') finishedCount++;
      courtRevenue += game.court_price || 0;

      game.players.forEach(player => {
        totalPlayers++;
        if (player.is_present) presentPlayers++;

        productsRevenue += player.total_consumption || 0;
        if (player.is_paid) {
          totalPaid += player.total_consumption || 0;
        } else {
          totalPending += player.total_consumption || 0;
        }

        player.consumptions.forEach(c => {
          if (!productSalesMap[c.product_name]) {
            productSalesMap[c.product_name] = { quantity: 0, total_sales: 0 };
          }
          productSalesMap[c.product_name].quantity += c.quantity;
          productSalesMap[c.product_name].total_sales += c.calculated_total_price;
        });
      });
    });

    const top_products = Object.entries(productSalesMap)
      .map(([name, data]) => ({
        product_name: name,
        quantity: data.quantity,
        total_sales: data.total_sales,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    return {
      date: targetDate,
      games_count: gamesToday.length,
      active_games: activeCount,
      finished_games: finishedCount,
      total_players: totalPlayers,
      present_players: presentPlayers,
      court_revenue: courtRevenue,
      products_revenue: productsRevenue,
      total_revenue: courtRevenue + productsRevenue,
      total_paid: totalPaid,
      total_pending: totalPending,
      top_products,
    };
  }
}

export const store = new ArenaRomanoStore();

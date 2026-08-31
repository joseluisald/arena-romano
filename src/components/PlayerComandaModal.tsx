import React, { useState } from 'react';
import { Game, GamePlayer, PaymentMethod, Product, ProductCategory } from '../types';
import { store } from '../services/store';
import { formatCurrency, calculateOptimalProductPrice } from '../utils/pricing';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Beer, 
  UtensilsCrossed, 
  Droplets, 
  Flame, 
  Shirt, 
  Package, 
  Share2,
  Sparkles,
  DollarSign,
  ReceiptText
} from 'lucide-react';

interface PlayerComandaModalProps {
  game: Game;
  player: GamePlayer;
  isOpen: boolean;
  onClose: () => void;
  onPlayerUpdated?: () => void;
}

export const PlayerComandaModal: React.FC<PlayerComandaModalProps> = ({
  game,
  player,
  isOpen,
  onClose,
}) => {
  const [activeMode, setActiveMode] = useState<'produtos' | 'avulso'>('produtos');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'todas'>('todas');
  
  // Custom / Avulso item state (e.g. Churrasco R$ 30)
  const [customItemName, setCustomItemName] = useState('Churrasco');
  const [customItemPrice, setCustomItemPrice] = useState<number | string>(30);
  const [customItemQty, setCustomItemQty] = useState(1);

  // Custom qty for catalog product
  const [selectedProductForCustomQty, setSelectedProductForCustomQty] = useState<Product | null>(null);
  const [customQty, setCustomQty] = useState(1);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const allProducts = store.getProducts().filter(p => p.active);
  const filteredProducts = selectedCategory === 'todas'
    ? allProducts
    : allProducts.filter(p => p.category === selectedCategory);

  const categories: Array<{ id: ProductCategory | 'todas'; label: string; icon: React.ReactNode }> = [
    { id: 'todas', label: 'Todos', icon: <Package size={13} /> },
    { id: 'cervejas', label: 'Cervejas', icon: <Beer size={13} /> },
    { id: 'churrasco', label: 'Churrasco', icon: <UtensilsCrossed size={13} /> },
    { id: 'bebidas', label: 'Bebidas', icon: <Droplets size={13} /> },
    { id: 'porcoes', label: 'Porções', icon: <Flame size={13} /> },
    { id: 'diversos', label: 'Outros', icon: <Shirt size={13} /> },
  ];

  const handleQuickAddProduct = (product: Product, qty: number) => {
    store.addConsumption(game.id, player.id, product.id, qty);
    showToast(`+${qty}x ${product.name}`);
  };

  const handleAddCustomExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const priceNum = typeof customItemPrice === 'string' ? parseFloat(customItemPrice.replace(',', '.')) : customItemPrice;
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }
    const name = customItemName.trim() || 'Item Avulso';
    const qty = Math.max(1, customItemQty);

    store.addCustomConsumption(game.id, player.id, name, priceNum, qty);
    showToast(`+${qty}x ${name} (${formatCurrency(priceNum * qty)})`);

    // Reset or keep sensible default
    setCustomItemName('Churrasco');
    setCustomItemPrice(30);
    setCustomItemQty(1);
    setActiveMode('produtos');
  };

  const handleAddCustomQtyProduct = () => {
    if (selectedProductForCustomQty && customQty > 0) {
      handleQuickAddProduct(selectedProductForCustomQty, customQty);
      setSelectedProductForCustomQty(null);
      setCustomQty(1);
    }
  };

  const handleRemoveConsumption = (consumptionId: string) => {
    store.removeConsumption(game.id, player.id, consumptionId);
  };

  const handleUpdateQuantity = (consumptionId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    store.updateConsumptionQuantity(game.id, player.id, consumptionId, newQty);
  };

  const handleTogglePayment = (method: PaymentMethod) => {
    if (player.is_paid && player.payment_method === method) {
      store.setPlayerPayment(game.id, player.id, false);
    } else {
      store.setPlayerPayment(game.id, player.id, true, method);
    }
  };

  const handleShareWhatsApp = () => {
    const lines = [
      `⚽ *ARENA ROMANO - Comanda Individual*`,
      `👤 *Jogador:* ${player.name}`,
      `🏟️ *Jogo:* ${game.title}`,
      `📅 *Data:* ${game.date.split('-').reverse().join('/')}`,
      ``,
      `*Itens consumidos:*`,
    ];

    if (player.consumptions.length === 0) {
      lines.push(`_Nenhum consumo registrado._`);
    } else {
      player.consumptions.forEach(c => {
        lines.push(`• ${c.quantity}x ${c.product_name} = ${formatCurrency(c.calculated_total_price)} (${c.time_formatted})`);
      });
    }

    lines.push(``);
    lines.push(`💰 *TOTAL DA COMANDA: ${formatCurrency(player.total_consumption)}*`);
    lines.push(`📌 *Status:* ${player.is_paid ? `✅ PAGO (${player.payment_method?.toUpperCase()})` : '⏳ PENDENTE'}`);
    lines.push(``);
    lines.push(`_Arena Romano • Quadra Esportiva_`);

    const encoded = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const quickCustomSuggestions = [
    { name: 'Churrasco', price: 30 },
    { name: 'Rateio Churrasco', price: 35 },
    { name: 'Saco de Gelo', price: 15 },
    { name: 'Carvão / Espeto', price: 20 },
    { name: 'Taxa Convidado', price: 10 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-xl bg-[#0e0e13] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#22222f] overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col text-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-2 mb-1" />

        {/* Toast alert */}
        {toastMessage && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-[#f27d26] text-white px-4 py-2 rounded-full shadow-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 border border-orange-400/40">
            <Sparkles size={14} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-[#14141d] px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#20202c]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 font-black text-base flex items-center justify-center shrink-0">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{player.name}</h2>
                {player.raw_tag && (
                  <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 text-[10px] font-bold border border-orange-500/20 shrink-0">
                    {player.raw_tag}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {game.title} • {player.is_present ? '🟢 Presente' : '⚪ Ausente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleShareWhatsApp}
              className="p-2 sm:p-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 transition-colors cursor-pointer active-press"
              title="Compartilhar no WhatsApp"
            >
              <Share2 size={17} />
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active-press"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Total & Payment Compact Bar */}
        <div className="bg-[#111118] px-4 py-2.5 border-b border-[#20202c] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total da Comanda</span>
            <span className="text-xl sm:text-2xl font-black text-[#f27d26] font-mono">
              {formatCurrency(player.total_consumption)}
            </span>
          </div>

          {/* Quick Payment Mode Selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleTogglePayment('pix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer active-press min-h-[38px] ${
                player.is_paid && player.payment_method === 'pix'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-[#181822] text-slate-300 border-[#272736] hover:bg-[#20202c]'
              }`}
            >
              <CheckCircle2 size={14} /> Pix
            </button>
            <button
              type="button"
              onClick={() => handleTogglePayment('dinheiro')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer active-press min-h-[38px] ${
                player.is_paid && player.payment_method === 'dinheiro'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-[#181822] text-slate-300 border-[#272736] hover:bg-[#20202c]'
              }`}
            >
              <DollarSign size={14} /> Dinheiro
            </button>
            <button
              type="button"
              onClick={() => handleTogglePayment('cartao')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active-press min-h-[38px] ${
                player.is_paid && player.payment_method === 'cartao'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-[#181822] text-slate-300 border-[#272736] hover:bg-[#20202c]'
              }`}
            >
              Cartão
            </button>
          </div>
        </div>

        {/* Tab Selector: Produtos do Bar VS Item Avulso / Churrasco */}
        <div className="px-4 pt-2.5 flex items-center gap-2 border-b border-[#20202c] pb-2 bg-[#0e0e13] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveMode('produtos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active-press ${
              activeMode === 'produtos'
                ? 'bg-[#f27d26] text-white shadow-sm'
                : 'bg-[#14141d] text-slate-400 hover:text-slate-200 border border-[#222230]'
            }`}
          >
            <Package size={15} />
            <span>Cardápio do Bar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('avulso')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active-press ${
              activeMode === 'avulso'
                ? 'bg-[#f27d26] text-white shadow-sm'
                : 'bg-[#14141d] text-orange-400 hover:text-orange-300 border border-orange-500/30'
            }`}
          >
            <UtensilsCrossed size={15} />
            <span>+ Avulso / Churrasco</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-4 flex-1 touch-pan-y">
          
          {/* TAB 1: ITEM AVULSO / CHURRASCO / RATEIO */}
          {activeMode === 'avulso' && (
            <div className="bg-[#14141d] p-3.5 sm:p-4 rounded-2xl border border-orange-500/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed size={14} /> Adicionar Despesa Avulsa / Churrasco
                </span>
                <span className="text-[11px] text-slate-400">Qualquer valor</span>
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                  Sugestões Rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickCustomSuggestions.map(sug => (
                    <button
                      key={sug.name}
                      type="button"
                      onClick={() => {
                        setCustomItemName(sug.name);
                        setCustomItemPrice(sug.price);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active-press ${
                        customItemName === sug.name
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                          : 'bg-[#1c1c28] text-slate-300 border-[#2a2a3c] hover:bg-[#252535]'
                      }`}
                    >
                      {sug.name} (R$ {sug.price})
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Form */}
              <form onSubmit={handleAddCustomExpense} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Descrição / Nome do Item:
                    </label>
                    <input
                      type="text"
                      value={customItemName}
                      onChange={e => setCustomItemName(e.target.value)}
                      placeholder="Ex: Churrasco, Gelo, Entrada..."
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-[#0a0a0f] text-white rounded-xl border border-[#2a2a3c] focus:border-[#f27d26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Valor Unitário (R$):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0.50"
                        value={customItemPrice}
                        onChange={e => setCustomItemPrice(e.target.value)}
                        placeholder="30,00"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-[#0a0a0f] text-white rounded-xl border border-[#2a2a3c] focus:border-[#f27d26] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">Qtd:</span>
                    <div className="flex items-center border border-[#2a2a3c] rounded-xl bg-[#0a0a0f]">
                      <button
                        type="button"
                        onClick={() => setCustomItemQty(Math.max(1, customItemQty - 1))}
                        className="px-3.5 py-2 text-slate-400 hover:text-white font-bold min-h-[38px] active-press"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-white">{customItemQty}</span>
                      <button
                        type="button"
                        onClick={() => setCustomItemQty(customItemQty + 1)}
                        className="px-3.5 py-2 text-slate-400 hover:text-white font-bold min-h-[38px] active-press"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-md shadow-orange-500/20 active-press cursor-pointer flex items-center gap-1.5 ml-auto min-h-[40px]"
                  >
                    <Plus size={15} />
                    <span>
                      Lançar {formatCurrency((parseFloat(String(customItemPrice).replace(',', '.')) || 0) * customItemQty)}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PRODUTOS DO BAR */}
          {activeMode === 'produtos' && (
            <div className="space-y-3">
              {/* Category selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active-press shrink-0 ${
                      selectedCategory === cat.id
                        ? 'bg-[#f27d26] text-white shadow-sm'
                        : 'bg-[#14141d] text-slate-400 hover:text-slate-200 border border-[#222230]'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Products List (Compact) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredProducts.map(product => {
                  const hasTiers = product.price_tiers && product.price_tiers.length > 1;

                  return (
                    <div
                      key={product.id}
                      className="bg-[#14141d] p-3 rounded-2xl border border-[#222230] flex flex-col justify-between hover:border-[#303042] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">{product.name}</span>
                        <span className="text-xs sm:text-sm font-black text-[#f27d26] font-mono shrink-0">
                          {formatCurrency(product.unit_price)}
                        </span>
                      </div>

                      {hasTiers && (
                        <div className="flex flex-wrap items-center gap-1 mb-2.5">
                          {product.price_tiers.map(t => (
                            <span key={t.quantity} className="text-[10px] bg-orange-500/10 text-orange-300 px-1.5 py-0.5 rounded-md border border-orange-500/20 font-medium">
                              {t.quantity} un = {formatCurrency(t.price)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Fast Action Buttons with Touch Padding */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#20202c]">
                        <button
                          type="button"
                          onClick={() => handleQuickAddProduct(product, 1)}
                          className="flex-1 py-2 bg-[#1e1e2c] hover:bg-[#f27d26] text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5 active-press min-h-[38px]"
                        >
                          +1
                        </button>
                        {product.price_tiers?.some(t => t.quantity === 2) && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddProduct(product, 2)}
                            className="flex-1 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5 border border-orange-500/20 active-press min-h-[38px]"
                          >
                            +2
                          </button>
                        )}
                        {product.price_tiers?.some(t => t.quantity === 4) && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddProduct(product, 4)}
                            className="flex-1 py-2 bg-[#f27d26] hover:bg-[#ff8a3d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5 active-press min-h-[38px]"
                          >
                            +4
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductForCustomQty(product);
                            setCustomQty(1);
                          }}
                          className="px-3 py-2 bg-[#1e1e2c] hover:bg-[#28283a] text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer active-press min-h-[38px]"
                          title="Outra quantidade"
                        >
                          +qtd
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Quantity popup if triggered */}
              {selectedProductForCustomQty && (
                <div className="p-3 bg-[#181824] border border-orange-500/40 rounded-2xl space-y-2 text-slate-200 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Quantidade para: <strong className="text-white">{selectedProductForCustomQty.name}</strong></span>
                    <button onClick={() => setSelectedProductForCustomQty(null)} className="text-slate-400 hover:text-white p-1">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-[#2a2a3c] rounded-xl bg-[#0c0c11]">
                      <button
                        type="button"
                        onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                        className="px-3.5 py-2 text-slate-300 font-bold active-press"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={customQty}
                        onChange={e => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 text-center text-xs font-bold border-none outline-none bg-transparent text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomQty(customQty + 1)}
                        className="px-3.5 py-2 text-slate-300 font-bold active-press"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-[#f27d26] font-bold font-mono">
                      = {formatCurrency(calculateOptimalProductPrice(selectedProductForCustomQty, customQty).total)}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCustomQtyProduct}
                      className="ml-auto px-3.5 py-2 bg-[#f27d26] text-white rounded-xl text-xs font-bold cursor-pointer active-press"
                    >
                      Adicionar {customQty}x
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Player's Consumed Items List */}
          <div className="pt-2 border-t border-[#20202c]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <ReceiptText size={13} className="text-orange-400" /> Itens Lançados na Comanda ({player.consumptions.length})
              </span>
            </div>

            {player.consumptions.length === 0 ? (
              <div className="text-center py-5 bg-[#111118] rounded-2xl border border-dashed border-[#20202c] text-slate-400 text-xs">
                Nenhum item lançado ainda. Toque nos botões do cardápio acima.
              </div>
            ) : (
              <div className="space-y-1.5">
                {player.consumptions.map(consumption => (
                  <div
                    key={consumption.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#14141d] border border-[#20202c] text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-slate-500 text-[10px] shrink-0">
                        {consumption.time_formatted}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-white block truncate">
                          {consumption.product_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {consumption.applied_breakdown || `${consumption.quantity} un`}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper with Large Hit Targets */}
                    <div className="flex items-center gap-1 bg-[#1c1c28] px-1 py-0.5 rounded-xl border border-[#28283a]">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(consumption.id, consumption.quantity, -1)}
                        className="p-2 text-slate-400 hover:text-rose-400 rounded-lg active-press min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-bold font-mono px-1 text-white text-xs">
                        {consumption.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(consumption.id, consumption.quantity, 1)}
                        className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg active-press min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right w-16 shrink-0">
                      <span className="font-bold text-[#f27d26] text-xs font-mono">
                        {formatCurrency(consumption.calculated_total_price)}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveConsumption(consumption.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer active-press"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="bg-[#14141d] px-4 py-3 border-t border-[#20202c] flex items-center justify-between pb-safe">
          <div className="text-xs">
            <span className="text-slate-400">Status: </span>
            <span className={`font-bold ${player.is_paid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {player.is_paid ? `Pago (${player.payment_method?.toUpperCase()})` : 'Pendente'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-md shadow-orange-500/20 active-press cursor-pointer min-h-[38px] flex items-center justify-center"
          >
            Concluir Comanda
          </button>
        </div>
      </div>
    </div>
  );
};

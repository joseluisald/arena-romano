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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0e0e13] rounded-2xl shadow-2xl border border-[#22222f] overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Toast alert */}
        {toastMessage && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#f27d26] text-white px-3.5 py-1.5 rounded-full shadow-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
            <Sparkles size={13} />
            {toastMessage}
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-[#14141d] px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#20202c]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 font-black text-base flex items-center justify-center">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{player.name}</h2>
                {player.raw_tag && (
                  <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 text-[10px] font-bold border border-orange-500/20">
                    {player.raw_tag}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {game.title} • {player.is_present ? '🟢 Presente' : '⚪ Ausente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareWhatsApp}
              className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 transition-colors cursor-pointer"
              title="Compartilhar no WhatsApp"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Total & Payment Compact Bar */}
        <div className="bg-[#111118] px-4 py-3 border-b border-[#20202c] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Consumido</span>
            <span className="text-xl sm:text-2xl font-black text-[#f27d26]">
              {formatCurrency(player.total_consumption)}
            </span>
          </div>

          {/* Quick Payment Mode Selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleTogglePayment('pix')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                player.is_paid && player.payment_method === 'pix'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-[#181822] text-slate-300 border-[#272736] hover:bg-[#20202c]'
              }`}
            >
              <CheckCircle2 size={13} /> Pix
            </button>
            <button
              type="button"
              onClick={() => handleTogglePayment('dinheiro')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                player.is_paid && player.payment_method === 'dinheiro'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-[#181822] text-slate-300 border-[#272736] hover:bg-[#20202c]'
              }`}
            >
              <DollarSign size={13} /> Dinheiro
            </button>
            <button
              type="button"
              onClick={() => handleTogglePayment('cartao')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                player.is_paid && player.payment_method === 'cartao'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-[#181822] text-slate-300 border-[#272736] hover:bg-[#20202c]'
              }`}
            >
              Cartão
            </button>
          </div>
        </div>

        {/* Tab Selector: Produtos do Bar VS Item Avulso / Churrasco */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-[#20202c] pb-2 bg-[#0e0e13]">
          <button
            type="button"
            onClick={() => setActiveMode('produtos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'produtos'
                ? 'bg-[#f27d26] text-white shadow-sm'
                : 'bg-[#14141d] text-slate-400 hover:text-slate-200 border border-[#222230]'
            }`}
          >
            <Package size={14} />
            <span>Produtos do Bar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('avulso')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'avulso'
                ? 'bg-[#f27d26] text-white shadow-sm'
                : 'bg-[#14141d] text-orange-400 hover:text-orange-300 border border-orange-500/30'
            }`}
          >
            <UtensilsCrossed size={14} />
            <span>+ Item Avulso / Churrasco (Valor Livre)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: ITEM AVULSO / CHURRASCO / RATEIO */}
          {activeMode === 'avulso' && (
            <div className="bg-[#14141d] p-4 rounded-xl border border-orange-500/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed size={14} /> Adicionar Despesa Avulsa / Churrasco
                </span>
                <span className="text-[11px] text-slate-400">Qualquer valor personalizado</span>
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
                      className="w-full px-3 py-2 text-xs font-semibold bg-[#0a0a0f] text-white rounded-xl border border-[#2a2a3c] focus:border-[#f27d26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Valor Unitário (R$):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0.50"
                        value={customItemPrice}
                        onChange={e => setCustomItemPrice(e.target.value)}
                        placeholder="30,00"
                        className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-[#0a0a0f] text-white rounded-xl border border-[#2a2a3c] focus:border-[#f27d26] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">Qtd:</span>
                    <div className="flex items-center border border-[#2a2a3c] rounded-lg bg-[#0a0a0f]">
                      <button
                        type="button"
                        onClick={() => setCustomItemQty(Math.max(1, customItemQty - 1))}
                        className="px-2.5 py-1 text-slate-400 hover:text-white font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-white">{customItemQty}</span>
                      <button
                        type="button"
                        onClick={() => setCustomItemQty(customItemQty + 1)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-md shadow-orange-500/20 active-press cursor-pointer flex items-center gap-1.5 ml-auto"
                  >
                    <Plus size={14} />
                    <span>
                      Adicionar {formatCurrency((parseFloat(String(customItemPrice).replace(',', '.')) || 0) * customItemQty)}
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
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#f27d26] text-white'
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
                      className="bg-[#14141d] p-2.5 rounded-xl border border-[#222230] flex flex-col justify-between hover:border-[#303042] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-white truncate">{product.name}</span>
                        <span className="text-xs font-extrabold text-[#f27d26] font-mono shrink-0">
                          {formatCurrency(product.unit_price)}
                        </span>
                      </div>

                      {hasTiers && (
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          {product.price_tiers.map(t => (
                            <span key={t.quantity} className="text-[9px] bg-orange-500/10 text-orange-300 px-1 py-0.2 rounded border border-orange-500/20">
                              {t.quantity} un = {formatCurrency(t.price)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Fast Action Buttons */}
                      <div className="flex items-center gap-1 pt-1.5 border-t border-[#20202c]">
                        <button
                          type="button"
                          onClick={() => handleQuickAddProduct(product, 1)}
                          className="flex-1 py-1 bg-[#1e1e2c] hover:bg-[#f27d26] text-slate-200 hover:text-white rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                        >
                          +1
                        </button>
                        {product.price_tiers?.some(t => t.quantity === 2) && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddProduct(product, 2)}
                            className="flex-1 py-1 bg-orange-500/10 hover:bg-orange-500 text-orange-300 hover:text-white rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5 border border-orange-500/20"
                          >
                            +2
                          </button>
                        )}
                        {product.price_tiers?.some(t => t.quantity === 4) && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddProduct(product, 4)}
                            className="flex-1 py-1 bg-[#f27d26] hover:bg-[#ff8a3d] text-white rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5"
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
                          className="px-2 py-1 bg-[#1e1e2c] hover:bg-[#28283a] text-slate-400 hover:text-slate-200 rounded-md text-xs font-bold transition-colors cursor-pointer"
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
                <div className="p-3 bg-[#181824] border border-orange-500/40 rounded-xl space-y-2 text-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Quantidade para: <strong className="text-white">{selectedProductForCustomQty.name}</strong></span>
                    <button onClick={() => setSelectedProductForCustomQty(null)} className="text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-[#2a2a3c] rounded-lg bg-[#0c0c11]">
                      <button
                        type="button"
                        onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                        className="px-2.5 py-1 text-slate-300 font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={customQty}
                        onChange={e => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-10 text-center text-xs font-bold border-none outline-none bg-transparent text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomQty(customQty + 1)}
                        className="px-2.5 py-1 text-slate-300 font-bold"
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
                      className="ml-auto px-3 py-1 bg-[#f27d26] text-white rounded-lg text-xs font-bold cursor-pointer"
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
                <ReceiptText size={13} className="text-orange-400" /> Itens na Comanda ({player.consumptions.length})
              </span>
            </div>

            {player.consumptions.length === 0 ? (
              <div className="text-center py-4 bg-[#111118] rounded-xl border border-dashed border-[#20202c] text-slate-500 text-xs">
                Nenhum item lançado ainda.
              </div>
            ) : (
              <div className="space-y-1.5">
                {player.consumptions.map(consumption => (
                  <div
                    key={consumption.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#14141d] border border-[#20202c] text-xs"
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

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 bg-[#1c1c28] px-1 py-0.5 rounded-lg border border-[#28283a]">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(consumption.id, consumption.quantity, -1)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-bold font-mono px-1 text-white text-xs">
                        {consumption.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(consumption.id, consumption.quantity, 1)}
                        className="p-1 text-slate-400 hover:text-emerald-400 rounded"
                      >
                        <Plus size={11} />
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
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#14141d] px-4 py-2.5 border-t border-[#20202c] flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-400">Status: </span>
            <span className={`font-bold ${player.is_paid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {player.is_paid ? `Pago (${player.payment_method?.toUpperCase()})` : 'Pendente'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

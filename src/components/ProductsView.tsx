import React, { useState } from 'react';
import { Product, ProductCategory, PriceTier } from '../types';
import { store } from '../services/store';
import { formatCurrency, calculateOptimalProductPrice } from '../utils/pricing';
import { 
  Plus, 
  Search, 
  Tag, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Beer, 
  UtensilsCrossed, 
  Coffee, 
  X, 
  Check, 
  Calculator,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const products = store.getProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('cervejas');
  const [unitPrice, setUnitPrice] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([{ quantity: 1, price: 10 }]);

  // Add Tier Row State inside Modal
  const [newTierQty, setNewTierQty] = useState<number>(3);
  const [newTierPrice, setNewTierPrice] = useState<number>(27);

  // Price Simulator State
  const [testSimulatorQty, setTestSimulatorQty] = useState<number>(5);

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'todos', label: 'Todos', icon: <Tag size={14} /> },
    { id: 'cervejas', label: 'Cervejas', icon: <Beer size={14} /> },
    { id: 'churrasco', label: 'Churrasco & Carnes', icon: <UtensilsCrossed size={14} /> },
    { id: 'bebidas', label: 'Não Alcoólicos', icon: <Coffee size={14} /> },
    { id: 'porcoes', label: 'Porções & Petiscos', icon: <UtensilsCrossed size={14} /> },
    { id: 'diversos', label: 'Diversos', icon: <Tag size={14} /> },
  ];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('cervejas');
    setUnitPrice(10);
    setDescription('');
    setPriceTiers([{ quantity: 1, price: 10 }]);
    setNewTierQty(3);
    setNewTierPrice(27);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setUnitPrice(p.unit_price);
    setDescription(p.description || '');
    setPriceTiers(p.price_tiers && p.price_tiers.length > 0 ? [...p.price_tiers] : [{ quantity: 1, price: p.unit_price }]);
    setNewTierQty(3);
    setNewTierPrice(Math.round(p.unit_price * 2.8));
    setIsModalOpen(true);
  };

  const handleAddTier = () => {
    if (newTierQty <= 1) return;
    const updated = priceTiers.filter(t => t.quantity !== newTierQty);
    updated.push({ quantity: newTierQty, price: newTierPrice });
    updated.sort((a, b) => a.quantity - b.quantity);
    setPriceTiers(updated);
  };

  const handleRemoveTier = (qty: number) => {
    if (qty === 1) return;
    setPriceTiers(priceTiers.filter(t => t.quantity !== qty));
  };

  const handleToggleActive = (productId: string) => {
    store.toggleProductActive(productId);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (confirm(`Deseja realmente remover o produto "${productName}"?`)) {
      store.deleteProduct(productId);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const baseTier = priceTiers.find(t => t.quantity === 1) || { quantity: 1, price: unitPrice };
    const finalTiers = [baseTier, ...priceTiers.filter(t => t.quantity > 1)].sort((a, b) => a.quantity - b.quantity);

    store.saveProduct({
      id: editingProduct ? editingProduct.id : undefined,
      name: name.trim(),
      category,
      unit_price: unitPrice,
      description: description.trim(),
      price_tiers: finalTiers,
    });

    setIsModalOpen(false);
  };

  const tempProductPreview: Product = {
    id: 'temp',
    name: name || 'Produto Exemplo',
    category,
    unit_price: unitPrice,
    active: true,
    price_tiers: priceTiers,
  };
  const liveSimulatorResult = calculateOptimalProductPrice(tempProductPreview, testSimulatorQty);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 md:pb-12 text-slate-100">
      
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-md shadow-black/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Cardápio & Preços do Bar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Itens do bar, carnes e bebidas com descontos automáticos e progressivos por quantidade.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white text-xs font-bold shadow-md shadow-orange-500/25 active-press cursor-pointer self-start sm:self-auto transition-all"
        >
          <Plus size={15} />
          <span>Cadastrar Novo Produto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição do produto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#1E2436] bg-[#10131B] text-white placeholder:text-slate-400 focus:border-[#FF6600] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#FF6600] text-white shadow-sm'
                    : 'bg-[#10131B] text-slate-400 hover:text-slate-200 border border-[#1E2436] hover:bg-[#151A26]'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#10131B] rounded-2xl p-10 border border-[#1E2436] text-center max-w-md mx-auto my-6 space-y-3 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-[#181D2B] text-orange-400 flex items-center justify-center mx-auto border border-[#23293D]">
            <Tag size={24} />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum produto cadastrado</h3>
          <p className="text-xs text-slate-400">
            Cadastre os itens do bar e lanchonete da Arena Romano para habilitar os lançamentos de comanda.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>Cadastrar Primeiro Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProducts.map(product => {
            return (
              <div
                key={product.id}
                className={`bg-[#10131B] rounded-2xl p-4 sm:p-5 border transition-all hover:border-[#2B354F] hover:bg-[#131722] flex flex-col justify-between group ${
                  product.active ? 'border-[#1E2436]' : 'border-[#1E2436]/60 opacity-60'
                }`}
              >
                <div>
                  {/* Header: Name, Price & Active status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="truncate">
                      <span className="text-[10px] font-bold text-[#FF6600] uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="font-extrabold text-base text-white truncate group-hover:text-[#FF6600] transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-[#FF6600] font-mono">
                        {formatCurrency(product.unit_price)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/ un</span>
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mb-2.5">
                      {product.description}
                    </p>
                  )}

                  {/* Progressive Tiers Combo View */}
                  {product.price_tiers && product.price_tiers.length > 1 && (
                    <div className="my-2.5 p-2.5 rounded-xl bg-[#0C0E15] border border-[#1A2030] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Sparkles size={12} className="text-[#FF6600]" />
                          Preço Promocional por Combo:
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {product.price_tiers.map(tier => {
                          const savings = (tier.quantity * product.unit_price) - tier.price;
                          return (
                            <div
                              key={tier.quantity}
                              className="bg-[#141824] p-1.5 rounded-lg border border-[#1E2538] text-center"
                            >
                              <span className="text-[10px] text-slate-400 font-bold block">
                                {tier.quantity} un
                              </span>
                              <span className="text-xs font-black text-white block font-mono">
                                {formatCurrency(tier.price)}
                              </span>
                              {savings > 0 && (
                                <span className="text-[9px] text-emerald-400 font-bold block">
                                  -{formatCurrency(savings)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#1B2132] flex items-center justify-between gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(product.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      product.active
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-[#181D2B] text-slate-400 border border-[#23293D]'
                    }`}
                  >
                    {product.active ? 'Ativo' : 'Inativo'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(product)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181D2B] transition-colors cursor-pointer"
                      title="Editar produto"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                      title="Excluir produto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-xl bg-[#10131B] rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-[#1E2436] overflow-hidden max-h-[94vh] sm:max-h-[92vh] flex flex-col text-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            
            {/* Mobile drag handle indicator */}
            <div className="sm:hidden w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-2 mb-1" />

            {/* Header */}
            <div className="bg-[#141824] text-white px-5 py-4 flex items-center justify-between border-b border-[#1E2436]">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {editingProduct ? 'Editar Produto do Bar' : 'Novo Produto para o Bar'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E2538] transition-colors cursor-pointer active-press"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 flex-1 touch-pan-y">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cerveja Original 350ml, Espeto de Picanha..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#1E2436] bg-[#0C0E15] text-white placeholder:text-slate-500 focus:border-[#FF6600] outline-none min-h-[42px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-[#1E2436] bg-[#0C0E15] text-white focus:border-[#FF6600] outline-none min-h-[42px]"
                  >
                    <option value="cervejas">Cervejas</option>
                    <option value="churrasco">Churrasco & Carnes</option>
                    <option value="bebidas">Não Alcoólicos</option>
                    <option value="porcoes">Porções & Petiscos</option>
                    <option value="diversos">Diversos</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Preço Unitário (1 un) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0.50"
                      required
                      value={unitPrice}
                      onChange={e => {
                        const p = Number(e.target.value);
                        setUnitPrice(p);
                        setPriceTiers(priceTiers.map(t => t.quantity === 1 ? { ...t, price: p } : t));
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-bold text-[#FF6600] rounded-xl border border-[#1E2436] bg-[#0C0E15] focus:border-[#FF6600] outline-none min-h-[42px] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">Descrição / Detalhes</label>
                <input
                  type="text"
                  placeholder="Ex: Long neck gelada, acompanhado de farofa e vinagrete..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#1E2436] bg-[#0C0E15] text-white placeholder:text-slate-500 focus:border-[#FF6600] outline-none min-h-[42px]"
                />
              </div>

              {/* Progressive Pricing Tiers Editor */}
              <div className="p-4 bg-[#0C0E15] border border-[#1E2436] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FF6600] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#FF6600]" />
                    Tabela de Descontos por Quantidade (Combo)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Configure combos automáticos. O sistema aplica o melhor desconto ao fechar a comanda do jogador.
                </p>

                {/* Add new tier inputs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 bg-[#141824] p-3 rounded-xl border border-[#1E2538]">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Quantidade</label>
                      <input
                        type="number"
                        min="2"
                        value={newTierQty}
                        onChange={e => setNewTierQty(Math.max(2, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 text-xs font-bold border border-[#23293D] bg-[#0C0E15] text-white rounded-lg outline-none min-h-[36px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Preço Total do Pacote (R$)</label>
                      <input
                        type="number"
                        step="0.50"
                        value={newTierPrice}
                        onChange={e => setNewTierPrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs font-bold border border-[#23293D] bg-[#0C0E15] text-white rounded-lg outline-none min-h-[36px]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="px-4 py-2 bg-[#FF6600] hover:bg-[#FF7B1A] text-white rounded-xl text-xs font-bold cursor-pointer active-press transition-colors min-h-[36px]"
                  >
                    + Salvar Faixa
                  </button>
                </div>

                {/* List of active tiers */}
                <div className="space-y-1.5">
                  {priceTiers.map(tier => (
                    <div
                      key={tier.quantity}
                      className="flex items-center justify-between p-2.5 bg-[#141824] rounded-xl border border-[#1E2538] text-xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{tier.quantity} un</span>
                        <span className="text-slate-500">➜</span>
                        <span className="font-extrabold text-[#FF6600] font-mono">{formatCurrency(tier.price)}</span>
                        {tier.quantity > 1 && (
                          <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                            Economia: {formatCurrency((tier.quantity * unitPrice) - tier.price)}
                          </span>
                        )}
                      </div>

                      {tier.quantity > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(tier.quantity)}
                          className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer active-press"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Preço Base</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Dynamic Price Simulator */}
                <div className="mt-2 pt-2 border-t border-[#1E2538] bg-[#121622] p-3 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <span className="font-bold text-slate-300 flex items-center gap-1 text-xs">
                      <Calculator size={14} className="text-[#FF6600]" />
                      Simulador de Preço Ótimo:
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTestSimulatorQty(n)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            testSimulatorQty === n
                              ? 'bg-[#FF6600] text-white'
                              : 'bg-[#0C0E15] text-slate-300 border border-[#23293D]'
                          }`}
                        >
                          {n} un
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0C0E15] p-2.5 rounded-xl border border-[#1E2538] flex items-center justify-between">
                    <div>
                      <span className="text-slate-300 text-xs block">
                        Cálculo para <strong>{testSimulatorQty} un</strong>: {liveSimulatorResult.breakdown}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#FF6600] font-mono">
                        {formatCurrency(liveSimulatorResult.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-[#1E2436] flex items-center justify-end gap-2.5 pb-safe">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white font-semibold text-xs hover:bg-[#181D2B] transition-colors cursor-pointer border border-[#1E2436] min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all active-press cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-initial min-h-[42px]"
                >
                  <Check size={16} />
                  <span>Salvar Produto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

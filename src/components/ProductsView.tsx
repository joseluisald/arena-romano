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
  ShieldCheck
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
    { id: 'todos', label: 'Todos os Produtos', icon: <Tag size={15} /> },
    { id: 'cervejas', label: 'Cervejas', icon: <Beer size={15} /> },
    { id: 'churrasco', label: 'Churrasco & Carnes', icon: <UtensilsCrossed size={15} /> },
    { id: 'bebidas', label: 'Não Alcoólicos & Água', icon: <Coffee size={15} /> },
    { id: 'porcoes', label: 'Porções & Petiscos', icon: <UtensilsCrossed size={15} /> },
    { id: 'diversos', label: 'Diversos', icon: <Tag size={15} /> },
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

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setUnitPrice(product.unit_price);
    setDescription(product.description || '');
    setPriceTiers(product.price_tiers ? [...product.price_tiers] : [{ quantity: 1, price: product.unit_price }]);
    setIsModalOpen(true);
  };

  const handleAddTier = () => {
    if (newTierQty <= 1 || newTierPrice <= 0) return;
    
    // Check if qty already exists
    const exists = priceTiers.some(t => t.quantity === newTierQty);
    let updated: PriceTier[];
    if (exists) {
      updated = priceTiers.map(t => t.quantity === newTierQty ? { quantity: newTierQty, price: newTierPrice } : t);
    } else {
      updated = [...priceTiers, { quantity: newTierQty, price: newTierPrice }].sort((a, b) => a.quantity - b.quantity);
    }
    setPriceTiers(updated);
  };

  const handleRemoveTier = (qty: number) => {
    if (qty === 1) return; // Cannot remove base tier
    setPriceTiers(priceTiers.filter(t => t.quantity !== qty));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Ensure tier 1 exists
    const finalTiers = priceTiers.filter(t => t.quantity !== 1);
    finalTiers.unshift({ quantity: 1, price: unitPrice });
    finalTiers.sort((a, b) => a.quantity - b.quantity);

    if (editingProduct) {
      store.saveProduct({
        id: editingProduct.id,
        name,
        category,
        unit_price: unitPrice,
        description,
        price_tiers: finalTiers,
      });
    } else {
      store.saveProduct({
        name,
        category,
        unit_price: unitPrice,
        description,
        active: true,
        price_tiers: finalTiers,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (productId: string) => {
    store.toggleProductActive(productId);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (confirm(`Deseja excluir o produto "${productName}" do catálogo?`)) {
      store.deleteProduct(productId);
    }
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-24 sm:pb-12 text-slate-100">
      
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121218] p-3.5 sm:p-4 rounded-2xl border border-[#20202c]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Cardápio & Preços do Bar
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Produtos cadastrados com descontos automáticos por quantidade.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white text-xs font-bold shadow-sm active-press cursor-pointer self-start sm:self-auto transition-all"
        >
          <Plus size={14} />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#20202c] bg-[#121218] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#f27d26] text-white'
                    : 'bg-[#121218] text-slate-400 hover:text-slate-200 border border-[#20202c]'
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
        <div className="bg-[#111116] rounded-2xl p-8 border border-[#20202c] text-center max-w-md mx-auto my-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1a1a24] text-orange-400 flex items-center justify-center mx-auto border border-[#2a2a38]">
            <Tag size={24} />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum produto cadastrado</h3>
          <p className="text-xs text-slate-400">
            Cadastre os itens do seu bar/lanchonete para lançar comandas de consumo.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>Cadastrar Primeiro Produto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredProducts.map(product => {
          return (
            <div
              key={product.id}
              className={`bg-[#121218] rounded-xl p-3 border transition-all hover:border-[#353545] flex flex-col justify-between ${
                product.active ? 'border-[#20202c]' : 'border-[#20202c]/60 opacity-60'
              }`}
            >
              <div>
                {/* Header: Name, Price & Active status */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="truncate">
                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider block">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-sm text-white truncate">
                      {product.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-[#f27d26] font-mono">
                      {formatCurrency(product.unit_price)}
                    </span>
                  </div>
                </div>

                {product.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                    {product.description}
                  </p>
                )}

                {/* Progressive Tiers Table */}
                <div className="my-2 p-2 rounded-lg bg-[#0c0c11] border border-[#1e1e28] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Sparkles size={11} className="text-orange-400" />
                      Preço por Quantidade:
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {product.price_tiers?.map(tier => {
                      const savings = (tier.quantity * product.unit_price) - tier.price;
                      return (
                        <div
                          key={tier.quantity}
                          className="bg-[#14141d] p-1 rounded border border-[#20202c] text-center"
                        >
                          <span className="text-[9px] text-slate-400 font-medium block">
                            {tier.quantity} un
                          </span>
                          <span className="text-[11px] font-bold text-white block font-mono">
                            {formatCurrency(tier.price)}
                          </span>
                          {savings > 0 && (
                            <span className="text-[8px] text-emerald-400 font-bold">
                              -{formatCurrency(savings)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#1e1e28] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(product.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    product.active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-[#181822] text-slate-400 border border-[#272736]'
                  }`}
                >
                  {product.active ? 'Ativo' : 'Inativo'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(product)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1c1c27] transition-colors cursor-pointer"
                    title="Editar produto"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Excluir produto"
                  >
                    <Trash2 size={13} />
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
          <div className="relative w-full max-w-xl bg-[#111116] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#272736] overflow-hidden max-h-[94vh] sm:max-h-[92vh] flex flex-col text-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            
            {/* Mobile drag handle indicator */}
            <div className="sm:hidden w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-2 mb-1" />

            {/* Header */}
            <div className="bg-[#161622] text-white px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#262638]">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active-press"
              >
                <X size={19} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProduct} className="p-4 overflow-y-auto space-y-3.5 flex-1 touch-pan-y">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cerveja Lata (350ml), Porção de Calabresa..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#272736] bg-[#0c0c11] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none min-h-[42px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#272736] bg-[#0c0c11] text-white focus:border-[#f27d26] outline-none font-medium min-h-[40px]"
                  >
                    <option value="cervejas">Cervejas</option>
                    <option value="churrasco">Churrasco</option>
                    <option value="bebidas">Bebidas & Água</option>
                    <option value="porcoes">Porções & Petiscos</option>
                    <option value="diversos">Diversos & Materiais</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Preço Unitário (1 unidade) *</label>
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
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold text-[#f27d26] rounded-xl border border-[#272736] bg-[#0c0c11] focus:border-[#f27d26] outline-none min-h-[40px] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">Descrição / Detalhes</label>
                <input
                  type="text"
                  placeholder="Ex: Marcas disponíveis, acompanhamentos..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#272736] bg-[#0c0c11] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none min-h-[40px]"
                />
              </div>

              {/* Progressive Pricing Tiers Editor */}
              <div className="p-3 bg-[#0c0c11] border border-[#272736] rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-orange-400" />
                    Promoções por Quantidade
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Defina descontos para compra em volume. O sistema calcula a melhor combinação automaticamente.
                </p>

                {/* Add new tier inputs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 bg-[#161622] p-2.5 rounded-xl border border-[#262638]">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Quantidade</label>
                      <input
                        type="number"
                        min="2"
                        value={newTierQty}
                        onChange={e => setNewTierQty(Math.max(2, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-[#2f2f42] bg-[#0c0c11] text-white rounded-lg outline-none min-h-[36px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Preço Combo (R$)</label>
                      <input
                        type="number"
                        step="0.50"
                        value={newTierPrice}
                        onChange={e => setNewTierPrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-[#2f2f42] bg-[#0c0c11] text-white rounded-lg outline-none min-h-[36px]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="px-3.5 py-2 bg-[#f27d26] hover:bg-[#ff8a3d] text-white rounded-xl text-xs font-bold cursor-pointer active-press transition-colors min-h-[36px]"
                  >
                    + Salvar Faixa
                  </button>
                </div>

                {/* List of active tiers */}
                <div className="space-y-1.5">
                  {priceTiers.map(tier => (
                    <div
                      key={tier.quantity}
                      className="flex items-center justify-between p-2 bg-[#161622] rounded-xl border border-[#262638] text-xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{tier.quantity} un</span>
                        <span className="text-slate-500">➜</span>
                        <span className="font-extrabold text-[#f27d26] font-mono">{formatCurrency(tier.price)}</span>
                        {tier.quantity > 1 && (
                          <span className="text-[9px] text-emerald-300 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
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
                        <span className="text-[10px] text-slate-500 font-medium">Base</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Interactive Dynamic Price Simulator */}
                <div className="mt-2 pt-2 border-t border-[#262638] bg-[#12121c] p-2.5 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
                      <Calculator size={13} className="text-orange-400" />
                      Simulador:
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTestSimulatorQty(n)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            testSimulatorQty === n
                              ? 'bg-[#f27d26] text-white'
                              : 'bg-[#0c0c11] text-slate-300 border border-[#272738]'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0c0c11] p-2 rounded-lg border border-[#272738] flex items-center justify-between">
                    <div>
                      <span className="text-slate-300 text-xs block">
                        Para <strong>{testSimulatorQty} un</strong>: {liveSimulatorResult.breakdown}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-[#f27d26] font-mono">
                        {formatCurrency(liveSimulatorResult.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-[#272736] flex items-center justify-end gap-2 pb-safe">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white font-semibold text-xs hover:bg-[#1c1c27] transition-colors cursor-pointer border border-[#272736] min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all active-press cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-initial min-h-[42px]"
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

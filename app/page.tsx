import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Pizza, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  Search,
  Percent,
  Calculator,
  ChevronRight,
  Copy
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'didoka-pizza-v2';

// --- CONSTANTES ---
const UNIDADES = [
  { id: 'kg', label: 'Quilograma (KG)', mult: 1000 },
  { id: 'g', label: 'Grama (G)', mult: 1 },
  { id: 'l', label: 'Litro (L)', mult: 1000 },
  { id: 'ml', label: 'Mililitro (ML)', mult: 1 },
  { id: 'un', label: 'Unidade (UN)', mult: 1 },
];

// Ordem correta: P, M, G, F, GG
const TAMANHOS = ['P', 'M', 'G', 'F', 'GG'];

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

// --- COMPONENTES DE UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, icon: Icon }) => {
  const variants = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-600/20",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400",
    ghost: "bg-transparent hover:bg-slate-50 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800",
  };

  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 active:scale-95 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [insumos, setInsumos] = useState([]);
  const [sabores, setSabores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [showSaborModal, setShowSaborModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const insumosRef = collection(db, 'artifacts', appId, 'users', user.uid, 'insumos');
    const saboresRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sabores');

    const unsubInsumos = onSnapshot(insumosRef, (snap) => {
      setInsumos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSabores = onSnapshot(saboresRef, (snap) => {
      setSabores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubInsumos(); unsubSabores(); };
  }, [user]);

  const handleSaveInsumo = async (data) => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'insumos');
    const u = UNIDADES.find(u => u.id === data.unidade_compra);
    const precoBase = Number(data.preco_compra) / (Number(data.quantidade_compra) * (u?.mult || 1));
    const finalData = { ...data, preco_por_unidade_base: precoBase };

    if (editingItem) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'insumos', editingItem.id), finalData);
    } else {
      await addDoc(colRef, finalData);
    }
    setShowInsumoModal(false);
    setEditingItem(null);
  };

  const handleSaveSabor = async (data) => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sabores');
    if (editingItem) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sabores', editingItem.id), data);
    } else {
      await addDoc(colRef, data);
    }
    setShowSaborModal(false);
    setEditingItem(null);
  };

  const handleDelete = async (col, id) => {
    if (!window.confirm("Confirmar exclusão?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, col, id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      <nav className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-r border-slate-200 dark:border-slate-800 p-4 shrink-0">
        <div className="flex items-center gap-3 py-4 mb-6">
          <div className="bg-orange-600 p-2 rounded-lg text-white shadow-lg shadow-orange-600/20"><Pizza size={24} /></div>
          <h1 className="font-bold text-xl tracking-tight">Didoka Pizza</h1>
        </div>
        <div className="space-y-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
          <NavItem active={activeTab === 'insumos'} onClick={() => setActiveTab('insumos')} icon={Package} label="Estoque de Insumos" />
          <NavItem active={activeTab === 'sabores'} onClick={() => setActiveTab('sabores')} icon={ClipboardList} label="Fichas por Sabor" />
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'dashboard' && <Dashboard insumos={insumos} sabores={sabores} />}
        {activeTab === 'insumos' && (
          <InsumosList 
            insumos={insumos} 
            onAdd={() => { setEditingItem(null); setShowInsumoModal(true); }}
            onEdit={(item) => { setEditingItem(item); setShowInsumoModal(true); }}
            onDelete={(id) => handleDelete('insumos', id)}
          />
        )}
        {activeTab === 'sabores' && (
          <SaboresList 
            sabores={sabores} 
            insumos={insumos}
            onAdd={() => { setEditingItem(null); setShowSaborModal(true); }}
            onEdit={(item) => { setEditingItem(item); setShowSaborModal(true); }}
            onDelete={(id) => handleDelete('sabores', id)}
          />
        )}
      </main>

      {showInsumoModal && <InsumoFormModal initialData={editingItem} onClose={() => setShowInsumoModal(false)} onSave={handleSaveInsumo} />}
      {showSaborModal && <SaborFormModal initialData={editingItem} insumos={insumos} onClose={() => setShowSaborModal(false)} onSave={handleSaveSabor} />}
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20" : "text-slate-500 hover:bg-slate-50"}`}>
      <Icon size={20} /> {label}
    </button>
  );
}

function Dashboard({ insumos, sabores }) {
  const stats = useMemo(() => {
    let totalPizzasConfiguradas = 0;
    let custoMedioTotal = 0;
    
    sabores.forEach(s => {
      Object.keys(s.tamanhos_config || {}).forEach(t => {
        totalPizzasConfiguradas++;
        custoMedioTotal += s.tamanhos_config[t].custo_total || 0;
      });
    });

    return {
      insumos: insumos.length,
      sabores: sabores.length,
      totalPizzas: totalPizzasConfiguradas,
      custoMedio: totalPizzasConfiguradas > 0 ? custoMedioTotal / totalPizzasConfiguradas : 0
    };
  }, [insumos, sabores]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <header><h2 className="text-3xl font-bold">Gestão Inteligente</h2><p className="text-slate-500">Acompanhamento financeiro em tempo real.</p></header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Insumos" value={stats.insumos} />
        <StatCard icon={Pizza} label="Sabores" value={stats.sabores} />
        <StatCard icon={Calculator} label="Fichas Ativas" value={stats.totalPizzas} />
        <StatCard icon={DollarSign} label="Custo Médio" value={formatCurrency(stats.custoMedio)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Sugestões de Venda (Tamanho G)</h3>
          <div className="space-y-3">
            {sabores.slice(0, 5).map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="font-medium">{s.nome}</span>
                <span className="text-orange-600 font-bold">{formatCurrency(s.tamanhos_config?.G?.preco_sugerido || 0)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> Custo Operacional Fixo</h3>
          <p className="text-sm text-slate-500">
            Cada pizza vendida contribui com um valor fixo em reais para cobrir sua estrutura (aluguel, gás, equipe).
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-blue-700 dark:text-blue-400 text-sm font-medium">
            Mantenha o valor atualizado no cadastro de cada sabor para um CMV preciso.
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="bg-slate-50 dark:bg-slate-800 p-2 w-fit rounded-lg"><Icon size={18} className="text-orange-600" /></div>
      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</div>
      <div className="text-xl font-black">{value}</div>
    </Card>
  );
}

function InsumosList({ insumos, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = insumos.filter(i => i.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Estoque de Insumos</h2>
        <Button onClick={onAdd} icon={Plus}>Novo Insumo</Button>
      </div>

      {/* Barra de busca SEMPRE visível */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 rounded-lg text-sm border-none focus:ring-2 focus:ring-orange-500 transition-all" 
            placeholder="Buscar ingrediente pelo nome..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      {insumos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-6">
            <Package size={48} className="text-slate-200 dark:text-slate-700" />
          </div>
          <h3 className="text-slate-600 dark:text-slate-300 font-bold text-lg">Estoque Vazio</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
            Você ainda não cadastrou nenhum ingrediente. Adicione insumos para poder montar suas fichas técnicas.
          </p>
          <Button onClick={onAdd} icon={Plus} className="px-8">Adicionar Primeiro Insumo</Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Insumo</th>
                  <th className="px-6 py-4">Custo Compra</th>
                  <th className="px-6 py-4">Custo Unitário Base</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">{i.nome}</td>
                    <td className="px-6 py-4 text-slate-500">{formatCurrency(i.preco_compra)} / {i.quantidade_compra}{i.unidade_compra}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-orange-600 font-bold">{formatCurrency(i.preco_por_unidade_base)}</span>
                        <span className="text-[10px] text-slate-400">por {i.unidade_compra === 'un' ? 'un' : (i.unidade_compra === 'kg' ? 'grama' : 'ml')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                      <button onClick={() => onEdit(i)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-lg transition-all"><Edit3 size={16}/></button>
                      <button onClick={() => onDelete(i.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">
                      Nenhum ingrediente encontrado para sua busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function InsumoFormModal({ initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || { nome: '', preco_compra: '', quantidade_compra: '', unidade_compra: 'kg' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md animate-in zoom-in-95 shadow-2xl">
        <div className="p-6 flex justify-between border-b dark:border-slate-800">
          <h3 className="text-lg font-bold">Cadastro de Insumo</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Insumo</label>
            <input className="w-full border dark:border-slate-700 bg-transparent p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all outline-none" placeholder="Ex: Farinha de Trigo 00" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preço Pago (R$)</label>
              <input type="number" className="w-full border dark:border-slate-700 bg-transparent p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.00" value={form.preco_compra} onChange={e => setForm({...form, preco_compra: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qtd Comprada</label>
              <input type="number" className="w-full border dark:border-slate-700 bg-transparent p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" placeholder="1" value={form.quantidade_compra} onChange={e => setForm({...form, quantidade_compra: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidade de Compra</label>
            <select className="w-full border dark:border-slate-700 bg-transparent p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" value={form.unidade_compra} onChange={e => setForm({...form, unidade_compra: e.target.value})}>
              {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2 rounded-b-xl border-t dark:border-slate-800"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={() => onSave(form)} icon={Save}>Salvar Insumo</Button></div>
      </Card>
    </div>
  );
}

function SaboresList({ sabores, insumos, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    return sabores.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()));
  }, [sabores, search]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fichas Técnicas</h2>
        <Button onClick={onAdd} icon={Plus}>Novo Sabor</Button>
      </div>

      {/* Barra de busca SEMPRE visível */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 rounded-lg text-sm border-none focus:ring-2 focus:ring-orange-500 transition-all" 
            placeholder="Buscar por nome do sabor..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className="p-6 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900/30 transition-all group border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black text-slate-800 dark:text-orange-500 uppercase tracking-tight">{s.nome}</h3>
                <div className="flex flex-wrap gap-1.5 mt-3">
                   {TAMANHOS.map(t => (
                     s.tamanhos_config?.[t] && 
                     <div key={t} className="flex flex-col bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-lg min-w-[60px]">
                       <span className="text-[10px] text-slate-400 font-bold uppercase">{t}</span>
                       <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(s.tamanhos_config[t].preco_sugerido)}</span>
                     </div>
                   ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" onClick={() => onEdit(s)} className="p-2 h-10 w-10"><Edit3 size={16}/></Button>
                <Button variant="danger" onClick={() => onDelete(s.id)} className="p-2 h-10 w-10"><Trash2 size={16}/></Button>
              </div>
            </div>
            <div className="pt-4 border-t dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Margem Alvo: <span className="text-emerald-500 font-bold">{s.margem_lucro}%</span></span>
              <span className="text-slate-500 font-medium">Custo Operacional: <span className="text-blue-500 font-bold">{formatCurrency(s.custo_operacional)}</span></span>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && sabores.length > 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 italic">
            Nenhum sabor encontrado para "{search}".
          </div>
        )}
        {sabores.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-6 text-slate-300">
              <Pizza size={48} />
            </div>
            <h3 className="text-slate-600 dark:text-slate-300 font-bold text-lg">Sem Fichas Técnicas</h3>
            <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
              Sua lista de sabores está vazia. Crie sua primeira ficha técnica para gerenciar o CMV de cada pizza.
            </p>
            <Button onClick={onAdd} icon={Plus} className="px-8">Criar Primeira Ficha</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SaborFormModal({ initialData, insumos, onClose, onSave }) {
  const [nome, setNome] = useState(initialData?.nome || '');
  const [margemLucro, setMargemLucro] = useState(initialData?.margem_lucro || 50);
  const [custoOperacional, setCustoOperacional] = useState(initialData?.custo_operacional || 5.00);
  const [activeSize, setActiveSize] = useState('G');
  
  const [tamanhosConfig, setTamanhosConfig] = useState(initialData?.tamanhos_config || {
    P: { ingredientes: [], embalagem: 1.50 },
    M: { ingredientes: [], embalagem: 1.80 },
    G: { ingredientes: [], embalagem: 2.20 },
    F: { ingredientes: [], embalagem: 3.50 },
    GG: { ingredientes: [], embalagem: 2.50 },
  });

  const currentConfig = tamanhosConfig[activeSize];

  const updateSizeField = (field, value) => {
    setTamanhosConfig({
      ...tamanhosConfig,
      [activeSize]: { ...currentConfig, [field]: value }
    });
  };

  const addIngrediente = () => {
    const next = [...currentConfig.ingredientes, { insumoId: '', quantidade: 0, unidade: 'g' }];
    updateSizeField('ingredientes', next);
  };

  const removeIngrediente = (idx) => {
    const next = currentConfig.ingredientes.filter((_, i) => i !== idx);
    updateSizeField('ingredientes', next);
  };

  const updateIngrediente = (idx, field, val) => {
    const next = [...currentConfig.ingredientes];
    next[idx][field] = val;
    updateSizeField('ingredientes', next);
  };

  const copyFromSize = (sourceSize) => {
    if (sourceSize === activeSize) return;
    if (!window.confirm(`Copiar ingredientes de ${sourceSize} para ${activeSize}?`)) return;
    
    setTamanhosConfig({
      ...tamanhosConfig,
      [activeSize]: { 
        ...currentConfig, 
        ingredientes: JSON.parse(JSON.stringify(tamanhosConfig[sourceSize].ingredientes))
      }
    });
  };

  const calculatedStats = useMemo(() => {
    const results = {};
    TAMANHOS.forEach(t => {
      const config = tamanhosConfig[t];
      const custoInsumos = config.ingredientes.reduce((acc, ing) => {
        const insumo = insumos.find(i => i.id === ing.insumoId);
        if (!insumo) return acc;
        const mult = UNIDADES.find(u => u.id === ing.unidade)?.mult || 1;
        return acc + (Number(ing.quantidade) * mult * insumo.preco_por_unidade_base);
      }, 0);

      const custoFixoPizza = custoInsumos + Number(config.embalagem) + Number(custoOperacional);
      const precoSugerido = custoFixoPizza * (1 + (Number(margemLucro) / 100));

      results[t] = { 
        custo_total: custoFixoPizza, 
        preco_sugerido: precoSugerido,
        custo_insumos: custoInsumos
      };
    });
    return results;
  }, [tamanhosConfig, insumos, margemLucro, custoOperacional]);

  const handleFinalSave = () => {
    if (!nome) return;
    onSave({
      nome,
      margem_lucro: Number(margemLucro),
      custo_operacional: Number(custoOperacional),
      tamanhos_config: Object.keys(tamanhosConfig).reduce((acc, t) => {
        acc[t] = { ...tamanhosConfig[t], ...calculatedStats[t] };
        return acc;
      }, {})
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase text-orange-600">Configurar Sabor: {nome || '...'}</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de Ficha Técnica Multi-Tamanho</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Configurações Globais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">Nome do Sabor</label>
              <input className="w-full border-none bg-white dark:bg-slate-900 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500 shadow-sm transition-all" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Calabresa Tradicional" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><DollarSign size={12}/> Operacional Fixo (R$)</label>
              <input type="number" className="w-full border-none bg-white dark:bg-slate-900 p-2.5 rounded-lg font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 shadow-sm" value={custoOperacional} onChange={e => setCustoOperacional(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Percent size={12}/> Margem de Lucro (%)</label>
              <input type="number" className="w-full border-none bg-white dark:bg-slate-900 p-2.5 rounded-lg font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 shadow-sm" value={margemLucro} onChange={e => setMargemLucro(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-fit overflow-x-auto shadow-inner">
              {TAMANHOS.map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveSize(t)}
                  className={`flex-1 md:flex-none px-10 py-2.5 rounded-lg font-black text-sm transition-all whitespace-nowrap ${activeSize === t ? "bg-white dark:bg-slate-700 shadow-md text-orange-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Copiar Ingredientes de:</span>
              <div className="flex gap-1">
                {TAMANHOS.map(t => (
                  <button key={t} onClick={() => copyFromSize(t)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-black transition-all disabled:opacity-30 active:scale-90" disabled={t === activeSize}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-black uppercase tracking-widest text-xs text-slate-500">Montagem do Tamanho {activeSize}</h4>
                <Button variant="secondary" onClick={addIngrediente} icon={Plus} className="text-xs h-9 font-bold px-6">Add Insumo</Button>
              </div>

              <div className="space-y-2">
                {currentConfig.ingredientes.map((ing, idx) => {
                  const sInsumo = insumos.find(i => i.id === ing.insumoId);
                  const mult = UNIDADES.find(u => u.id === ing.unidade)?.mult || 1;
                  const valorLinha = sInsumo ? (Number(ing.quantidade) * mult * sInsumo.preco_por_unidade_base) : 0;

                  return (
                    <div key={idx} className="flex gap-2 items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-orange-200 transition-colors">
                      <select 
                        className="flex-1 min-w-0 border-none bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-sm focus:ring-1 focus:ring-orange-500"
                        value={ing.insumoId}
                        onChange={e => updateIngrediente(idx, 'insumoId', e.target.value)}
                      >
                        <option value="">Selecionar ingrediente...</option>
                        {insumos.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                      </select>
                      <div className="flex gap-1 w-36 shrink-0">
                        <input type="number" className="w-full border-none bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-sm font-bold text-center" placeholder="Qtd" value={ing.quantidade} onChange={e => updateIngrediente(idx, 'quantidade', e.target.value)} />
                        <select className="w-16 border-none bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-[10px] font-black uppercase" value={ing.unidade} onChange={e => updateIngrediente(idx, 'unidade', e.target.value)}>
                          {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.id.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="w-24 text-right font-black text-orange-600 text-xs shrink-0 tracking-tight">{formatCurrency(valorLinha)}</div>
                      <button onClick={() => removeIngrediente(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </div>
                  );
                })}
                {currentConfig.ingredientes.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-2">
                    <span className="text-slate-400 text-sm italic">Adicione ingredientes para ver o custo parcial.</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custo da Caixa ({activeSize})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                      <input type="number" className="pl-10 pr-4 py-2.5 w-36 border-none bg-white dark:bg-slate-900 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 shadow-sm" value={currentConfig.embalagem} onChange={e => updateSizeField('embalagem', e.target.value)} />
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Calculator size={160}/></div>
                <h4 className="font-black mb-6 text-center border-b border-slate-800 pb-3 uppercase text-[10px] tracking-[0.3em] text-orange-500">RESUMO DE CUSTO {activeSize}</h4>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Soma de Insumos</span>
                    <span className="font-bold text-slate-300">{formatCurrency(calculatedStats[activeSize].custo_insumos)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Custo Estrutura (Fixo)</span>
                    <span className="font-bold text-blue-400">{formatCurrency(Number(custoOperacional))}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Custo Real Final (CMV)</span>
                       <span className="text-3xl font-black text-orange-500">{formatCurrency(calculatedStats[activeSize].custo_total)}</span>
                    </div>
                  </div>
                  <div className="pt-8 mt-4 border-t border-dashed border-slate-700 text-center">
                    <div className="text-[10px] text-slate-400 font-black uppercase mb-3 tracking-[0.2em]">SUGESTÃO DE VENDA</div>
                    <div className="text-5xl font-black text-emerald-400 drop-shadow-lg tracking-tighter">{formatCurrency(calculatedStats[activeSize].preco_sugerido)}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="p-6 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-6 md:items-center justify-between shrink-0">
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {TAMANHOS.map(t => (
              <div key={t} className={`flex flex-col px-4 border-r border-slate-100 dark:border-slate-800 last:border-0 transition-all ${activeSize === t ? 'scale-110 origin-left border-orange-500' : 'opacity-30'}`}>
                <div className="text-[10px] text-slate-400 font-black uppercase">{t}</div>
                <div className={`text-sm font-black ${activeSize === t ? 'text-orange-600' : ''}`}>{formatCurrency(calculatedStats[t].preco_sugerido)}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 shrink-0">
            <Button variant="ghost" className="font-bold px-6" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleFinalSave} icon={Save} className="px-12 h-14 font-black uppercase tracking-widest text-lg">Salvar Ficha</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
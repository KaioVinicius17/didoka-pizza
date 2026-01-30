"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query
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
  Search, 
  Percent, 
  Calculator 
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE DIRETA ---
// Kaio, preencha os valores abaixo com os dados do seu Console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCJPDGcKvWObK9b70TJaqWwq48s3wHiYqM",
  authDomain: "didoka-pizza.firebaseapp.com",
  projectId: "didoka-pizza",
  storageBucket: "didoka-pizza.firebasestorage.app",
  messagingSenderId: "431046628959",
  appId: "1:431046628959:web:2a0dc49e6997dc012a2dea",
  measurementId: "G-NBJYE1WG4Y"
};


// Inicialização segura
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "didoka-pizza-producao";

// --- CONSTANTES ---
const UNIDADES = [
  { id: 'kg', label: 'Quilograma (KG)', mult: 1000 },
  { id: 'g', label: 'Grama (G)', mult: 1 },
  { id: 'l', label: 'Litro (L)', mult: 1000 },
  { id: 'ml', label: 'Mililitro (ML)', mult: 1 },
  { id: 'un', label: 'Unidade (UN)', mult: 1 },
];

const TAMANHOS = ['P', 'M', 'G', 'F', 'GG'];

const formatCurrency = (val: number | string | undefined) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
};

// --- INTERFACES PARA TYPESCRIPT ---
interface Insumo {
  id: string;
  nome: string;
  preco_compra: number;
  quantidade_compra: number;
  unidade_compra: string;
  preco_por_unidade_base: number;
}

interface IngredienteRef {
  insumoId: string;
  quantidade: number;
  unidade: string;
}

interface TamanhoConfig {
  ingredientes: IngredienteRef[];
  embalagem: number;
  custo_total?: number;
  preco_sugerido?: number;
  custo_insumos?: number;
}

interface Sabor {
  id: string;
  nome: string;
  margem_lucro: number;
  custo_operacional: number;
  tamanhos_config: { [key: string]: TamanhoConfig };
}

// --- COMPONENTES DE UI ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, icon: Icon }: any) => {
  const variants: any = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-600/20",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400",
    ghost: "bg-transparent hover:bg-slate-50 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800",
  };

  return (
    <button 
      type="button"
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
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [showSaborModal, setShowSaborModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { console.error("Erro auth:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const insumosRef = collection(db, 'pizzarias', appId, 'users', user.uid, 'insumos');
    const saboresRef = collection(db, 'pizzarias', appId, 'users', user.uid, 'sabores');

    const unsubInsumos = onSnapshot(insumosRef, (snap) => {
      setInsumos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insumo)));
    });

    const unsubSabores = onSnapshot(saboresRef, (snap) => {
      setSabores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sabor)));
      setLoading(false);
    });

    return () => { unsubInsumos(); unsubSabores(); };
  }, [user]);

  const handleSaveInsumo = async (data: any) => {
    if (!user) return;
    const colRef = collection(db, 'pizzarias', appId, 'users', user.uid, 'insumos');
    const u = UNIDADES.find(u => u.id === data.unidade_compra);
    const precoBase = Number(data.preco_compra) / (Number(data.quantidade_compra) * (u?.mult || 1));
    const finalData = { ...data, preco_por_unidade_base: precoBase };

    if (editingItem) {
      await updateDoc(doc(db, 'pizzarias', appId, 'users', user.uid, 'insumos', editingItem.id), finalData);
    } else {
      await addDoc(colRef, finalData);
    }
    setShowInsumoModal(false);
    setEditingItem(null);
  };

  const handleSaveSabor = async (data: any) => {
    if (!user) return;
    const colRef = collection(db, 'pizzarias', appId, 'users', user.uid, 'sabores');
    if (editingItem) {
      await updateDoc(doc(db, 'pizzarias', appId, 'users', user.uid, 'sabores', editingItem.id), data);
    } else {
      await addDoc(colRef, data);
    }
    setShowSaborModal(false);
    setEditingItem(null);
  };

  const handleDelete = async (col: string, id: string) => {
    if (!window.confirm("Confirmar exclusão?")) return;
    if (!user) return; 
    await deleteDoc(doc(db, 'pizzarias', appId, 'users', user.uid, col, id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      <nav className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-r border-slate-200 dark:border-slate-800 p-4 shrink-0">
        <div className="flex items-center gap-3 py-4 mb-6">
          <div className="bg-orange-600 p-2 rounded-lg text-white shadow-lg shadow-orange-600/20"><Pizza size={24} /></div>
          <h1 className="font-bold text-xl tracking-tight text-orange-600">Didoka Pizza</h1>
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
            onEdit={(item: any) => { setEditingItem(item); setShowInsumoModal(true); }}
            onDelete={(id: string) => handleDelete('insumos', id)}
          />
        )}
        {activeTab === 'sabores' && (
          <SaboresList 
            sabores={sabores} 
            insumos={insumos}
            onAdd={() => { setEditingItem(null); setShowSaborModal(true); }}
            onEdit={(item: any) => { setEditingItem(item); setShowSaborModal(true); }}
            onDelete={(id: string) => handleDelete('sabores', id)}
          />
        )}
      </main>

      {showInsumoModal && <InsumoFormModal initialData={editingItem} onClose={() => setShowInsumoModal(false)} onSave={handleSaveInsumo} />}
      {showSaborModal && <SaborFormModal initialData={editingItem} insumos={insumos} onClose={() => setShowSaborModal(false)} onSave={handleSaveSabor} />}
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20" : "text-slate-500 hover:bg-slate-50"}`}>
      <Icon size={20} /> {label}
    </button>
  );
}

function Dashboard({ insumos, sabores }: { insumos: Insumo[], sabores: Sabor[] }) {
  const stats = useMemo(() => {
    let totalPizzasConfiguradas = 0;
    let custoMedioTotal = 0;
    
    sabores.forEach((s) => {
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
          <h3 className="font-bold mb-4 text-orange-600">Sugestões de Venda (Tamanho G)</h3>
          <div className="space-y-3">
            {sabores.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="font-medium">{s.nome}</span>
                <span className="text-orange-600 font-bold">{formatCurrency(s.tamanhos_config?.G?.preco_sugerido || 0)}</span>
              </div>
            ))}
            {sabores.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Nenhum sabor cadastrado ainda.</p>}
          </div>
        </Card>
        <Card className="p-6 text-center flex flex-col items-center justify-center">
          <TrendingUp size={32} className="text-blue-500 mb-2"/> 
          <h3 className="font-bold">CMV Automático</h3>
          <p className="text-sm text-slate-500 mt-2">
            Acompanhe o impacto da inflação dos insumos no seu lucro em tempo real.
          </p>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="bg-slate-50 dark:bg-slate-800 p-2 w-fit rounded-lg"><Icon size={18} className="text-orange-600" /></div>
      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</div>
      <div className="text-xl font-black">{value}</div>
    </Card>
  );
}

function InsumosList({ insumos, onAdd, onEdit, onDelete }: { insumos: Insumo[], onAdd: () => void, onEdit: (i: Insumo) => void, onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = insumos.filter((i) => i.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Insumos</h2>
        <Button onClick={onAdd} icon={Plus}>Novo Insumo</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 rounded-lg text-sm border-none focus:ring-2 focus:ring-orange-500 transition-all outline-none" 
            placeholder="Buscar ingrediente..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      {insumos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Package size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
          <h3 className="text-slate-600 dark:text-slate-300 font-bold text-lg">Estoque Vazio</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">Cadastre os ingredientes básicos primeiro.</p>
          <Button onClick={onAdd} icon={Plus} className="px-8">Adicionar Primeiro Insumo</Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 uppercase text-[10px] tracking-widest">
                <tr><th className="px-6 py-4">Insumo</th><th className="px-6 py-4">Compra</th><th className="px-6 py-4">Unitário</th><th className="px-6 py-4 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 font-semibold">{i.nome}</td>
                    <td className="px-6 py-4 text-slate-500">{formatCurrency(i.preco_compra)}</td>
                    <td className="px-6 py-4 text-orange-600 font-bold">{formatCurrency(i.preco_por_unidade_base)}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                      <button onClick={() => onEdit(i)} className="p-2 text-slate-400 hover:text-orange-600 transition-all"><Edit3 size={16}/></button>
                      <button onClick={() => onDelete(i.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function InsumoFormModal({ initialData, onClose, onSave }: any) {
  const [form, setForm] = useState(initialData || { nome: '', preco_compra: '', quantidade_compra: '', unidade_compra: 'kg' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="p-6 flex justify-between border-b dark:border-slate-800">
          <h3 className="text-lg font-bold">Dados do Insumo</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Nome</label>
            <input className="w-full border dark:border-slate-700 bg-transparent p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ex: Queijo Muçarela" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Preço Pago (R$)</label>
              <input type="number" className="w-full border dark:border-slate-700 bg-transparent p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.00" value={form.preco_compra} onChange={e => setForm({...form, preco_compra: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Qtd Comprada</label>
              <input type="number" className="w-full border dark:border-slate-700 bg-transparent p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" placeholder="1" value={form.quantidade_compra} onChange={e => setForm({...form, quantidade_compra: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Unidade</label>
            <select className="w-full border dark:border-slate-700 bg-transparent p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" value={form.unidade_compra} onChange={e => setForm({...form, unidade_compra: e.target.value})}>
              {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2 rounded-b-xl border-t dark:border-slate-800"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={() => onSave(form)} icon={Save}>Salvar</Button></div>
      </Card>
    </div>
  );
}

function SaboresList({ sabores, insumos, onAdd, onEdit, onDelete }: { sabores: Sabor[], insumos: Insumo[], onAdd: () => void, onEdit: (s: Sabor) => void, onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => sabores.filter((s) => s.nome.toLowerCase().includes(search.toLowerCase())), [sabores, search]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sabores</h2>
        <Button onClick={onAdd} icon={Plus}>Novo Sabor</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 rounded-lg text-sm border-none focus:ring-2 focus:ring-orange-500 transition-all outline-none" 
            placeholder="Pesquisar sabor..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="p-6 hover:shadow-lg transition-all group border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black text-orange-600 uppercase tracking-tight">{s.nome}</h3>
                <div className="flex flex-wrap gap-1.5 mt-3">
                   {TAMANHOS.map(t => (
                     s.tamanhos_config?.[t] && 
                     <div key={t} className="flex flex-col bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-lg min-w-[60px] text-center shadow-sm">
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
            <div className="pt-4 border-t dark:border-slate-800 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
              <span className="text-slate-500">Lucro Alvo: <span className="text-emerald-500">{s.margem_lucro}%</span></span>
              <span className="text-slate-500">Fixo Operacional: <span className="text-blue-500">{formatCurrency(s.custo_operacional)}</span></span>
            </div>
          </Card>
        ))}
        {sabores.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <Pizza size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
            <h3 className="text-slate-600 dark:text-slate-300 font-bold text-lg">Sem Fichas Técnicas</h3>
            <Button onClick={onAdd} icon={Plus} className="mt-4 px-8">Criar Primeiro Sabor</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SaborFormModal({ initialData, insumos, onClose, onSave }: { initialData: Sabor | null, insumos: Insumo[], onClose: () => void, onSave: (data: any) => void }) {
  const [nome, setNome] = useState(initialData?.nome || '');
  const [margemLucro, setMargemLucro] = useState(initialData?.margem_lucro || 50);
  const [custoOperacional, setCustoOperacional] = useState(initialData?.custo_operacional || 5.00);
  const [activeSize, setActiveSize] = useState('G');
  
  const [tamanhosConfig, setTamanhosConfig] = useState<any>(initialData?.tamanhos_config || {
    P: { ingredientes: [], embalagem: 1.50 },
    M: { ingredientes: [], embalagem: 1.80 },
    G: { ingredientes: [], embalagem: 2.20 },
    F: { ingredientes: [], embalagem: 3.50 },
    GG: { ingredientes: [], embalagem: 2.50 },
  });

  const currentConfig = tamanhosConfig[activeSize];

  const updateSizeField = (field: string, value: any) => {
    setTamanhosConfig({
      ...tamanhosConfig,
      [activeSize]: { ...currentConfig, [field]: value }
    });
  };

  const addIngrediente = () => {
    const next = [...currentConfig.ingredientes, { insumoId: '', quantidade: 0, unidade: 'g' }];
    updateSizeField('ingredientes', next);
  };

  const removeIngrediente = (idx: number) => {
    const next = currentConfig.ingredientes.filter((_: any, i: number) => i !== idx);
    updateSizeField('ingredientes', next);
  };

  const updateIngrediente = (idx: number, field: string, val: any) => {
    const next = [...currentConfig.ingredientes];
    next[idx][field] = val;
    updateSizeField('ingredientes', next);
  };

  const copyFromSize = (sourceSize: string) => {
    if (sourceSize === activeSize) return;
    if (!window.confirm(`Copiar ficha do tamanho ${sourceSize} para ${activeSize}?`)) return;
    updateSizeField('ingredientes', JSON.parse(JSON.stringify(tamanhosConfig[sourceSize].ingredientes)));
  };

  const calculatedStats = useMemo(() => {
    const results: any = {};
    TAMANHOS.forEach(t => {
      const config = tamanhosConfig[t];
      const custoInsumos = config.ingredientes.reduce((acc: number, ing: any) => {
        const insumo = insumos.find((i: any) => i.id === ing.insumoId);
        if (!insumo) return acc;
        const mult = UNIDADES.find(u => u.id === ing.unidade)?.mult || 1;
        return acc + (Number(ing.quantidade) * mult * insumo.preco_por_unidade_base);
      }, 0);

      const custoFinal = custoInsumos + Number(config.embalagem) + Number(custoOperacional);
      results[t] = { 
        custo_total: custoFinal, 
        preco_sugerido: custoFinal * (1 + (Number(margemLucro) / 100)),
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
      tamanhos_config: Object.keys(tamanhosConfig).reduce((acc: any, t) => {
        acc[t] = { ...tamanhosConfig[t], ...calculatedStats[t] };
        return acc;
      }, {})
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 shadow-2xl">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
          <h3 className="text-xl font-black uppercase text-orange-600">Ficha Técnica: {nome || 'Sabor Novo'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border dark:border-slate-800 shadow-inner">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sabor</label>
              <input className="w-full border-none bg-white dark:bg-slate-900 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500 shadow-sm" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Operacional (R$)</label>
              <input type="number" className="w-full border-none bg-white dark:bg-slate-900 p-2.5 rounded-lg font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 shadow-sm" value={custoOperacional} onChange={e => setCustoOperacional(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margem de Lucro (%)</label>
              <input type="number" className="w-full border-none bg-white dark:bg-slate-900 p-2.5 rounded-lg font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 shadow-sm" value={margemLucro} onChange={e => setMargemLucro(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-fit overflow-x-auto shadow-inner">
            {TAMANHOS.map(t => (
              <button 
                key={t} 
                onClick={() => setActiveSize(t)} 
                className={`flex-1 md:flex-none px-10 py-2.5 rounded-lg font-black text-sm transition-all ${activeSize === t ? "bg-white dark:bg-slate-700 shadow-md text-orange-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black uppercase tracking-widest text-xs text-slate-500">Ingredientes - Tamanho {activeSize}</h4>
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold text-slate-400 self-center uppercase">Copiar de:</span>
                  <div className="flex gap-1">
                    {TAMANHOS.filter(t => t !== activeSize).map(t => (
                      <button key={t} onClick={() => copyFromSize(t)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-orange-50 transition-all">{t}</button>
                    ))}
                  </div>
                  <Button variant="secondary" onClick={addIngrediente} icon={Plus} className="text-[10px] h-7 px-3">Add Item</Button>
                </div>
              </div>

              <div className="space-y-2">
                {currentConfig.ingredientes.map((ing: any, idx: number) => (
                  <div key={idx} className="flex gap-2 items-center p-3 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-sm hover:border-orange-200 transition-all">
                    <select className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm outline-none" value={ing.insumoId} onChange={e => updateIngrediente(idx, 'insumoId', e.target.value)}>
                      <option value="">Ingrediente...</option>
                      {insumos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                    <input type="number" className="w-20 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm font-bold text-center outline-none" value={ing.quantidade} onChange={e => updateIngrediente(idx, 'quantidade', Number(e.target.value))} />
                    <select className="w-16 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-[10px] font-black uppercase outline-none" value={ing.unidade} onChange={e => updateIngrediente(idx, 'unidade', e.target.value)}>
                      {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.id.toUpperCase()}</option>)}
                    </select>
                    <button onClick={() => removeIngrediente(idx)} className="text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                  </div>
                ))}
                {currentConfig.ingredientes.length === 0 && <p className="text-center py-10 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">Sem ingredientes para este tamanho.</p>}
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border dark:border-slate-800 flex justify-between items-center shadow-inner">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Custo Caixa ({activeSize})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                  <input type="number" className="pl-8 pr-3 py-2 w-32 bg-white dark:bg-slate-900 border-none rounded-lg text-sm font-black outline-none focus:ring-2 focus:ring-orange-500 shadow-sm" value={currentConfig.embalagem} onChange={e => updateSizeField('embalagem', Number(e.target.value))} />
                </div>
              </div>
            </div>

            <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Calculator size={64}/></div>
              <h4 className="font-black mb-6 text-center border-b border-slate-800 pb-3 uppercase text-[10px] tracking-[0.3em] text-orange-500">RESUMO {activeSize}</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-bold"><span>Total Insumos</span><span>{formatCurrency(calculatedStats[activeSize].custo_insumos)}</span></div>
                <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-bold"><span>Taxa Operacional</span><span>{formatCurrency(Number(custoOperacional))}</span></div>
                <div className="pt-4 border-t border-slate-800 flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Custo Final (CMV)</span>
                  <span className="text-3xl font-black text-orange-500">{formatCurrency(calculatedStats[activeSize].custo_total)}</span>
                </div>
                <div className="pt-8 border-t border-dashed border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-[0.2em]">SUGESTÃO DE VENDA</div>
                  <div className="text-5xl font-black text-emerald-400 tracking-tighter drop-shadow-md">{formatCurrency(calculatedStats[activeSize].preco_sugerido)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="p-6 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {TAMANHOS.map(t => (
              <div key={t} className={`flex flex-col px-4 border-r dark:border-slate-800 last:border-0 transition-all ${activeSize === t ? 'opacity-100 scale-110 origin-left border-orange-500' : 'opacity-30'}`}>
                <div className="text-[10px] text-slate-400 font-black uppercase">{t}</div>
                <div className={`text-sm font-black ${activeSize === t ? 'text-orange-600' : ''}`}>{formatCurrency(calculatedStats[t].preco_sugerido)}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="font-bold" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleFinalSave} icon={Save} className="px-10 h-12 font-black uppercase tracking-widest shadow-lg">Salvar Sabor</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
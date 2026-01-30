"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
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
  Search, 
  Percent, 
  Calculator,
  AlertTriangle,
  LogOut,
  Mail,
  Lock,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE DIRETA ---
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

const formatCurrency = (val: number | string | any) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
};

// --- INTERFACES ---
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
  <div className={`bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, icon: Icon, loading = false }: any) => {
  const variants: any = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400",
    ghost: "bg-transparent hover:bg-slate-50 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800",
    outline: "bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
  };

  return (
    <button 
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-50 active:scale-95 ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

// --- COMPONENTE DE LOGIN ---

function LoginScreen({ onLogged }: { onLogged: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogged();
    } catch (err: any) {
      setError("Falha na autenticação. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogged();
    } catch (err: any) {
      setError("Falha ao entrar com o Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md p-10 shadow-2xl border-none">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-orange-600 p-5 rounded-[32px] text-white mb-5 shadow-2xl shadow-orange-600/30">
            <Pizza size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter text-center leading-none">Didoka Pizza</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-3">Gestão Profissional</p>
        </div>

        <div className="space-y-4">
          <Button onClick={handleGoogleLogin} loading={googleLoading} variant="outline" className="w-full h-14 flex gap-3 border-slate-200 dark:border-slate-800">
            {!googleLoading && <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.77-3.77C18.52 1.15 15.42 0 12 0 7.31 0 3.25 2.69 1.2 6.64l4.41 3.42C6.63 7.07 9.1 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.8-.07-1.56-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.74-2.4 3.58l4.41 3.42c2.58-2.38 4.01-5.88 4.01-9.24z"/><path fill="#FBBC05" d="M5.61 14.78c-.24-.72-.37-1.48-.37-2.28s.13-1.56.37-2.28L1.2 6.8c-.77 1.56-1.2 3.32-1.2 5.2s.43 3.64 1.2 5.2l4.41-3.42z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.41-3.42c-1.1.74-2.51 1.17-3.52 1.17-2.9 0-5.37-1.97-6.39-4.76L1.2 17.36C3.25 21.31 7.31 24 12 24z"/></svg>}
            Google
          </Button>

          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] absolute">ou e-mail</span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" required placeholder="Utilizador" className="w-full bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 dark:text-white transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" required placeholder="Senha" className="w-full bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 dark:text-white transition-all" value={password} onChange={e => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
            <Button loading={loading} className="w-full h-14">Aceder Sistema</Button>
          </form>
        </div>

        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center text-[10px] font-black text-slate-400 hover:text-orange-500 transition-all mt-10 uppercase tracking-[0.2em]">
          {isRegistering ? "Já tem conta? Login" : "Nova conta? Registe-se"}
        </button>
      </Card>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // FIX: Estado declarado no topo para evitar erro de referência
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [showSaborModal, setShowSaborModal] = useState(false);

  // Efeito para alternar tema
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const insumosRef = collection(db, 'pizzarias', appId, 'users', user.uid, 'insumos');
    const saboresRef = collection(db, 'pizzarias', appId, 'users', user.uid, 'sabores');

    const unsubInsumos = onSnapshot(insumosRef, (snap) => {
      setInsumos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insumo)));
    }, (err) => {
       if (err.code === 'permission-denied') setError("Verifique as permissões do Firebase.");
    });

    const unsubSabores = onSnapshot(saboresRef, (snap) => {
      setSabores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sabor)));
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
    if (!window.confirm("Eliminar permanentemente?")) return;
    if (!user) return; 
    await deleteDoc(doc(db, 'pizzarias', appId, 'users', user.uid, col, id));
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-orange-600 mb-4" size={50} />
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando Didoka...</p>
    </div>
  );

  if (!user) return <LoginScreen onLogged={() => setLoading(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar - Fixa e de Altura Total */}
      <nav className="w-full md:w-80 bg-white dark:bg-slate-900 border-b md:border-r border-slate-200 dark:border-slate-800 p-8 shrink-0 shadow-2xl z-30 flex flex-col md:h-screen md:sticky md:top-0">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600 p-3 rounded-[20px] text-white shadow-xl shadow-orange-600/30"><Pizza size={30} /></div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter text-slate-800 dark:text-white uppercase leading-none">Didoka</h1>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Pizza Analytics</span>
            </div>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-orange-500 transition-all shadow-inner border dark:border-slate-700/50"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
          <NavItem active={activeTab === 'insumos'} onClick={() => setActiveTab('insumos')} icon={Package} label="Insumos" />
          <NavItem active={activeTab === 'sabores'} onClick={() => setActiveTab('sabores')} icon={ClipboardList} label="Fichas Técnicas" />
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 mt-8">
           <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl mb-6 border dark:border-slate-800/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Conta</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
           </div>
           <button 
             onClick={() => signOut(auth)}
             className="w-full flex items-center gap-4 px-6 py-4 rounded-[20px] text-[10px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all uppercase tracking-widest"
           >
             <LogOut size={20} /> Sair
           </button>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-14 overflow-y-auto bg-slate-50 dark:bg-slate-950">
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

      {/* Modais */}
      {showInsumoModal && <InsumoFormModal initialData={editingItem} onClose={() => setShowInsumoModal(false)} onSave={handleSaveInsumo} />}
      {showSaborModal && <SaborFormModal initialData={editingItem} insumos={insumos} onClose={() => setShowSaborModal(false)} onSave={handleSaveSabor} />}
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[24px] text-xs font-black transition-all uppercase tracking-widest ${active ? "bg-orange-600 text-white shadow-xl shadow-orange-600/30" : "text-slate-500 hover:bg-white dark:hover:bg-slate-800 shadow-sm"}`}>
      <Icon size={22} /> {label}
    </button>
  );
}

function Dashboard({ insumos, sabores }: { insumos: Insumo[], sabores: Sabor[] }) {
  const stats = useMemo(() => {
    let totalPizzas = 0;
    let custoTotal = 0;
    sabores.forEach((s) => {
      Object.keys(s.tamanhos_config || {}).forEach(t => {
        totalPizzas++;
        custoTotal += s.tamanhos_config[t].custo_total || 0;
      });
    });
    return {
      insumos: insumos.length,
      sabores: sabores.length,
      totalPizzas,
      custoMedio: totalPizzas > 0 ? custoTotal / totalPizzas : 0
    };
  }, [insumos, sabores]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Didoka Dashboard</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Gestão de CMV em Tempo Real</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard icon={Package} label="Insumos" value={stats.insumos} color="text-blue-500" />
        <StatCard icon={Pizza} label="Receitas" value={stats.sabores} color="text-orange-500" />
        <StatCard icon={Calculator} label="Fichas" value={stats.totalPizzas} color="text-purple-500" />
        <StatCard icon={DollarSign} label="Custo Médio" value={formatCurrency(stats.custoMedio)} color="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="p-10 border-none shadow-xl bg-white dark:bg-slate-900">
          <h3 className="font-black text-xl mb-10 flex items-center gap-4 text-orange-600 uppercase tracking-widest border-b dark:border-slate-800 pb-6"><TrendingUp size={28}/> Sugestão de Venda (TAM G)</h3>
          <div className="space-y-4">
            {sabores.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between items-center p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/30 border dark:border-slate-800 transition-all hover:scale-[1.01]">
                <span className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs tracking-tight">{s.nome}</span>
                <span className="text-orange-600 font-black text-xl tracking-tighter">{formatCurrency(s.tamanhos_config?.G?.preco_sugerido || 0)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-10 flex flex-col items-center justify-center text-center bg-orange-600 text-white border-none shadow-2xl relative overflow-hidden group rounded-[48px]">
          <div className="absolute -top-20 -right-20 opacity-10 group-hover:rotate-45 transition-transform duration-700"><Calculator size={300} /></div>
          <div className="bg-white/20 p-8 rounded-full mb-8 shadow-inner relative z-10"><Pizza size={64} /></div>
          <h3 className="font-black text-3xl uppercase mb-4 tracking-tight leading-none">Cálculo Preciso</h3>
          <p className="text-orange-50 font-bold max-w-xs leading-relaxed text-lg opacity-90 uppercase text-[10px] tracking-[0.2em]">O sistema recalcula automaticamente o seu lucro ao atualizar qualquer preço.</p>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="p-10 flex flex-col gap-4 transition-all hover:translate-y-[-8px] hover:shadow-2xl group border-none bg-white dark:bg-slate-900 shadow-xl rounded-[40px]">
      <div className={`bg-slate-50 dark:bg-slate-800 p-4 w-fit rounded-[24px] ${color} shadow-sm group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors`}><Icon size={30} /></div>
      <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 leading-none">{label}</div>
      <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">{value}</div>
    </Card>
  );
}

function InsumosList({ insumos, onAdd, onEdit, onDelete }: any) {
  const [search, setSearch] = useState("");
  const filtered = insumos.filter((i: any) => i.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Insumos</h2>
        <Button onClick={onAdd} icon={Plus} className="w-full sm:w-auto h-16 px-12 text-sm">Novo Item</Button>
      </div>

      <Card className="p-5 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[32px]">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={26} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-950/50 pl-16 pr-8 py-6 rounded-3xl text-lg border-none focus:ring-2 focus:ring-orange-500 outline-none font-black text-slate-700 dark:text-white shadow-inner transition-all uppercase tracking-tight" 
            placeholder="O que está a faltar?" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      {insumos.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-[64px] border-4 border-dashed border-slate-100 dark:border-slate-800 p-10">
          <Package size={100} className="text-slate-100 dark:text-slate-800 mb-8" />
          <h3 className="text-slate-700 dark:text-slate-300 font-black text-3xl uppercase tracking-widest">Sem Insumos</h3>
          <Button onClick={onAdd} icon={Plus} className="px-16 h-20 text-base shadow-2xl">Adicionar</Button>
        </div>
      ) : (
        <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[48px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 font-black text-slate-400 uppercase text-[10px] tracking-[0.4em]">
                <tr>
                  <th className="px-12 py-8">Designação</th>
                  <th className="px-12 py-8 text-center">Compra</th>
                  <th className="px-12 py-8 text-center">Unitário Base</th>
                  <th className="px-12 py-8 text-right">Gerir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filtered.map((i: any) => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group">
                    <td className="px-12 py-10 font-black text-slate-800 dark:text-slate-200 uppercase text-xs tracking-tight">{i.nome}</td>
                    <td className="px-12 py-10 text-center text-slate-500 font-black text-lg tracking-tighter">{formatCurrency(i.preco_compra)} <span className="text-[10px] opacity-40 font-bold ml-2 uppercase">Pack {i.quantidade_compra}{i.unidade_compra}</span></td>
                    <td className="px-12 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-orange-600 font-black text-2xl tracking-tighter leading-none">{formatCurrency(i.preco_por_unidade_base)}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">por {i.unidade_compra === 'un' ? 'un' : (i.unidade_compra === 'kg' ? 'g' : 'ml')}</span>
                      </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => onEdit(i)} className="p-4 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/50 rounded-[24px]"><Edit3 size={24}/></button>
                        <button onClick={() => onDelete(i.id)} className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-[24px]"><Trash2 size={24}/></button>
                      </div>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border-none overflow-hidden rounded-[48px] bg-white dark:bg-slate-900">
        <div className="p-10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
          <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-500">Cadastro de Insumo</h3>
          <button onClick={onClose} className="p-4 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X size={24}/></button>
        </div>
        <div className="p-12 space-y-10">
          <div className="space-y-4 text-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Nome do Ingrediente</label>
            <input className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-[24px] outline-none focus:ring-2 focus:ring-orange-500 shadow-inner border-none font-black text-center text-2xl tracking-tighter" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4 text-center">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Preço Pago</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-[24px] outline-none focus:ring-2 focus:ring-orange-500 shadow-inner border-none font-black text-center text-2xl text-orange-600 tracking-tighter" value={form.preco_compra} onChange={e => setForm({...form, preco_compra: e.target.value})} />
            </div>
            <div className="space-y-4 text-center">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Qtd Pack</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-[24px] outline-none focus:ring-2 focus:ring-orange-500 shadow-inner border-none font-black text-center text-2xl tracking-tighter" value={form.quantidade_compra} onChange={e => setForm({...form, quantidade_compra: e.target.value})} />
            </div>
          </div>
          <div className="space-y-4 text-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Unidade</label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-[24px] outline-none focus:ring-2 focus:ring-orange-500 shadow-inner border-none font-black text-center text-lg tracking-[0.2em]" value={form.unidade_compra} onChange={e => setForm({...form, unidade_compra: e.target.value})}>
              {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div className="p-10 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-5 border-t dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} className="px-10 font-black">Sair</Button>
          <Button onClick={() => onSave(form)} icon={Save} className="px-16 h-20 text-lg shadow-2xl">Gravar Insumo</Button>
        </div>
      </Card>
    </div>
  );
}

function SaboresList({ sabores, insumos, onAdd, onEdit, onDelete }: any) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => sabores.filter((s: any) => s.nome.toLowerCase().includes(search.toLowerCase())), [sabores, search]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Fichas Técnicas</h2>
        <Button onClick={onAdd} icon={Plus} className="w-full sm:w-auto h-16 px-12 text-sm">Nova Pizza</Button>
      </div>

      <Card className="p-5 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[32px]">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={26} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-950/50 pl-16 pr-8 py-6 rounded-3xl text-lg border-none focus:ring-2 focus:ring-orange-500 outline-none font-black text-slate-700 dark:text-white shadow-inner transition-all uppercase tracking-tight" 
            placeholder="Buscar por sabor..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {filtered.map((s: any) => (
          <Card key={s.id} className="p-12 hover:shadow-2xl transition-all group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[56px] shadow-xl">
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex flex-col gap-6">
                <h3 className="text-4xl font-black text-orange-600 uppercase tracking-tighter leading-none">{s.nome}</h3>
                <div className="flex flex-wrap gap-3">
                   {TAMANHOS.map(t => (
                     s.tamanhos_config?.[t] && 
                     <div key={t} className="flex flex-col bg-slate-50 dark:bg-slate-800/80 border dark:border-slate-700 px-6 py-4 rounded-[28px] min-w-[90px] text-center shadow-md">
                       <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest leading-none mb-2">{t}</span>
                       <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tighter">{formatCurrency(s.tamanhos_config[t].preco_sugerido)}</span>
                     </div>
                   ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" onClick={() => onEdit(s)} className="p-4 h-14 w-14 hover:bg-orange-50"><Edit3 size={28}/></Button>
                <Button variant="danger" onClick={() => onDelete(s.id)} className="p-4 h-14 w-14 hover:bg-red-50"><Trash2 size={28}/></Button>
              </div>
            </div>
            <div className="pt-10 border-t dark:border-slate-800 flex justify-between items-center text-[10px] uppercase font-black tracking-[0.3em] text-slate-400">
              <span>Lucro Alvo: <span className="text-emerald-500 font-black">{s.margem_lucro}%</span></span>
              <span>Fixo Estrutura: <span className="text-blue-500 font-black">{formatCurrency(s.custo_operacional)}</span></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SaborFormModal({ initialData, insumos, onClose, onSave }: any) {
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
    if (!window.confirm(`Copiar ficha do tamanho ${sourceSize} para este tamanho?`)) return;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-[1400px] h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border-none shadow-2xl rounded-[64px] bg-white dark:bg-slate-900">
        <div className="p-10 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0 text-center">
          <div className="flex items-center gap-6">
            <div className="bg-orange-600 p-4 rounded-[28px] text-white shadow-xl shadow-orange-600/30"><Pizza size={32} /></div>
            <div>
              <h3 className="text-3xl font-black uppercase text-orange-600 tracking-tighter leading-none">Ficha Técnica</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">Análise de Custos por Pizza</p>
            </div>
          </div>
          <button onClick={onClose} className="p-5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all shadow-xl"><X size={32}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 md:p-16 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-50 dark:bg-slate-800/30 p-12 rounded-[56px] shadow-inner text-center">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Nome do Sabor</label>
              <input className="w-full bg-white dark:bg-slate-950 p-6 rounded-[32px] outline-none focus:ring-2 focus:ring-orange-500 border-none font-black text-center text-2xl tracking-tighter" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Fixo Estrutura (R$)</label>
              <input type="number" className="w-full bg-white dark:bg-slate-950 p-6 rounded-[32px] outline-none focus:ring-2 focus:ring-blue-500 border-none font-black text-center text-2xl text-blue-600 tracking-tighter" value={custoOperacional} onChange={e => setCustoOperacional(Number(e.target.value))} />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Lucro Alvo (%)</label>
              <input type="number" className="w-full bg-white dark:bg-slate-950 p-6 rounded-[32px] outline-none focus:ring-2 focus:ring-emerald-500 border-none font-black text-center text-2xl text-emerald-600 tracking-tighter" value={margemLucro} onChange={e => setMargemLucro(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex gap-2 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-[40px] w-fit overflow-x-auto shadow-inner border dark:border-slate-700/50">
              {TAMANHOS.map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveSize(t)} 
                  className={`px-16 py-5 rounded-[32px] font-black text-sm uppercase tracking-widest transition-all ${activeSize === t ? "bg-white dark:bg-slate-700 shadow-2xl text-orange-600 scale-[1.03]" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 text-left">
            <div className="lg:col-span-2 space-y-10">
              <div className="flex justify-between items-center border-b-2 dark:border-slate-800 pb-8">
                <h4 className="font-black uppercase tracking-[0.4em] text-xs text-slate-400">Montagem {activeSize}</h4>
                <div className="flex gap-4 items-center">
                  <div className="hidden xl:flex gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 self-center uppercase mr-3 ml-2 tracking-widest opacity-60">Copiar:</span>
                    {TAMANHOS.filter(t => t !== activeSize).map(t => (
                      <button key={t} onClick={() => copyFromSize(t)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-[11px] font-black hover:bg-orange-50 transition-all text-slate-500">{t}</button>
                    ))}
                  </div>
                  <Button variant="secondary" onClick={addIngrediente} icon={Plus} className="h-14 px-8 text-xs font-black">Novo Item</Button>
                </div>
              </div>

              <div className="space-y-4">
                {currentConfig.ingredientes.map((ing: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center p-4 bg-slate-50 dark:bg-slate-950 rounded-[32px] border dark:border-slate-800 shadow-inner group transition-all">
                    <select className="flex-1 bg-white dark:bg-slate-800 p-5 rounded-[24px] outline-none font-black text-lg transition-all focus:ring-2 focus:ring-orange-500 appearance-none text-slate-700 dark:text-white" value={ing.insumoId} onChange={e => updateIngrediente(idx, 'insumoId', e.target.value)}>
                      <option value="">Escolher ingrediente...</option>
                      {insumos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                    <div className="flex gap-2 w-64 shrink-0">
                      <input type="number" className="w-full bg-white dark:bg-slate-800 p-5 rounded-[24px] outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white font-black text-center text-xl" value={ing.quantidade} onChange={e => updateIngrediente(idx, 'quantidade', Number(e.target.value))} />
                      <select className="w-28 bg-white dark:bg-slate-800 p-5 rounded-[24px] text-[11px] font-black uppercase outline-none text-center" value={ing.unidade} onChange={e => updateIngrediente(idx, 'unidade', e.target.value)}>
                        {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.id.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeIngrediente(idx)} className="p-4 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={28}/></button>
                  </div>
                ))}
              </div>
              
              <div className="p-8 bg-orange-50/50 dark:bg-orange-950/10 rounded-[40px] border border-orange-100 dark:border-orange-900/30 flex justify-between items-center shadow-inner mt-12">
                <div className="flex flex-col text-center sm:text-left">
                  <label className="text-[11px] font-black text-orange-600 uppercase tracking-[0.3em] leading-none">Custo Embalagem</label>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-3 tracking-widest opacity-60">{activeSize}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-orange-400 opacity-60">R$</span>
                  <input type="number" className="pl-14 pr-8 py-6 w-56 bg-white dark:bg-slate-950 border-none rounded-[32px] text-2xl font-black outline-none focus:ring-2 focus:ring-orange-500 shadow-2xl transition-all text-center text-orange-600" value={currentConfig.embalagem} onChange={e => updateSizeField('embalagem', Number(e.target.value))} />
                </div>
              </div>
            </div>

            <Card className="p-12 bg-slate-900 text-white border-none shadow-2xl h-fit rounded-[56px] relative overflow-hidden flex flex-col gap-10">
              <div className="absolute -top-10 -right-10 opacity-5 rotate-12"><Calculator size={150}/></div>
              <h4 className="font-black text-center border-b border-slate-800 pb-8 uppercase text-[12px] tracking-[0.6em] text-orange-500 relative z-10">Total de Custos {activeSize}</h4>
              <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-center text-sm text-slate-500 uppercase font-black tracking-widest"><span>Stock Bruto</span><span className="text-slate-100">{formatCurrency(calculatedStats[activeSize].custo_insumos)}</span></div>
                <div className="flex justify-between items-center text-sm text-slate-500 uppercase font-black tracking-widest"><span>Embalagem</span><span className="text-slate-100">{formatCurrency(currentConfig.embalagem)}</span></div>
                <div className="flex justify-between items-center text-sm text-slate-500 uppercase font-black tracking-widest"><span>Custo Fixo</span><span className="text-blue-500">{formatCurrency(Number(custoOperacional))}</span></div>
                <div className="pt-10 border-t border-slate-800 flex flex-col items-center gap-4">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em]">CMV Real Total</span>
                  <span className="text-6xl font-black text-orange-500 tracking-tighter">{formatCurrency(calculatedStats[activeSize].custo_total)}</span>
                </div>
                <div className="pt-12 border-t border-dashed border-slate-700 text-center flex flex-col gap-4">
                  <div className="text-[11px] text-slate-400 font-black uppercase tracking-[0.5em]">Venda Sugerida (+{margemLucro}%)</div>
                  <div className="text-8xl font-black text-emerald-400 tracking-tighter drop-shadow-2xl">{formatCurrency(calculatedStats[activeSize].preco_sugerido)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="p-12 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col xl:flex-row justify-between items-center gap-10 shrink-0 shadow-2xl z-20 relative">
          <div className="flex gap-10 overflow-x-auto pb-4 scrollbar-hide max-w-full">
            {TAMANHOS.map(t => (
              <div key={t} className={`flex flex-col px-10 border-r border-slate-200 dark:border-slate-800 last:border-0 transition-all ${activeSize === t ? 'opacity-100 scale-110 border-orange-500' : 'opacity-20'}`}>
                <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-2 leading-none text-center">{t}</div>
                <div className={`text-2xl font-black whitespace-nowrap tracking-tighter text-center ${activeSize === t ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}`}>{formatCurrency(calculatedStats[t].preco_sugerido)}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 w-full xl:w-auto">
            <Button variant="ghost" className="font-black h-20 px-12 text-sm opacity-60" onClick={onClose}>Descartar</Button>
            <Button onClick={handleFinalSave} icon={Save} className="px-20 h-20 font-black uppercase tracking-[0.2em] shadow-2xl flex-1 xl:flex-none text-xl">Salvar Receita</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
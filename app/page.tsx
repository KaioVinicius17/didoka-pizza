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
// Kaio, preencha as chaves abaixo com os dados do seu Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCJPDGcKvWObK9b70TJaqWwq48s3wHiYqM",
  authDomain: "didoka-pizza.firebaseapp.com",
  projectId: "didoka-pizza",
  storageBucket: "didoka-pizza.firebasestorage.app",
  messagingSenderId: "431046628959",
  appId: "1:431046628959:web:2a0dc49e6997dc012a2dea",
  measurementId: "G-NBJYE1WG4Y"
};

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
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, icon: Icon, loading = false }: any) => {
  const variants: any = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20",
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
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 ${variants[variant]} ${className}`}
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
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-600 p-4 rounded-3xl text-white mb-4 shadow-xl shadow-orange-600/30">
            <Pizza size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter text-center">Didoka Pizza</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Cálculo de CMV Inteligente</p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleGoogleLogin} 
            loading={googleLoading}
            variant="outline" 
            className="w-full h-14 font-bold flex gap-3"
          >
            {!googleLoading && (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.77-3.77C18.52 1.15 15.42 0 12 0 7.31 0 3.25 2.69 1.2 6.64l4.41 3.42C6.63 7.07 9.1 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.8-.07-1.56-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.74-2.4 3.58l4.41 3.42c2.58-2.38 4.01-5.88 4.01-9.24z"/>
                <path fill="#FBBC05" d="M5.61 14.78c-.24-.72-.37-1.48-.37-2.28s.13-1.56.37-2.28L1.2 6.8c-.77 1.56-1.2 3.32-1.2 5.2s.43 3.64 1.2 5.2l4.41-3.42z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.41-3.42c-1.1.74-2.51 1.17-3.52 1.17-2.9 0-5.37-1.97-6.39-4.76L1.2 17.36C3.25 21.31 7.31 24 12 24z"/>
              </svg>
            )}
            Entrar com o Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] absolute">ou e-mail</span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 pt-2">
            <input 
              type="email" required placeholder="E-mail"
              className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 dark:text-white"
              value={email} onChange={e => setEmail(e.target.value)}
            />
            <input 
              type="password" required placeholder="Senha"
              className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 dark:text-white"
              value={password} onChange={e => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200/20">{error}</p>}
            <Button loading={loading} className="w-full h-14 uppercase font-black tracking-widest text-sm">
              {isRegistering ? "Criar Conta" : "Acessar"}
            </Button>
          </form>
        </div>

        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-center text-xs font-black text-slate-400 hover:text-orange-500 transition-all mt-8 uppercase tracking-widest"
        >
          {isRegistering ? "Já tem conta? Entrar" : "Nova conta? Registe-se"}
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

  // Efeito para alternar classes do tema
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
       if (err.code === 'permission-denied') setError("Verifique as regras do Firestore.");
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
    if (!window.confirm("Deseja excluir este item?")) return;
    if (!user) return; 
    await deleteDoc(doc(db, 'pizzarias', appId, 'users', user.uid, col, id));
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-orange-600 mb-4" size={40} />
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Sincronizando Dados...</p>
    </div>
  );

  if (!user) return <LoginScreen onLogged={() => setLoading(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar - Altura Total e Fixa em Desktop */}
      <nav className="w-full md:w-72 bg-white dark:bg-slate-900 border-b md:border-r border-slate-200 dark:border-slate-800 p-6 shrink-0 shadow-sm z-20 flex flex-col md:h-screen md:sticky md:top-0">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white shadow-lg"><Pizza size={26} /></div>
            <h1 className="font-black text-xl tracking-tighter text-slate-800 dark:text-white uppercase leading-none">Didoka</h1>
          </div>
          {/* Botão de Tema */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-orange-500 transition-all shadow-inner"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="space-y-2 flex-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
          <NavItem active={activeTab === 'insumos'} onClick={() => setActiveTab('insumos')} icon={Package} label="Insumos" />
          <NavItem active={activeTab === 'sabores'} onClick={() => setActiveTab('sabores')} icon={ClipboardList} label="Fichas Técnicas" />
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-10">
           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pizzaria Logada</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
           </div>
           <button 
             onClick={() => signOut(auth)}
             className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all uppercase tracking-widest"
           >
             <LogOut size={18} /> Sair do Sistema
           </button>
        </div>
      </nav>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 p-4 md:p-12 overflow-x-hidden">
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
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${active ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
      <Icon size={22} /> {label}
    </button>
  );
}

function Dashboard({ insumos, sabores }: { insumos: Insumo[], sabores: Sabor[] }) {
  const stats = useMemo(() => {
    let totalPizzas = 0;
    let custoTotalAcumulado = 0;
    sabores.forEach((s) => {
      Object.keys(s.tamanhos_config || {}).forEach(t => {
        totalPizzas++;
        custoTotalAcumulado += s.tamanhos_config[t].custo_total || 0;
      });
    });
    return {
      insumos: insumos.length,
      sabores: sabores.length,
      totalPizzas,
      custoMedio: totalPizzas > 0 ? custoTotalAcumulado / totalPizzas : 0
    };
  }, [insumos, sabores]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Painel Executivo</h2>
        <p className="text-slate-500 font-medium text-lg mt-1">Visão clara dos custos de produção.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} label="Insumos" value={stats.insumos} color="text-blue-600" />
        <StatCard icon={Pizza} label="Receitas" value={stats.sabores} color="text-orange-600" />
        <StatCard icon={Calculator} label="Fichas" value={stats.totalPizzas} color="text-purple-600" />
        <StatCard icon={DollarSign} label="Custo Médio" value={formatCurrency(stats.custoMedio)} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-10">
          <h3 className="font-black text-xl mb-8 flex items-center gap-3 text-orange-600 uppercase tracking-widest border-b dark:border-slate-800 pb-4"><TrendingUp size={24}/> Sugestão de Venda (G)</h3>
          <div className="space-y-4">
            {sabores.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between items-center p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 transition-all hover:border-orange-500/40">
                <span className="font-black text-slate-800 dark:text-slate-200 uppercase text-xs tracking-tight">{s.nome}</span>
                <span className="text-orange-600 font-black text-lg">{formatCurrency(s.tamanhos_config?.G?.preco_sugerido || 0)}</span>
              </div>
            ))}
            {sabores.length === 0 && <p className="text-center text-slate-400 py-10 italic">Aguardando receitas...</p>}
          </div>
        </Card>
        <Card className="p-10 flex flex-col items-center justify-center text-center bg-orange-600 text-white border-none shadow-2xl shadow-orange-600/30 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform"><Calculator size={200} /></div>
          <div className="bg-white/20 p-6 rounded-full mb-6 shadow-inner relative z-10"><Pizza size={56} /></div>
          <h3 className="font-black text-2xl uppercase mb-3 relative z-10 tracking-tight">Didoka Inteligente</h3>
          <p className="text-orange-50 font-medium max-w-xs leading-relaxed relative z-10 text-lg">Seus custos são recalculados automaticamente ao mudar o preço de compra.</p>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="p-8 flex flex-col gap-3 transition-all hover:scale-[1.03] hover:shadow-xl group border-none bg-white dark:bg-slate-900 shadow-md">
      <div className={`bg-slate-50 dark:bg-slate-800 p-3.5 w-fit rounded-2xl ${color} shadow-sm group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors`}><Icon size={24} /></div>
      <div className="text-[11px] text-slate-400 font-black uppercase tracking-[0.25em] mt-3 leading-none">{label}</div>
      <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">{value}</div>
    </Card>
  );
}

function InsumosList({ insumos, onAdd, onEdit, onDelete }: any) {
  const [search, setSearch] = useState("");
  const filtered = insumos.filter((i: any) => i.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Estoque de Insumos</h2>
        <Button onClick={onAdd} icon={Plus} className="w-full sm:w-auto h-14 px-10 uppercase font-black tracking-widest text-sm">Novo Insumo</Button>
      </div>

      <Card className="p-5 border-none shadow-md">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-950/50 pl-14 pr-6 py-5 rounded-2xl text-base border-none focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 dark:text-white shadow-inner transition-all" 
            placeholder="Pesquisar por ingrediente (ex: Farinha, Queijo...)" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      {insumos.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 animate-in zoom-in-95">
          <div className="bg-slate-50 dark:bg-slate-800 p-10 rounded-full mb-8 text-slate-200 dark:text-slate-700 shadow-inner">
            <Package size={80} />
          </div>
          <h3 className="text-slate-700 dark:text-slate-300 font-black text-2xl uppercase tracking-widest">Sem Stock</h3>
          <p className="text-slate-400 text-lg mb-10 max-w-sm leading-relaxed font-medium">Cadastre os seus ingredientes para que a Didoka possa calcular as suas fichas.</p>
          <Button onClick={onAdd} icon={Plus} className="px-12 h-16 uppercase font-black tracking-widest shadow-2xl">Começar Agora</Button>
        </div>
      ) : (
        <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900 rounded-[32px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 font-black text-slate-400 uppercase text-[10px] tracking-[0.3em]">
                <tr>
                  <th className="px-10 py-6">Ingrediente</th>
                  <th className="px-10 py-6 text-center">Compra</th>
                  <th className="px-10 py-6 text-center">Unitário Base</th>
                  <th className="px-10 py-6 text-right">Gerir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((i: any) => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-10 py-7 font-black text-slate-800 dark:text-slate-200 uppercase text-xs tracking-tight">{i.nome}</td>
                    <td className="px-10 py-7 text-center text-slate-500 font-bold">{formatCurrency(i.preco_compra)} <span className="text-[10px] opacity-40 ml-1">({i.quantidade_compra}{i.unidade_compra})</span></td>
                    <td className="px-10 py-7 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-orange-600 font-black text-lg tracking-tighter">{formatCurrency(i.preco_por_unidade_base)}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">p/ {i.unidade_compra === 'un' ? 'un' : (i.unidade_compra === 'kg' ? 'grama' : 'ml')}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                        <button onClick={() => onEdit(i)} className="p-3 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-2xl transition-all shadow-sm"><Edit3 size={20}/></button>
                        <button onClick={() => onDelete(i.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-all shadow-sm"><Trash2 size={20}/></button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border-none overflow-hidden rounded-[40px]">
        <div className="p-8 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
          <h3 className="font-black uppercase tracking-[0.2em] text-xs text-slate-500">Cadastro de Insumo</h3>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all"><X size={24}/></button>
        </div>
        <div className="p-10 space-y-8">
          <div className="space-y-2 text-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nome do Ingrediente</label>
            <input className="w-full bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 shadow-inner border-none font-bold text-center text-lg" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 text-center">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Preço Pago</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 shadow-inner border-none font-black text-center text-lg text-orange-600" value={form.preco_compra} onChange={e => setForm({...form, preco_compra: e.target.value})} />
            </div>
            <div className="space-y-2 text-center">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Qtd Pack</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 shadow-inner border-none font-bold text-center text-lg" value={form.quantidade_compra} onChange={e => setForm({...form, quantidade_compra: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Unidade</label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 shadow-inner border-none font-black appearance-none text-center text-lg" value={form.unidade_compra} onChange={e => setForm({...form, unidade_compra: e.target.value})}>
              {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4 rounded-b-xl border-t dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} className="px-8 font-black uppercase text-xs tracking-widest">Cancelar</Button>
          <Button onClick={() => onSave(form)} icon={Save} className="px-12 h-16 uppercase font-black tracking-widest text-base shadow-xl">Guardar Insumo</Button>
        </div>
      </Card>
    </div>
  );
}

function SaboresList({ sabores, insumos, onAdd, onEdit, onDelete }: any) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => sabores.filter((s: any) => s.nome.toLowerCase().includes(search.toLowerCase())), [sabores, search]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Fichas Técnicas</h2>
        <Button onClick={onAdd} icon={Plus} className="w-full sm:w-auto h-14 px-10 uppercase font-black tracking-widest text-sm">Nova Pizza</Button>
      </div>

      <Card className="p-5 border-none shadow-md">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-950/50 pl-14 pr-6 py-5 rounded-2xl text-base border-none focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 dark:text-white shadow-inner transition-all" 
            placeholder="Pesquisar por sabor (ex: Margherita, Portuguesa...)" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filtered.map((s: any) => (
          <Card key={s.id} className="p-10 hover:shadow-2xl transition-all group relative overflow-hidden border-slate-200 bg-white dark:bg-slate-900 rounded-[32px]">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex flex-col gap-4">
                <h3 className="text-3xl font-black text-orange-600 uppercase tracking-tighter leading-none">{s.nome}</h3>
                <div className="flex flex-wrap gap-2.5 mt-2">
                   {TAMANHOS.map(t => (
                     s.tamanhos_config?.[t] && 
                     <div key={t} className="flex flex-col bg-slate-50 dark:bg-slate-800/80 border dark:border-slate-700 px-5 py-3 rounded-2xl min-w-[80px] text-center shadow-sm">
                       <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{t}</span>
                       <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(s.tamanhos_config[t].preco_sugerido)}</span>
                     </div>
                   ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" onClick={() => onEdit(s)} className="p-3.5 h-12 w-12 hover:bg-orange-50"><Edit3 size={24}/></Button>
                <Button variant="danger" onClick={() => onDelete(s.id)} className="p-3.5 h-12 w-12"><Trash2 size={24}/></Button>
              </div>
            </div>
            <div className="pt-8 border-t dark:border-slate-800 flex justify-between items-center text-[11px] uppercase font-black tracking-[0.25em] text-slate-400">
              <span>Lucro: <span className="text-emerald-500">{s.margem_lucro}%</span></span>
              <span>Fixo Estrutura: <span className="text-blue-500">{formatCurrency(s.custo_operacional)}</span></span>
            </div>
          </Card>
        ))}
        {sabores.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 min-h-[400px]">
            <Pizza size={90} className="text-slate-100 dark:text-slate-800 mb-8" />
            <h3 className="text-slate-700 dark:text-slate-300 font-black text-2xl uppercase tracking-widest">Sem Receitas</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-sm font-medium">Monte as suas fichas técnicas para controlar o CMV por pizza.</p>
            <Button onClick={onAdd} icon={Plus} className="px-12 h-16 uppercase font-black tracking-widest shadow-2xl">Criar Minha Primeira Pizza</Button>
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
    if (!window.confirm(`Deseja copiar a configuração do tamanho ${sourceSize} para este tamanho?`)) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-none rounded-[48px]">
        <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="text-2xl font-black uppercase text-orange-600 tracking-tighter leading-none">Ficha Técnica</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2">Personalização de Sabores</p>
          </div>
          <button onClick={onClose} className="p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all shadow-sm"><X size={26}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-14 space-y-12">
          {/* Header Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50 dark:bg-slate-800/30 p-10 rounded-[40px] border dark:border-slate-800 shadow-inner">
            <div className="space-y-3 text-center md:text-left">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sabor da Pizza</label>
              <input className="w-full bg-white dark:bg-slate-950 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm border-none font-black text-center text-xl tracking-tight" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Margherita" />
            </div>
            <div className="space-y-3 text-center md:text-left">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Estrutura Fixa (R$)</label>
              <input type="number" className="w-full bg-white dark:bg-slate-950 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm border-none font-black text-center text-xl text-blue-600" value={custoOperacional} onChange={e => setCustoOperacional(Number(e.target.value))} />
            </div>
            <div className="space-y-3 text-center md:text-left">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Margem Alvo (%)</label>
              <input type="number" className="w-full bg-white dark:bg-slate-950 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm border-none font-black text-center text-xl text-emerald-600" value={margemLucro} onChange={e => setMargemLucro(Number(e.target.value))} />
            </div>
          </div>

          {/* Tamanhos - Corrigido para ser apenas "F" e centralizado */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex gap-2 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-3xl w-full md:w-fit overflow-x-auto shadow-inner border dark:border-slate-700/50">
              {TAMANHOS.map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveSize(t)} 
                  className={`flex-1 md:flex-none px-12 py-4 rounded-[20px] font-black text-sm transition-all ${activeSize === t ? "bg-white dark:bg-slate-700 shadow-xl text-orange-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-6">
                <h4 className="font-black uppercase tracking-[0.3em] text-[11px] text-slate-500">Montagem Tamanho {activeSize}</h4>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex gap-2">
                    <span className="text-[10px] font-black text-slate-400 self-center uppercase mr-2 opacity-60 tracking-widest">Copiar de:</span>
                    <div className="flex gap-1.5">
                      {TAMANHOS.filter(t => t !== activeSize).map(t => (
                        <button key={t} onClick={() => copyFromSize(t)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl text-[11px] font-black hover:bg-orange-50 transition-all shadow-sm text-slate-600 hover:border-orange-500/50">{t}</button>
                      ))}
                    </div>
                  </div>
                  <Button variant="secondary" onClick={addIngrediente} icon={Plus} className="text-[11px] h-10 px-6 font-black uppercase tracking-widest">Add Item</Button>
                </div>
              </div>

              <div className="space-y-4">
                {currentConfig.ingredientes.map((ing: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center p-5 bg-white dark:bg-slate-900 rounded-[24px] border dark:border-slate-800 shadow-sm hover:border-orange-500 transition-all group relative">
                    <select className="flex-1 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl outline-none font-bold text-base transition-all focus:ring-1 focus:ring-orange-500 appearance-none text-slate-700 dark:text-white" value={ing.insumoId} onChange={e => updateIngrediente(idx, 'insumoId', e.target.value)}>
                      <option value="">Escolha um ingrediente...</option>
                      {insumos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                    <div className="flex gap-2 w-56 shrink-0">
                      <input type="number" className="w-full bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-800 dark:text-white font-black text-center text-lg" value={ing.quantidade} onChange={e => updateIngrediente(idx, 'quantidade', Number(e.target.value))} />
                      <select className="w-24 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl text-[11px] font-black uppercase outline-none text-center border-none shadow-inner" value={ing.unidade} onChange={e => updateIngrediente(idx, 'unidade', e.target.value)}>
                        {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.id.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeIngrediente(idx)} className="p-3 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
                  </div>
                ))}
                {currentConfig.ingredientes.length === 0 && <p className="text-center py-20 text-slate-400 italic text-base border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px]">Clique no botão acima para começar a montar esta pizza.</p>}
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/30 rounded-[32px] border dark:border-slate-800 flex justify-between items-center shadow-inner mt-10">
                <div className="flex flex-col">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] leading-none">Custo da Caixa</label>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-2">Tamanho {activeSize}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">R$</span>
                  <input type="number" className="pl-12 pr-6 py-4 w-48 bg-white dark:bg-slate-950 border-none rounded-2xl text-lg font-black outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all text-center" value={currentConfig.embalagem} onChange={e => updateSizeField('embalagem', Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Sumário Lateral */}
            <Card className="p-10 bg-slate-900 text-white border-none shadow-2xl h-fit flex flex-col gap-8 rounded-[40px] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><Calculator size={100}/></div>
              <h4 className="font-black text-center border-b border-slate-800 pb-6 uppercase text-[11px] tracking-[0.5em] text-orange-500 relative z-10">Total de Custos {activeSize}</h4>
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center text-sm text-slate-500 uppercase font-black tracking-widest"><span>Ingredientes</span><span className="text-slate-200">{formatCurrency(calculatedStats[activeSize].custo_insumos)}</span></div>
                <div className="flex justify-between items-center text-sm text-slate-500 uppercase font-black tracking-widest"><span>Embalagem</span><span className="text-slate-200">{formatCurrency(currentConfig.embalagem)}</span></div>
                <div className="flex justify-between items-center text-sm text-slate-500 uppercase font-black tracking-widest"><span>Estrutura</span><span className="text-blue-400">{formatCurrency(Number(custoOperacional))}</span></div>
                <div className="pt-8 border-t border-slate-800 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Custo Real de Produção</span>
                  <span className="text-5xl font-black text-orange-500 tracking-tighter">{formatCurrency(calculatedStats[activeSize].custo_total)}</span>
                </div>
                <div className="pt-12 border-t border-dashed border-slate-700 text-center flex flex-col gap-3">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Preço de Venda Sugerido</div>
                  <div className="text-7xl font-black text-emerald-400 tracking-tighter drop-shadow-2xl">{formatCurrency(calculatedStats[activeSize].preco_sugerido)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-10 md:p-14 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col lg:flex-row justify-between items-center gap-10 shrink-0 shadow-2xl relative z-20">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide max-w-full">
            {TAMANHOS.map(t => (
              <div key={t} className={`flex flex-col px-8 border-r border-slate-100 dark:border-slate-800 last:border-0 transition-all ${activeSize === t ? 'opacity-100 scale-110 origin-left border-orange-500' : 'opacity-20'}`}>
                <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">{t}</div>
                <div className={`text-xl font-black whitespace-nowrap tracking-tighter ${activeSize === t ? 'text-orange-600' : 'text-slate-700'}`}>{formatCurrency(calculatedStats[t].preco_sugerido)}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 w-full lg:w-auto">
            <Button variant="ghost" className="font-black h-16 px-10 text-xs" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleFinalSave} icon={Save} className="px-16 h-16 font-black uppercase tracking-widest shadow-2xl flex-1 lg:flex-none text-lg">Guardar Receita</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
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
  Loader2
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE DIRETA ---
// Kaio, certifique-se de preencher as chaves abaixo para que a persistência funcione!
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
  <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, icon: Icon, loading = false }: any) => {
  const variants: any = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-600/20",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400",
    ghost: "bg-transparent hover:bg-slate-50 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800",
    outline: "bg-transparent border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
  };

  return (
    <button 
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 active:scale-95 ${variants[variant]} ${className}`}
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
      setError(err.message.includes("auth/invalid-credential") ? "E-mail ou senha incorretos." : "Ocorreu um erro na autenticação.");
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
      console.error(err);
      setError("Não foi possível entrar com o Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border-none">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-600 p-4 rounded-2xl text-white mb-4 shadow-lg shadow-orange-600/20">
            <Pizza size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter text-center">Didoka Pizza</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Gestão de CMV e Ficha Técnica</p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleGoogleLogin} 
            loading={googleLoading}
            variant="outline" 
            className="w-full h-12 font-bold flex gap-3 border-slate-200 dark:border-slate-800"
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
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest absolute">ou e-mail</span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" required
                  className="w-full bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 dark:text-white"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" required
                  className="w-full bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 dark:text-white"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-900/10 py-2 rounded-lg">{error}</p>}

            <Button loading={loading} className="w-full h-12 uppercase font-black tracking-widest">
              {isRegistering ? "Criar Minha Conta" : "Entrar com E-mail"}
            </Button>
          </form>
        </div>

        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-center text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors mt-8 uppercase tracking-widest"
        >
          {isRegistering ? "Já tem uma conta? Entrar" : "Ainda não tem conta? Registe-se"}
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

  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [showSaborModal, setShowSaborModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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
       if (err.code === 'permission-denied') setError("Sem permissão. Verifique as regras de segurança no console do Firebase.");
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
    if (!window.confirm("Deseja excluir este item permanentemente?")) return;
    if (!user) return; 
    await deleteDoc(doc(db, 'pizzarias', appId, 'users', user.uid, col, id));
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      <p className="text-slate-400 text-sm font-black uppercase tracking-widest animate-pulse">Sincronizando Didoka Pizza...</p>
    </div>
  );

  if (!user) return <LoginScreen onLogged={() => setLoading(false)} />;

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Erro de Acesso</h2>
      <p className="text-slate-500 max-w-md mb-6">{error}</p>
      <Button onClick={() => signOut(auth)}>Tentar Novamente</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      <nav className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 shadow-sm z-10 flex flex-col h-full">
        <div className="flex items-center gap-3 py-4 mb-8">
          <div className="bg-orange-600 p-2.5 rounded-xl text-white shadow-lg"><Pizza size={24} /></div>
          <h1 className="font-black text-xl tracking-tighter text-slate-800 dark:text-white uppercase leading-none">Didoka Pizza</h1>
        </div>
        <div className="space-y-1.5 flex-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Painel Geral" />
          <NavItem active={activeTab === 'insumos'} onClick={() => setActiveTab('insumos')} icon={Package} label="Lista de Insumos" />
          <NavItem active={activeTab === 'sabores'} onClick={() => setActiveTab('sabores')} icon={ClipboardList} label="Fichas Técnicas" />
        </div>
        <div className="pt-6 border-t dark:border-slate-800 mt-10">
           <div className="px-4 mb-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Utilizador</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{user.email}</p>
           </div>
           <button 
             onClick={() => signOut(auth)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all uppercase tracking-widest"
           >
             <LogOut size={16} /> Sair do Sistema
           </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-10">
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
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <header>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Resumo de Negócio</h2>
        <p className="text-slate-500 font-medium">Controle total sobre o seu custo de produção.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} label="Insumos" value={stats.insumos} color="text-blue-600" />
        <StatCard icon={Pizza} label="Receitas" value={stats.sabores} color="text-orange-600" />
        <StatCard icon={Calculator} label="Fichas" value={stats.totalPizzas} color="text-purple-600" />
        <StatCard icon={DollarSign} label="Custo Médio" value={formatCurrency(stats.custoMedio)} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-orange-600 uppercase tracking-widest"><TrendingUp size={20}/> Sugestão de Venda (G)</h3>
          <div className="space-y-4">
            {sabores.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:border-orange-500/30">
                <span className="font-black text-slate-700 dark:text-slate-200 uppercase text-xs">{s.nome}</span>
                <span className="text-orange-600 font-black">{formatCurrency(s.tamanhos_config?.G?.preco_sugerido || 0)}</span>
              </div>
            ))}
            {sabores.length === 0 && <p className="text-center text-slate-400 text-sm py-10 italic">Aguardando as suas receitas...</p>}
          </div>
        </Card>
        <Card className="p-8 flex flex-col items-center justify-center text-center bg-orange-600 text-white border-none shadow-xl">
          <div className="bg-white/20 p-5 rounded-full mb-4 shadow-inner"><Calculator size={48} /></div>
          <h3 className="font-black text-xl uppercase mb-2 tracking-tighter">Didoka Inteligente</h3>
          <p className="text-orange-50 font-medium max-w-xs leading-relaxed">O preço sugerido garante que a margem de lucro seja respeitada em todos os tamanhos.</p>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="p-6 flex flex-col gap-2 transition-all hover:scale-[1.03] hover:shadow-md">
      <div className={`bg-slate-50 dark:bg-slate-800 p-2.5 w-fit rounded-xl ${color}`}><Icon size={22} /></div>
      <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{label}</div>
      <div className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{value}</div>
    </Card>
  );
}

function InsumosList({ insumos, onAdd, onEdit, onDelete }: any) {
  const [search, setSearch] = useState("");
  const filtered = insumos.filter((i: any) => i.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Stock de Insumos</h2>
        <Button onClick={onAdd} icon={Plus} className="w-full sm:w-auto h-12 px-8 uppercase font-black">Adicionar Novo</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-800 pl-12 pr-4 py-3 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-700 dark:text-white" 
            placeholder="Pesquisar por ingrediente..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      {insumos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 min-h-[400px] animate-in zoom-in-95">
          <Package size={80} className="text-slate-100 dark:text-slate-800 mb-6" />
          <h3 className="text-slate-700 dark:text-slate-300 font-black text-xl uppercase tracking-widest">Ainda sem Stock</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed font-medium">Para calcular o CMV das pizzas, comece a cadastrar os seus ingredientes básicos.</p>
          <Button onClick={onAdd} icon={Plus} className="px-10 h-14 uppercase font-black tracking-widest">Começar Agora</Button>
        </div>
      ) : (
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-5">Ingrediente</th>
                  <th className="px-6 py-5 text-center">Compra</th>
                  <th className="px-6 py-5 text-center">Unitário Base</th>
                  <th className="px-6 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((i: any) => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-5 font-black text-slate-800 dark:text-slate-200 uppercase text-xs tracking-tight">{i.nome}</td>
                    <td className="px-6 py-5 text-center text-slate-500 font-bold">{formatCurrency(i.preco_compra)} <span className="text-[10px] opacity-60">({i.quantidade_compra}{i.unidade_compra})</span></td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-orange-600 font-black text-base tracking-tighter">{formatCurrency(i.preco_por_unidade_base)}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">p/ {i.unidade_compra === 'un' ? 'un' : (i.unidade_compra === 'kg' ? 'grama' : 'ml')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right flex justify-end gap-1 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(i)} className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all"><Edit3 size={18}/></button>
                      <button onClick={() => onDelete(i.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={18}/></button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-none overflow-hidden">
        <div className="p-6 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
          <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">Dados do Insumo</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-1.5 text-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Ingrediente</label>
            <input className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm border-none font-bold text-center" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Pago (R$)</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm border-none font-bold text-center" value={form.preco_compra} onChange={e => setForm({...form, preco_compra: e.target.value})} />
            </div>
            <div className="space-y-1.5 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd Pack</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm border-none font-bold text-center" value={form.quantidade_compra} onChange={e => setForm({...form, quantidade_compra: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1.5 text-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade</label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm border-none font-bold appearance-none text-center" value={form.unidade_compra} onChange={e => setForm({...form, unidade_compra: e.target.value})}>
              {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-xl border-t dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} className="px-6 font-bold">Cancelar</Button>
          <Button onClick={() => onSave(form)} icon={Save} className="px-10 h-14 uppercase font-black">Salvar Insumo</Button>
        </div>
      </Card>
    </div>
  );
}

function SaboresList({ sabores, insumos, onAdd, onEdit, onDelete }: any) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => sabores.filter((s: any) => s.nome.toLowerCase().includes(search.toLowerCase())), [sabores, search]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Sabores</h2>
        <Button onClick={onAdd} icon={Plus} className="w-full sm:w-auto h-12 px-8 uppercase font-black">Nova Pizza</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-slate-50 dark:bg-slate-800 pl-12 pr-4 py-3 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-700 dark:text-white" 
            placeholder="Pesquisar por nome do sabor..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filtered.map((s: any) => (
          <Card key={s.id} className="p-8 hover:shadow-xl transition-all group relative overflow-hidden border-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-black text-orange-600 uppercase tracking-tight leading-none">{s.nome}</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                   {TAMANHOS.map(t => (
                     s.tamanhos_config?.[t] && 
                     <div key={t} className="flex flex-col bg-slate-50 dark:bg-slate-800/80 border dark:border-slate-700 px-4 py-2 rounded-2xl min-w-[70px] text-center shadow-sm">
                       <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{t}</span>
                       <span className="text-xs font-black text-slate-700 dark:text-slate-200">{formatCurrency(s.tamanhos_config[t].preco_sugerido)}</span>
                     </div>
                   ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" onClick={() => onEdit(s)} className="p-2.5 h-11 w-11"><Edit3 size={20}/></Button>
                <Button variant="danger" onClick={() => onDelete(s.id)} className="p-2.5 h-11 w-11"><Trash2 size={20}/></Button>
              </div>
            </div>
            <div className="pt-6 border-t dark:border-slate-800 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-400">
              <span>Lucro Alvo: <span className="text-emerald-500">{s.margem_lucro}%</span></span>
              <span>Fixo Estrutura: <span className="text-blue-500">{formatCurrency(s.custo_operacional)}</span></span>
            </div>
          </Card>
        ))}
        {sabores.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 p-10 min-h-[400px] animate-in zoom-in-95">
            <Pizza size={80} className="text-slate-100 dark:text-slate-800 mb-6" />
            <h3 className="text-slate-700 font-black text-xl uppercase tracking-widest">Sem Receitas</h3>
            <Button onClick={onAdd} icon={Plus} className="px-10 h-14 uppercase font-black">Criar Primeiro Sabor</Button>
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
    if (!window.confirm(`Copiar os ingredientes do tamanho ${sourceSize} para o tamanho ${activeSize}?`)) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-none">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase text-orange-600 tracking-tighter">Ficha Técnica</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sabores & Proporções</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border dark:border-slate-800 shadow-inner">
            <div className="space-y-1.5 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Sabor</label>
              <input className="w-full bg-white dark:bg-slate-950 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm border-none font-bold text-center" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Portuguesa" />
            </div>
            <div className="space-y-1.5 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa Estrutural (R$)</label>
              <input type="number" className="w-full bg-white dark:bg-slate-950 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm border-none font-black text-center text-blue-600" value={custoOperacional} onChange={e => setCustoOperacional(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margem Alvo (%)</label>
              <input type="number" className="w-full bg-white dark:bg-slate-950 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm border-none font-black text-center text-emerald-600" value={margemLucro} onChange={e => setMargemLucro(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-fit overflow-x-auto shadow-inner">
              {TAMANHOS.map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveSize(t)} 
                  className={`flex-1 md:flex-none px-10 py-3 rounded-xl font-black text-sm transition-all ${activeSize === t ? "bg-white dark:bg-slate-700 shadow-md text-orange-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-left">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
                <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Montagem Tamanho {activeSize}</h4>
                <div className="flex gap-3 items-center">
                  <div className="hidden sm:flex gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 self-center uppercase mr-1">Copiar de:</span>
                    {TAMANHOS.filter(t => t !== activeSize).map(t => (
                      <button key={t} onClick={() => copyFromSize(t)} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg text-[10px] font-black hover:bg-orange-50 transition-all">{t}</button>
                    ))}
                  </div>
                  <Button variant="secondary" onClick={addIngrediente} icon={Plus} className="text-[10px] h-8 px-5 font-black uppercase tracking-widest">Add Item</Button>
                </div>
              </div>

              <div className="space-y-3">
                {currentConfig.ingredientes.map((ing: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm hover:border-orange-500 transition-all group">
                    <select className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm outline-none font-bold transition-all focus:ring-1 focus:ring-orange-500 appearance-none text-slate-700 dark:text-white" value={ing.insumoId} onChange={e => updateIngrediente(idx, 'insumoId', e.target.value)}>
                      <option value="">Ingrediente...</option>
                      {insumos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                    <div className="flex gap-1.5 w-48 shrink-0">
                      <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm font-black text-center outline-none focus:ring-1 focus:ring-orange-500 text-slate-800 dark:text-white" value={ing.quantidade} onChange={e => updateIngrediente(idx, 'quantidade', Number(e.target.value))} />
                      <select className="w-20 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-[10px] font-black uppercase outline-none text-center" value={ing.unidade} onChange={e => updateIngrediente(idx, 'unidade', e.target.value)}>
                        {UNIDADES.map(u => <option key={u.id} value={u.id}>{u.id.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeIngrediente(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                  </div>
                ))}
                {currentConfig.ingredientes.length === 0 && <p className="text-center py-14 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">Sem ingredientes para o tamanho {activeSize}.</p>}
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border dark:border-slate-800 flex justify-between items-center shadow-inner mt-6">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Preço da Embalagem {activeSize}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                  <input type="number" className="pl-10 pr-4 py-3 w-40 bg-white dark:bg-slate-900 border-none rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all text-center" value={currentConfig.embalagem} onChange={e => updateSizeField('embalagem', Number(e.target.value))} />
                </div>
              </div>
            </div>

            <Card className="p-8 bg-slate-900 text-white border-none shadow-2xl h-fit">
              <h4 className="font-black mb-6 text-center border-b border-slate-800 pb-4 uppercase text-[10px] tracking-[0.4em] text-orange-500">RELATÓRIO {activeSize}</h4>
              <div className="space-y-5">
                <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-black tracking-widest"><span>Stock</span><span className="text-slate-200">{formatCurrency(calculatedStats[activeSize].custo_insumos)}</span></div>
                <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-black tracking-widest"><span>Embalagem</span><span className="text-slate-200">{formatCurrency(currentConfig.embalagem)}</span></div>
                <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-black tracking-widest"><span>Fixo</span><span className="text-blue-400">{formatCurrency(Number(custoOperacional))}</span></div>
                <div className="pt-6 border-t border-slate-800 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">Custo Total (CMV)</span>
                  <span className="text-4xl font-black text-orange-500 tracking-tighter">{formatCurrency(calculatedStats[activeSize].custo_total)}</span>
                </div>
                <div className="pt-10 border-t border-dashed border-slate-700 text-center flex flex-col gap-2">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Preço de Venda</div>
                  <div className="text-6xl font-black text-emerald-400 tracking-tighter drop-shadow-md">{formatCurrency(calculatedStats[activeSize].preco_sugerido)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="p-8 md:p-10 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-8 shrink-0 shadow-2xl relative z-20">
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide max-w-full">
            {TAMANHOS.map(t => (
              <div key={t} className={`flex flex-col px-6 border-r border-slate-100 dark:border-slate-800 last:border-0 transition-all ${activeSize === t ? 'opacity-100 scale-110 origin-left border-orange-500' : 'opacity-20'}`}>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t}</div>
                <div className={`text-base font-black whitespace-nowrap tracking-tight ${activeSize === t ? 'text-orange-600' : 'text-slate-700'}`}>{formatCurrency(calculatedStats[t].preco_sugerido)}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button variant="ghost" className="font-black h-14 px-8" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleFinalSave} icon={Save} className="px-12 h-14 font-black uppercase tracking-widest shadow-xl flex-1 md:flex-none text-base">Salvar Ficha</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
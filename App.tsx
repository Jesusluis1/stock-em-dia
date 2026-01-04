
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  ChevronRight,
  Menu,
  X,
  Sparkles,
  LogOut,
  Info,
  Phone,
  Printer,
  History,
  ShoppingBag,
  Store,
  Lock,
  UserPlus,
  MessageCircle,
  Mail,
  Download,
  ClipboardList,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Product, Transaction, ItemCategory, User } from './types';
import { getStockInsights } from './services/geminiService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Revertendo para o componente Logo anterior (SVG personalizado)
const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg', className?: string, invert?: boolean }> = ({ size = 'md', className, invert }) => {
  const iconSize = size === 'sm' ? 24 : size === 'md' ? 32 : 56;
  const containerSize = size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-16 h-16' : 'w-28 h-28';
  const rounded = size === 'lg' ? 'rounded-[2rem]' : 'rounded-2xl';

  return (
    <div className={`${containerSize} relative flex items-center justify-center ${className}`}>
        <div className={`absolute inset-0 border-[3px] ${invert ? 'border-[#7DC242]' : 'border-[#7DC242]'} rounded-full border-l-transparent border-t-transparent -rotate-45`}></div>
        <div className={`absolute inset-0 border-[3px] ${invert ? 'border-white/40' : 'border-[#1B4E81] opacity-40'} rounded-full border-r-transparent border-b-transparent rotate-12`}></div>
        <div className={`${containerSize} ${invert ? 'bg-white text-[#1B4E81]' : 'bg-[#1B4E81] text-white'} ${rounded} flex items-center justify-center shadow-xl relative z-10`}>
          <ClipboardList size={iconSize * 0.7} strokeWidth={2.5} />
        </div>
    </div>
  );
};

const App: React.FC = () => {
  // State Management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'transactions' | 'about'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiInsight, setAiInsight] = useState<string>('Analisando seu negócio...');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTransaction, setModalTransaction] = useState<{show: boolean, type: 'entrada' | 'saída'}>({show: false, type: 'entrada'});
  
  // Auth Validation States
  const [authError, setAuthError] = useState<string | null>(null);

  // Constants
  const CONTACT_PHONE = "+244936878664";
  const CONTACT_EMAIL = "jesusdaconceicaoluis@gmail.com";
  const WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE.replace('+', '')}`;

  // Persistence (LocalStorage)
  useEffect(() => {
    const activeSession = localStorage.getItem('stockemdia_active_session');
    if (activeSession) {
      setCurrentUser(JSON.parse(activeSession));
    }

    const savedProducts = localStorage.getItem('stockemdia_products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));

    const savedTransactions = localStorage.getItem('stockemdia_transactions');
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  }, []);

  useEffect(() => {
    localStorage.setItem('stockemdia_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('stockemdia_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Validation Logic
  const validatePhone = (phone: string) => {
    const angolaPhoneRegex = /^9[0-9]{8}$/;
    return angolaPhoneRegex.test(phone);
  };

  // Auth Handlers
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;

    if (!validatePhone(phone)) {
      setAuthError('O número de telefone deve ser válido (9 dígitos começando com 9).');
      return;
    }

    const usersJson = localStorage.getItem('stockemdia_registered_users');
    const registeredUsers: User[] = usersJson ? JSON.parse(usersJson) : [];

    const user = registeredUsers.find(u => u.phone === phone && u.password === password);

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('stockemdia_active_session', JSON.stringify(user));
    } else {
      setAuthError('Credenciais inválidas. Verifique os dados ou crie uma conta.');
    }
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const business = formData.get('business') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;

    if (name.trim().length < 3) {
      setAuthError('O nome deve ter pelo menos 3 caracteres.');
      return;
    }
    if (business.trim().length < 2) {
      setAuthError('O nome do negócio deve ser válido.');
      return;
    }
    if (!validatePhone(phone)) {
      setAuthError('O número de telefone deve ter 9 dígitos e começar com 9.');
      return;
    }
    if (password.length < 6) {
      setAuthError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    const usersJson = localStorage.getItem('stockemdia_registered_users');
    const registeredUsers: User[] = usersJson ? JSON.parse(usersJson) : [];

    if (registeredUsers.some(u => u.phone === phone)) {
      setAuthError('Já existe uma conta registada com este número de telefone.');
      return;
    }

    const newUser: User = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: name.trim(), 
      phone: phone,
      password: password,
      businessName: business.trim()
    };

    const updatedUsers = [...registeredUsers, newUser];
    localStorage.setItem('stockemdia_registered_users', JSON.stringify(updatedUsers));

    setCurrentUser(newUser);
    localStorage.setItem('stockemdia_active_session', JSON.stringify(newUser));
    setIsRegistering(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('stockemdia_active_session');
  };

  // Business Logic
  const stats = useMemo(() => {
    const userProducts = products.filter(p => p.userId === currentUser?.id);
    const userTransactions = transactions.filter(t => t.userId === currentUser?.id);
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalValue: userProducts.reduce((acc, p) => acc + (p.price * p.stock), 0),
      lowStock: userProducts.filter(p => p.stock <= p.minStock).length,
      todaySales: userTransactions
        .filter(t => t.type === 'saída' && t.date.startsWith(today))
        .reduce((acc, t) => acc + t.totalValue, 0)
    };
  }, [products, transactions, currentUser]);

  const fetchAiInsights = useCallback(async () => {
    if (!currentUser || products.length === 0) return;
    const userSpecificProducts = products.filter(p => p.userId === currentUser.id);
    if (userSpecificProducts.length === 0) {
      setAiInsight("Adicione o seu primeiro produto para receber conselhos estratégicos.");
      return;
    }
    const insight = await getStockInsights(userSpecificProducts);
    setAiInsight(insight);
  }, [products, currentUser]);

  useEffect(() => {
    if (currentUser) fetchAiInsights();
  }, [fetchAiInsights, currentUser]);

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser!.id,
      name: formData.get('name') as string,
      category: formData.get('category') as ItemCategory,
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      lastUpdated: new Date().toISOString(),
    };
    setProducts([...products, newProduct]);
    setShowAddModal(false);
  };

  const processTransaction = (productId: string, quantity: number, type: 'entrada' | 'saída') => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (type === 'saída' && product.stock < quantity) {
      alert('Stock insuficiente!');
      return;
    }

    const newProducts = products.map(p => 
      p.id === productId ? { 
        ...p, 
        stock: type === 'entrada' ? p.stock + quantity : p.stock - quantity, 
        lastUpdated: new Date().toISOString() 
      } : p
    );
    
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser!.id,
      productId: product.id,
      productName: product.name,
      quantity,
      type,
      date: new Date().toISOString(),
      totalValue: product.price * quantity
    };

    setProducts(newProducts);
    setTransactions([newTransaction, ...transactions]);
    setModalTransaction({show: false, type: 'entrada'});
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);
  };

  // Exportação PDF Completa com Logo e Movimentações (Mantida)
  const handleExportPDF = () => {
    const userProducts = products.filter(p => p.userId === currentUser?.id);
    const userTransactions = transactions.filter(t => t.userId === currentUser?.id);
    
    if (userProducts.length === 0 && userTransactions.length === 0) {
      return alert('Não há dados para exportar.');
    }
    
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(22);
    doc.setTextColor(27, 78, 129);
    doc.text("RELATÓRIO GERAL DE ATIVIDADE", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Negócio: ${currentUser?.businessName}`, 14, 35);
    doc.text(`Emissão: ${new Date().toLocaleString('pt-AO')}`, 14, 40);

    // INVENTÁRIO ATUAL
    doc.setFontSize(14);
    doc.setTextColor(27, 78, 129);
    doc.text("1. Resumo do Armazém", 14, 55);

    const productRows = userProducts.map(p => [
      p.name,
      p.category,
      formatCurrency(p.price),
      p.stock.toString(),
      p.stock <= p.minStock ? "REPOR" : "OK"
    ]);

    (doc as any).autoTable({
      head: [['Artigo', 'Família', 'Preço Unit.', 'Stock', 'Estado']],
      body: productRows,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [27, 78, 129] },
      styles: { fontSize: 8 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // HISTÓRICO DE MOVIMENTAÇÕES
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.setFontSize(14);
    doc.text("2. Todas as Movimentações Registadas", 14, currentY);

    const transactionRows = userTransactions.map(t => [
      new Date(t.date).toLocaleString('pt-AO'),
      t.productName,
      t.type === 'entrada' ? 'ENTRADA' : 'SAÍDA',
      t.quantity.toString(),
      formatCurrency(t.totalValue)
    ]);

    (doc as any).autoTable({
      head: [['Data/Hora', 'Artigo', 'Tipo', 'Qtd', 'Valor']],
      body: transactionRows,
      startY: currentY + 5,
      theme: 'striped',
      headStyles: { fillColor: [125, 194, 66] },
      styles: { fontSize: 8 }
    });

    doc.save(`relatorio_completo_${currentUser?.businessName}.pdf`);
  };

  const handlePrint = () => { window.print(); };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#1B4E81] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#7DC242] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]"></div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md relative z-10 border border-slate-100">
          <div className="text-center mb-8">
            <Logo size="lg" className="mx-auto mb-4" />
            <h1 className="text-3xl font-black text-[#1B4E81] tracking-tight">Stock em Dia</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">"Mantenha o seu negócio sempre em dia"</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-bold text-rose-700 leading-tight">{authError}</p>
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input label="Nome Completo" name="name" placeholder="Ex: José da Silva" icon={<UserPlus size={18}/>} required />
              <Input label="Nome do Negócio" name="business" placeholder="Ex: Cantina Central" icon={<Store size={18}/>} required />
              <Input label="Telefone (9 dígitos)" name="phone" type="tel" placeholder="9xxxxxxxx" icon={<Phone size={18}/>} required />
              <Input label="Palavra-passe (min. 6)" name="password" type="password" placeholder="••••••" icon={<Lock size={18}/>} required />
              <button className="w-full py-4 bg-[#7DC242] hover:bg-[#6ba336] text-white rounded-2xl font-black transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs">
                Abrir Minha Conta
              </button>
              <button type="button" onClick={() => { setIsRegistering(false); setAuthError(null); }} className="w-full text-sm text-[#1B4E81] font-bold text-center py-2">
                Já sou cadastrado? Faça Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input label="Telefone" name="phone" type="tel" placeholder="9xxxxxxxx" icon={<Phone size={18}/>} required />
              <Input label="Palavra-passe" name="password" type="password" placeholder="••••••" icon={<Lock size={18}/>} required />
              <button className="w-full py-4 bg-[#1B4E81] hover:bg-[#143a61] text-white rounded-2xl font-black transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs">
                Aceder ao Painel
              </button>
              <button type="button" onClick={() => { setIsRegistering(true); setAuthError(null); }} className="w-full text-sm text-[#7DC242] font-bold text-center py-2">
                Novo Usuário? Crie uma Conta Grátis
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Suporte Técnico</p>
            <div className="flex gap-4">
              <a href={`tel:${CONTACT_PHONE}`} className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:text-[#1B4E81] transition-colors shadow-sm">
                <Phone size={18}/>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:text-[#7DC242] transition-colors shadow-sm">
                <MessageCircle size={18}/>
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:text-rose-600 transition-colors shadow-sm">
                <Mail size={18}/>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body, html { height: auto !important; overflow: visible !important; background: white !important; }
          #root { height: auto !important; }
          main { display: block !important; position: static !important; width: 100% !important; height: auto !important; overflow: visible !important; margin: 0 !important; padding: 15mm !important; }
          .scrollable-body { overflow: visible !important; height: auto !important; display: block !important; }
          table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 20px !important; }
          th, td { border: 1px solid #333 !important; padding: 8px !important; font-size: 10pt !important; }
          header, aside { display: none !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 w-72 h-full bg-[#1B4E81] text-white transition-transform duration-300 border-r border-slate-800 no-print
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <Logo size="sm" invert />
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none text-white">Stock em Dia</h1>
              <span className="text-[9px] text-[#7DC242] font-black uppercase tracking-[0.2em]">{currentUser.businessName}</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18}/>} label="Dashboard" onClick={() => {setActiveTab('dashboard'); setIsSidebarOpen(false)}} />
            <NavItem active={activeTab === 'inventory'} icon={<Package size={18}/>} label="Meu Armazém" onClick={() => {setActiveTab('inventory'); setIsSidebarOpen(false)}} />
            <NavItem active={activeTab === 'transactions'} icon={<History size={18}/>} label="Movimentações" onClick={() => {setActiveTab('transactions'); setIsSidebarOpen(false)}} />
            <NavItem active={activeTab === 'about'} icon={<Info size={18}/>} label="Sobre o App" onClick={() => {setActiveTab('about'); setIsSidebarOpen(false)}} />
          </nav>

          <div className="mt-auto pt-6 space-y-4">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                <Sparkles size={40} className="text-[#7DC242]"/>
              </div>
              <div className="flex items-center gap-2 mb-2 text-[#7DC242]">
                <Sparkles size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Stock em Dia IA</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">"{aiInsight}"</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-rose-400 hover:bg-rose-400/10 transition-colors">
              <LogOut size={16} /> Encerrar Sessão
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden main-content">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 no-print">
          <div className="flex items-center gap-4">
            <button className="p-2 -ml-2 text-slate-500 md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
               <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestor de Stock</h2>
               <p className="text-lg font-black text-[#1B4E81]">Bem-vindo, {currentUser.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Procurar no inventário..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#1B4E81] transition-all text-xs font-bold outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#7DC242] hover:bg-[#6ba336] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              <Plus size={16} />
              <span>Adicionar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scrollable-body">
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard label="Valor Total" value={formatCurrency(stats.totalValue)} sub="Inventário avaliado" icon={<Package className="text-[#1B4E81]" />} color="blue" />
                <StatCard label="Saídas Hoje" value={formatCurrency(stats.todaySales)} sub="Faturação do dia" icon={<TrendingUp className="text-[#7DC242]" />} color="emerald" />
                <StatCard label="Ruptura de Stock" value={stats.lowStock.toString()} sub="Itens abaixo do mínimo" icon={<AlertTriangle className="text-amber-600" />} color="amber" alert={stats.lowStock > 0} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-6">
                  <div className="flex items-center justify-between no-print">
                    <h3 className="text-xl font-black text-[#1B4E81] tracking-tight">Produtos Críticos</h3>
                    <button onClick={() => setActiveTab('inventory')} className="text-xs font-black text-[#7DC242] uppercase tracking-widest hover:underline">Ver completo</button>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    {products.filter(p => p.userId === currentUser.id && p.stock <= p.minStock).length === 0 ? (
                      <div className="p-16 text-center text-slate-400">
                        <ShoppingBag size={48} className="mx-auto mb-3 opacity-20"/>
                        <p className="font-bold text-sm italic">O seu stock está em dia!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {products.filter(p => p.userId === currentUser.id && p.stock <= p.minStock).map(p => (
                          <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                                <AlertTriangle size={24} />
                              </div>
                              <div>
                                <p className="font-black text-slate-800">{p.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.category} • Restam {p.stock} un</p>
                              </div>
                            </div>
                            <button onClick={() => setModalTransaction({show: true, type: 'entrada'})} className="px-5 py-2.5 rounded-xl bg-[#1B4E81] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#143a61] transition-all shadow-sm">Repor</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 no-print">
                  <h3 className="text-xl font-black text-[#1B4E81] tracking-tight">Movimentos</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <ActionButton onClick={() => setModalTransaction({show: true, type: 'saída'})} icon={<ArrowUpRight size={24}/>} label="Vender Artigo" sub="Registar nova saída" color="rose" />
                    <ActionButton onClick={() => setModalTransaction({show: true, type: 'entrada'})} icon={<ArrowDownLeft size={24}/>} label="Entrada de Stock" sub="Registar nova compra" color="emerald" />
                    <button onClick={handlePrint} className="w-full p-6 flex items-center gap-4 bg-[#1B4E81] rounded-[1.8rem] text-white hover:bg-[#143a61] transition-all shadow-lg">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"> <Printer size={20} /> </div>
                      <div className="text-left">
                        <p className="font-black text-sm uppercase tracking-widest">Imprimir Relatório</p>
                        <p className="text-[10px] text-slate-400 font-bold">Relatório impresso completo</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-[#1B4E81] tracking-tight">Controlo de Inventário</h3>
                    <p className="text-sm font-medium text-slate-400">Gerindo {products.filter(p => p.userId === currentUser.id).length} referências</p>
                  </div>
                  <div className="flex gap-2 no-print">
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"> <Printer size={16}/> Imprimir </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4E81] text-white text-xs font-black uppercase tracking-widest hover:bg-[#143a61] transition-all shadow-md"> <FileText size={16}/> Gerar Relatório PDF </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-b border-slate-100">
                        <th className="px-8 py-6">Item</th>
                        <th className="px-8 py-6">Família</th>
                        <th className="px-8 py-6 text-right">Preço (AOA)</th>
                        <th className="px-8 py-6 text-center">Quant.</th>
                        <th className="px-8 py-6 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.filter(p => p.userId === currentUser.id && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B4E81] group-hover:bg-[#7DC242] group-hover:text-white transition-all shadow-sm"> <Package size={20}/> </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm tracking-tight">{p.name}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">ID: {p.id.toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6"> <span className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 font-black uppercase tracking-widest">{p.category}</span> </td>
                          <td className="px-8 py-6 text-right font-black text-slate-700">{formatCurrency(p.price)}</td>
                          <td className="px-8 py-6 text-center"> <p className={`font-black text-base ${p.stock <= p.minStock ? 'text-rose-600' : 'text-[#1B4E81]'}`}>{p.stock}</p> </td>
                          <td className="px-8 py-6 text-center">
                            {p.stock <= p.minStock ? <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full uppercase tracking-widest">Baixo</span> : <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-[#7DC242] bg-[#7DC242]/10 border border-[#7DC242]/20 px-3 py-1.5 rounded-full uppercase tracking-widest">Em Dia</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#1B4E81] tracking-tight">Histórico de Caixa</h3>
                    <p className="text-sm font-medium text-slate-400">Todas as entradas e saídas de stock</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handlePrint} className="no-print flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"> <Printer size={16}/> Imprimir Tudo </button>
                    <button onClick={handleExportPDF} className="no-print flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"> <FileText size={16}/> PDF Completo </button>
                  </div>
                </div>
                <div>
                  {transactions.filter(t => t.userId === currentUser.id).length === 0 ? (
                    <div className="p-24 text-center text-slate-400 italic"> <History size={64} className="mx-auto mb-4 opacity-10" /> <p className="font-bold">Ainda não registou movimentos.</p> </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {transactions.filter(t => t.userId === currentUser.id).map(t => (
                        <div key={t.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === 'entrada' ? 'bg-[#7DC242]/10 text-[#7DC242] border border-[#7DC242]/20' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}> {t.type === 'entrada' ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />} </div>
                            <div>
                              <p className="font-black text-slate-800 text-lg leading-tight">{t.productName}</p>
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2 mt-1"> {new Date(t.date).toLocaleString('pt-AO')} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> <span className="uppercase tracking-widest">{t.type === 'entrada' ? 'Entrada' : 'Saída/Venda'}</span> </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-black ${t.type === 'entrada' ? 'text-[#7DC242]' : 'text-rose-600'}`}> {t.type === 'entrada' ? '+' : '-'}{t.quantity} un </p>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{formatCurrency(t.totalValue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
               </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
              <div className="text-center space-y-4">
                <Logo size="lg" className="mx-auto" />
                <h2 className="text-4xl font-black text-[#1B4E81] tracking-tight">Stock em Dia</h2>
                <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto italic">"Gestão inteligente para o comércio em Angola."</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AboutCard title="Visão Clara" desc="Saiba exatamente quanto tem em armazém e qual o valor total do seu património." icon={<ShoppingBag size={32} className="text-[#1B4E81]"/>} />
                <AboutCard title="Eficiência em Kwanzas" desc="Toda a plataforma adaptada à nossa moeda e realidade comercial." icon={<TrendingUp size={32} className="text-[#7DC242]"/>} />
                <AboutCard title="Apoio Local" desc="Suporte direto em Angola para garantir que o seu negócio nunca pare." icon={<MessageCircle size={32} className="text-blue-600"/>} />
                <AboutCard title="Gestão em Dia" desc="Inteligência artificial para sugerir reposições e promoções estratégicas." icon={<LayoutDashboard size={32} className="text-amber-600"/>} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showAddModal && (
        <Modal title="Novo Artigo" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddProduct} className="space-y-6">
            <Input label="Designação do Produto" name="name" required placeholder="Ex: Arroz Tio Victor 1kg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categoria</label>
                  <select name="category" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#1B4E81]/10 focus:border-[#1B4E81] transition-all font-black text-sm text-slate-700">
                    <option value="Alimentos">Alimentos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Eletrónicos">Eletrónicos</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Vestuário">Vestuário</option>
                    <option value="Construção">Construção</option>
                    <option value="Outros">Outros</option>
                  </select>
               </div>
               <Input label="Preço Unitário (AOA)" name="price" type="number" required placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Input label="Stock em Mão" name="stock" type="number" required placeholder="0" />
              <Input label="Aviso Mínimo" name="minStock" type="number" required placeholder="Ex: 10" />
            </div>
            <button type="submit" className="w-full py-5 bg-[#1B4E81] hover:bg-[#143a61] text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs"> Adicionar ao Stock </button>
          </form>
        </Modal>
      )}

      {modalTransaction.show && (
        <Modal title={modalTransaction.type === 'entrada' ? 'Registar Entrada' : 'Confirmar Venda'} onClose={() => setModalTransaction({...modalTransaction, show: false})}>
          <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); processTransaction(formData.get('productId') as string, Number(formData.get('quantity')), modalTransaction.type); }} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Selecionar Produto</label>
              <select name="productId" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#1B4E81]/10 focus:border-[#1B4E81] transition-all font-black text-sm text-slate-700">
                <option value="">Escolha um item...</option>
                {products.filter(p => p.userId === currentUser.id).map(p => ( <option key={p.id} value={p.id}>{p.name} (Saldo: {p.stock})</option> ))}
              </select>
            </div>
            <Input label="Quantidade" name="quantity" type="number" required placeholder="0" />
            <button type="submit" className={`w-full py-5 ${modalTransaction.type === 'entrada' ? 'bg-[#7DC242] hover:bg-[#6ba336]' : 'bg-rose-600 hover:bg-rose-700'} text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs`}> Finalizar Movimento </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-[#1B4E81] shadow-lg shadow-black/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}> {icon} {label} </button>
);

const StatCard: React.FC<{ label: string, value: string, sub: string, icon: React.ReactNode, color: string, alert?: boolean }> = ({ label, value, sub, icon, color, alert }) => (
  <div className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all group stat-card ${alert ? 'border-rose-100 bg-rose-50/20 shadow-rose-100 shadow-xl' : 'border-slate-50 shadow-sm hover:border-slate-100 hover:shadow-md'}`}>
    <div className="flex items-center justify-between mb-8">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center border border-${color}-100 shadow-sm group-hover:scale-110 transition-transform`}> {icon} </div>
    </div>
    <div className="space-y-1">
      <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{value}</span>
      <p className={`text-[11px] font-bold mt-2 ${alert ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>{sub}</p>
    </div>
  </div>
);

const ActionButton: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, sub: string, color: string }> = ({ onClick, icon, label, sub, color }) => (
  <button onClick={onClick} className={`w-full p-6 text-left border-2 border-slate-50 bg-white rounded-[1.8rem] hover:border-${color === 'rose' ? 'rose' : 'emerald'}-500 hover:shadow-xl transition-all group flex items-center gap-5`}>
    <div className={`w-14 h-14 rounded-[1.2rem] bg-${color}-50 text-${color}-600 flex items-center justify-center border border-${color}-100 group-hover:scale-110 transition-transform`}> {icon} </div>
    <div>
      <p className="font-black text-[#1B4E81] leading-tight uppercase tracking-widest text-xs mb-1">{label}</p>
      <p className="text-[10px] font-bold text-slate-400">{sub}</p>
    </div>
  </button>
);

const Input: React.FC<{ label: string, name: string, type?: string, required?: boolean, placeholder?: string, icon?: React.ReactNode }> = ({ label, name, type = 'text', required, placeholder, icon }) => (
  <div className="space-y-3">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1B4E81] transition-colors">{icon}</div>}
      <input required={required} name={name} type={type} placeholder={placeholder} className={`w-full ${icon ? 'pl-14' : 'px-6'} py-4.5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-[#1B4E81]/5 focus:border-[#1B4E81] transition-all font-bold text-slate-900 placeholder:text-slate-300 text-sm`} />
    </div>
  </div>
);

const Modal: React.FC<{ title: string, onClose: () => void, children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1B4E81]/80 backdrop-blur-sm animate-in fade-in duration-300 no-print">
    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-black text-2xl text-[#1B4E81] tracking-tight">{title}</h3>
        <button onClick={onClose} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-[#1B4E81] transition-all active:scale-90"><X size={20} /></button>
      </div>
      <div className="p-10"> {children} </div>
    </div>
  </div>
);

const AboutCard: React.FC<{ title: string, desc: string, icon: React.ReactNode }> = ({ title, desc, icon }) => (
  <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-xl transition-all text-center group">
    <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform"> <div className="p-5 bg-slate-50 rounded-[1.5rem]"> {icon} </div> </div>
    <h4 className="font-black text-[#1B4E81] mb-3 tracking-tight text-xl">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed font-medium italic">"{desc}"</p>
  </div>
);

export default App;

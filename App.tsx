
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PenTool, BrainCircuit, BarChart3, MessageSquare, 
  Calendar, FolderClosed, Wrench, ShieldCheck, 
  Settings, Bell, Plus, ArrowUpRight, ArrowDownLeft, Wallet, Home, User,
  Truck, Eye, AlertTriangle, Thermometer, Camera
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { MOCK_CONSUMPTION, MOCK_STATUS, MOCK_TIRES, MOCK_ACTIVITIES } from './constants';
import { getTireInsights } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [aiInsight, setAiInsight] = useState<string>('Carregando análise da frota...');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    getTireInsights(MOCK_TIRES).then(res => setAiInsight(res));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateThermalSimulation = async () => {
    setIsGeneratingImage(true);
    // Create a new GoogleGenAI instance right before making an API call to ensure it uses the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: "Generate a realistic top-view thermal map image of a truck tire showing heat concentration areas (red and yellow) on the tread, professional diagnostic style, white background." }]
        }
      });
      
      // Correctly extract the image data from response parts
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImageUrl(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (isMobile) return <MobileView aiInsight={aiInsight} />;
  return (
    <WebView 
      aiInsight={aiInsight} 
      generatedImageUrl={generatedImageUrl} 
      isGeneratingImage={isGeneratingImage}
      onGenerateImage={generateThermalSimulation}
    />
  );
};

// --- WEB COMPONENTS (Panze Inspired) ---

const WebView: React.FC<{ 
  aiInsight: string, 
  generatedImageUrl: string | null, 
  isGeneratingImage: boolean,
  onGenerateImage: () => void 
}> = ({ aiInsight, generatedImageUrl, isGeneratingImage, onGenerateImage }) => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">P</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">pneu<span className="text-indigo-600 font-medium">track</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
          <SidebarItem icon={<Truck size={20}/>} label="Frota Ativa" />
          <SidebarItem icon={<FolderClosed size={20}/>} label="Estoque" />
          <SidebarItem icon={<BarChart3 size={20}/>} label="Relatórios" />
          
          <div className="pt-8 pb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Operações</div>
          <SidebarItem icon={<ShieldCheck size={20}/>} label="Inspeções" />
          {/* Fix: Replaced Tool with Wrench */}
          <SidebarItem icon={<Wrench size={20}/>} label="Manutenções" />
          <SidebarItem icon={<Settings size={20}/>} label="Ajustes" />
        </nav>

        <div className="mt-10 p-4 bg-gray-50 rounded-2xl flex items-center gap-3 border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">JG</div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-800 truncate">João Gestor</p>
            <p className="text-xs text-gray-400 truncate">Administrador</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel de Controle</h1>
            <p className="text-gray-400 text-sm font-medium">Monitoramento em tempo real da linha pesada</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Bell size={20} className="text-gray-400 cursor-pointer hover:text-indigo-600 transition-colors" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </div>
             <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-semibold text-sm">
                <Plus size={18} /> Novo Registro
             </button>
          </div>
        </header>

        {/* Status Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <div className="col-span-1 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <BrainCircuit size={24} />
              </div>
              <h3 className="text-lg font-bold mb-1">IA Fleet Advisor</h3>
              <p className="text-xs text-indigo-100 leading-relaxed opacity-80">Insights baseados em telemetria e histórico de desgaste.</p>
            </div>
            <button className="mt-8 py-3 bg-white text-indigo-900 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-colors">Solicitar Auditoria</button>
          </div>

          <StatCard icon={<ShieldCheck className="text-emerald-500"/>} label="Pneus em Uso" value="124" detail="Disponibilidade: 98%" />
          <StatCard icon={<Thermometer className="text-orange-500"/>} label="Alertas Calor" value="03" detail="Risco de estouro" />
          <StatCard icon={<AlertTriangle className="text-rose-500"/>} label="Trocas Urgentes" value="05" detail="Sulco < 1.6mm" />
        </section>

        {/* Visual Axle Map & AI Simulation */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
           <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Mapa de Eixos (Scania R450)</h2>
              <div className="flex justify-center items-center py-10 bg-gray-50 rounded-2xl">
                 <div className="relative w-48 h-80 border-4 border-gray-200 rounded-3xl flex flex-col justify-between p-4">
                    {/* Front Axle */}
                    <div className="flex justify-between -mx-10">
                       <TireIndicator status="ok" pos="FL" />
                       <TireIndicator status="warning" pos="FR" />
                    </div>
                    {/* Chassis Line */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-0.5 h-3/4 bg-gray-200"></div>
                    {/* Rear Axles */}
                    <div className="flex flex-col gap-8">
                       <div className="flex justify-between -mx-10">
                          <div className="flex gap-2"><TireIndicator status="ok" /><TireIndicator status="ok" /></div>
                          <div className="flex gap-2"><TireIndicator status="ok" /><TireIndicator status="ok" /></div>
                       </div>
                       <div className="flex justify-between -mx-10">
                          <div className="flex gap-2"><TireIndicator status="alert" /><TireIndicator status="ok" /></div>
                          <div className="flex gap-2"><TireIndicator status="ok" /><TireIndicator status="ok" /></div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Simulação Térmica (IA)</h2>
                <button 
                  onClick={onGenerateImage}
                  disabled={isGeneratingImage}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Camera size={20} />
                </button>
              </div>
              <div className="flex-1 border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center overflow-hidden bg-gray-50 min-h-[300px]">
                 {isGeneratingImage ? (
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Gerando visão térmica...</p>
                   </div>
                 ) : generatedImageUrl ? (
                   <img src={generatedImageUrl} alt="Simulação IA" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center px-10">
                      <Thermometer size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-sm text-gray-400">Clique na câmera para gerar uma análise visual de desgaste simulada por IA.</p>
                   </div>
                 )}
              </div>
           </div>
        </section>

        {/* Charts and Tables */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 mb-10">
           <h2 className="text-lg font-bold text-gray-800 mb-8">Análise de Consumo Mensal</h2>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_CONSUMPTION}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                    itemStyle={{fontWeight: 'bold', fontSize: '12px'}}
                  />
                  <Line type="monotone" dataKey="success" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </section>

        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 mb-10">
           <div className="flex items-center gap-3 mb-6">
              <BrainCircuit className="text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-800">IA Insights Fleet</h2>
           </div>
           <div className="bg-indigo-50/50 rounded-2xl p-6 text-indigo-900/80 text-sm leading-relaxed border border-indigo-100">
              {aiInsight}
           </div>
        </section>
      </main>
    </div>
  );
};

// --- MOBILE COMPONENTS (Fintech Inspired) ---

const MobileView: React.FC<{ aiInsight: string }> = ({ aiInsight }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] pb-28 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-150px] left-[-50px] w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[120px] opacity-40"></div>
      
      <header className="px-6 pt-12 pb-6 flex justify-between items-center z-10">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden border border-white">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bom dia,</p>
               <p className="text-lg font-bold text-gray-800">Marcella</p>
            </div>
         </div>
         <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-100 relative">
            <Bell size={20} className="text-gray-700" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full"></span>
         </button>
      </header>

      {/* Main Card (Fintech Style) */}
      <section className="px-6 mb-8 z-10">
         <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <p className="text-indigo-100 text-xs font-medium mb-1">Custo Projetado (Pneus/KM)</p>
            <div className="flex items-baseline gap-2 mb-8">
               <h2 className="text-4xl font-bold">R$ 1.42</h2>
               <span className="text-xs bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">-4%</span>
            </div>
            
            <div className="flex justify-between items-center bg-black/10 backdrop-blur-md rounded-3xl p-4">
               <div className="flex flex-col">
                  <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-tighter">Próxima Inspeção</span>
                  <span className="text-xs font-bold">24 Mai, 2024</span>
               </div>
               <div className="w-px h-6 bg-white/20"></div>
               <div className="flex flex-col">
                  <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-tighter">Status Frota</span>
                  <span className="text-xs font-bold">100% OK</span>
               </div>
            </div>
         </div>
      </section>

      {/* Quick Actions */}
      <section className="px-6 mb-8 flex justify-between z-10">
         <MobileCircleAction icon={<ArrowUpRight />} label="Troca" color="bg-orange-500" />
         <MobileCircleAction icon={<Thermometer />} label="Aferição" color="bg-indigo-500" />
         <MobileCircleAction icon={<ShieldCheck />} label="Checklist" color="bg-emerald-500" />
         <MobileCircleAction icon={<Plus />} label="Novo" color="bg-gray-800" />
      </section>

      {/* AI Insights (Mobile) */}
      <section className="px-6 mb-8 z-10">
         <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-xl shadow-gray-100/50">
            <div className="flex items-center gap-2 mb-3">
               <BrainCircuit className="text-indigo-600" size={18} />
               <h3 className="text-sm font-bold text-gray-800">Insight do Dia</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed italic">
               "{aiInsight.slice(0, 100)}..."
            </p>
         </div>
      </section>

      {/* Recent List */}
      <section className="px-6 flex-1 z-10">
         <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-lg font-bold text-gray-800">Últimas Atividades</h3>
            <button className="text-xs font-bold text-indigo-600">Ver Todas</button>
         </div>
         <div className="space-y-4">
            {MOCK_ACTIVITIES.map((act) => (
               <div key={act.id} className="bg-white/70 backdrop-blur-md p-5 rounded-[28px] flex items-center justify-between border border-white shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        act.type === 'Troca' ? 'bg-orange-50 text-orange-500' : 'bg-indigo-50 text-indigo-500'
                     }`}>
                        {/* Fix: Replaced Tool with Wrench */}
                        {act.type === 'Troca' ? <ArrowUpRight size={22} /> : <Wrench size={22} />}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-gray-800">{act.description}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{act.vehicle}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`text-sm font-bold ${act.cost < 0 ? 'text-gray-800' : 'text-emerald-500'}`}>
                        {act.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </p>
                     <p className="text-[10px] text-gray-400 font-medium">{act.date}</p>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Bottom Navbar (Float) */}
      <nav className="fixed bottom-8 left-8 right-8 bg-white/80 backdrop-blur-2xl h-18 rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/50 flex items-center justify-around px-6 z-50">
         <MobileNavItem icon={<Home />} active />
         <MobileNavItem icon={<BarChart3 />} />
         <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-200 -mt-10 border-4 border-white">
            <Plus size={24} />
         </div>
         <MobileNavItem icon={<Wallet />} />
         <MobileNavItem icon={<User />} />
      </nav>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean }> = ({ icon, label, active }) => (
  <a href="#" className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
    active 
    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
    : 'text-gray-400 hover:text-gray-800 hover:bg-gray-50'
  }`}>
    <span className={`${active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'} transition-colors`}>{icon}</span>
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </a>
);

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, detail: string }> = ({ icon, label, value, detail }) => (
  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 group">
    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
      {icon}
    </div>
    <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
    <p className="text-sm font-bold text-gray-600 mb-2">{label}</p>
    <div className="flex items-center gap-1.5">
       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{detail}</p>
    </div>
  </div>
);

const TireIndicator: React.FC<{ status: 'ok' | 'warning' | 'alert', pos?: string }> = ({ status, pos }) => {
  const colors = {
    ok: 'bg-emerald-500 shadow-emerald-200',
    warning: 'bg-orange-400 shadow-orange-200',
    alert: 'bg-rose-500 shadow-rose-200'
  };
  return (
    <div className={`w-8 h-12 rounded-md ${colors[status]} shadow-lg flex items-center justify-center relative cursor-help`}>
       {pos && <span className="absolute -top-6 text-[8px] font-bold text-gray-400">{pos}</span>}
       <div className="w-4 h-full bg-black/10 flex flex-col justify-around py-1">
          {[...Array(4)].map((_, i) => <div key={i} className="w-full h-[1px] bg-white/20"></div>)}
       </div>
    </div>
  );
};

const MobileCircleAction: React.FC<{ icon: React.ReactNode, label: string, color: string }> = ({ icon, label, color }) => (
  <div className="flex flex-col items-center gap-2">
     <button className={`w-14 h-14 ${color} text-white rounded-[22px] flex items-center justify-center shadow-lg transition-transform active:scale-95`}>
        {/* Fix: Added type casting to allow size prop on cloned element */}
        {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
     </button>
     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
  </div>
);

const MobileNavItem: React.FC<{ icon: React.ReactNode, active?: boolean }> = ({ icon, active }) => (
  <button className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${
    active ? 'text-indigo-600' : 'text-gray-300'
  }`}>
    {/* Fix: Added type casting to allow size and strokeWidth props on cloned element */}
    {React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: active ? 2.5 : 2 })}
  </button>
);

export default App;

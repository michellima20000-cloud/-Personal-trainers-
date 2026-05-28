import React, { useState } from 'react';
import { 
  Users, Shield, Laptop, Smartphone, Key, DollarSign, Database,
  Activity, Clock, LogOut, ArrowRight, Heart, Sparkles, BarChart2,
  Trash2, Plus, ExternalLink, RefreshCw, Mail, Search, CheckCircle2,
  Lock, CheckSquare, MessageCircle, AlertTriangle, KeyRound
} from 'lucide-react';
import { Student, Trainer, AccessLog } from '../types';

interface AdminDashboardProps {
  students: Student[];
  trainers: Trainer[];
  accessLogs: AccessLog[];
  onImpersonateTrainer: (trainer: Trainer) => void;
  onImpersonateStudent: (student: Student) => void;
  onLogout: () => void;
  onDeleteStudent?: (id: string) => void;
}

export default function AdminDashboard({
  students,
  trainers,
  accessLogs,
  onImpersonateTrainer,
  onImpersonateStudent,
  onLogout,
  onDeleteStudent
}: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'visao' | 'trainers' | 'students' | 'logs'>('visao');
  const [trainerSearch, setTrainerSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [logsSearch, setLogsSearch] = useState('');

  // Calculations for analytics
  const totalTrainers = trainers.length;
  const totalStudents = students.length;
  
  // Calculate total recurring values
  const totalMRR = students.reduce((acc, s) => acc + (s.value || 0), 0);
  
  const planDistribution = students.reduce((acc, s) => {
    acc[s.plan] = (acc[s.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeStudentsCount = students.filter(s => s.status === 'Ativo').length;

  // Filters
  const filteredTrainers = trainers.filter(t => 
    t.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(trainerSearch.toLowerCase()) ||
    (t.customIdLink || '').toLowerCase().includes(trainerSearch.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.objective.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.plan.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredLogs = accessLogs.filter(log => 
    log.userName.toLowerCase().includes(logsSearch.toLowerCase()) ||
    log.action.toLowerCase().includes(logsSearch.toLowerCase()) ||
    log.device.toLowerCase().includes(logsSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#09090b] min-h-screen text-neutral-100">
      
      {/* Supreme Admin Header Bar */}
      <header className="border-b border-neutral-800 bg-[#0c0c0e] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="bg-[#39FF14]/15 border border-[#39FF14]/30 p-2 rounded-xl text-[#39FF14]">
            <Shield size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest font-black bg-[#39FF14] text-black px-2 py-0.5 rounded-sm uppercase">SUPREME ADMIN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mt-0.5">
              GymPulse System Cockpit
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-white">Michel Lima</p>
            <p className="text-[10px] text-neutral-400 font-mono">michel.lima20000@gmail.com</p>
          </div>
          <button 
            onClick={onLogout}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer hover:bg-neutral-850"
          >
            <LogOut size={13} /> Sair do Cockpit
          </button>
        </div>
      </header>

      {/* Primary Cockpit Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-neutral-900/50 rounded-xl border border-neutral-800 font-mono text-xs max-w-md">
          {[
            { id: 'visao', label: 'Estatísticas', icon: BarChart2 },
            { id: 'trainers', label: 'Treinadores', icon: Laptop },
            { id: 'students', label: 'Alunos', icon: Users },
            { id: 'logs', label: 'Audit / Segurança', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-2 px-4 rounded-lg transition font-bold uppercase shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-[#39FF14] text-black shadow-md' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Visão Geral / Estatísticas */}
        {activeSubTab === 'visao' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-2">
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">Volume de Consultores</p>
                <div className="flex items-baseline justify-between pt-1">
                  <h3 className="text-3xl font-black text-white tracking-tight">{totalTrainers}</h3>
                  <span className="text-[10px] bg-[#39FF14]/15 border border-[#39FF14]/25 text-[#39FF14] px-2 py-0.5 rounded font-mono font-bold">ATIVOS</span>
                </div>
                <p className="text-xs text-neutral-500 leading-none pt-1">Personal Training cadastrados</p>
              </div>

              <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-2">
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">Total de Alunos</p>
                <div className="flex items-baseline justify-between pt-1">
                  <h3 className="text-3xl font-black text-[#39FF14] tracking-tight">{totalStudents}</h3>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                    {activeStudentsCount} ATIVOS
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-none pt-1">Fidelizados com assessoria ativa</p>
              </div>

              <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-2">
                <p className="text-[10px] font-mono text-[#39FF14] uppercase tracking-widest font-bold font-black flex items-center gap-1">
                  <Sparkles size={11} className="animate-bounce" /> Valor Estimado MRR
                </p>
                <div className="flex items-baseline justify-between pt-1">
                  <h3 className="text-3xl font-black text-white tracking-tight">R$ {totalMRR.toFixed(2)}</h3>
                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">MENSAL</span>
                </div>
                <p className="text-xs text-neutral-500 leading-none pt-1">Soma das mensalidades de alunos</p>
              </div>

              <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-2">
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">Status Integração Cloud</p>
                <div className="flex items-baseline justify-between pt-1">
                  <h3 className="text-lg font-black text-amber-400 tracking-tight flex items-center gap-1">
                    <Database size={16} /> FIRESTORE
                  </h3>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold animate-pulse">SINCRONIZADO</span>
                </div>
                <p className="text-xs text-neutral-500 leading-none pt-1">Segurança de dados e regras ativas</p>
              </div>

            </div>

            {/* Overview Detail & Quick Welcome */}
            <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 space-y-3">
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-1.5 uppercase">
                <Activity size={14} className="text-[#39FF14]" /> Cockpit Administrativo Geral - GymPulse
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
                Olá Michel, este painel foi estruturado para fornecer visibilidade total sobre o sistema. Você tem controle total sobre o andamento e pode migrar (impostar/personificar) para a visão de qualquer profissional cadastrado para gerenciar suas fichas ou acompanhar logs de acesso por alunos de forma auditada no Firebase.
              </p>
            </div>

            {/* Plan distribution & logs ticker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Plan Distribution */}
              <div className="bg-[#121214]/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Divisão dos Planos Contratados (Alunos)</h4>
                
                <div className="space-y-3 font-mono text-xs">
                  {Object.entries(planDistribution).map(([name, count]) => {
                    const percent = Math.round((count / totalStudents) * 100);
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-400">{name}</span>
                          <span className="text-white font-bold">{count} Alunos ({percent}%)</span>
                        </div>
                        <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#39FF14] h-full" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(planDistribution).length === 0 && (
                    <p className="text-xs text-neutral-500">Nenhum plano contratado ativo.</p>
                  )}
                </div>
              </div>

              {/* Box 2: Quick Logs Timeline */}
              <div className="bg-[#121214]/60 p-5 rounded-2xl border border-neutral-800 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 mb-2">
                    <Clock size={14} className="text-amber-400" /> Atividades Recentes do Sistema
                  </h4>
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {accessLogs.slice(0, 4).map((log) => (
                      <div key={log.id} className="text-[11px] bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-850 flex items-start justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <p className="text-neutral-200 font-semibold">{log.action}</p>
                          <p className="text-neutral-500 font-mono">{log.userName} ({log.role}) • {log.timestamp}</p>
                        </div>
                        <span className="shrink-0 text-[8px] font-mono border border-[#39FF14]/30 px-1.5 py-0.5 rounded text-[#39FF14] bg-[#39FF14]/5 truncate max-w-[80px]">
                          {log.device}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSubTab('logs')}
                  className="text-[11px] text-right text-[#39FF14] font-bold font-mono hover:underline block pt-2 cursor-pointer self-end"
                >
                  Ver todos os logs →
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: List of Trainers & Option to Impersonate */}
        {activeSubTab === 'trainers' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-850">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
                <input 
                  type="text"
                  placeholder="Pesquisar por treinador (nome, email ou link)..."
                  value={trainerSearch}
                  onChange={(e) => setTrainerSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#39FF14] transition font-mono"
                />
              </div>
              <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                Total Filtrado: {filteredTrainers.length} de {trainers.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTrainers.map((t) => {
                const isDefault = t.id === 't_default';
                // Find students linked to this trainer ID
                const linkedStudents = students.filter(s => s.trainerId === t.id);

                return (
                  <div key={t.id} className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-4 flex flex-col justify-between relative overflow-hidden">
                    {isDefault && (
                      <div className="absolute top-0 right-0 bg-[#39FF14]/15 text-[#39FF14] text-[8px] font-sans px-3.5 py-1 uppercase rounded-bl-lg font-black tracking-widest border-l border-b border-[#39FF14]/20">Padrão Seed</div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-[#39FF14] font-mono">
                          {t.name.split(' ').map(n=>n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{t.name}</h4>
                          <p className="text-[10px] font-mono text-neutral-400 mt-0.5">{t.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2">
                        <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-900">
                          <span className="text-neutral-500 block uppercase text-[8px] leading-tight">Plano GymPulse</span>
                          <span className="text-neutral-200 mt-0.5 block font-bold">{t.selectedPlan || 'Mensal'}</span>
                        </div>
                        <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-900">
                          <span className="text-neutral-500 block uppercase text-[8px] leading-tight">Link de Convite</span>
                          <span className="text-[#39FF14] mt-0.5 block font-bold truncate">/{t.customIdLink}</span>
                        </div>
                        <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-900">
                          <span className="text-neutral-500 block uppercase text-[8px] leading-tight">Faturamento Ativo</span>
                          <span className="text-emerald-400 mt-0.5 block font-bold">R$ {linkedStudents.reduce((acc,s)=>acc + (s.value||0), 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-900">
                          <span className="text-neutral-500 block uppercase text-[8px] leading-tight">Alunos Associados</span>
                          <span className="text-neutral-200 mt-0.5 block font-bold">{linkedStudents.length} vinculados</span>
                        </div>
                      </div>

                      {/* Display Pix parameters of the Trainer */}
                      <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-900 space-y-1 font-mono text-[9px]">
                        <p className="text-neutral-500 uppercase tracking-tight text-[8px] font-bold">Configuração de Recebimento</p>
                        <p className="text-neutral-300">Tipo Pix: <span className="text-white font-bold">{t.pixKeyType || 'Chave Aleatória'}</span></p>
                        <p className="text-neutral-300">Chave Pix: <span className="text-[#39FF14] font-bold select-all">{t.pixKey || 'Não configurada'}</span></p>
                        <p className="text-neutral-300">WhatsApp: <span className="text-white">{t.phoneWhatsApp || 'Não informado'}</span></p>
                        <p className="text-neutral-300">Stripe: <span className={t.stripeEnabled ? "text-emerald-400" : "text-neutral-500"}>{t.stripeEnabled ? `Ativo (${t.stripePublishableKey || 'pk_key'})` : 'Desativado'}</span></p>
                      </div>
                    </div>

                    <button
                      onClick={() => onImpersonateTrainer(t)}
                      className="w-full bg-[#121214] border border-neutral-800 hover:border-[#39FF14]/50 text-white hover:text-[#39FF14] py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 font-mono shadow-md"
                    >
                      <Laptop size={13} /> Entrar no CRM de {t.name.split(' ')[0]}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}

              {filteredTrainers.length === 0 && (
                <p className="text-xs text-neutral-500 font-mono col-span-2 text-center py-6">Nenhum personal trainer encontrado com estes filtros.</p>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: List of Registered Students & Impersonate Student */}
        {activeSubTab === 'students' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-850">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
                <input 
                  type="text"
                  placeholder="Pesquisar por alunos (nome, objetivo, plano)..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#39FF14] transition font-sans"
                />
              </div>
              <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                Total Filtrado: {filteredStudents.length} de {students.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((s) => {
                // Find corresponding trainer object
                const trainersObj = trainers.find(t => t.id === s.trainerId) || trainers[0] || { name: 'Daniel Personal' };

                return (
                  <div key={s.id} className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                            <span className="font-extrabold text-xs text-white">{s.name[0]}</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">{s.name}</h4>
                            <p className="text-[9px] font-mono text-neutral-400">{s.joinedAt} • {s.plan}</p>
                          </div>
                        </div>

                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-extrabold tracking-wider ${
                          s.status === 'Ativo' ? 'bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14]' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                          {s.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono bg-neutral-950 p-2.5 rounded-xl border border-neutral-900/40">
                        <div>
                          <span className="text-neutral-500 block">Objetivo:</span>
                          <span className="text-white font-bold">{s.objective}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Mensalidade:</span>
                          <span className="text-[#39FF14] font-bold">R$ {s.value.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Vencimento:</span>
                          <span className="text-neutral-300 font-bold">{s.nextPayment}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Coach Resp.:</span>
                          <span className="text-neutral-300 font-bold truncate pr-1 block">{trainersObj.name.split(' ')[0]}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-neutral-900/80">
                          <span className="text-neutral-500 block">Caso Clínico/Restrição:</span>
                          <span className="text-neutral-300 font-sans italic line-clamp-1">{s.restrictions || 'Nenhuma registrada'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onImpersonateStudent(s)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 hover:text-blue-400 text-xs text-white py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer font-mono"
                        title="Ver do portal do aluno"
                      >
                        <Smartphone size={12} /> Impersonar Aluno
                      </button>
                      
                      {onDeleteStudent && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja remover permanente o perfil de ${s.name}?`)) {
                              onDeleteStudent(s.id);
                            }
                          }}
                          className="bg-neutral-900 border border-neutral-800 hover:bg-red-950/20 hover:border-red-500/40 hover:text-red-400 p-2 rounded-xl transition cursor-pointer"
                          title="Remover Aluno"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredStudents.length === 0 && (
                <p className="text-xs text-neutral-500 font-mono col-span-3 text-center py-6">Nenhum aluno cadastrado encontrado com estes critérios.</p>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: General system Audits and logs search */}
        {activeSubTab === 'logs' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-xl rounded-full"></div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-1.5 pt-0.5">
                <Shield size={14} className="text-amber-400" /> Trilha de Auditoria e Logs de Segurança
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Todas as ações executadas tanto por profissionais de educação física quanto por alunos no painel são registradas com data, hora e carimbo de dispositivo móvel ou desktop, gerando uma persistência histórica distribuída no Firebase Cloud.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-850">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
                <input 
                  type="text"
                  placeholder="Pesquisar logs por usuário, action ou device..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#39FF14] transition font-mono"
                />
              </div>
              <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                Total Filtrado: {filteredLogs.length} de {accessLogs.length}
              </span>
            </div>

            <div className="bg-[#121214] rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-[#0c0c0e]/80 text-[#39FF14] font-mono uppercase tracking-wider text-[10px]">
                      <th className="p-4">Carimbo de Data/Hora</th>
                      <th className="p-4">Usuário</th>
                      <th className="p-4">Papel</th>
                      <th className="p-4">Evento / Ação Registrada</th>
                      <th className="p-4">Aparelho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850 font-mono">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-900/45 transition">
                        <td className="p-4 text-neutral-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                        <td className="p-4 font-sans font-bold text-white">{log.userName}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                            (log.role as string) === 'trainer' ? 'bg-[#39FF14]/10 text-[#39FF14]' : (log.role as string) === 'admin' ? 'bg-amber-400/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {log.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-300 font-sans text-[11px] leading-relaxed select-all">{log.action}</td>
                        <td className="p-4 whitespace-nowrap text-neutral-400 text-[11px]">{log.device}</td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-500">Nenhum evento registrado encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}

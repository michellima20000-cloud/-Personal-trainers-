import React, { useState, useEffect } from 'react';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Bell, CreditCard, 
  SwitchCamera, ChevronRight, RefreshCw, BarChart2, Star, Shield, HelpCircle, X
} from 'lucide-react';
import { Student, TrainingSheet, EvolutionRecord, AgendaEvent, ChatMessage, AppNotification, RevenueLog, AccessLog } from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_SHEETS, 
  INITIAL_EVOLUTION_RECORDS, 
  INITIAL_AGENDA, 
  INITIAL_CHATS, 
  INITIAL_NOTIFICATIONS, 
  REVENUE_LOGS 
} from './mockData';
import TrainerDashboard from './components/TrainerDashboard';
import StudentDashboard from './components/StudentDashboard';
import LoginScreen from './components/LoginScreen';

const LOCAL_STORAGE_KEY = 'gympulse_sandbox_state_v1';

const INITIAL_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'log_seed_1',
    role: 'trainer',
    userName: 'Personal Trainer',
    timestamp: '27/05/2026 09:00:15',
    action: 'Acesso ao Painel Principal (Consultoria)',
    device: 'Computador Desktop'
  },
  {
    id: 'log_seed_2',
    role: 'student',
    userId: 's1',
    userName: 'Ana Silva',
    timestamp: '27/05/2026 10:15:30',
    action: 'Acesso ao Portal do Aluno (Visualização de Treinos)',
    device: 'Dispositivo Móvel'
  },
  {
    id: 'log_seed_3',
    role: 'student',
    userId: 's2',
    userName: 'Carlos Souza',
    timestamp: '27/05/2026 11:30:10',
    action: 'Acesso ao Portal do Aluno (Registro de Pesagem)',
    device: 'Dispositivo Móvel'
  }
];

export default function App() {
  const [role, setRole] = useState<'trainer' | 'student'>('trainer');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // Unified Local Databases
  const [students, setStudents] = useState<Student[]>([]);
  const [sheets, setSheets] = useState<Record<string, TrainingSheet>>({});
  const [evolution, setEvolution] = useState<Record<string, EvolutionRecord[]>>({});
  const [agenda, setAgenda] = useState<AgendaEvent[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [revenueLogs, setRevenueLogs] = useState<RevenueLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  // Selected student inside the student area role view
  const [activeStudentId, setActiveStudentId] = useState<string>('');

  // Sandbox notification/sync log banner state
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'Plataforma carregada com sucesso.',
    'Banco de dados local (localStorage) inicializado.'
  ]);
  const [showSyncLogPane, setShowSyncLogPane] = useState(true);

  // Load state on mount
  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    // Parse URL parameters for invitation links
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role');
    const urlStudentId = params.get('studentId');

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setStudents(parsed.students || INITIAL_STUDENTS);
        setSheets(parsed.sheets || INITIAL_SHEETS);
        setEvolution(parsed.evolution || INITIAL_EVOLUTION_RECORDS);
        setAgenda(parsed.agenda || INITIAL_AGENDA);
        setChats(parsed.chats || INITIAL_CHATS);
        setNotifications(parsed.notifications || INITIAL_NOTIFICATIONS);
        setRevenueLogs(parsed.revenueLogs || REVENUE_LOGS);
        setAccessLogs(parsed.accessLogs || INITIAL_ACCESS_LOGS);
        
        const firstId = urlStudentId || parsed.students?.[0]?.id || INITIAL_STUDENTS[0].id;
        setActiveStudentId(firstId);
        
        if (urlRole === 'student') {
          setRole('student');
          setIsLoggedIn(true);
          addSyncLog(`Link de convite detectado: Logado como Aluno.`);
        } else if (urlRole === 'trainer') {
          setRole('trainer');
          setIsLoggedIn(true);
          addSyncLog(`Link administrativo consultor detectado.`);
        } else {
          setIsLoggedIn(parsed.isLoggedIn || false);
          setRole(parsed.role || 'trainer');
        }

        addSyncLog('Estado anterior restaurado com sucesso do localStorage.');
      } catch (err) {
        loadDefaults();
      }
    } else {
      loadDefaults();
      if (urlRole === 'student' && urlStudentId) {
        setRole('student');
        setActiveStudentId(urlStudentId);
        setIsLoggedIn(true);
        addSyncLog(`Link de convite detectado: Logado como Aluno.`);
      }
    }
  }, []);

  const loadDefaults = () => {
    setStudents(INITIAL_STUDENTS);
    setSheets(INITIAL_SHEETS);
    setEvolution(INITIAL_EVOLUTION_RECORDS);
    setAgenda(INITIAL_AGENDA);
    setChats(INITIAL_CHATS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setRevenueLogs(REVENUE_LOGS);
    setAccessLogs(INITIAL_ACCESS_LOGS);
    setActiveStudentId(INITIAL_STUDENTS[0].id);
    addSyncLog('Dados de demonstração padrão carregados no aplicativo.');
  };

  // Save state helper
  const saveState = (
    newStudents: Student[],
    newSheets: Record<string, TrainingSheet>,
    newEvolution: Record<string, EvolutionRecord[]>,
    newAgenda: AgendaEvent[],
    newChats: Record<string, ChatMessage[]>,
    newNotifications: AppNotification[],
    newRevenue: RevenueLog[],
    newAccessLogs?: AccessLog[],
    newIsLoggedIn?: boolean,
    newLoggedInRole?: 'trainer' | 'student'
  ) => {
    const data = {
      students: newStudents,
      sheets: newSheets,
      evolution: newEvolution,
      agenda: newAgenda,
      chats: newChats,
      notifications: newNotifications,
      revenueLogs: newRevenue,
      accessLogs: newAccessLogs || accessLogs,
      isLoggedIn: newIsLoggedIn !== undefined ? newIsLoggedIn : isLoggedIn,
      role: newLoggedInRole !== undefined ? newLoggedInRole : role
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  // Automatically record access log when role/active student switches
  useEffect(() => {
    if (students.length === 0) return;
    if (!isLoggedIn) return; // Only log active accesses when user is logged in

    const uid = role === 'student' ? activeStudentId : 'trainer';
    const uName = role === 'student'
      ? (students.find(s => s.id === activeStudentId)?.name || 'Aluno')
      : 'Personal Trainer';
    const actionDesc = role === 'student'
      ? `Acessou o portal do aluno (${uName})`
      : 'Acessou o painel de administração (Personal)';

    const newLog: AccessLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      role,
      userId: role === 'student' ? activeStudentId : undefined,
      userName: uName,
      timestamp: new Date().toLocaleString('pt-BR'),
      action: actionDesc,
      device: navigator.userAgent.includes('Mobi') ? 'Dispositivo Móvel' : 'Computador Desktop'
    };

    setAccessLogs(prev => {
      // Prevent double triggers within same 2 seconds of action
      if (prev.length > 0 && prev[0].userId === uid && prev[0].role === role) {
        return prev;
      }
      const updated = [newLog, ...prev];
      saveState(students, sheets, evolution, agenda, chats, notifications, revenueLogs, updated);
      return updated;
    });
  }, [role, activeStudentId, students.length, isLoggedIn]);

  const addSyncLog = (message: string) => {
    const timestampStr = new Date().toLocaleTimeString('pt-BR');
    setSyncLogs((prev) => [`[${timestampStr}] ${message}`, ...prev.slice(0, 9)]);
  };

  // State modification events passed to children:
  
  const handleAddStudent = (std: Student) => {
    const updated = [...students, std];
    setStudents(updated);
    
    // Create empty sheet list
    const updatedSheets = {
      ...sheets,
      [std.id]: { A: [], B: [], C: [], D: [], E: [] }
    };
    setSheets(updatedSheets);

    // Initial empty evolution
    const updatedEvol = {
      ...evolution,
      [std.id]: [
        {
          id: 're_init_' + std.id,
          studentId: std.id,
          date: std.joinedAt.split('/').reverse().join('-'), // format to YYYY-MM-DD
          weight: std.weight,
          bmi: std.weight / (std.height * std.height),
          notes: 'Avaliação inicial coletada no cadastro do personal.'
        }
      ]
    };
    setEvolution(updatedEvol);

    // Initial empty chat
    const updatedChats = {
      ...chats,
      [std.id]: [
        { id: 'mc_init_' + std.id, sender: 'trainer', text: `Olá ${std.name}! Seja muito bem-vindo à minha consultoria GymPulse. Aqui você receberá suas planilhas semanais de treino e poderá registrar suas cargas e progresso corporal!`, timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) }
      ]
    };
    setChats(updatedChats);

    // Trigger notification
    const updatedNotifs = [
      {
        id: 'not_std_' + Date.now(),
        studentId: std.id,
        studentName: std.name,
        title: 'Boas-vindas à consultoria! 🎉',
        message: 'Acesso liberado. Seu Personal Trainer acabou de ativar o seu perfil de treino.',
        channel: 'push' as const,
        type: 'plan' as const,
        sentAt: new Date().toLocaleString('pt-BR')
      },
      ...notifications
    ];
    setNotifications(updatedNotifs);

    saveState(updated, updatedSheets, updatedEvol, agenda, updatedChats, updatedNotifs, revenueLogs);
    addSyncLog(`Novo aluno cadastrado: "${std.name}". Ficha A-E, chats e notificações iniciadas.`);
  };

  const handleUpdateStudent = (id: string, data: Partial<Student>) => {
    const updated = students.map(s => s.id === id ? { ...s, ...data } : s);
    setStudents(updated);
    saveState(updated, sheets, evolution, agenda, chats, notifications, revenueLogs);
    addSyncLog(`Dados corporais de "${updated.find(s => s.id === id)?.name}" atualizados.`);
  };

  const handleDeleteStudent = (id: string) => {
    const targetName = students.find(s => s.id === id)?.name || '';
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    
    // clean sheet / evolut / chat
    const updatedSheets = { ...sheets };
    delete updatedSheets[id];

    const updatedEvol = { ...evolution };
    delete updatedEvol[id];

    const updatedChats = { ...chats };
    delete updatedChats[id];

    saveState(updated, updatedSheets, updatedEvol, agenda, updatedChats, notifications, revenueLogs);
    addSyncLog(`Excluído aluno "${targetName}" e limpo registros associados de treino, medidas e chats.`);
  };

  const handleUpdateSheet = (studentId: string, sheet: TrainingSheet) => {
    const updatedSheets = {
      ...sheets,
      [studentId]: sheet
    };
    setSheets(updatedSheets);

    // Automatically send notification to the student
    const student = students.find(s => s.id === studentId);
    const updatedNotifs = [
      {
        id: 'not_sheet_' + Date.now(),
        studentId,
        studentName: student ? student.name : 'Aluno',
        title: 'Ficha de treinos atualizada! 🏋️',
        message: 'Seu Personal atualizou sua divisão de treinos. Abra a aba de treinos para conferir as novas séries e cargas-alvo.',
        channel: 'push' as const,
        type: 'workout' as const,
        sentAt: new Date().toLocaleString('pt-BR')
      },
      ...notifications
    ];
    setNotifications(updatedNotifs);

    saveState(students, updatedSheets, evolution, agenda, chats, updatedNotifs, revenueLogs);
    addSyncLog(`Treinador editou ficha de treinos de "${student?.name}". Aluno notificado via push.`);
  };

  const handleAddAgendaEvent = (event: AgendaEvent) => {
    const updated = [event, ...agenda];
    setAgenda(updated);

    // Send WhatsApp simulator notification if student is attached
    let updatedNotifs = [...notifications];
    if (event.studentId) {
      const student = students.find(s => s.id === event.studentId);
      updatedNotifs = [
        {
          id: 'not_ag_' + Date.now(),
          studentId: event.studentId,
          studentName: student ? student.name : 'Aluno',
          title: 'Aula agendada pelo Personal! ⏰',
          message: `Olá! Seu treino presencial ou chamada de vídeo para ${event.title} foi agendada para ${event.date.split('-').reverse().join('/')} às ${event.time}. Prepare as garrafas de água!`,
          channel: 'whatsapp' as const,
          type: 'reminder' as const,
          sentAt: new Date().toLocaleString('pt-BR')
        },
        ...updatedNotifs
      ];
      setNotifications(updatedNotifs);
    }

    saveState(students, sheets, evolution, updated, chats, updatedNotifs, revenueLogs);
    addSyncLog(`Aula agendada: "${event.title}" no dia ${event.date.split('-').reverse().join('/')}. Alerta disparado.`);
  };

  const handleDeleteAgendaEvent = (id: string) => {
    const target = agenda.find(e => e.id === id);
    const updated = agenda.filter(e => e.id !== id);
    setAgenda(updated);
    saveState(students, sheets, evolution, updated, chats, notifications, revenueLogs);
    addSyncLog(`Cancelado evento de agenda: "${target?.title}".`);
  };

  const handleSendMessage = (studentId: string, text: string, senderOverride?: 'trainer' | 'student') => {
    const senderRole = senderOverride || (role === 'trainer' ? 'trainer' : 'student');
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: senderRole,
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const studentChats = chats[studentId] || [];
    const updatedChats = {
      ...chats,
      [studentId]: [...studentChats, newMsg]
    };
    setChats(updatedChats);
    saveState(students, sheets, evolution, agenda, updatedChats, notifications, revenueLogs);
    addSyncLog(`[CONVERSA] Mensagem enviada por ${senderRole === 'trainer' ? 'Personal' : 'Aluno'}: "${text.substring(0, 30)}..."`);
  };

  const handleSendNotification = (notif: AppNotification) => {
    const updated = [notif, ...notifications];
    setNotifications(updated);
    saveState(students, sheets, evolution, agenda, chats, updated, revenueLogs);
    addSyncLog(`Notificação manual enviada para "${notif.studentName}" via [${notif.channel.toUpperCase()}].`);
  };

  const handleAddEvolutionRecord = (studentId: string, record: EvolutionRecord) => {
    const currentList = evolution[studentId] || [];
    const updatedList = [...currentList, record];
    const updatedEvol = {
      ...evolution,
      [studentId]: updatedList
    };
    setEvolution(updatedEvol);

    // Also update current active weight inside students profile immediately for synchronization
    const updatedStudents = students.map(s => s.id === studentId ? { ...s, weight: record.weight } : s);
    setStudents(updatedStudents);

    // Notify trainer about physical weight drop or log change
    const targetStudent = students.find(s => s.id === studentId);
    const updatedNotifs = [
      {
        id: 'not_ev_' + Date.now(),
        studentId,
        studentName: targetStudent ? targetStudent.name : 'Aluno',
        title: 'Medidas corporais registradas! 📈',
        message: `Novo registro físico: Peso ${record.weight}kg, IMC de ${record.bmi.toFixed(1)}. Histórico atualizado.`,
        channel: 'whatsapp' as const,
        type: 'reminder' as const,
        sentAt: new Date().toLocaleString('pt-BR')
      },
      ...notifications
    ];
    setNotifications(updatedNotifs);

    saveState(updatedStudents, sheets, updatedEvol, agenda, chats, updatedNotifs, revenueLogs);
    addSyncLog(`Aluno "${targetStudent?.name}" cadastrou nova pesagem corporal: ${record.weight}kg.`);
  };

  const handleCompleteWorkout = (studentId: string, workoutLetter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const targetStudent = students.find(s => s.id === studentId);
    
    // Add completed notification
    const completedNotif: AppNotification = {
      id: 'not_done_' + Date.now(),
      studentId,
      studentName: targetStudent ? targetStudent.name : 'Aluno',
      title: 'Treino concluído! ✅',
      message: `${targetStudent?.name} concluiu o Treino ${workoutLetter} com sucesso e anotou as cargas!`,
      channel: 'push',
      type: 'workout',
      sentAt: new Date().toLocaleString('pt-BR')
    };

    const updatedNotifs = [completedNotif, ...notifications];
    setNotifications(updatedNotifs);

    // Update trainer stats (simulating completed workouts inside billing / logs or revenue metrics)
    const updatedRevenue = revenueLogs.map((log, index) => {
      // increase May metrics
      if (index === revenueLogs.length - 1) {
        return {
          ...log,
          payments: log.payments + 1
        };
      }
      return log;
    });
    setRevenueLogs(updatedRevenue);

    saveState(students, sheets, evolution, agenda, chats, updatedNotifs, updatedRevenue);
    addSyncLog(`Aluno "${targetStudent?.name}" marcou o "Treino ${workoutLetter}" como CONCLUÍDO. Cargas atualizadas.`);
  };

  const handleLoginSuccess = (enteredRole: 'trainer' | 'student', studentId?: string) => {
    setRole(enteredRole);
    if (studentId) {
      setActiveStudentId(studentId);
    }
    setIsLoggedIn(true);
    
    // Save state
    saveState(
      students,
      sheets,
      evolution,
      agenda,
      chats,
      notifications,
      revenueLogs,
      accessLogs,
      true, // isLoggedIn
      enteredRole
    );

    addSyncLog(`Login bem-sucedido! Acesso concedido à área de: ${enteredRole === 'trainer' ? 'Personal Trainer' : 'Aluno'}.`);
  };

  const handleLogout = () => {
    const uName = role === 'student'
      ? (students.find(s => s.id === activeStudentId)?.name || 'Aluno')
      : 'Personal Trainer';

    // Record access logout log
    const newLog: AccessLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      role,
      userId: role === 'student' ? activeStudentId : undefined,
      userName: uName,
      timestamp: new Date().toLocaleString('pt-BR'),
      action: `Logout efetuado com sucesso da conta.`,
      device: navigator.userAgent.includes('Mobi') ? 'Dispositivo Móvel' : 'Computador Desktop'
    };

    const updatedLogs = [newLog, ...accessLogs];
    setAccessLogs(updatedLogs);

    setIsLoggedIn(false);
    addSyncLog(`Logout efetuado para: ${uName}. Sessão encerrada.`);
    
    saveState(
      students,
      sheets,
      evolution,
      agenda,
      chats,
      notifications,
      revenueLogs,
      updatedLogs,
      false, // isLoggedIn
      role
    );
  };

  const handleTriggerAutoResponse = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Smart automatic trainer responses based on student profile for beautiful high fidelity
    const answers = [
      "Obrigado pelo feedback de treino! Ajustei o descanso das séries para te ajudar na estafa.",
      "Excelente progresso de força, com técnica apurada. Cargas salvas. Na próxima semana buscaremos progresão de carga!",
      "Lembre-se de manter o déficit calórico hoje! O segredo é na constância dos macros.",
      "Perfeito! Amanhã presencialmente ajustaremos a postura.",
      "Excelente, beba bastante água!"
    ];
    const randAnswer = answers[Math.floor(Math.random() * answers.length)];
    
    handleSendMessage(studentId, `(Automatizado) ` + randAnswer, 'student');
  };

  const resetAllDataButton = () => {
    if (confirm('Deseja redefinir todo o banco de dados local para os dados padrão iniciais de simulação?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      loadDefaults();
      setIsLoggedIn(false);
    }
  };

  return (
    <div className="bg-[#09090b] min-h-screen text-neutral-100 flex flex-col antialiased selection:bg-[#39FF14] selection:text-black">
      
      {/* Top Controller: Role Sandbox Switcher */}
      {isLoggedIn && (
        <div className="bg-[#18181b] border-b border-[#39FF14]/30 text-xs py-3 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#39FF14]/10 text-[#39FF14] px-2.5 py-1 rounded border border-[#39FF14]/20 font-mono text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse"></span>
                Fidelidade Máxima (Autenticado)
              </div>
              <p className="text-neutral-300 text-[11px] leading-tight text-center md:text-left">
                Troque rapidamente as visões para testes: 
                <strong className="text-white font-semibold"> Personal cria treinos ➔ Aluno treina ➔ Profissional acompanha painel!</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRole('trainer');
                  addSyncLog('Alternou sandbox para visualização do Personal Trainer.');
                }}
                className={`px-4.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs ${role === 'trainer' ? 'bg-[#39FF14] text-black font-extrabold shadow-sm shadow-[#39FF14]/20' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'}`}
              >
                <Users size={14} /> Ver como Personal
              </button>

              <button
                onClick={() => {
                  setRole('student');
                  addSyncLog(`Alternou sandbox para visualização do Aluno ("${students.find(s=>s.id===activeStudentId)?.name || 'Perfil'}").`);
                }}
                className={`px-4.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs ${role === 'student' ? 'bg-[#39FF14] text-black font-extrabold shadow-sm shadow-[#39FF14]/20' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'}`}
              >
                <Dumbbell size={14} /> Ver como Aluno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Dashboard views render based on active Sandbox Selector */}
      <div className="flex-1 flex flex-col">
        {!isLoggedIn ? (
          <LoginScreen 
            students={students} 
            onLoginSuccess={handleLoginSuccess} 
          />
        ) : (
          students.length > 0 && (
            role === 'trainer' ? (
              <TrainerDashboard
                students={students}
                sheets={sheets}
                evolution={evolution}
                agenda={agenda}
                chats={chats}
                notifications={notifications}
                revenueLogs={revenueLogs}
                accessLogs={accessLogs}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onUpdateSheet={handleUpdateSheet}
                onAddAgendaEvent={handleAddAgendaEvent}
                onDeleteAgendaEvent={handleDeleteAgendaEvent}
                onSendMessage={(id, text) => handleSendMessage(id, text, 'trainer')}
                onSendNotification={handleSendNotification}
                onTriggerAutoResponse={handleTriggerAutoResponse}
                onLogout={handleLogout}
              />
            ) : (
              <StudentDashboard
                students={students}
                sheets={sheets}
                evolution={evolution}
                chats={chats}
                activeStudentId={activeStudentId}
                accessLogs={accessLogs}
                onSelectStudent={(id) => {
                  setActiveStudentId(id);
                  addSyncLog(`Alterado aluno ativo no portal do aluno para: "${students.find(s=>s.id===id)?.name}".`);
                }}
                onUpdateSheetExercises={async (id, letter, items) => {
                  const currentSheet = sheets[id] || { A: [], B: [], C: [], D: [], E: [] };
                  handleUpdateSheet(id, { ...currentSheet, [letter]: items });
                }}
                onAddEvolutionRecord={handleAddEvolutionRecord}
                onSendMessage={(id, text) => handleSendMessage(id, text, 'student')}
                onCompleteWorkout={handleCompleteWorkout}
                onLogout={handleLogout}
              />
            )
          )
        )}
      </div>

      {/* Sync Logging Console drawer at bottom for developers, very informative */}
      {showSyncLogPane && (
        <div className="bg-neutral-950 border-t border-neutral-800 text-[11px] p-3 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1 w-full overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-neutral-500 font-mono uppercase tracking-widest font-black flex items-center gap-1">
                  <RefreshCw size={11} className="text-[#39FF14] animate-spin" /> Log de Transações Integradas (Real-Time Sandbox)
                </span>
                <button 
                  onClick={() => setShowSyncLogPane(false)}
                  className="text-neutral-500 hover:text-white bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[9px] transition"
                >
                  Ocultar Logs
                </button>
              </div>
              <div className="font-mono text-neutral-400 bg-[#121214] p-2 rounded border border-neutral-800/80 max-h-16 overflow-y-auto leading-relaxed select-text space-y-0.5">
                {syncLogs.map((log, idx) => (
                  <div key={idx} className={idx === 0 ? 'text-[#39FF14] font-medium' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
              <button 
                onClick={resetAllDataButton}
                className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-3.5 py-2 rounded-xl transition text-[10px] font-bold tracking-tight cursor-pointer"
                title="Apaga cache e retorna ao estado inicial"
              >
                Resetar Estado Padrão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal toggle backup for floating sync logs panel when hidden */}
      {!showSyncLogPane && (
        <button 
          onClick={() => setShowSyncLogPane(true)}
          className="fixed bottom-3 right-3 z-40 bg-neutral-900 hover:bg-neutral-800 text-[#39FF14] px-3 py-1.5 rounded-lg border border-neutral-800 text-[10px] font-mono tracking-tight transition cursor-pointer flex items-center gap-1 shadow-lg"
        >
          <RefreshCw size={10} className="animate-spin" /> Exibir Logs de Sincronia
        </button>
      )}

    </div>
  );
}

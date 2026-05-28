import React, { useState, useEffect } from 'react';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Bell, CreditCard, 
  SwitchCamera, ChevronRight, RefreshCw, BarChart2, Star, Shield, HelpCircle, X
} from 'lucide-react';
import { Student, TrainingSheet, EvolutionRecord, AgendaEvent, ChatMessage, AppNotification, RevenueLog, AccessLog, MarketingPlan, Trainer } from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_SHEETS, 
  INITIAL_EVOLUTION_RECORDS, 
  INITIAL_AGENDA, 
  INITIAL_CHATS, 
  INITIAL_NOTIFICATIONS, 
  REVENUE_LOGS,
  INITIAL_MARKETING_PLANS
} from './mockData';
import TrainerDashboard from './components/TrainerDashboard';
import StudentDashboard from './components/StudentDashboard';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';

import { deleteDoc, doc } from 'firebase/firestore';
import { 
  db,
  initializeAnonymousAuth, 
  fetchStudents, saveStudent,
  fetchSheets, saveSheet,
  fetchAllEvolutionRecords, saveEvolutionRecord,
  fetchAllChatMessages, saveChatMessage,
  fetchAgendaEvents, saveAgendaEvent, deleteAgendaEventDoc,
  fetchNotifications, saveNotification,
  fetchRevenueLogs, saveRevenueLog,
  fetchAccessLogs, saveAccessLog,
  fetchMarketingPlans, saveMarketingPlan,
  fetchTrainers, saveTrainer
} from './utils/firebase';

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
  const [role, setRole] = useState<'trainer' | 'student' | 'admin'>('trainer');
  const [originalAdminSession, setOriginalAdminSession] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // Unified Databases
  const [students, setStudents] = useState<Student[]>([]);
  const [sheets, setSheets] = useState<Record<string, TrainingSheet>>({});
  const [evolution, setEvolution] = useState<Record<string, EvolutionRecord[]>>({});
  const [agenda, setAgenda] = useState<AgendaEvent[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [revenueLogs, setRevenueLogs] = useState<RevenueLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [marketingPlans, setMarketingPlans] = useState<MarketingPlan[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [activeTrainer, setActiveTrainer] = useState<Trainer | null>(null);

  // Selected student inside the student area role view
  const [activeStudentId, setActiveStudentId] = useState<string>('');

  // Sandbox notification/sync log banner state
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'Inicializando barramento de eventos do banco...'
  ]);
  const [loadingFirebase, setLoadingFirebase] = useState(true);

  // Initialize and Synchronize with Firebase
  useEffect(() => {
    async function initFirebaseSandbox() {
      try {
        addSyncLog("Autenticando sessão anônima segura no Firebase...");
        await initializeAnonymousAuth();

        // 1. Fetch main student records list
        addSyncLog("Verificando registros de alunos em nuvem...");
        let remoteStudents = await fetchStudents();
        
        let remoteSheets: Record<string, TrainingSheet> = {};
        let remoteEvolution: Record<string, EvolutionRecord[]> = {};
        let remoteChats: Record<string, ChatMessage[]> = {};
        let remoteAgenda: AgendaEvent[] = [];
        let remoteNotifications: AppNotification[] = [];
        let remoteRevenueLogs: RevenueLog[] = [];
        let remoteAccessLogs: AccessLog[] = [];
        let remoteMarketingPlans: MarketingPlan[] = [];
        let remoteTrainers: Trainer[] = [];

        // If completely empty database, bootstrap standard seeding dynamically!
        if (!remoteStudents || remoteStudents.length === 0) {
          addSyncLog("Banco Firebase vazio detectado! Realizando seeding de demonstração...");
          
          // Seed Students
          for (const s of INITIAL_STUDENTS) {
            await saveStudent(s);
          }
          // Seed Sheets
          for (const [sid, sheet] of Object.entries(INITIAL_SHEETS)) {
            await saveSheet(sid, sheet);
          }
          // Seed Evolution
          for (const [sid, records] of Object.entries(INITIAL_EVOLUTION_RECORDS)) {
            for (const r of records) {
              await saveEvolutionRecord(sid, r);
            }
          }
          // Seed Chat Logs
          for (const [sid, msgs] of Object.entries(INITIAL_CHATS)) {
            for (const m of msgs) {
              await saveChatMessage(sid, m);
            }
          }
          // Seed Agenda Schedules
          for (const event of INITIAL_AGENDA) {
            await saveAgendaEvent(event);
          }
          // Seed App Notifications logs
          for (const notif of INITIAL_NOTIFICATIONS) {
            await saveNotification(notif);
          }
          // Seed Revenues metrics
          for (const r of REVENUE_LOGS) {
            await saveRevenueLog(r);
          }
          // Seed AccessLogs auditing
          for (const log of INITIAL_ACCESS_LOGS) {
            await saveAccessLog(log);
          }
          // Seed Marketing Plans
          for (const plan of INITIAL_MARKETING_PLANS) {
            await saveMarketingPlan(plan);
          }

          const defaultTrainer: Trainer = {
            id: 't_default',
            name: 'Daniel Personal Coach',
            email: 'personal@gympulse.com.br',
            password: 'personal123',
            selectedPlan: 'Trimestral',
            trialStartDate: new Date().toLocaleDateString('pt-BR'),
            trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            subscriptionStatus: 'paid',
            customIdLink: 'daniel-personal',
            pixKeyType: 'Chave Aleatória',
            pixKey: '9bbf9c81-8077-4cdd-bb85-055ee56bfd31',
            phoneWhatsApp: '+5511999999999',
            stripeEnabled: true,
            stripePublishableKey: 'pk_test_sample_key'
          };
          await saveTrainer(defaultTrainer);

          addSyncLog("Seeding concluído! Todos os dados integrados em nuvem.");
          
          // Use loaded values
          remoteStudents = INITIAL_STUDENTS;
          remoteSheets = INITIAL_SHEETS;
          remoteEvolution = INITIAL_EVOLUTION_RECORDS;
          remoteChats = INITIAL_CHATS;
          remoteAgenda = INITIAL_AGENDA;
          remoteNotifications = INITIAL_NOTIFICATIONS;
          remoteRevenueLogs = REVENUE_LOGS;
          remoteAccessLogs = INITIAL_ACCESS_LOGS;
          remoteMarketingPlans = INITIAL_MARKETING_PLANS;
          remoteTrainers = [defaultTrainer];
        } else {
          // Firebase already populated, fetch remaining entities
          addSyncLog("Carregando planilhas e agendamento da nuvem...");
          remoteSheets = await fetchSheets();
          remoteAgenda = await fetchAgendaEvents();
          remoteNotifications = await fetchNotifications();
          remoteRevenueLogs = await fetchRevenueLogs();
          remoteAccessLogs = await fetchAccessLogs();

          addSyncLog("Carregando planos de marketing...");
          remoteMarketingPlans = await fetchMarketingPlans();
          if (!remoteMarketingPlans || remoteMarketingPlans.length === 0) {
            for (const plan of INITIAL_MARKETING_PLANS) {
              await saveMarketingPlan(plan);
            }
            remoteMarketingPlans = INITIAL_MARKETING_PLANS;
          }

          addSyncLog("Sincronizando profissionais...");
          remoteTrainers = await fetchTrainers();
          if (!remoteTrainers || remoteTrainers.length === 0) {
            const defaultTrainer: Trainer = {
              id: 't_default',
              name: 'Daniel Personal Coach',
              email: 'personal@gympulse.com.br',
              password: 'personal123',
              selectedPlan: 'Trimestral',
              trialStartDate: new Date().toLocaleDateString('pt-BR'),
              trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
              subscriptionStatus: 'paid',
              customIdLink: 'daniel-personal',
              pixKeyType: 'Chave Aleatória',
              pixKey: '9bbf9c81-8077-4cdd-bb85-055ee56bfd31',
              phoneWhatsApp: '+5511999999999',
              stripeEnabled: true,
              stripePublishableKey: 'pk_test_sample_key'
            };
            await saveTrainer(defaultTrainer);
            remoteTrainers = [defaultTrainer];
          }

          addSyncLog("Carregando biometria e chats de cada aluno...");
          for (const s of remoteStudents) {
            const ev = await fetchAllEvolutionRecords(s.id);
            remoteEvolution[s.id] = ev;

            const ch = await fetchAllChatMessages(s.id);
            remoteChats[s.id] = ch;
          }
        }

        // Apply state updates to React
        setStudents(remoteStudents);
        setSheets(remoteSheets);
        setEvolution(remoteEvolution);
        setAgenda(remoteAgenda);
        setChats(remoteChats);
        setNotifications(remoteNotifications);
        setRevenueLogs(remoteRevenueLogs);
        setAccessLogs(remoteAccessLogs);
        setMarketingPlans(remoteMarketingPlans);
        setTrainers(remoteTrainers);

        // Parse URL parameters for invitation links
        const params = new URLSearchParams(window.location.search);
        const urlRole = params.get('role');
        const urlStudentId = params.get('studentId');
        const urlTrainerIdLink = params.get('trainerId'); // custom unique link identifier e.g. daniel-personal


        const firstId = urlStudentId || remoteStudents?.[0]?.id || 's1';
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
          // Restore credentials locally if applicable
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setIsLoggedIn(parsed.isLoggedIn || false);
              setRole(parsed.role || 'trainer');
              if (parsed.marketingPlans) {
                setMarketingPlans(parsed.marketingPlans);
              }
            } catch (e) {}
          }
        }

        addSyncLog("Ambiente real do Firebase totalmente sincronizado.");
        setLoadingFirebase(false);
      } catch (err) {
        console.error("Firebase startup error:", err);
        addSyncLog("Erro de conexão ao Firebase. Ativando fallback...");
        loadDefaults();
        setLoadingFirebase(false);
      }
    }

    initFirebaseSandbox();
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
    setMarketingPlans(INITIAL_MARKETING_PLANS);
    setActiveStudentId(INITIAL_STUDENTS[0]?.id || 's1');
    addSyncLog('Dados de demonstração local carregados em cache de fallback.');
  };

  // Cache configuration state helper
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
    newLoggedInRole?: 'trainer' | 'student' | 'admin',
    newMarketingPlans?: MarketingPlan[],
    newActiveTrainer?: Trainer | null,
    newTrainers?: Trainer[]
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
      role: newLoggedInRole !== undefined ? newLoggedInRole : role,
      marketingPlans: newMarketingPlans || marketingPlans,
      activeTrainer: newActiveTrainer !== undefined ? newActiveTrainer : activeTrainer,
      trainers: newTrainers || trainers
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  // Automatically record access log when role/active student switches
  useEffect(() => {
    if (students.length === 0) return;
    if (!isLoggedIn) return; 
    if (loadingFirebase) return;

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

    async function writeLogToCloud() {
      try {
        await saveAccessLog(newLog);
      } catch (err) {
        console.error("Firebase log tracing error:", err);
      }
    }
    writeLogToCloud();

    setAccessLogs(prev => {
      if (prev.length > 0 && prev[0].userId === uid && prev[0].role === role) {
        return prev;
      }
      const updated = [newLog, ...prev];
      saveState(students, sheets, evolution, agenda, chats, notifications, revenueLogs, updated);
      return updated;
    });
  }, [role, activeStudentId, students.length, isLoggedIn, loadingFirebase]);

  const addSyncLog = (message: string) => {
    const timestampStr = new Date().toLocaleTimeString('pt-BR');
    setSyncLogs((prev) => [`[${timestampStr}] ${message}`, ...prev.slice(0, 9)]);
  };

  const handleUpdateMarketingPlan = async (updatedPlan: MarketingPlan) => {
    const updated = marketingPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setMarketingPlans(updated);
    addSyncLog(`[Firebase] Gravando alteração no plano "${updatedPlan.title}"...`);
    try {
      await saveMarketingPlan(updatedPlan);
      addSyncLog(`[Firebase] Plano "${updatedPlan.title}" atualizado com sucesso na nuvem.`);
    } catch (err) {
      console.error("Error updating plan in Firebase:", err);
      addSyncLog(`[Error] Erro ao sincronizar alteração de plano.`);
    }
    saveState(students, sheets, evolution, agenda, chats, notifications, revenueLogs, accessLogs, isLoggedIn, role, updated);
  };

  // Firestore & local synchronized event handlers:

  const handleAddTrainer = async (trn: Trainer) => {
    const updated = [...trainers, trn];
    setTrainers(updated);
    setActiveTrainer(trn);
    try {
      await saveTrainer(trn);
      addSyncLog(`[Firebase] Novo personal ${trn.name} cadastrado com sucesso.`);
    } catch (e) {
      addSyncLog(`[Error] Erro ao sincronizar cadastro de profissional.`);
    }
    saveState(students, sheets, evolution, agenda, chats, notifications, revenueLogs, accessLogs, true, 'trainer', marketingPlans, trn, updated);
  };

  const handleUpdateTrainer = async (trn: Trainer) => {
    const updated = trainers.map(t => t.id === trn.id ? trn : t);
    setTrainers(updated);
    setActiveTrainer(trn);
    try {
      await saveTrainer(trn);
      addSyncLog(`[Firebase] Configuração de ${trn.name} atualizada na nuvem.`);
    } catch (e) {
      addSyncLog(`[Error] Erro ao sincronizar atualização de profissional.`);
    }
    saveState(students, sheets, evolution, agenda, chats, notifications, revenueLogs, accessLogs, isLoggedIn, 'trainer', marketingPlans, trn, updated);
  };
  
  const handleAddStudent = async (std: Student) => {
    const updated = [...students, std];
    setStudents(updated);
    
    // Initial structures
    const initSheet = { A: [], B: [], C: [], D: [], E: [] };
    const updatedSheets = { ...sheets, [std.id]: initSheet };
    setSheets(updatedSheets);

    const initRecord: EvolutionRecord = {
      id: 're_init_' + std.id,
      studentId: std.id,
      date: std.joinedAt.split('/').reverse().join('-'), 
      weight: std.weight,
      bmi: std.weight / (std.height * std.height),
      notes: 'Avaliação inicial coletada no cadastro do personal.'
    };
    const updatedEvol = { ...evolution, [std.id]: [initRecord] };
    setEvolution(updatedEvol);

    const initChat: ChatMessage = { 
      id: 'mc_init_' + std.id, 
      sender: 'trainer', 
      text: `Olá ${std.name}! Seja muito bem-vindo à minha consultoria GymPulse. Aqui você receberá suas planilhas semanais de treino e poderá registrar suas cargas e progresso corporal!`, 
      timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) 
    };
    const updatedChats = { ...chats, [std.id]: [initChat] };
    setChats(updatedChats);

    const initNotif: AppNotification = {
      id: 'not_std_' + Date.now(),
      studentId: std.id,
      studentName: std.name,
      title: 'Boas-vindas à consultoria! 🎉',
      message: 'Acesso liberado. Seu Personal Trainer acabou de ativar o seu perfil de treino.',
      channel: 'push',
      type: 'plan',
      sentAt: new Date().toLocaleString('pt-BR')
    };
    const updatedNotifs = [initNotif, ...notifications];
    setNotifications(updatedNotifs);

    // Persist to Cloud
    addSyncLog(`[Firebase] Gravando novo aluno "${std.name}"...`);
    try {
      await saveStudent(std);
      await saveSheet(std.id, initSheet);
      await saveEvolutionRecord(std.id, initRecord);
      await saveChatMessage(std.id, initChat);
      await saveNotification(initNotif);
      addSyncLog(`[Firebase] Novo aluno cadastrado e sincronizado com sucesso.`);
    } catch (err) {
      addSyncLog(`[Error] Falha ao persistir cadastros no Firestore.`);
    }

    saveState(updated, updatedSheets, updatedEvol, agenda, updatedChats, updatedNotifs, revenueLogs);
  };

  const handleUpdateStudent = async (id: string, data: Partial<Student>) => {
    const updated = students.map(s => s.id === id ? { ...s, ...data } : s);
    setStudents(updated);

    const updatedStudent = updated.find(s => s.id === id);
    if (updatedStudent) {
      try {
        await saveStudent(updatedStudent);
        addSyncLog(`[Firebase] Dados de "${updatedStudent.name}" atualizados em nuvem.`);
      } catch (err) {
        addSyncLog(`[Error] Erro ao sincronizar update de biotipo.`);
      }
    }

    saveState(updated, sheets, evolution, agenda, chats, notifications, revenueLogs);
  };

  const handleDeleteStudent = async (id: string) => {
    const targetName = students.find(s => s.id === id)?.name || '';
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    
    // clean local state references
    const updatedSheets = { ...sheets };
    delete updatedSheets[id];

    const updatedEvol = { ...evolution };
    delete updatedEvol[id];

    const updatedChats = { ...chats };
    delete updatedChats[id];

    addSyncLog(`[Firebase] Excluindo documentos de "${targetName}"...`);
    try {
      await deleteDoc(doc(db, 'students', id));
      await deleteDoc(doc(db, 'sheets', id));
      addSyncLog(`[Firebase] Aluno e histórico limpos do servidor em nuvem.`);
    } catch (err) {
      addSyncLog(`[Error] Erro de rede ao deletar registro.`);
    }

    saveState(updated, updatedSheets, updatedEvol, agenda, updatedChats, notifications, revenueLogs);
  };

  const handleUpdateSheet = async (studentId: string, sheetToSave: TrainingSheet) => {
    const updatedSheets = {
      ...sheets,
      [studentId]: sheetToSave
    };
    setSheets(updatedSheets);

    const student = students.find(s => s.id === studentId);
    const newNotif: AppNotification = {
      id: 'not_sheet_' + Date.now(),
      studentId,
      studentName: student ? student.name : 'Aluno',
      title: 'Ficha de treinos atualizada! 🏋️',
      message: 'Seu Personal atualizou sua divisão de treinos. Abra a aba de treinos para conferir as novas séries e cargas-alvo.',
      channel: 'push',
      type: 'workout',
      sentAt: new Date().toLocaleString('pt-BR')
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    try {
      await saveSheet(studentId, sheetToSave);
      await saveNotification(newNotif);
      addSyncLog(`[Firebase] Planilha de treino de "${student?.name}" salva na nuvem.`);
    } catch (err) {
      addSyncLog(`[Error] Erro de sincronização de planilha.`);
    }

    saveState(students, updatedSheets, evolution, agenda, chats, updatedNotifs, revenueLogs);
  };

  const handleAddAgendaEvent = async (event: AgendaEvent) => {
    const updated = [event, ...agenda];
    setAgenda(updated);

    let updatedNotifs = [...notifications];
    const student = event.studentId ? students.find(s => s.id === event.studentId) : null;
    let newNotifAddress: AppNotification | null = null;

    if (event.studentId && student) {
      newNotifAddress = {
        id: 'not_ag_' + Date.now(),
        studentId: event.studentId,
        studentName: student.name,
        title: 'Aula agendada pelo Personal! ⏰',
        message: `Olá! Seu treino presencial ou chamada de vídeo para ${event.title} foi agendada para ${event.date.split('-').reverse().join('/')} às ${event.time}. Prepare as garrafas de água!`,
        channel: 'whatsapp',
        type: 'reminder',
        sentAt: new Date().toLocaleString('pt-BR')
      };
      updatedNotifs = [newNotifAddress, ...updatedNotifs];
      setNotifications(updatedNotifs);
    }

    try {
      await saveAgendaEvent(event);
      if (newNotifAddress) {
        await saveNotification(newNotifAddress);
      }
      addSyncLog(`[Firebase] Data agendada para "${event.title}" gravada com sucesso.`);
    } catch (err) {
      addSyncLog(`[Error] Erro ao sincronizar agenda.`);
    }

    saveState(students, sheets, evolution, updated, chats, updatedNotifs, revenueLogs);
  };

  const handleDeleteAgendaEvent = async (id: string) => {
    const target = agenda.find(e => e.id === id);
    const updated = agenda.filter(e => e.id !== id);
    setAgenda(updated);
    
    try {
      await deleteAgendaEventDoc(id);
      addSyncLog(`[Firebase] Evento "${target?.title}" removido com sucesso.`);
    } catch (err) {
      addSyncLog(`[Error] Falha ao apagar compromisso.`);
    }

    saveState(students, sheets, evolution, updated, chats, notifications, revenueLogs);
  };

  const handleSendMessage = async (studentId: string, text: string, senderOverride?: 'trainer' | 'student') => {
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

    try {
      await saveChatMessage(studentId, newMsg);
    } catch (err) {
      console.error("Firebase message dispatch error:", err);
    }

    saveState(students, sheets, evolution, agenda, updatedChats, notifications, revenueLogs);
    addSyncLog(`[CONVERSA] Mensagem enviada por ${senderRole === 'trainer' ? 'Personal' : 'Aluno'}: "${text.substring(0, 30)}..."`);
  };

  const handleSendNotification = async (notif: AppNotification) => {
    const updated = [notif, ...notifications];
    setNotifications(updated);

    try {
      await saveNotification(notif);
      addSyncLog(`[Firebase] Notificação manual persistida.`);
    } catch (err) {
      console.error(err);
    }

    saveState(students, sheets, evolution, agenda, chats, updated, revenueLogs);
  };

  const handleAddEvolutionRecord = async (studentId: string, record: EvolutionRecord) => {
    const currentList = evolution[studentId] || [];
    const updatedList = [...currentList, record];
    const updatedEvol = {
      ...evolution,
      [studentId]: updatedList
    };
    setEvolution(updatedEvol);

    const updatedStudents = students.map(s => s.id === studentId ? { ...s, weight: record.weight } : s);
    setStudents(updatedStudents);

    const targetStudent = students.find(s => s.id === studentId);
    const newNotif: AppNotification = {
      id: 'not_ev_' + Date.now(),
      studentId,
      studentName: targetStudent ? targetStudent.name : 'Aluno',
      title: 'Medidas corporais registradas! 📈',
      message: `Novo registro físico: Peso ${record.weight}kg, IMC de ${record.bmi.toFixed(1)}. Histórico atualizado.`,
      channel: 'whatsapp',
      type: 'reminder',
      sentAt: new Date().toLocaleString('pt-BR')
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    try {
      await saveEvolutionRecord(studentId, record);
      const targetObj = updatedStudents.find(s => s.id === studentId);
      if (targetObj) {
        await saveStudent(targetObj);
      }
      await saveNotification(newNotif);
      addSyncLog(`[Firebase] Registro biométrico integrado e salvo.`);
    } catch (err) {
      addSyncLog(`[Error] Falha ao sincronizar biometria.`);
    }

    saveState(updatedStudents, sheets, updatedEvol, agenda, chats, updatedNotifs, revenueLogs);
  };

  const handleCompleteWorkout = async (studentId: string, workoutLetter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const targetStudent = students.find(s => s.id === studentId);
    
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

    const updatedRevenue = revenueLogs.map((log, index) => {
      if (index === revenueLogs.length - 1) {
        return {
          ...log,
          payments: log.payments + 1
        };
      }
      return log;
    });
    setRevenueLogs(updatedRevenue);

    try {
      await saveNotification(completedNotif);
      const activeMonthLog = updatedRevenue[updatedRevenue.length - 1];
      await saveRevenueLog(activeMonthLog);
      addSyncLog(`[Firebase] Ficha de rendimento físico salva no banco cloud.`);
    } catch (err) {
      addSyncLog(`[Error] Erro ao sincronizar conclusão de treinos.`);
    }

    saveState(students, sheets, evolution, agenda, chats, updatedNotifs, updatedRevenue);
  };

  const handleLoginSuccess = (enteredRole: 'trainer' | 'student' | 'admin', studentId?: string, loggedInTrainer?: Trainer) => {
    setRole(enteredRole);
    if (studentId) {
      setActiveStudentId(studentId);
    }
    
    let trainerToSet: Trainer | null = null;
    if (enteredRole === 'trainer') {
      trainerToSet = loggedInTrainer || trainers[0] || null;
      setActiveTrainer(trainerToSet);
    }
    
    setIsLoggedIn(true);
    setOriginalAdminSession(enteredRole === 'admin');
    
    saveState(
      students,
      sheets,
      evolution,
      agenda,
      chats,
      notifications,
      revenueLogs,
      accessLogs,
      true, 
      enteredRole,
      marketingPlans,
      trainerToSet
    );

    const desc = enteredRole === 'admin' 
      ? 'Administrador Supremo' 
      : enteredRole === 'trainer' 
        ? 'Consultor' 
        : 'Aluno';
    addSyncLog(`Login bem-sucedido: Sessão aberta como ${desc}.`);
  };

  const handleImpersonateTrainer = (trn: Trainer) => {
    setActiveTrainer(trn);
    setRole('trainer');
    addSyncLog(`[Impersonação Admin] Visualizando como Personal Trainer: ${trn.name}`);
  };

  const handleImpersonateStudent = (std: Student) => {
    setActiveStudentId(std.id);
    setRole('student');
    addSyncLog(`[Impersonação Admin] Visualizando como Aluno: ${std.name}`);
  };

  const handleRestoreAdminSession = () => {
    setRole('admin');
    addSyncLog(`Sessão de personificação encerrada. Retornando ao Cockpit do Administrador.`);
  };

  const handleLogout = () => {
    const uName = role === 'student'
      ? (students.find(s => s.id === activeStudentId)?.name || 'Aluno')
      : 'Personal Trainer';

    // Log to Firebase
    const newLog: AccessLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      role,
      userId: role === 'student' ? activeStudentId : undefined,
      userName: uName,
      timestamp: new Date().toLocaleString('pt-BR'),
      action: `Logout efetuado com sucesso da conta.`,
      device: navigator.userAgent.includes('Mobi') ? 'Dispositivo Móvel' : 'Computador Desktop'
    };

    async function writeLogoutLog() {
      try {
        await saveAccessLog(newLog);
      } catch (err) {}
    }
    writeLogoutLog();

    const updatedLogs = [newLog, ...accessLogs];
    setAccessLogs(updatedLogs);

    setIsLoggedIn(false);
    setActiveTrainer(null);
    addSyncLog(`Logout concluído para: ${uName}.`);
    
    saveState(
      students,
      sheets,
      evolution,
      agenda,
      chats,
      notifications,
      revenueLogs,
      updatedLogs,
      false, 
      role,
      marketingPlans,
      null
    );
  };

  const handleTriggerAutoResponse = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

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

  const resetAllDataButton = async () => {
    if (confirm('Deseja redefinir todo o banco de dados FIREBASE e limpar caches locais?')) {
      setLoadingFirebase(true);
      try {
        addSyncLog("Restaurando banco de dados Firebase para seeds padrões...");
        
        for (const s of INITIAL_STUDENTS) {
          await saveStudent(s);
        }
        for (const [sid, sheet] of Object.entries(INITIAL_SHEETS)) {
          await saveSheet(sid, sheet);
        }
        for (const [sid, records] of Object.entries(INITIAL_EVOLUTION_RECORDS)) {
          for (const r of records) {
            await saveEvolutionRecord(sid, r);
          }
        }
        for (const [sid, msgs] of Object.entries(INITIAL_CHATS)) {
          for (const m of msgs) {
            await saveChatMessage(sid, m);
          }
        }
        for (const event of INITIAL_AGENDA) {
          await saveAgendaEvent(event);
        }
        for (const notif of INITIAL_NOTIFICATIONS) {
          await saveNotification(notif);
        }
        for (const r of REVENUE_LOGS) {
          await saveRevenueLog(r);
        }
        for (const log of INITIAL_ACCESS_LOGS) {
          await saveAccessLog(log);
        }

        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setStudents(INITIAL_STUDENTS);
        setSheets(INITIAL_SHEETS);
        setEvolution(INITIAL_EVOLUTION_RECORDS);
        setAgenda(INITIAL_AGENDA);
        setChats(INITIAL_CHATS);
        setNotifications(INITIAL_NOTIFICATIONS);
        setRevenueLogs(REVENUE_LOGS);
        setAccessLogs(INITIAL_ACCESS_LOGS);
        setActiveStudentId(INITIAL_STUDENTS[0].id);

        setIsLoggedIn(false);
        addSyncLog("Firebase restaurado com dados sementes de demonstração.");
      } catch (err) {
        addSyncLog("Erro ao sincronizar reset do Firebase.");
      } finally {
        setLoadingFirebase(false);
      }
    }
  };

  return (
    <div className="bg-[#09090b] min-h-screen text-neutral-100 flex flex-col antialiased selection:bg-[#39FF14] selection:text-black">
      
      {originalAdminSession && role !== 'admin' && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 px-4 py-2 flex items-center justify-between gap-3 text-xs text-white font-bold tracking-tight shadow-md z-50 animate-slideDown">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-300"></span>
            </span>
            <span className="font-mono text-[9px] uppercase bg-black text-[#39FF14] px-2 py-0.5 rounded leading-none">MODO IMPERSONAÇÃO ADMIN SUPREMO</span>
            <span>Acompanhando a plataforma como: <strong className="underline text-white font-extrabold">{role === 'trainer' ? activeTrainer?.name : students.find(s => s.id === activeStudentId)?.name}</strong></span>
          </div>
          <button 
            onClick={handleRestoreAdminSession}
            className="bg-black hover:bg-neutral-950 border border-[#39FF14]/30 text-[#39FF14] text-[10px] font-black uppercase font-mono px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Shield size={12} className="text-[#39FF14]" /> Voltar ao Cockpit
          </button>
        </div>
      )}

      {loadingFirebase ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-screen relative overflow-hidden select-none">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#39FF14]/5 to-transparent blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <RefreshCw className="text-[#39FF14] animate-spin" size={32} />
            <h1 className="text-3xl font-black tracking-tight text-white font-sans uppercase">Gym<span className="text-[#39FF14]">Pulse</span></h1>
          </div>
          <p className="text-xs font-mono text-neutral-400 tracking-wider">Conectando ao Firestore Cloud e Sincronizando tabelas...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {!isLoggedIn ? (
            <LoginScreen 
              students={students} 
              trainers={trainers}
              onLoginSuccess={handleLoginSuccess} 
              onAddStudent={handleAddStudent}
              onAddTrainer={handleAddTrainer}
            />
          ) : (
            students.length > 0 && (
              role === 'admin' ? (
                <AdminDashboard
                  students={students}
                  trainers={trainers}
                  accessLogs={accessLogs}
                  onImpersonateTrainer={handleImpersonateTrainer}
                  onImpersonateStudent={handleImpersonateStudent}
                  onLogout={handleLogout}
                  onDeleteStudent={handleDeleteStudent}
                />
              ) : role === 'trainer' ? (
                <TrainerDashboard
                  students={students}
                  sheets={sheets}
                  evolution={evolution}
                  agenda={agenda}
                  chats={chats}
                  notifications={notifications}
                  revenueLogs={revenueLogs}
                  accessLogs={accessLogs}
                  marketingPlans={marketingPlans}
                  activeTrainer={activeTrainer}
                  onUpdateTrainer={handleUpdateTrainer}
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
                  onUpdateMarketingPlan={handleUpdateMarketingPlan}
                />
              ) : (
                <StudentDashboard
                  students={students}
                  trainers={trainers}
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
      )}



    </div>
  );
}

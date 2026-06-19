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

import { deleteDoc, doc, collection, onSnapshot } from 'firebase/firestore';
import { 
  db,
  auth,
  initializeAnonymousAuth, registerAuthUser,
  fetchStudents, fetchStudent, fetchStudentByEmail, saveStudent,
  fetchSheets, saveSheet,
  fetchAllEvolutionRecords, saveEvolutionRecord,
  fetchAllChatMessages, saveChatMessage,
  fetchAgendaEvents, saveAgendaEvent, deleteAgendaEventDoc,
  fetchNotifications, saveNotification,
  fetchRevenueLogs, saveRevenueLog,
  fetchAccessLogs, saveAccessLog,
  fetchMarketingPlans, saveMarketingPlan, deleteMarketingPlan,
  fetchTrainers, fetchTrainer, saveTrainer,
  purgeTestAccountsFirestore,
  purgeEntireDatabaseFirestore
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

const DEFAULT_TRAINER: Trainer = {
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
  stripePublishableKey: 'pk_test_sample_key',
  stripeSecretKey: ''
};

const loadCachedOrSeed = () => {
  const cachedStr = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
  if (cachedStr) {
    try {
      const parsed = JSON.parse(cachedStr);
      if (parsed && typeof parsed === 'object') {
        return {
          role: parsed.role || 'trainer',
          isLoggedIn: parsed.isLoggedIn !== undefined ? parsed.isLoggedIn : false,
          students: parsed.students || INITIAL_STUDENTS,
          sheets: parsed.sheets || INITIAL_SHEETS,
          evolution: parsed.evolution || INITIAL_EVOLUTION_RECORDS,
          agenda: parsed.agenda || INITIAL_AGENDA,
          chats: parsed.chats || INITIAL_CHATS,
          notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
          revenueLogs: parsed.revenueLogs || REVENUE_LOGS,
          accessLogs: parsed.accessLogs || INITIAL_ACCESS_LOGS,
          marketingPlans: (parsed.marketingPlans || INITIAL_MARKETING_PLANS).filter((p: any) => p.id !== 'Semestral'),
          trainers: parsed.trainers || [],
          activeTrainer: parsed.activeTrainer || null,
          activeStudentId: parsed.activeStudentId || (parsed.students && parsed.students[0] && parsed.students[0].id) || ''
        };
      }
    } catch (e) {
      console.warn("Could not parse cached loading state, using initial seed data.", e);
    }
  }

  // Fallback to defaults
  return {
    role: 'trainer',
    isLoggedIn: false,
    students: INITIAL_STUDENTS,
    sheets: INITIAL_SHEETS,
    evolution: INITIAL_EVOLUTION_RECORDS,
    agenda: INITIAL_AGENDA,
    chats: INITIAL_CHATS,
    notifications: INITIAL_NOTIFICATIONS,
    revenueLogs: REVENUE_LOGS,
    accessLogs: INITIAL_ACCESS_LOGS,
    marketingPlans: INITIAL_MARKETING_PLANS,
    trainers: [],
    activeTrainer: null,
    activeStudentId: ''
  };
};

const getInitialStates = () => {
  const initial = loadCachedOrSeed();
  
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role');
    const urlStudentId = params.get('studentId');
    const urlTrainerId = params.get('trainerId');
    
    // Auto-login disabled so students must go through LoginScreen, authenticate with Google, and link their Gmail!
    if (urlStudentId) {
      if (initial.isLoggedIn && initial.role === 'student' && initial.activeStudentId === urlStudentId) {
        // Keep logged-in active student session!
      } else {
        initial.role = 'student';
        initial.isLoggedIn = false;
        initial.activeStudentId = urlStudentId;
      }
    } else if (urlTrainerId) {
      // If there's a trainer referral in the URL, log out of any cached session
      // and clear the active student ID to guarantee they see the login/onboarding screen of that specific Trainer!
      initial.isLoggedIn = false;
      initial.role = 'student';
      initial.activeStudentId = '';
    } else if (urlRole === 'student' || urlRole === 'trainer') {
      if (initial.isLoggedIn && initial.role === urlRole) {
        // Keep logged-in active session!
      } else {
        initial.role = urlRole as any;
        initial.isLoggedIn = false;
      }
    }
  }
  
  return initial;
};

const preloadedState = getInitialStates();

export default function App() {
  const [role, setRole] = useState<'trainer' | 'student' | 'admin'>(preloadedState.role);
  const [originalAdminSession, setOriginalAdminSession] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(preloadedState.isLoggedIn);
  
  // Unified Databases
  const [students, setStudents] = useState<Student[]>(preloadedState.students);
  const [sheets, setSheets] = useState<Record<string, TrainingSheet>>(preloadedState.sheets);
  const [evolution, setEvolution] = useState<Record<string, EvolutionRecord[]>>(preloadedState.evolution);
  const [agenda, setAgenda] = useState<AgendaEvent[]>(preloadedState.agenda);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(preloadedState.chats);
  const [notifications, setNotifications] = useState<AppNotification[]>(preloadedState.notifications);
  const [revenueLogs, setRevenueLogs] = useState<RevenueLog[]>(preloadedState.revenueLogs);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(preloadedState.accessLogs);
  const [marketingPlans, setMarketingPlans] = useState<MarketingPlan[]>(preloadedState.marketingPlans);
  const [trainers, setTrainers] = useState<Trainer[]>(preloadedState.trainers);
  const [activeTrainer, setActiveTrainer] = useState<Trainer | null>(preloadedState.activeTrainer);

  // Selected student inside the student area role view
  const [activeStudentId, setActiveStudentId] = useState<string>(preloadedState.activeStudentId);

  // Sandbox notification/sync log banner state
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'Inicializando barramento de eventos do banco...'
  ]);
  const [loadingFirebase, setLoadingFirebase] = useState(true);
  const [syncingStatus, setSyncingStatus] = useState<'syncing' | 'synced' | 'error'>('syncing');

  // Rapid loading fallback to make startup feel instantaneous using preloaded caches
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlStudentId = params ? params.get('studentId') : null;
    const isDirectLink = !!urlStudentId;
    
    const delay = isDirectLink ? 150 : 450; // Near-instantaneous (150ms) reveal for direct student link clicks!
    
    const timer = setTimeout(() => {
      setLoadingFirebase(false);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  // Initialize and Synchronize with Firebase
  useEffect(() => {
    async function initFirebaseSandbox() {
      // 15 second safety boundary timeout for the entire database synchronization
      let timeoutId: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Timeout de conexão")), 15000);
      });

      try {
        // Run anonymous authentication in parallel with fetches to eliminate sequential RTT delays
        const parallelFetchPromise = (async () => {
          try {
            await initializeAnonymousAuth();
          } catch (e) {
            console.warn("Skipping anonymous auth wait", e);
          }

          const [
            fetchedStudents,
            fetchedSheets,
            fetchedAgenda,
            fetchedNotifications,
            fetchedRevenueLogs,
            fetchedAccessLogs,
            fetchedMarketingPlans,
            fetchedTrainers
          ] = await Promise.all([
            fetchStudents().catch(err => { console.error("fetchStudents failed:", err); return []; }),
            fetchSheets().catch(err => { console.error("fetchSheets failed:", err); return {}; }),
            fetchAgendaEvents().catch(err => { console.error("fetchAgendaEvents failed:", err); return []; }),
            fetchNotifications().catch(err => { console.error("fetchNotifications failed:", err); return []; }),
            fetchRevenueLogs().catch(err => { console.error("fetchRevenueLogs failed:", err); return []; }),
            fetchAccessLogs().catch(err => { console.error("fetchAccessLogs failed:", err); return []; }),
            fetchMarketingPlans().catch(err => { console.error("fetchMarketingPlans failed:", err); return []; }),
            fetchTrainers().catch(err => { console.error("fetchTrainers failed:", err); return []; })
          ]);
          return {
            students: fetchedStudents || [],
            sheets: fetchedSheets || {},
            agenda: fetchedAgenda || [],
            notifications: fetchedNotifications || [],
            revenueLogs: fetchedRevenueLogs || [],
            accessLogs: fetchedAccessLogs || [],
            marketingPlans: fetchedMarketingPlans || [],
            trainers: fetchedTrainers || []
          };
        })();

        const dbData = await Promise.race([parallelFetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        let remoteStudents = (dbData.students || []).filter(s => !['s1', 's2', 's3', 's4', 's5'].includes(s.id));
        
        // Anti-wipe local-to-cloud auto-synchronization safeguard
        const localOnlyStudents = (preloadedState.students || []).filter(
          s => !['s1', 's2', 's3', 's4', 's5'].includes(s.id) && 
               !remoteStudents.some(rs => rs.id === s.id)
        );

        if (localOnlyStudents.length > 0) {
          addSyncLog(`[Sync] Sincronizando ${localOnlyStudents.length} aluno(s) locais pendentes para o Firebase...`);
          localOnlyStudents.forEach(s => {
            saveStudent(s)
              .then(() => addSyncLog(`[Sync] Aluno "${s.name}" sincronizado com a nuvem.`))
              .catch(err => console.error("Failed to sync student to cloud:", err));
            
            const localSheet = preloadedState.sheets?.[s.id];
            if (localSheet) {
              saveSheet(s.id, localSheet).catch(err => console.error("Failed to sync training sheet to cloud:", err));
            }

            const localEvols = preloadedState.evolution?.[s.id];
            if (localEvols && Array.isArray(localEvols)) {
              localEvols.forEach(r => {
                saveEvolutionRecord(s.id, r).catch(err => console.error("Failed to sync evolution record to cloud:", err));
              });
            }

            const localChats = preloadedState.chats?.[s.id];
            if (localChats && Array.isArray(localChats)) {
              localChats.forEach(m => {
                saveChatMessage(s.id, m).catch(err => console.error("Failed to sync chat message to cloud:", err));
              });
            }
          });
          remoteStudents = [...remoteStudents, ...localOnlyStudents];
        }

        let remoteSheets = dbData.sheets;
        let remoteAgenda = dbData.agenda;
        let remoteNotifications = dbData.notifications;
        let remoteRevenueLogs = dbData.revenueLogs;
        let remoteAccessLogs = dbData.accessLogs;
        let remoteMarketingPlans = dbData.marketingPlans;
        let remoteTrainers = (dbData.trainers || []).filter(t => t.id !== 't_default');

        // Ensure Semestral is removed and Anual is added to plans list
        remoteMarketingPlans = (remoteMarketingPlans || []).filter(p => p.id !== 'Semestral');
        const hasAnual = remoteMarketingPlans.some(p => p.id === 'Anual');
        if (!hasAnual) {
          const anualDefault = {
            id: 'Anual',
            title: 'Plano Anual',
            price: 90,
            period: '/m',
            features: ['Planilha Treino A-E', 'Suporte Conversa e Áudio', 'Avaliação Física Completa', 'Acompanhamento de Metas & Peso', 'Acesso 12 Meses Premium'],
            recommended: false
          };
          remoteMarketingPlans = [...remoteMarketingPlans, anualDefault];
          saveMarketingPlan(anualDefault).catch(err => console.error("Error saving Anual fallback:", err));
        }
        // Guarantee 'Semestral' doc is deleted from Firebase to keep database pristine
        deleteMarketingPlan('Semestral').catch(() => {});

        // Parse URL parameters for invitation links
        const params = new URLSearchParams(window.location.search);
        const urlRole = params.get('role');
        const urlStudentId = params.get('studentId');
        const urlTrainerId = params.get('trainerId');

        // Synchronously determine the actual active trainer log state
        let finalActiveTrainer: Trainer | null = null;

        // 1. If trainerId is in the URL (direct personal trainer link), match it FIRST as the absolute priority!
        if (urlTrainerId) {
          finalActiveTrainer = remoteTrainers.find(
            t => (t.customIdLink || '').toLowerCase() === urlTrainerId.toLowerCase() || 
                 t.id.toLowerCase() === urlTrainerId.toLowerCase() ||
                 (t.email || '').split('@')[0].toLowerCase() === urlTrainerId.toLowerCase()
          ) || null;
        }

        // 2. If studentId is in the URL (active student invite link), retrieve their actual personal trainer
        if (!finalActiveTrainer && urlStudentId) {
          const matchedStudent = remoteStudents.find(s => s.id === urlStudentId);
          if (matchedStudent?.trainerId) {
            finalActiveTrainer = remoteTrainers.find(t => t.id === matchedStudent.trainerId) || null;
          }
        }

        // 3. Fallback to activeStudentId if stored in cache
        if (!finalActiveTrainer && preloadedState.role === 'student' && preloadedState.activeStudentId) {
          const matchedStudent = remoteStudents.find(s => s.id === preloadedState.activeStudentId);
          if (matchedStudent?.trainerId) {
            finalActiveTrainer = remoteTrainers.find(t => t.id === matchedStudent.trainerId) || null;
          }
        }

        // 4. Fallback to cached activeTrainer (ignoring fake DEFAULT_TRAINER 't_default')
        if (!finalActiveTrainer && preloadedState.activeTrainer && preloadedState.activeTrainer.id !== 't_default') {
          finalActiveTrainer = remoteTrainers.find(t => t.id === preloadedState.activeTrainer.id) || preloadedState.activeTrainer;
        }

        // 5. Default fallback to first active trainer in DB (but only if it's not empty)
        if (!finalActiveTrainer && remoteTrainers.length > 0) {
          finalActiveTrainer = remoteTrainers[0];
        }

        // Cache the active trainer referral identifier if it is a real trainer
        if (finalActiveTrainer && finalActiveTrainer.id !== 't_default' && typeof window !== 'undefined') {
          localStorage.setItem('gympulse_referred_trainer_id', finalActiveTrainer.id);
        }

        // Apply state updates to React
        setStudents(remoteStudents);
        setSheets(remoteSheets);
        setAgenda(remoteAgenda);
        setNotifications(remoteNotifications);
        setRevenueLogs(remoteRevenueLogs);
        setAccessLogs(remoteAccessLogs);
        setMarketingPlans(remoteMarketingPlans);
        setTrainers(remoteTrainers);
        setActiveTrainer(finalActiveTrainer);

        const firstId = urlStudentId || remoteStudents?.[0]?.id || '';
        setActiveStudentId(prev => urlStudentId || prev || firstId);

        let finalIsLoggedIn = preloadedState.isLoggedIn;
        let finalRole = preloadedState.role;

        if (urlStudentId) {
          setRole('student');
          setIsLoggedIn(false);
          finalRole = 'student';
          finalIsLoggedIn = false;
          addSyncLog(`Link de convite de aluno detectado: Aguardando autenticação da conta Google.`);
          const matchedStudent = remoteStudents.find(s => s.id === urlStudentId);
          if (matchedStudent && matchedStudent.status !== 'Ativo') {
            matchedStudent.status = 'Ativo';
            saveStudent(matchedStudent)
              .then(() => {
                addSyncLog(`[Firebase] Status do aluno "${matchedStudent.name}" pré-ativado na nuvem.`);
              })
              .catch(err => {
                console.error("Failed to pre-activate student on boot:", err);
              });
          }
        } else if (urlTrainerId) {
          setRole('student');
          setIsLoggedIn(false);
          finalRole = 'student';
          finalIsLoggedIn = false;
          addSyncLog(`Link de onboarding de treinador detectado: Redirecionando para Cadastro.`);
        } else if (urlRole === 'student') {
          setRole('student');
          setIsLoggedIn(false);
          finalRole = 'student';
          finalIsLoggedIn = false;
          addSyncLog(`Convite de aluno reconhecido. Prossiga com o login via Gmail.`);
        } else if (urlRole === 'trainer') {
          setRole('trainer');
          setIsLoggedIn(false);
          finalRole = 'trainer';
          finalIsLoggedIn = false;
          addSyncLog(`Link administrativo consultor detectado.`);
        }

        // Cache the latest synchronized cloud data (with existing cache for evolution & chats temporarily)
        saveState(
          remoteStudents,
          remoteSheets,
          preloadedState.evolution,
          remoteAgenda,
          preloadedState.chats,
          remoteNotifications,
          remoteRevenueLogs,
          remoteAccessLogs,
          finalIsLoggedIn,
          finalRole,
          remoteMarketingPlans,
          finalActiveTrainer,
          remoteTrainers
        );

        addSyncLog("Conexão real ao Firebase estabelecida com sucesso!");
        setSyncingStatus('synced');
        setLoadingFirebase(false);

        // Background synchronization of subcollections (biometrics/chats) to guarantee instantaneous loading
        (async () => {
          try {
            const evPromises: Promise<EvolutionRecord[]>[] = [];
            const chatPromises: Promise<ChatMessage[]>[] = [];
            const sIds: string[] = [];

            for (const s of remoteStudents) {
              sIds.push(s.id);
              evPromises.push(fetchAllEvolutionRecords(s.id));
              chatPromises.push(fetchAllChatMessages(s.id));
            }

            const [evs, chatsData] = await Promise.all([
              Promise.all(evPromises),
              Promise.all(chatPromises)
            ]);

            const remoteEvolution: Record<string, EvolutionRecord[]> = {};
            const remoteChats: Record<string, ChatMessage[]> = {};
            sIds.forEach((sid, idx) => {
              remoteEvolution[sid] = evs[idx] || [];
              remoteChats[sid] = chatsData[idx] || [];
            });

            // Hydrate states asynchronously and write back updated cache
            setEvolution(remoteEvolution);
            setChats(remoteChats);

            saveState(
              remoteStudents,
              remoteSheets,
              remoteEvolution,
              remoteAgenda,
              remoteChats,
              remoteNotifications,
              remoteRevenueLogs,
              remoteAccessLogs,
              finalIsLoggedIn,
              finalRole,
              remoteMarketingPlans,
              finalActiveTrainer,
              remoteTrainers
            );
            addSyncLog("Sincronização de biometria e chats concluída em segundo plano.");
          } catch (bgErr) {
            console.warn("Background subcollection sync fallback failed:", bgErr);
          }
        })();
      } catch (err) {
        clearTimeout(timeoutId);
        console.log("Firebase sync system warning:", err);
        addSyncLog("Erro de conexão ao Firebase. Ativando fallback...");
        loadDefaults();
        setSyncingStatus('error');
        setLoadingFirebase(false);
      }
    }

    initFirebaseSandbox();
  }, []);

  const loadDefaults = () => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    let parsed: any = null;
    if (cached) {
      try {
        parsed = JSON.parse(cached);
      } catch (e) {
        console.error("Error parsing cache in loadDefaults:", e);
      }
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
      stripePublishableKey: 'pk_test_sample_key',
      stripeSecretKey: ''
    };

    const recoveredStudents = (parsed?.students || INITIAL_STUDENTS).filter((s: any) => !['s1', 's2', 's3', 's4', 's5'].includes(s.id));
    const recoveredTrainers = (parsed?.trainers || []).filter((t: any) => t.id !== 't_default');
    const recoveredStudentId = parsed?.activeStudentId || (recoveredStudents[0]?.id) || '';
    const recoveredRole = parsed?.role || 'trainer';
    
    let recoveredTrainer = parsed?.activeTrainer || (recoveredTrainers[0] || null);
    if (recoveredRole === 'student' && recoveredStudentId) {
      const matchStu = recoveredStudents.find((s: any) => s.id === recoveredStudentId);
      if (matchStu && matchStu.trainerId) {
        recoveredTrainer = recoveredTrainers.find((t: any) => t.id === matchStu.trainerId) || recoveredTrainer;
      }
    }

    setStudents(recoveredStudents);
    setSheets(parsed?.sheets || INITIAL_SHEETS);
    setEvolution(parsed?.evolution || INITIAL_EVOLUTION_RECORDS);
    setAgenda(parsed?.agenda || INITIAL_AGENDA);
    setChats(parsed?.chats || INITIAL_CHATS);
    setNotifications(parsed?.notifications || INITIAL_NOTIFICATIONS);
    setRevenueLogs(parsed?.revenueLogs || REVENUE_LOGS);
    setAccessLogs(parsed?.accessLogs || INITIAL_ACCESS_LOGS);
    setMarketingPlans((parsed?.marketingPlans || INITIAL_MARKETING_PLANS).filter((p: any) => p.id !== 'Semestral'));
    setTrainers(recoveredTrainers);
    setActiveTrainer(recoveredTrainer);
    setActiveStudentId(recoveredStudentId);

    if (parsed) {
      setIsLoggedIn(parsed.isLoggedIn !== undefined ? parsed.isLoggedIn : false);
      setRole(parsed.role || 'trainer');
    }

    addSyncLog('Dados locais recuperados do cache offline de segurança.');
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
    newTrainers?: Trainer[],
    newActiveStudentId?: string
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
      trainers: newTrainers || trainers,
      activeStudentId: newActiveStudentId !== undefined ? newActiveStudentId : activeStudentId
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

  // Master reactive LocalStorage synchronization effect
  useEffect(() => {
    if (loadingFirebase) return;
    saveState(students, sheets, evolution, agenda, chats, notifications, revenueLogs);
  }, [students, sheets, evolution, agenda, chats, notifications, revenueLogs]);

  // Real-time synchronization of students list from Firebase Firestore
  useEffect(() => {
    if (loadingFirebase) return;

    const q = collection(db, 'students');
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Student);
      });

      // Filter out test students (match initial load filter)
      const filtered = list.filter(s => !['s1', 's2', 's3', 's4', 's5'].includes(s.id));

      setStudents((prev) => {
        // Deep compare to prevent unnecessary state triggers
        if (JSON.stringify(prev) === JSON.stringify(filtered)) {
          return prev;
        }
        return filtered;
      });
    }, (error) => {
      console.error("Error syncing students collection in real-time:", error);
    });

    return () => {
      unsub();
    };
  }, [loadingFirebase]);

  // Real-time synchronization of trainers from Firebase Firestore
  useEffect(() => {
    if (loadingFirebase) return;

    const q = collection(db, 'trainers');
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Trainer[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Trainer);
      });

      const filtered = list.filter(t => t.id !== 't_default');

      setTrainers((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(filtered)) {
          return prev;
        }
        return filtered;
      });
      
      // Keep activeTrainer updated if features changed
      setActiveTrainer((prevActive) => {
        if (!prevActive) return prevActive;
        const updatedSelf = filtered.find(t => t.id === prevActive.id);
        if (updatedSelf && JSON.stringify(updatedSelf) !== JSON.stringify(prevActive)) {
          return updatedSelf;
        }
        return prevActive;
      });
    }, (error) => {
      console.error("Error syncing trainers in real-time:", error);
    });

    return () => {
      unsub();
    };
  }, [loadingFirebase]);

  // Real-time synchronization of training sheets from Firebase Firestore
  useEffect(() => {
    if (loadingFirebase) return;

    const q = collection(db, 'sheets');
    const unsub = onSnapshot(q, (snapshot) => {
      const sheetsMap: Record<string, TrainingSheet> = {};
      snapshot.forEach((d) => {
        sheetsMap[d.id] = d.data() as TrainingSheet;
      });

      setSheets((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(sheetsMap)) {
          return prev;
        }
        return sheetsMap;
      });
    }, (error) => {
      console.error("Error syncing training sheets in real-time:", error);
    });

    return () => {
      unsub();
    };
  }, [loadingFirebase]);

  // Real-time synchronization of agenda events from Firebase Firestore
  useEffect(() => {
    if (loadingFirebase) return;

    const q = collection(db, 'agenda');
    const unsub = onSnapshot(q, (snapshot) => {
      const list: AgendaEvent[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AgendaEvent);
      });

      setAgenda((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(list)) {
          return prev;
        }
        return list;
      });
    }, (error) => {
      console.error("Error syncing agenda in real-time:", error);
    });

    return () => {
      unsub();
    };
  }, [loadingFirebase]);

  // Real-time synchronization of notifications from Firebase Firestore
  useEffect(() => {
    if (loadingFirebase) return;

    const q = collection(db, 'notifications');
    const unsub = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AppNotification);
      });

      // Sort notifications chronologically (newest first)
      list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

      setNotifications((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(list)) {
          return prev;
        }
        return list;
      });
    }, (error) => {
      console.error("Error syncing notifications in real-time:", error);
    });

    return () => {
      unsub();
    };
  }, [loadingFirebase]);

  // Real-time synchronization of evolution subcollections for each student
  useEffect(() => {
    if (loadingFirebase || students.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    students.forEach((student) => {
      const q = collection(db, 'students', student.id, 'evolution');
      const unsub = onSnapshot(q, (snapshot) => {
        const records: EvolutionRecord[] = [];
        snapshot.forEach((doc) => {
          records.push(doc.data() as EvolutionRecord);
        });

        // Sort records chronologically (newest first)
        records.sort((a, b) => {
          const tA = new Date(a.date).getTime() || 0;
          const tB = new Date(b.date).getTime() || 0;
          return tB - tA;
        });

        setEvolution((prev) => {
          const prevRecords = prev[student.id] || [];
          if (JSON.stringify(prevRecords) === JSON.stringify(records)) {
            return prev;
          }
          return {
            ...prev,
            [student.id]: records
          };
        });
      }, (error) => {
        console.error(`Error syncing evolution for student ${student.id}:`, error);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [loadingFirebase, students]);

  // Real-time synchronization of chats from Firebase Firestore using collections onSnapshot
  useEffect(() => {
    if (loadingFirebase || !isLoggedIn || students.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    students.forEach((student) => {
      const q = collection(db, 'students', student.id, 'chats');
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          msgs.push(doc.data() as ChatMessage);
        });

        // Sort messages chronologically by msg.id timestamp (msg_17156...)
        msgs.sort((a, b) => {
          const tA = Number(a.id.replace('msg_', '')) || 0;
          const tB = Number(b.id.replace('msg_', '')) || 0;
          return tA - tB;
        });

        setChats((prev) => {
          const prevMsgs = prev[student.id] || [];
          if (JSON.stringify(prevMsgs) === JSON.stringify(msgs)) {
            return prev;
          }
          return {
            ...prev,
            [student.id]: msgs
          };
        });
      }, (error) => {
        console.error(`Error syncing chats for student ${student.id}:`, error);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [loadingFirebase, isLoggedIn, students]);

  // Handle real or simulated Stripe Redirect Return parameters
  useEffect(() => {
    if (loadingFirebase) return;

    const params = new URLSearchParams(window.location.search);
    const hasLicenseSuccess = params.get('license_payment') === 'success';
    const hasStudentSuccess = params.get('student_payment') === 'success';

    if (hasLicenseSuccess) {
      const plan = params.get('plan') || 'Trimestral';
      const pendingTrainerStr = localStorage.getItem('gympulse_pending_trainer');
      if (pendingTrainerStr) {
        try {
          const pendingTrainer = JSON.parse(pendingTrainerStr) as Trainer;
          pendingTrainer.subscriptionStatus = 'paid';
          pendingTrainer.selectedPlan = plan as any;
          
          addSyncLog(`[Stripe Checkout] Novo personal cadastrado e ativado via retorno do Stripe: ${pendingTrainer.name}`);
          
          handleAddTrainer(pendingTrainer).then(() => {
            setIsLoggedIn(true);
            setRole('trainer');
            setActiveTrainer(pendingTrainer);
            localStorage.removeItem('gympulse_pending_trainer');
            
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            setTimeout(() => {
              alert(`🏋️ Sucesso! Seu plano de licença GymPulse (${plan}) foi ativado e sua conta foi criada!`);
            }, 300);
          });
        } catch (err) {
          console.error("Error processing pending trainer from Stripe checkout redirect:", err);
        }
      } else {
        const targetTrainer = activeTrainer || trainers[0];
        if (targetTrainer) {
          addSyncLog(`[Stripe Checkout] Processando retorno de ativação de plano.`);
          handleUpdateTrainer({
            ...targetTrainer,
            subscriptionStatus: 'paid',
            selectedPlan: plan as any
          }).then(() => {
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            setTimeout(() => {
              alert(`🏋️ Sucesso! Seu plano de licença GymPulse (${plan}) foi ativado e sincronizado com o Stripe!`);
            }, 300);
          });
        }
      }
    } else if (hasStudentSuccess) {
      const studentId = params.get('studentId') || activeStudentId;
      const plan = params.get('plan') || 'Mensal';
      if (studentId) {
        addSyncLog(`[Stripe Checkout] Confirmando pagamento de mensalidade.`);
        handleUpdateStudent(studentId, {
          status: 'Ativo',
          nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
        }).then(() => {
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          setTimeout(() => {
            alert(`🎉 Pagamento Stripe confirmado! Seu plano está 100% ativo.`);
          }, 300);
        });
      }
    }
  }, [loadingFirebase, trainers, students, activeTrainer]);

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
    const exists = trainers.some(t => t.id === trn.id);
    const updated = exists
      ? trainers.map(t => t.id === trn.id ? trn : t)
      : [...trainers, trn];
    setTrainers(updated);
    setActiveTrainer(trn);
    
    // Save to local storage synchronously first
    saveState(students, sheets, evolution, agenda, chats, notifications, revenueLogs, accessLogs, true, 'trainer', marketingPlans, trn, updated);

    addSyncLog(`[Firebase] Gravando novo profissional...`);
    saveTrainer(trn)
      .then(() => {
        addSyncLog(`[Firebase] Novo personal ${trn.name} cadastrado com sucesso.`);
      })
      .catch((e) => {
        console.error("Firebase save trainer failed:", e);
        addSyncLog(`[Error] Erro ao sincronizar cadastro de profissional.`);
      });
  };

  const handleUpdateTrainer = async (trn: Trainer) => {
    const updated = trainers.map(t => t.id === trn.id ? trn : t);
    setTrainers(updated);
    setActiveTrainer(trn);

    // Save to local storage synchronously first
    saveState(students, sheets, evolution, agenda, chats, notifications, revenueLogs, accessLogs, isLoggedIn, 'trainer', marketingPlans, trn, updated);

    addSyncLog(`[Firebase] Atualizando profissional...`);
    saveTrainer(trn)
      .then(() => {
        addSyncLog(`[Firebase] Configuração de ${trn.name} atualizada na nuvem.`);
      })
      .catch((e) => {
        console.error("Firebase update trainer failed:", e);
        addSyncLog(`[Error] Erro ao sincronizar atualização de profissional.`);
      });
  };
  
  const handleAddStudent = async (std: Student): Promise<Student> => {
    if (!std.email || !std.password) {
      throw new Error("E-mail e senha são obrigatórios para a criação do usuário no Firebase Auth.");
    }

    const emailClean = std.email.trim().toLowerCase();
    const passClean = std.password.trim();

    // 1. Resolve dynamic trainerId dynamically from URL or cached local storage if not provided on payload
    let resolvedTrainerId = std.trainerId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTrainerId = params.get('trainerId') || localStorage.getItem('gympulse_referred_trainer_id_raw');
      if (urlTrainerId && (!resolvedTrainerId || resolvedTrainerId === 't_default')) {
        const matched = trainers.find(t => 
          (t.customIdLink || '').toLowerCase() === urlTrainerId.toLowerCase() || 
          t.id.toLowerCase() === urlTrainerId.toLowerCase() ||
          (t.email || '').split('@')[0].toLowerCase() === urlTrainerId.toLowerCase()
        );
        if (matched) {
          resolvedTrainerId = matched.id;
          console.log(`[GymPulse App/Firebase Login] Capturado e resolvido trainerId da URL/Storage com sucesso: "${matched.name}" (ID: ${matched.id})`);
        } else {
          // Dynamic query from Firestore to ensure no generic personal falls back
          try {
            console.log(`[GymPulse App/Firebase Login] Buscando personal "${urlTrainerId}" diretamente em nuvem...`);
            const dbTrainer = await fetchTrainer(urlTrainerId);
            if (dbTrainer) {
              resolvedTrainerId = dbTrainer.id;
              std.trainerName = dbTrainer.name;
              std.nomePersonal = dbTrainer.name;
              console.log(`[GymPulse App/Firebase Login] Sucesso! Personal resolvido da nuvem: "${dbTrainer.name}" (ID: ${dbTrainer.id})`);
            }
          } catch (dbErr) {
            console.error("Erro ao buscar personal em nuvem no handleAddStudent:", dbErr);
          }
        }
      }
    }

    const finalTrainerIdToAssign = resolvedTrainerId || (activeTrainer && activeTrainer.id !== 't_default' ? activeTrainer.id : 't_default');

    const profileMetaObj = {
      name: std.name,
      plan: std.plan,
      phone: std.phoneWhatsApp || '',
      trainerId: finalTrainerIdToAssign,
      joinedAt: std.joinedAt,
      weight: std.weight,
      height: std.height,
      gender: std.gender,
      objective: std.objective,
      observations: std.observations
    };
    const profileMeta = JSON.stringify(profileMetaObj);

    addSyncLog(`[Firebase] Criando credenciais no Firebase Authentication para: "${emailClean}"...`);
    
    let uid = '';
    try {
      const user = await registerAuthUser(emailClean, passClean, profileMeta);
      uid = user.uid;
      addSyncLog(`[Firebase Auth] Usuário criado com sucesso no Authentication. UID: ${uid}`);
    } catch (authCreateErr: any) {
      console.error("[Firebase Auth Error] Erro ao criar conta de usuário:", authCreateErr);
      if (authCreateErr.code === 'auth/email-already-in-use') {
        let found = null;
        try {
          found = await fetchStudentByEmail(emailClean);
        } catch (fetchErr) {
          console.warn("Could not check existing profile by email in handleAddStudent:", fetchErr);
        }
        if (found) {
          throw new Error(`O e-mail "${emailClean}" já está cadastrado no sistema do Portal pertencente a ${found.name || 'outro aluno'}. Use outro e-mail para cadastrar.`);
        } else {
          throw new Error(`O e-mail "${emailClean}" já está cadastrado no Firebase Auth. O aluno pode fazer login diretamente com esse e-mail para criar seu perfil automaticamente.`);
        }
      } else if (authCreateErr.code === 'auth/weak-password') {
        throw new Error(`A senha informada é considerada fraca pelo Firebase Auth (mínimo de 6 caracteres).`);
      } else {
        throw new Error(`Falha no Firebase Authentication: ${authCreateErr.message || authCreateErr}`);
      }
    }

    // Now modify the std object to use this UID as reference for both Firestore and its object id
    std.id = uid;
    std.uid = uid;
    std.email = emailClean;
    
    // Set mapped Portuguese fields requested
    std.nome = std.name;
    std.telefone = std.phoneWhatsApp || '';
    std.plano = std.plan;
    std.status = std.status;
    std.onboarding = std.isProfileComplete ? 'completo' : 'pendente';

    std.trainerId = finalTrainerIdToAssign;
    let trainerObj = trainers.find(t => t.id === finalTrainerIdToAssign);
    if (!trainerObj && finalTrainerIdToAssign && finalTrainerIdToAssign !== 't_default') {
      try {
        console.log(`[GymPulse App/Firebase saveState] Aluno registrado sem cache na memória, buscando personal em nuvem para "${finalTrainerIdToAssign}"...`);
        const dbTrainer = await fetchTrainer(finalTrainerIdToAssign);
        if (dbTrainer) {
          trainerObj = dbTrainer;
        }
      } catch (err) {
        console.warn("Could not query trainer from Firestore during save validation:", err);
      }
    }

    if (trainerObj) {
      std.trainerName = trainerObj.name;
      std.nomePersonal = trainerObj.name;
    } else {
      std.trainerName = std.trainerName || 'Consultoria Geral';
      std.nomePersonal = std.nomePersonal || 'Consultoria Geral';
    }
    console.log(`[GymPulse App/Firebase saveState] Aluno registrado vinculando definitivamente ao trainerId: "${std.trainerId}" (${std.trainerName})`);

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

    // Persist to local storage synchronously and immediately
    saveState(updated, updatedSheets, updatedEvol, agenda, updatedChats, updatedNotifs, revenueLogs);

    // Save to Cloud securely in the background so that the UI updates instantly and feels blazingly fast!
    addSyncLog(`[Firebase] Iniciando persistência de dados do aluno no Firestore em segundo plano (UID: ${uid})...`);
    Promise.all([
      saveStudent(std),
      saveSheet(std.id, initSheet),
      saveEvolutionRecord(std.id, initRecord),
      saveChatMessage(std.id, initChat),
      saveNotification(initNotif)
    ])
      .then(() => {
        addSyncLog(`[Firebase] Aluno "${std.name}" e dados de suporte (ficha, evolução, chat, notificações) persistidos com sucesso no Firestore.`);
      })
      .catch((saveErr: any) => {
        console.error("[Firebase Save Failure] Falha ao persistir no Firestore (Background):", saveErr);
        addSyncLog(`[Error] Falha ao persistir os dados complementares de "${std.name}" no Firestore em segundo plano.`);
      });

    return std;
  };

  const handleUpdateStudent = async (id: string, data: Partial<Student>) => {
    // 1. Resolve current student record from state or fetch directly from Firestore if missing
    let currentStudent = students.find(s => s.id === id);
    
    if (!currentStudent) {
      try {
        currentStudent = await fetchStudent(id) || undefined;
      } catch (err) {
        console.warn("Could not fetch student directly in handleUpdateStudent fallback:", err);
      }
    }
    
    const updatedStudent: Student = currentStudent 
      ? { ...currentStudent, ...data }
      : { id, ...data } as Student;

    // 2. Update local students array
    let updated: Student[];
    const exists = students.some(s => s.id === id);
    if (exists) {
      updated = students.map(s => s.id === id ? updatedStudent : s);
    } else {
      updated = [...students, updatedStudent];
    }
    setStudents(updated);

    // 3. Persist state to local storage
    saveState(updated, sheets, evolution, agenda, chats, notifications, revenueLogs);

    // 4. Save to Cloud securely and directly
    addSyncLog(`[Firebase] Atualizando "${updatedStudent.name || id}" em nuvem (segundo plano)...`);
    return saveStudent(updatedStudent)
      .then(() => {
        addSyncLog(`[Firebase] Dados de "${updatedStudent.name || id}" atualizados em nuvem.`);
      })
      .catch((err) => {
        console.error("Firebase update student failed:", err);
        addSyncLog(`[Error] Falha ao sincronizar dados de "${updatedStudent.name || id}" em nuvem.`);
      });
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

    // Save to local storage synchronously and immediately
    saveState(updated, updatedSheets, updatedEvol, agenda, updatedChats, notifications, revenueLogs);

    addSyncLog(`[Firebase] Iniciando exclusão de "${targetName}" em nuvem...`);
    Promise.all([
      deleteDoc(doc(db, 'students', id)),
      deleteDoc(doc(db, 'sheets', id))
    ])
      .then(() => {
        addSyncLog(`[Firebase] Aluno e histórico limpos do servidor em nuvem.`);
      })
      .catch((err) => {
        console.error("Firebase delete student failed:", err);
        addSyncLog(`[Error] Erro de rede ao deletar registro.`);
      });
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

    // Save to local storage synchronously and immediately
    saveState(students, updatedSheets, evolution, agenda, chats, updatedNotifs, revenueLogs);

    saveSheet(studentId, sheetToSave)
      .then(() => saveNotification(newNotif))
      .then(() => {
        addSyncLog(`[Firebase] Planilha de treino de "${student?.name}" salva na nuvem.`);
      })
      .catch((err) => {
        console.error("Firebase save sheet failed:", err);
        addSyncLog(`[Error] Erro de sincronização de planilha.`);
      });
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

    // Save to local storage synchronously and immediately
    saveState(students, sheets, evolution, updated, chats, updatedNotifs, revenueLogs);

    const promises = [saveAgendaEvent(event)];
    if (newNotifAddress) {
      promises.push(saveNotification(newNotifAddress));
    }

    Promise.all(promises)
      .then(() => {
        addSyncLog(`[Firebase] Data agendada para "${event.title}" gravada com sucesso.`);
      })
      .catch((err) => {
        console.error("Firebase save agenda failed:", err);
        addSyncLog(`[Error] Erro ao sincronizar agenda.`);
      });
  };

  const handleDeleteAgendaEvent = async (id: string) => {
    const target = agenda.find(e => e.id === id);
    const updated = agenda.filter(e => e.id !== id);
    setAgenda(updated);
    
    // Save to local storage synchronously and immediately
    saveState(students, sheets, evolution, updated, chats, notifications, revenueLogs);

    deleteAgendaEventDoc(id)
      .then(() => {
        addSyncLog(`[Firebase] Evento "${target?.title}" removido com sucesso.`);
      })
      .catch((err) => {
        console.error("Firebase delete agenda failed:", err);
        addSyncLog(`[Error] Falha ao apagar compromisso.`);
      });
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

    // Save synchronously and immediately
    saveState(students, sheets, evolution, agenda, updatedChats, notifications, revenueLogs);
    addSyncLog(`[CONVERSA] Mensagem enviada por ${senderRole === 'trainer' ? 'Personal' : 'Aluno'}: "${text.substring(0, 30)}..."`);

    saveChatMessage(studentId, newMsg)
      .catch((err) => {
        console.error("Firebase message dispatch error:", err);
      });
  };

  const handleSendNotification = async (notif: AppNotification) => {
    const updated = [notif, ...notifications];
    setNotifications(updated);

    // Save synchronously and immediately
    saveState(students, sheets, evolution, agenda, chats, updated, revenueLogs);

    saveNotification(notif)
      .then(() => {
        addSyncLog(`[Firebase] Notificação manual persistida.`);
      })
      .catch((err) => {
        console.error("Firebase save notification failed:", err);
      });
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

    // Save synchronously and immediately
    saveState(updatedStudents, sheets, updatedEvol, agenda, chats, updatedNotifs, revenueLogs);

    const targetObj = updatedStudents.find(s => s.id === studentId);
    const promises = [
      saveEvolutionRecord(studentId, record),
      saveNotification(newNotif)
    ];
    if (targetObj) {
      promises.push(saveStudent(targetObj));
    }

    Promise.all(promises)
      .then(() => {
        addSyncLog(`[Firebase] Registro biométrico integrado e salvo.`);
      })
      .catch((err) => {
        console.error("Firebase save evolution failed:", err);
        addSyncLog(`[Error] Falha ao sincronizar biometria.`);
      });
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

    // Save synchronously and immediately
    saveState(students, sheets, evolution, agenda, chats, updatedNotifs, updatedRevenue);

    const activeMonthLog = updatedRevenue[updatedRevenue.length - 1];
    Promise.all([
      saveNotification(completedNotif),
      saveRevenueLog(activeMonthLog)
    ])
      .then(() => {
        addSyncLog(`[Firebase] Ficha de rendimento físico salva no banco cloud.`);
      })
      .catch((err) => {
        console.error("Firebase update revenue logs failed:", err);
        addSyncLog(`[Error] Erro ao sincronizar conclusão de treinos.`);
      });
  };

  const handleLoginSuccess = (enteredRole: 'trainer' | 'student' | 'admin', studentId?: string, loggedInTrainer?: Trainer, loggedInStudent?: Student) => {
    setRole(enteredRole);
    if (studentId) {
      setActiveStudentId(studentId);
    }
    
    let trainerToSet: Trainer | null = null;
    let finalStudents = [...students];

    if (enteredRole === 'trainer') {
      trainerToSet = loggedInTrainer || trainers[0] || null;
      setActiveTrainer(trainerToSet);
    } else if (enteredRole === 'student') {
      const targetStudentId = studentId || activeStudentId;
      
      // If we got the direct student object from LoginScreen (which queried Firestore directly),
      // we can merge it into the students state if it's missing or update it to match the login credentials!
      let activeStudent = finalStudents.find(s => s.id === targetStudentId);
      if (!activeStudent && loggedInStudent) {
        activeStudent = loggedInStudent;
        if (!finalStudents.some(s => s.id === loggedInStudent.id)) {
          finalStudents = [...finalStudents, loggedInStudent];
          setStudents(finalStudents);
        }
      }

      if (activeStudent) {
        if (activeStudent.status !== 'Ativo') {
          activeStudent.status = 'Ativo';
          saveStudent(activeStudent).catch(err => {
            console.error("Failed to auto-activate student on success login:", err);
          });
        }
      }
      
      let foundTrainerId: string | undefined = undefined;
      
      // 1. Look up trainerId directly from URL referral params first (it is the invite/professional origin!)
      const params = new URLSearchParams(window.location.search);
      const urlTrainerId = params.get('trainerId');
      if (urlTrainerId) {
        const matched = trainers.find(
          t => (t.customIdLink || '').toLowerCase() === urlTrainerId.toLowerCase() || 
               t.id.toLowerCase() === urlTrainerId.toLowerCase() ||
               (t.email || '').split('@')[0].toLowerCase() === urlTrainerId.toLowerCase()
        );
        if (matched) {
          foundTrainerId = matched.id;
        }
      }
      
      // 2. Look up trainerId from localStorage stored cache fallback
      if (!foundTrainerId && typeof window !== 'undefined') {
        const storedTrainerId = localStorage.getItem('gympulse_referred_trainer_id');
        if (storedTrainerId && storedTrainerId !== 't_default') {
          foundTrainerId = storedTrainerId;
        }
      }
      
      if (!foundTrainerId && activeStudent && activeStudent.trainerId && activeStudent.trainerId !== 't_default') {
        foundTrainerId = activeStudent.trainerId;
      }
      
      if (!foundTrainerId && activeTrainer && activeTrainer.id !== 't_default') {
        foundTrainerId = activeTrainer.id;
      }

      if (foundTrainerId) {
        trainerToSet = trainers.find(t => t.id === foundTrainerId) || null;
      }

      if (!trainerToSet && trainers.length > 0) {
        const firstReal = trainers.find(t => t.id !== 't_default');
        trainerToSet = (activeTrainer && activeTrainer.id !== 't_default') ? activeTrainer : (firstReal || trainers[0]);
      }
      
      // Auto-bind student to trainer persistently in the database if there is a mismatch or missing trainerId!
      if (activeStudent && trainerToSet && activeStudent.trainerId !== trainerToSet.id) {
        const updatedStudent = { ...activeStudent, trainerId: trainerToSet.id };
        finalStudents = finalStudents.map(s => s.id === activeStudent.id ? updatedStudent : s);
        setStudents(finalStudents);
        saveStudent(updatedStudent).then(() => {
          addSyncLog(`[Firebase] Vinculando Aluno "${activeStudent.name}" ao Personal Coach "${trainerToSet?.name}" com sucesso.`);
        }).catch(err => {
          console.error("Failed to persist student trainerId auto-bind:", err);
        });
      }
      
      setActiveTrainer(trainerToSet);
    }
    
    setIsLoggedIn(true);
    setOriginalAdminSession(enteredRole === 'admin');
    
    saveState(
      finalStudents,
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
      trainerToSet,
      trainers,
      studentId
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

    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('role');
        url.searchParams.delete('studentId');
        url.searchParams.delete('trainerId');
        window.history.pushState({}, '', url.pathname + url.search);
      } catch (e) {
        console.warn('Could not clear URL parameters on logout', e);
      }
    }
    
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

  const resetAllDataButton = async (bypassConfirm = true) => {
    if (bypassConfirm) {
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
        setActiveStudentId(INITIAL_STUDENTS[0]?.id || 's1');

        setIsLoggedIn(false);
        addSyncLog("Firebase restaurado com dados sementes de demonstração.");
      } catch (err) {
        addSyncLog("Erro ao sincronizar reset do Firebase.");
      } finally {
        setLoadingFirebase(false);
      }
    }
  };

  const handlePurgeTestAccounts = async () => {
    setLoadingFirebase(true);
    try {
      addSyncLog("Excluindo alunos fictícios e treinador de testes do Firebase...");
      await purgeTestAccountsFirestore();
      
      const remainingStudents = students.filter(s => !['s1', 's2', 's3', 's4', 's5'].includes(s.id));
      setStudents(remainingStudents);
      
      const newSheets = { ...sheets };
      const newEvolution = { ...evolution };
      const newChats = { ...chats };
      
      for (const sid of ['s1', 's2', 's3', 's4', 's5']) {
        delete newSheets[sid];
        delete newEvolution[sid];
        delete newChats[sid];
      }
      setSheets(newSheets);
      setEvolution(newEvolution);
      setChats(newChats);
      
      setTrainers(prev => prev.filter(t => t.id !== 't_default'));
      if (activeTrainer?.id === 't_default') {
        setActiveTrainer(null);
        setIsLoggedIn(false);
      }
      
      addSyncLog("Contas de teste de demonstração removidas com sucesso.");
    } catch (err: any) {
      console.error(err);
      addSyncLog("Erro ao remover contas de teste: " + err.message);
    } finally {
      setLoadingFirebase(false);
    }
  };

  const handlePurgeAllData = async () => {
    setLoadingFirebase(true);
    try {
      addSyncLog("Limpando base de dados do Firestore totalmente...");
      await purgeEntireDatabaseFirestore();
      
      setStudents([]);
      setSheets({});
      setEvolution({});
      setAgenda([]);
      setChats({});
      setNotifications([]);
      setRevenueLogs([]);
      setAccessLogs([]);
      setTrainers([]);
      setActiveTrainer(null);
      setIsLoggedIn(false);
      
      addSyncLog("Toda a base de dados foi apagada com sucesso (estado virgem de produção).");
    } catch (err: any) {
      console.error(err);
      addSyncLog("Erro ao limpar base de dados: " + err.message);
    } finally {
      setLoadingFirebase(false);
    }
  };


  // Find customizable theme color based on role or URL parameters
  const getActiveThemeColor = () => {
    // 1. If trainer is logged in
    if (isLoggedIn && role === 'trainer' && activeTrainer) {
      return activeTrainer.themeColor || '#39FF14';
    }
    
    // 2. If student is logged in
    if (isLoggedIn && role === 'student' && activeStudentId) {
      const activeStudent = students.find(s => s.id === activeStudentId);
      if (activeStudent?.trainerId) {
        const studentTrainer = trainers.find(t => t.id === activeStudent.trainerId);
        if (studentTrainer?.themeColor) {
          return studentTrainer.themeColor;
        }
      }
    }
    
    // 3. If nobody is logged in, check URL ?trainerId=
    if (!isLoggedIn && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTrainerId = params.get('trainerId');
      if (urlTrainerId) {
        // Find by customIdLink or id
        const matchedTrainer = trainers.find(t => 
          t.customIdLink?.toLowerCase() === urlTrainerId.toLowerCase() || 
          t.id === urlTrainerId
        );
        if (matchedTrainer?.themeColor) {
          return matchedTrainer.themeColor;
        }
      }
    }
    
    // Fallback: If we have an activeTrainer set in preloadedState or default state
    if (activeTrainer?.themeColor) {
      return activeTrainer.themeColor;
    }
    
    return '#39FF14'; // original neon green pulse
  };

  const hexToRgb = (hex: string): string => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '57, 255, 20';
  };

  const themeColor = getActiveThemeColor();
  const themeColorRgb = hexToRgb(themeColor);

  return (
    <div className="bg-[#09090b] min-h-screen text-neutral-100 flex flex-col antialiased selection:bg-[#39FF14] selection:text-black">
      
      {/* Dynamic Style Theme Injector */}
      <style>{`
        :root {
          --brand-color: ${themeColor};
          --brand-color-rgb: ${themeColorRgb};
        }
        
        ::selection {
          background-color: var(--brand-color) !important;
          color: #000000 !important;
        }

        /* Override exact Tailwind utility classes for dynamic theme mapping */
        .text-\\[\\#39FF14\\] {
          color: ${themeColor} !important;
        }
        .bg-\\[\\#39FF14\\] {
          background-color: ${themeColor} !important;
        }
        .border-\\[\\#39FF14\\] {
          border-color: ${themeColor} !important;
        }
        .border-\\[\\#39FF14\\]\\/20 {
          border-color: rgba(${themeColorRgb}, 0.2) !important;
        }
        .border-\\[\\#39FF14\\]\\/25 {
          border-color: rgba(${themeColorRgb}, 0.25) !important;
        }
        .border-\\[\\#39FF14\\]\\/30 {
          border-color: rgba(${themeColorRgb}, 0.3) !important;
        }
        .border-\\[\\#39FF14\\]\\/40 {
          border-color: rgba(${themeColorRgb}, 0.4) !important;
        }
        .border-\\[\\#39FF14\\]\\/50 {
          border-color: rgba(${themeColorRgb}, 0.5) !important;
        }
        .bg-\\[\\#39FF14\\]\\/10 {
          background-color: rgba(${themeColorRgb}, 0.1) !important;
        }
        .bg-\\[\\#39FF14\\]\\/15 {
          background-color: rgba(${themeColorRgb}, 0.15) !important;
        }
        .bg-\\[\\#39FF14\\]\\/20 {
          background-color: rgba(${themeColorRgb}, 0.2) !important;
        }
        .shadow-\\[\\#39FF14\\]\\/10 {
          --tw-shadow-color: rgba(${themeColorRgb}, 0.1) !important;
          box-shadow: 0 4px 6px -1px rgba(${themeColorRgb}, 0.1), 0 2px 4px -1px rgba(${themeColorRgb}, 0.06) !important;
        }
        .shadow-\\[\\#39FF14\\]\\/25 {
          --tw-shadow-color: rgba(${themeColorRgb}, 0.25) !important;
          box-shadow: 0 10px 15px -3px rgba(${themeColorRgb}, 0.25), 0 4px 6px -2px rgba(${themeColorRgb}, 0.05) !important;
        }
        .hover\\:shadow-\\[\\#39FF14\\]\\/25:hover {
          --tw-shadow-color: rgba(${themeColorRgb}, 0.25) !important;
          box-shadow: 0 10px 15px -3px rgba(${themeColorRgb}, 0.25), 0 4px 6px -2px rgba(${themeColorRgb}, 0.05) !important;
        }
        .hover\\:bg-green-400:hover {
          background-color: ${themeColor} !important;
          filter: brightness(1.1) !important;
        }
        .hover\\:border-\\[\\#39FF14\\]:hover {
          border-color: ${themeColor} !important;
        }
        .from-\\[\\#39FF14\\]\\/10 {
          --tw-gradient-from: rgba(${themeColorRgb}, 0.1) !important;
          --tw-gradient-to: rgba(${themeColorRgb}, 0) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        .from-\\[\\#39FF14\\]\\/20 {
          --tw-gradient-from: rgba(${themeColorRgb}, 0.2) !important;
          --tw-gradient-to: rgba(${themeColorRgb}, 0) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        .to-\\[\\#39FF14\\]\\/5 {
          --tw-gradient-to: rgba(${themeColorRgb}, 0.05) !important;
        }
        .to-\\[\\#39FF14\\]\\/10 {
          --tw-gradient-to: rgba(${themeColorRgb}, 0.1) !important;
        }
        .from-\\[\\#39FF14\\] {
          --tw-gradient-from: ${themeColor} !important;
        }
        .to-\\[\\#39FF14\\] {
          --tw-gradient-to: ${themeColor} !important;
        }
        
        /* General custom indicator colors */
        .text-green-400 {
          color: ${themeColor} !important;
        }
        .bg-green-500 {
          background-color: ${themeColor} !important;
        }
        .bg-green-600 {
          background-color: ${themeColor} !important;
          filter: brightness(0.9) !important;
        }
      `}</style>
      
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
              onUpdateStudent={handleUpdateStudent}
            />
          ) : (
            role === 'admin' ? (
              <AdminDashboard
                students={students}
                trainers={trainers}
                accessLogs={accessLogs}
                onImpersonateTrainer={handleImpersonateTrainer}
                onImpersonateStudent={handleImpersonateStudent}
                onLogout={handleLogout}
                onDeleteStudent={handleDeleteStudent}
                onPurgeTestAccounts={handlePurgeTestAccounts}
                onPurgeAllData={handlePurgeAllData}
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
                onPurgeTestAccounts={handlePurgeTestAccounts}
              />
            ) : (
              <StudentDashboard
                students={students}
                trainers={trainers}
                activeTrainer={activeTrainer}
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
                onUpdateTrainer={handleUpdateTrainer}
                onUpdateStudent={handleUpdateStudent}
              />
            )
          )}
        </div>
      )}

    </div>
  );
}

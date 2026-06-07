import React, { useState, useMemo } from 'react';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Bell, CreditCard, 
  Plus, Trash2, Edit3, CheckCircle, TrendingUp, DollarSign, 
  AlertCircle, Star, Search, Send, Smile, Phone, Video, 
  MapPin, Clock, ArrowUpRight, BarChart2, Check, X, Award, Copy, LogOut, Lock,
  Upload, Image, Eye, EyeOff, Smartphone, MessageCircle, Zap, Clipboard, Settings, Mail
} from 'lucide-react';
import { Student, Exercise, TrainingSheet, EvolutionRecord, AgendaEvent, ChatMessage, AppNotification, RevenueLog, Objective, PlanType, WorkoutExercise, AccessLog, MarketingPlan, Trainer } from '../types';
import { EXERCISE_BANK } from '../mockData';
import SimulatedStripeCheckout from './SimulatedStripeCheckout';
import { motion } from 'motion/react';

interface TrainerDashboardProps {
  students: Student[];
  sheets: Record<string, TrainingSheet>;
  evolution: Record<string, EvolutionRecord[]>;
  agenda: AgendaEvent[];
  chats: Record<string, ChatMessage[]>;
  notifications: AppNotification[];
  revenueLogs: RevenueLog[];
  accessLogs: AccessLog[];
  marketingPlans?: MarketingPlan[];
  activeTrainer?: Trainer | null;
  onUpdateTrainer?: (trainer: Trainer) => void;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (id: string, data: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onUpdateSheet: (studentId: string, sheet: TrainingSheet) => void;
  onAddAgendaEvent: (event: AgendaEvent) => void;
  onDeleteAgendaEvent: (id: string) => void;
  onSendMessage: (studentId: string, text: string) => void;
  onSendNotification: (notification: AppNotification) => void;
  onTriggerAutoResponse: (studentId: string) => void;
  onLogout?: () => void;
  onUpdateMarketingPlan?: (plan: MarketingPlan) => void;
  onPurgeTestAccounts?: () => Promise<void>;
}

export default function TrainerDashboard({
  students: rawStudents,
  sheets,
  evolution,
  agenda,
  chats,
  notifications,
  revenueLogs,
  accessLogs,
  marketingPlans = [],
  activeTrainer = null,
  onUpdateTrainer,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onUpdateSheet,
  onAddAgendaEvent,
  onDeleteAgendaEvent,
  onSendMessage,
  onSendNotification,
  onTriggerAutoResponse,
  onLogout,
  onUpdateMarketingPlan,
  onPurgeTestAccounts
}: TrainerDashboardProps) {
  const students = useMemo(() => {
    return rawStudents.filter(s => activeTrainer ? s.trainerId === activeTrainer.id : true);
  }, [rawStudents, activeTrainer]);

  const [activeTab, setActiveTab] = useState<'alunos' | 'cadastrar_aluno' | 'agenda' | 'treinos' | 'chat' | 'notificacoes' | 'planos' | 'logs' | 'configuracoes'>('alunos');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSortBy, setStudentSortBy] = useState<'name' | 'joinDate'>('name');
  
  const filteredAndSortedStudents = useMemo(() => {
    return [...students]
      .filter((student) => {
        if (!studentSearchQuery.trim()) return true;
        const q = studentSearchQuery.toLowerCase();
        return (
          student.name.toLowerCase().includes(q) ||
          student.objective.toLowerCase().includes(q) ||
          student.plan.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (studentSortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else {
          const parseJoinDate = (dStr: string) => {
            if (!dStr) return 0;
            const parts = dStr.split('/');
            if (parts.length === 3) {
              return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
            }
            return new Date(dStr).getTime() || 0;
          };
          return parseJoinDate(b.joinedAt) - parseJoinDate(a.joinedAt);
        }
      });
  }, [students, studentSearchQuery, studentSortBy]);
  
  // Trainer SaaS & Recruitment Link States
  const [copiedRecruitmentLink, setCopiedRecruitmentLink] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [copiedDashboardPix, setCopiedDashboardPix] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Integrated WhatsApp and Connection Dialog states
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waActiveStudent, setWaActiveStudent] = useState<Student | null>(null);
  const [waCustomMessage, setWaCustomMessage] = useState('');
  
  // SaaS payment states
  const [licensePaymentMethod, setLicensePaymentMethod] = useState<'pix' | 'stripe'>('pix');
  const [licenseCardNumber, setLicenseCardNumber] = useState('');
  const [licenseCardName, setLicenseCardName] = useState('');
  const [licenseCardExpiry, setLicenseCardExpiry] = useState('');
  const [licenseCardCvv, setLicenseCardCvv] = useState('');
  const [licensePaymentLoadingStep, setLicensePaymentLoadingStep] = useState(0); // 0 = none, 1 = connecting, 2 = authorizing, 3 = finalizing
  const [saasStripeError, setSaasStripeError] = useState("");
  const [licenseSelectedPlan, setLicenseSelectedPlan] = useState<PlanType>(activeTrainer?.selectedPlan || 'Trimestral');
  const [showSimulatedStripe, setShowSimulatedStripe] = useState(false);
  
  // Profile Configuration states
  const [profileTrainerName, setProfileTrainerName] = useState(activeTrainer?.name || 'Daniel Personal Coach');
  const [profileTrainerLink, setProfileTrainerLink] = useState(activeTrainer?.customIdLink || 'daniel-personal');
  const [profileTrainerPlan, setProfileTrainerPlan] = useState<PlanType>(activeTrainer?.selectedPlan || 'Trimestral');
  const [profilePixKeyType, setProfilePixKeyType] = useState<'CNPJ' | 'CPF' | 'Telefone' | 'E-mail' | 'Chave Aleatória'>(activeTrainer?.pixKeyType || 'Chave Aleatória');
  const [profilePixKey, setProfilePixKey] = useState(activeTrainer?.pixKey || '9bbf9c81-8077-4cdd-bb85-055ee56bfd31');
  const [profilePixQrCode, setProfilePixQrCode] = useState(activeTrainer?.pixQrCode || '');
  const [profilePhoneWhatsApp, setProfilePhoneWhatsApp] = useState(activeTrainer?.phoneWhatsApp || '+5511999999999');
  const [profileStripeEnabled, setProfileStripeEnabled] = useState(activeTrainer?.stripeEnabled ?? true);
  const [profileStripePublishableKey, setProfileStripePublishableKey] = useState(activeTrainer?.stripePublishableKey || 'pk_test_sample_key');
  const [profileStripeSecretKey, setProfileStripeSecretKey] = useState(activeTrainer?.stripeSecretKey || '');
  const [showSecretKeyField, setShowSecretKeyField] = useState(false);
  const [profileThemeColor, setProfileThemeColor] = useState(activeTrainer?.themeColor || '#39FF14');
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState<string | null>(null);

  const handleSaveGlobalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateTrainer && activeTrainer) {
      const updated: Trainer = {
        ...activeTrainer,
        name: profileTrainerName.trim(),
        customIdLink: profileTrainerLink.trim().toLowerCase().replace(/\s+/g, '-'),
        selectedPlan: profileTrainerPlan,
        pixKeyType: profilePixKeyType,
        pixKey: profilePixKey.trim(),
        phoneWhatsApp: profilePhoneWhatsApp.trim(),
        stripeEnabled: profileStripeEnabled,
        stripePublishableKey: profileStripePublishableKey.trim(),
        stripeSecretKey: profileStripeSecretKey.trim(),
        themeColor: profileThemeColor
      };
      onUpdateTrainer(updated);
      setSettingsSavedFeedback("Configurações atualizadas com sucesso e salvas na nuvem Firebase!");
      setTimeout(() => {
        setSettingsSavedFeedback(null);
      }, 5000);
    }
  };

  const handleStripeCheckoutSaaS = async () => {
    setLicensePaymentLoadingStep(1); // 1 = Connecting to Stripe API
    setSaasStripeError("");
    try {
      const priceMap: Record<PlanType, number> = {
        'Mensal': 39.90,
        'Trimestral': 97.00,
        'Semestral': 180.00,
        'Anual': 297.00
      };
      const price = priceMap[licenseSelectedPlan] || 97.00;

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planName: licenseSelectedPlan,
          price: price,
          successUrl: window.location.origin + window.location.pathname + `?license_payment=success&plan=${licenseSelectedPlan}`,
          cancelUrl: window.location.href,
          trainerId: activeTrainer?.id || 'daniel-personal'
        })
      });

      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.warn("Could not parse Stripe API response as JSON, falling back to simulation mode.", parseError);
        data = { isSimulation: true };
      }

      if (data.sessionUrl) {
        // Try to open in a new tab first to avoid iframe blocking
        const stripeWindow = window.open(data.sessionUrl, '_blank');
        if (!stripeWindow || stripeWindow.closed || typeof stripeWindow.closed === 'undefined') {
          // Fallback to top-level/iframe window redirect if blocked by popup blocker
          try {
            window.top!.location.href = data.sessionUrl;
          } catch (e) {
            window.location.href = data.sessionUrl;
          }
        }
      } else if (data.isSimulation) {
        // Stripe Key not configured, open mockup Stripe checkout overlay
        console.log("Stripe key is missing, opening mockup Stripe checkout overlay.");
        setLicensePaymentLoadingStep(0);
        setShowSimulatedStripe(true);
      } else {
        // Error returned from Stripe API (e.g. key permission issues)
        console.error("Stripe API error response:", data.error);
        setSaasStripeError(data.error || "Ocorreu uma falha ao abrir a página do Stripe.");
        setLicensePaymentLoadingStep(0);
      }
    } catch (err: any) {
      console.error("Stripe error:", err);
      setSaasStripeError(err?.message || "Erro ao contatar o servidor do Stripe.");
      setLicensePaymentLoadingStep(0);
    }
  };

  const handleBypassStripeSaaSSimulate = () => {
    setSaasStripeError("");
    setLicensePaymentLoadingStep(2);
    setTimeout(() => {
      setLicensePaymentLoadingStep(3);
      setTimeout(() => {
        if (onUpdateTrainer && activeTrainer) {
          onUpdateTrainer({
            ...activeTrainer,
            subscriptionStatus: 'paid',
            selectedPlan: licenseSelectedPlan
          });
        }
        setLicensePaymentLoadingStep(4);
        setTimeout(() => {
          setLicensePaymentLoadingStep(0);
          setShowUpgradeModal(false);
        }, 2000);
      }, 1200);
    }, 1200);
  };

  const [savedReceivingFeedback, setSavedReceivingFeedback] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePixQrCode(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePixQrCode(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    if (activeTrainer) {
      setProfileTrainerName(activeTrainer.name);
      setProfileTrainerLink(activeTrainer.customIdLink);
      setProfileTrainerPlan(activeTrainer.selectedPlan);
      setProfilePixKeyType(activeTrainer.pixKeyType || 'Chave Aleatória');
      setProfilePixKey(activeTrainer.pixKey || '');
      setProfilePixQrCode(activeTrainer.pixQrCode || '');
      setProfilePhoneWhatsApp(activeTrainer.phoneWhatsApp || '');
      setProfileStripeEnabled(activeTrainer.stripeEnabled ?? true);
      setProfileStripePublishableKey(activeTrainer.stripePublishableKey || '');
      setProfileStripeSecretKey(activeTrainer.stripeSecretKey || '');
      setLicenseSelectedPlan(activeTrainer.selectedPlan || 'Trimestral');
      setProfileThemeColor(activeTrainer.themeColor || '#39FF14');
    }
  }, [activeTrainer]);

  // Inline delete confirmation state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // States for forms and modal toggles
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [cadastroMode, setCadastroMode] = useState<'rapido' | 'completo'>('rapido');
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    email: '',
    password: '',
    age: 25,
    weight: 70,
    height: 1.75,
    objective: 'Hipertrofia',
    restrictions: '',
    history: '',
    plan: 'Mensal',
    status: 'Ativo',
    phoneWhatsApp: ''
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  React.useEffect(() => {
    setIsConfirmingDelete(false);
  }, [selectedStudentId]);

  const [editingSheetLetter, setEditingSheetLetter] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [selectedExerciseId, setSelectedExerciseId] = useState(EXERCISE_BANK[0].id);
  const [newExerciseSets, setNewExerciseSets] = useState(4);
  const [newExerciseReps, setNewExerciseReps] = useState('10-12');
  const [newExerciseRest, setNewExerciseRest] = useState(90);
  const [newExerciseWeight, setNewExerciseWeight] = useState(20);
  const [newExerciseNotes, setNewExerciseNotes] = useState('');

  // Agenda Form State
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<AgendaEvent>>({
    title: '',
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    type: 'Presencial',
    durationMin: 60,
    notes: ''
  });

  // Chat filter and draft
  const [chatStudentId, setChatStudentId] = useState<string>(students[0]?.id || '');
  const [chatDraft, setChatDraft] = useState('');

  // Notification draft
  const [notifTargetStudent, setNotifTargetStudent] = useState<string>('all');
  const [notifChannel, setNotifChannel] = useState<'push' | 'whatsapp' | 'email'>('whatsapp');
  const [notifType, setNotifType] = useState<'reminder' | 'motivation' | 'plan' | 'workout'>('reminder');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  // Plan editing states
  const [editingPlan, setEditingPlan] = useState<MarketingPlan | null>(null);
  const [editingFeaturesText, setEditingFeaturesText] = useState<string>('');

  // Personal/Individual student plan editing states
  const [editingStudentPlan, setEditingStudentPlan] = useState<boolean>(false);
  const [tempStudentPlan, setTempStudentPlan] = useState<PlanType>('Mensal');
  const [tempStudentValue, setTempStudentValue] = useState<number>(0);
  const [tempStudentStatus, setTempStudentStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [tempStudentName, setTempStudentName] = useState('');
  const [tempStudentPhone, setTempStudentPhone] = useState('');
  const [tempStudentEmail, setTempStudentEmail] = useState('');
  const [tempStudentPassword, setTempStudentPassword] = useState('');
  const [tempStudentAge, setTempStudentAge] = useState(25);
  const [tempStudentWeight, setTempStudentWeight] = useState(70);
  const [tempStudentHeight, setTempStudentHeight] = useState(1.70);
  const [tempStudentObjective, setTempStudentObjective] = useState<Objective>('Hipertrofia');
  const [tempStudentRestrictions, setTempStudentRestrictions] = useState('');
  const [tempStudentHistory, setTempStudentHistory] = useState('');

  // Computed Stats for Trainer Overview
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Ativo').length;
  const currentMonthRevenue = revenueLogs[revenueLogs.length - 1]?.total || 0;
  
  // Quick student details computed
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedStudentEvolution = selectedStudentId ? (evolution[selectedStudentId] || []) : [];
  const latestEvolution = selectedStudentEvolution[selectedStudentEvolution.length - 1];

  // Exercises on selected training sheet letter
  const currentSheetExercises = (selectedStudentId && sheets[selectedStudentId]) 
    ? (sheets[selectedStudentId][editingSheetLetter] || []) 
    : [];

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name) return;
    
    // Auto populate values
    const studentId = 's_' + Date.now();
    
    // Values based on rapid vs full mode
    const isRapido = cadastroMode === 'rapido';
    
    const createdStudent: Student = {
      id: studentId,
      name: newStudent.name.trim(),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150&auto=format&fit=crop&q=80`,
      age: isRapido ? 25 : Number(newStudent.age || 25),
      weight: isRapido ? 70 : Number(newStudent.weight || 70),
      height: isRapido ? 1.70 : Number(newStudent.height || 1.70),
      objective: isRapido ? 'Hipertrofia' : ((newStudent.objective as Objective) || 'Hipertrofia'),
      restrictions: isRapido ? 'Nenhuma restrição (Cadastro Rápido).' : (newStudent.restrictions || 'Nenhuma restrição informada.'),
      history: isRapido ? 'Iniciante (Modo Pré-cadastro rápido).' : (newStudent.history || 'Iniciante.'),
      plan: (newStudent.plan as PlanType) || 'Mensal',
      status: (newStudent.status as 'Ativo' | 'Inativo') || 'Inativo', // Default inativo until profile complete
      joinedAt: new Date().toLocaleDateString('pt-BR'),
      nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      value: newStudent.plan === 'Anual' ? 90.00 : newStudent.plan === 'Semestral' ? 120.00 : newStudent.plan === 'Trimestral' ? 140.00 : 150.00,
      phoneWhatsApp: newStudent.phoneWhatsApp ? newStudent.phoneWhatsApp.trim() : undefined,
      trainerId: activeTrainer?.id || 't_default',
      email: '', // Password-less Google connection
      password: '',
      isProfileComplete: false
    };

    onAddStudent(createdStudent);
    setSelectedStudentId(studentId);
    setActiveTab('alunos');
    // reset form
    setNewStudent({
      name: '',
      email: '',
      password: '',
      age: 25,
      weight: 70,
      height: 1.75,
      objective: 'Hipertrofia',
      restrictions: '',
      history: '',
      plan: 'Mensal',
      status: 'Ativo',
      phoneWhatsApp: ''
    });
  };

  const handleDeleteExerciseFromSheet = (exerciseIndex: number) => {
    if (!selectedStudentId) return;
    const currentSheet = sheets[selectedStudentId] || { A: [], B: [], C: [], D: [], E: [] };
    const list = [...(currentSheet[editingSheetLetter] || [])];
    list.splice(exerciseIndex, 1);
    
    const updatedSheet = {
      ...currentSheet,
      [editingSheetLetter]: list
    };
    onUpdateSheet(selectedStudentId, updatedSheet);
  };

  const handleAddExerciseToSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const baseExercise = EXERCISE_BANK.find(ex => ex.id === selectedExerciseId);
    if (!baseExercise) return;

    const newWorkoutItem: WorkoutExercise = {
      id: 'wi_' + Date.now(),
      exerciseId: baseExercise.id,
      name: baseExercise.name,
      sets: Number(newExerciseSets),
      reps: newExerciseReps,
      restSec: Number(newExerciseRest),
      weightCc: Number(newExerciseWeight),
      notes: newExerciseNotes
    };

    const currentSheet = sheets[selectedStudentId] || { A: [], B: [], C: [], D: [], E: [] };
    const currentLetterList = currentSheet[editingSheetLetter] || [];

    const updatedSheet = {
      ...currentSheet,
      [editingSheetLetter]: [...currentLetterList, newWorkoutItem]
    };

    onUpdateSheet(selectedStudentId, updatedSheet);
    
    // Reset inputs except exercise selection
    setNewExerciseNotes('');
  };

  const handleScheduleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;

    const eventStudent = students.find(s => s.id === newEvent.studentId);
    
    const scheduled: AgendaEvent = {
      id: 'ev_' + Date.now(),
      studentId: newEvent.studentId || undefined,
      studentName: eventStudent ? eventStudent.name : undefined,
      title: newEvent.title,
      date: newEvent.date || '',
      time: newEvent.time || '',
      type: (newEvent.type as 'Presencial' | 'Online') || 'Presencial',
      durationMin: Number(newEvent.durationMin || 60),
      notes: newEvent.notes
    };

    onAddAgendaEvent(scheduled);
    setShowAddEventModal(false);
    setNewEvent({
      title: '',
      studentId: '',
      date: new Date().toISOString().split('T')[0],
      time: '08:00',
      type: 'Presencial',
      durationMin: 60,
      notes: ''
    });
  };

  const handleSendChatMessage = () => {
    if (!chatDraft.trim()) return;
    onSendMessage(chatStudentId, chatDraft);
    const draftContent = chatDraft;
    setChatDraft('');

    // Trigger auto-student response after 1.5 seconds for engaging UX
    setTimeout(() => {
      onTriggerAutoResponse(chatStudentId);
    }, 1500);
  };

  const dispatchNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    const timestampStr = new Date().toLocaleString('pt-BR');

    if (notifTargetStudent === 'all') {
      // Send to all active students
      students.forEach(std => {
        onSendNotification({
          id: 'n_' + Date.now() + Math.random().toString(36).substring(2, 5),
          studentId: std.id,
          studentName: std.name,
          title: notifTitle,
          message: notifMessage,
          channel: notifChannel,
          type: notifType,
          sentAt: timestampStr
        });
      });
      setNotifFeedback(`Notificação "${notifTitle}" enviada com sucesso para TODOS os alunos via ${notifChannel.toUpperCase()}!`);
    } else {
      const targetStd = students.find(s => s.id === notifTargetStudent);
      if (targetStd) {
        onSendNotification({
          id: 'n_' + Date.now(),
          studentId: targetStd.id,
          studentName: targetStd.name,
          title: notifTitle,
          message: notifMessage,
          channel: notifChannel,
          type: notifType,
          sentAt: timestampStr
        });
        setNotifFeedback(`Notificação enviada com sucesso para ${targetStd.name} via ${notifChannel.toUpperCase()}!`);
      }
    }

    setNotifTitle('');
    setNotifMessage('');
    setTimeout(() => {
      setNotifFeedback(null);
    }, 4500);
  };

  // Quick fill notification templates
  const applyTemplate = (templateType: 'hidratacao' | 'ficha' | 'motivacao' | 'mensalidade') => {
    setNotifType(templateType === 'hidratacao' ? 'reminder' : templateType === 'motivacao' ? 'motivation' : templateType === 'mensalidade' ? 'plan' : 'workout');
    switch (templateType) {
      case 'hidratacao':
        setNotifTitle('💧 Lembrete de Hidratação');
        setNotifMessage('Opa! Não esqueça de beber água hoje. A meta diária recomendada para o seu plano é de pelo menos 3 a 4 litros. Mantenha as células cheias!');
        setNotifChannel('whatsapp');
        break;
      case 'ficha':
        setNotifTitle('🏋️ Nova fola de treinos liberada!');
        setNotifMessage('Acabei de ajustar a sua divisão de treinos no aplicativo. Vá na aba de treinos para conferir seus exercícios, metas de cargas e séries.');
        setNotifChannel('push');
        break;
      case 'motivacao':
        setNotifTitle('🔥 Foco e Constância!');
        setNotifMessage('Resultados consistentes não vêm do que você faz de vez em quando, mas sim do que você faz todos os dias. Vamos amassar as metas hoje!');
        setNotifChannel('push');
        break;
      case 'mensalidade':
        setNotifTitle('💳 Vencimento de Plano');
        setNotifMessage('Olá! Passando para lembrar que sua renovação mensal do GymPulse está próxima. Você pode conferir os dados de pagamento direto no seu perfil.');
        setNotifChannel('email');
        break;
    }
  };

  if (activeTrainer?.subscriptionStatus === 'expired') {
    return (
      <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-sans pb-16 justify-center items-center px-4 animate-fade-in relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="w-full max-w-2xl bg-[#0c0c0e] border border-neutral-800 rounded-3xl p-6 md:p-8 relative shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/25 text-red-500 animate-pulse">
              <Lock size={28} />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight font-mono">
              Acesso Suspenso - Assinatura Expirada / Cancelada
            </h1>
            <p className="text-xs text-neutral-400 max-w-lg leading-relaxed font-sans">
              Seu período de teste grátis ou assinatura do seu painel GymPulse terminou. Para restabelecer o acesso aos dados dos seus alunos, prescrição de treinos e agenda, regularize sua conta escolhendo um dos planos abaixo.
            </p>
          </div>

          {/* Core Plan Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'Mensal', price: 'R$ 39,90', period: '/mês', desc: 'Acesso mensal completo' },
              { key: 'Trimestral', price: 'R$ 97,00', period: '/trimestre', desc: 'Combo ideal para crescer' },
              { key: 'Anual', price: 'R$ 297,00', period: '/ano', desc: 'Melhor custo-benefício' }
            ].map((p) => {
              const isSelected = licenseSelectedPlan === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setLicenseSelectedPlan(p.key as PlanType)}
                  className={`p-4 rounded-2xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#39FF14]/5 border-[#39FF14] text-white shadow-[0_0_15px_rgba(57,255,20,0.08)]'
                      : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-800 hover:bg-neutral-900/80 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider text-neutral-400">{p.key}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#39FF14]"></span>}
                    </div>
                    <p className="text-sm font-black text-white font-mono mt-2">
                      {p.price}
                      <span className="text-[10px] font-normal text-neutral-500">{p.period}</span>
                    </p>
                  </div>
                  <p className="text-[9px] text-neutral-500 font-sans mt-3">{p.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-neutral-950 p-1.5 rounded-xl border border-neutral-850/60 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLicensePaymentMethod('pix')}
              className={`py-2 text-xs font-black uppercase font-mono tracking-wider text-center transition rounded-lg cursor-pointer ${
                licensePaymentMethod === 'pix'
                  ? 'bg-[#39FF14] text-black shadow-lg'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              ⚡ Pagar via Pix Instante
            </button>
            <button
              type="button"
              onClick={() => setLicensePaymentMethod('stripe')}
              className={`py-2 text-xs font-black uppercase font-mono tracking-wider text-center transition rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                licensePaymentMethod === 'stripe'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <CreditCard size={14} /> Cartão (Stripe)
            </button>
          </div>

          {/* Dynamic Payment Details inside Block */}
          {licensePaymentLoadingStep > 0 ? (
            <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-6 text-center space-y-4 animate-scale-up">
              {licensePaymentLoadingStep < 4 ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="w-8 h-8 border-3 border-dashed border-[#39FF14] rounded-full animate-spin"></div>
                  <p className="text-xs text-white font-mono uppercase tracking-widest font-black animate-pulse">
                    {licensePaymentLoadingStep === 1 && 'Contatando API Stripe (v3)...'}
                    {licensePaymentLoadingStep === 2 && 'Autorizando Gateway...'}
                    {licensePaymentLoadingStep === 3 && 'Processando Webhook e Liberando Acesso...'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2 animate-scale-up">
                  <div className="w-10 h-10 rounded-full bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] flex items-center justify-center animate-bounce">
                    <Check size={20} />
                  </div>
                  <p className="text-xs font-black text-white font-mono uppercase tracking-wider">Acesso Total Liberado!</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Seu pagamento foi confirmado. Redirecionando para o seu dashboard...
                  </p>
                </div>
              )}
            </div>
          ) : licensePaymentMethod === 'pix' ? (
            <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl text-center space-y-4 animate-fade-in">
              <p className="text-[10px] text-neutral-450 font-mono uppercase tracking-wider">QR Code Copie e Cole para ativação imediata:</p>
              
              <div className="bg-white p-2 w-28 h-28 mx-auto flex items-center justify-center rounded-xl border border-neutral-200 shadow-md relative">
                <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${(i * 3 + 1) % 5 === 0 ? 'bg-black' : 'bg-neutral-100'}`} />
                  ))}
                </div>
                <div className="absolute w-7 h-7 bg-black rounded-full border-2 border-white flex items-center justify-center shadow">
                  <span className="text-[8px] font-mono font-black text-[#39FF14]">PIX</span>
                </div>
              </div>

              <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 flex items-center gap-2 max-w-sm mx-auto">
                <pre className="text-[9px] overflow-hidden truncate font-mono text-neutral-400 flex-1">
                  0002012658001BR.GOV.BCB.PIX0136gympulse-license-saas-{licenseSelectedPlan.toLowerCase()}-active-39e
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`0002012658001BR.GOV.BCB.PIX0136gympulse-license-saas-${licenseSelectedPlan.toLowerCase()}-active-39e`);
                    setCopiedDashboardPix(true);
                    setTimeout(() => setCopiedDashboardPix(false), 2000);
                  }}
                  className="bg-[#39FF14] text-black text-[9px] font-black uppercase font-mono px-3 py-1.5 rounded-lg shrink-0 hover:bg-[#39FF14]/80 active:scale-95 transition cursor-pointer"
                >
                  {copiedDashboardPix ? 'Copiado!' : 'Copiar Chave'}
                </button>
              </div>

              {copiedDashboardPix && (
                <p className="text-[9px] text-[#39FF14] font-mono animate-pulse">✓ Chave copiada para a área de transferência!</p>
              )}

              <button
                type="button"
                onClick={() => {
                  setLicensePaymentLoadingStep(1);
                  setTimeout(() => {
                    setLicensePaymentLoadingStep(3);
                    setTimeout(() => {
                      if (onUpdateTrainer && activeTrainer) {
                        onUpdateTrainer({
                          ...activeTrainer,
                          subscriptionStatus: 'paid',
                          selectedPlan: licenseSelectedPlan
                        });
                      }
                      setLicensePaymentLoadingStep(4);
                      setTimeout(() => {
                        setLicensePaymentLoadingStep(0);
                      }, 2000);
                    }, 1200);
                  }, 1200);
                }}
                className="w-full max-w-sm mx-auto bg-[#39FF14] text-black font-extrabold uppercase font-mono tracking-wider py-3 rounded-xl text-xs transition cursor-pointer mt-2"
              >
                Confirmar Pagamento via Pix
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-neutral-950 border border-neutral-850 p-6 rounded-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                  <Lock size={26} />
                </div>
                
                <div className="space-y-1.5 text-center">
                  <p className="text-xs text-white font-mono uppercase tracking-widest font-black">Pagamento Direto via Stripe</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-sans max-w-sm mx-auto">
                    Você selecionou o plano <strong className="text-white text-xs">{licenseSelectedPlan}</strong>. Nós conectamos diretamente ao gateway de pagamentos criptografado oficial da <strong>Stripe</strong>.
                  </p>
                </div>

                <div className="bg-[#0f1015] border border-[#1b1c24] p-3.5 rounded-xl flex items-center justify-between text-xs font-mono max-w-xs mx-auto">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Valor da licença:</span>
                  <span className="text-white font-black text-sm">
                    {licenseSelectedPlan === 'Mensal' ? 'R$ 39,90/mês' : licenseSelectedPlan === 'Trimestral' ? 'R$ 97,00/trimestre' : 'R$ 297,00/ano'}
                  </span>
                </div>

                {saasStripeError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-left space-y-2.5 animate-scale-up">
                    <div>
                      <p className="text-[10px] font-mono text-red-500 uppercase font-black leading-none flex items-center gap-1">
                        ⚠️ Erro do Stripe (Permissão/Chave)
                      </p>
                      <p className="text-[10px] text-neutral-300 leading-normal font-sans mt-1">
                        {saasStripeError}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBypassStripeSaaSSimulate}
                      className="w-full bg-[#39FF14] hover:bg-[#34e212] text-black font-mono uppercase font-black text-[10px] tracking-wide py-2 px-3 rounded-lg text-center cursor-pointer transition"
                    >
                      ⚡ Ignorar Erro e Usar Pagamento Simulado (Testar)
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 justify-center text-[10px] text-neutral-500 font-mono">
                  <Check size={12} className="text-indigo-400" />
                  <span>Ambiente seguro certificado por Stripe Checkout</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStripeCheckoutSaaS}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 cursor-pointer text-center uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Lock size={12} className="text-indigo-200" /> Ir para o Stripe (Pagar Assinatura)
              </button>
            </div>
          )}

          <div className="flex justify-center border-t border-neutral-900 pt-4">
            <button
              onClick={() => onLogout()}
              className="text-xs text-neutral-500 hover:text-white font-bold font-mono uppercase tracking-widest cursor-pointer animate-pulse"
            >
              ← Voltar ao Login
            </button>
          </div>
        </div>

        {/* Ensure the mockup Stripe Checkout overlay renders inside early return block if it's active */}
        {showSimulatedStripe && (
          <SimulatedStripeCheckout
            planName={licenseSelectedPlan}
            price={
              licenseSelectedPlan === 'Mensal' ? 39.90 : 
              licenseSelectedPlan === 'Trimestral' ? 97.00 : 
              licenseSelectedPlan === 'Semestral' ? 180.00 : 297.00
            }
            studentName={activeTrainer?.name || 'Daniel Coach'}
            onSuccess={() => {
              setShowSimulatedStripe(false);
              setLicensePaymentLoadingStep(4); // Trigger success step
              if (onUpdateTrainer && activeTrainer) {
                onUpdateTrainer({
                  ...activeTrainer,
                  subscriptionStatus: 'paid',
                  selectedPlan: licenseSelectedPlan
                });
              }
              setTimeout(() => {
                setLicensePaymentLoadingStep(0);
              }, 2000);
            }}
            onCancel={() => {
              setShowSimulatedStripe(false);
              setLicensePaymentLoadingStep(0);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-sans pb-16"
    >
      
      {/* Upper Stats bar */}
      <div className="bg-[#121214] border-b border-neutral-800 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[#39FF14] h-8 w-2 bg-[#39FF14] rounded-full inline-block"></span>
                <span>GymPulse</span>
              </div>
              <span className="text-xs bg-[#39FF14]/10 text-[#39FF14] px-2.5 py-0.5 rounded-full border border-[#39FF14]/20 font-mono tracking-widest uppercase">
                TRAINER CORE
              </span>
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 mt-1">Simulação completa do painel de treino do profissional.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
            <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-[#39FF14]/10 rounded-lg text-[#39FF14]">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Alunos Totais</p>
                <p className="text-lg font-bold text-white">{totalStudents}</p>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <CheckCircle size={18} />
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Alunos Ativos</p>
                <p className="text-lg font-bold text-white">{activeStudents}</p>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Faturamento</p>
                <p className="text-lg font-bold text-emerald-400">R$ {currentMonthRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-[#39FF14]/10 rounded-lg text-[#39FF14]">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Sessões Semanais</p>
                <p className="text-lg font-bold text-white">{agenda.length} agendamentos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav Panels */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          {activeTrainer && (
            <div className="mb-4 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-4 rounded-2xl relative overflow-hidden flex items-center gap-3 shadow-lg shadow-black/40">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-12 h-12 bg-[#39FF14]/5 rounded-full blur-xl"></div>
              <div className="w-10 h-10 rounded-full bg-[#39FF14]/15 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] font-black text-sm uppercase shrink-0">
                {activeTrainer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[8px] text-neutral-500 font-mono uppercase tracking-widest leading-none font-bold">Painel de Controle</p>
                <p className="text-xs font-bold text-white truncate mt-1">{activeTrainer.name}</p>
                <p className="text-[9px] text-[#39FF14] truncate font-mono mt-0.5">{activeTrainer.email}</p>
              </div>
            </div>
          )}
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-3 mb-2">GERENCIAMENTO</p>
          
          <button 
            onClick={() => setActiveTab('alunos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'alunos' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Users size={18} className={activeTab === 'alunos' ? 'text-[#39FF14]' : ''} />
              <span>Lista de Alunos</span>
            </div>
            <span className="text-xs bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full">{students.length}</span>
          </button>

          <button 
            onClick={() => setActiveTab('cadastrar_aluno')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'cadastrar_aluno' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Plus size={18} className={activeTab === 'cadastrar_aluno' ? 'text-[#39FF14]' : ''} />
              <span className="font-bold">Cadastrar Aluno</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('treinos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'treinos' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Dumbbell size={18} className={activeTab === 'treinos' ? 'text-[#39FF14]' : ''} />
              <span>Monitor de Treinos</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('agenda')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'agenda' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} className={activeTab === 'agenda' ? 'text-[#39FF14]' : ''} />
              <span>Agenda Inteligente</span>
            </div>
            <span className="text-xs bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full">
              {agenda.filter(ev => ev.date === new Date().toISOString().split('T')[0]).length} hoje
            </span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('chat');
              if (selectedStudentId) setChatStudentId(selectedStudentId);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'chat' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className={activeTab === 'chat' ? 'text-[#39FF14]' : ''} />
              <span>Chat Interno</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('notificacoes')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'notificacoes' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className={activeTab === 'notificacoes' ? 'text-[#39FF14]' : ''} />
              <span>Aviso & Notificações</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('planos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'planos' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <CreditCard size={18} className={activeTab === 'planos' ? 'text-[#39FF14]' : ''} />
              <span>Planos e Faturamento</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'logs' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Clock size={18} className={activeTab === 'logs' ? 'text-[#39FF14]' : ''} />
              <span>Histórico de Acessos</span>
            </div>
            <span className="text-xs bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full select-none">{accessLogs.length}</span>
          </button>

          <button 
            onClick={() => setActiveTab('configuracoes')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'configuracoes' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Settings size={18} className={activeTab === 'configuracoes' ? 'text-[#39FF14]' : ''} />
              <span>Personalizar & Configurações</span>
            </div>
          </button>

          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 text-left mt-4 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 font-bold cursor-pointer"
            >
              <LogOut size={18} />
              <span>Sair do Painel</span>
            </button>
          )}
        </div>

        {/* Tab content screens - dynamic renders */}
        <div className="flex-1 bg-neutral-950 rounded-2xl border border-neutral-800 p-4 md:p-6 shadow-2xl relative overflow-hidden">
          
          {/* TAB 1: ALUNOS (CADASTRO E DETALHES DE EVOLUÇÃO) */}
          {activeTab === 'alunos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users size={20} className="text-[#39FF14]" />
                    Gestão Geral de Alunos
                  </h2>
                  <p className="text-xs text-neutral-400">Gerencie informações, objetivos físicos e monitore a evolução corporal de seus matriculados.</p>
                </div>
              </div>

              {/* Twin Widget SaaS & Recruitment Link */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. SEU LINK DE RECRUTAMENTO DE ALUNOS */}
                <div className="bg-[#121214] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-500/5 blur-xl rounded-full" />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1.5 rounded-lg bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14]">
                        <Copy size={16} />
                      </span>
                      <h3 className="text-xs font-black tracking-wider uppercase text-neutral-200 font-mono">Link de Onboarding de Alunos</h3>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                      Envie o link abaixo para seus alunos se cadastrarem direto. Eles serão automaticamente associados ao seu painel administrativo.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={window.location.origin + '/?trainerId=' + (activeTrainer?.customIdLink || 'daniel-personal')}
                      className="flex-1 bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 px-3 py-2 rounded-lg font-mono focus:outline-none focus:border-[#39FF14]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const link = window.location.origin + '/?trainerId=' + (activeTrainer?.customIdLink || 'daniel-personal');
                        navigator.clipboard.writeText(link);
                        setCopiedRecruitmentLink(true);
                        setTimeout(() => setCopiedRecruitmentLink(false), 2000);
                      }}
                      className="bg-[#39FF14] text-black font-extrabold text-[11px] px-4 py-2 rounded-lg transition duration-200 hover:shadow-[0_0_10px_rgba(57,255,20,0.3)] active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedRecruitmentLink ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedRecruitmentLink ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. SUA ASSINATURA SAAS GYMPULSE */}
                <div className="bg-[#121214] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-indigo-500/5 blur-xl rounded-full" />
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#39FF14]">
                          <Award size={16} />
                        </span>
                        <h3 className="text-xs font-black tracking-wider uppercase text-neutral-200 font-mono">Status da sua Licença SaaS</h3>
                      </div>
                      
                      {activeTrainer?.subscriptionStatus === 'trial' ? (
                        <span className="text-[9px] font-mono font-bold uppercase bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full animate-pulse">
                          Período de Testes (7 dias)
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-black uppercase bg-emerald-500/10 border border-emerald-500/30 text-[#39FF14] px-2 py-0.5 rounded-full flex items-center gap-1">
                          ★★ Plano Ativo
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1 mb-3">
                      <div className="flex justify-between items-center text-[11px]">
                        <p className="text-neutral-400">Assinatura Vinculada:</p>
                        <strong className="text-white font-mono">{activeTrainer?.selectedPlan || 'Trimestral'}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <p className="text-neutral-400">Vencimento faturado:</p>
                        <strong className="text-neutral-300 font-mono">{activeTrainer?.trialExpiresAt || '05/06/2026'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(true)}
                      className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white font-bold text-[11px] py-2 rounded-lg transition cursor-pointer"
                    >
                      Configurar Perfil / Link
                    </button>
                    {activeTrainer?.subscriptionStatus === 'trial' && (
                      <div className="flex gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Deseja realmente CANCELAR o seu período de testes grátis? Seu acesso será suspenso imediatamente e você precisará assinar um plano pago para liberar o sistema.")) {
                              onUpdateTrainer({
                                ...activeTrainer,
                                subscriptionStatus: 'expired'
                              });
                            }
                          }}
                          className="flex-1 bg-red-950/40 border border-red-500/35 hover:bg-red-900 hover:text-white text-red-400 font-bold text-[10px] py-2 px-3 rounded-lg transition cursor-pointer"
                        >
                          Cancelar Teste (Simular Bloqueio)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUpgradeModal(true)}
                          className="flex-1 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-555 hover:text-black text-[#39FF14] font-extrabold text-[10px] py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <DollarSign size={12} />
                          <span>Ativar Licença</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. LIMPEZA DE DEMONSTRAÇÃO (REMOVER ALUNOS DE TESTES) */}
                <div className="bg-[#121214] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 blur-xl rounded-full" />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        <Trash2 size={16} />
                      </span>
                      <h3 className="text-xs font-black tracking-wider uppercase text-neutral-200 font-mono">Contas de Demonstração</h3>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                      Limpe os alunos de testes virtuais (Ana Silva, Carlos Souza, Igor Santos, etc.) do banco de dados para liberar espaço e organizar seus alunos reais vindos de convites.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      if (!onPurgeTestAccounts) return;
                      const msg = activeTrainer?.id === 't_default'
                        ? "Atenção: Você está conectado com o treinador demonstrativo (Daniel Personal Coach). Ao remover as contas de demonstração, você também será desconectado para poder criar o seu próprio perfil real de treinador. Deseja prosseguir?"
                        : "Deseja realmente excluir permanentemente do banco de dados do Firestore os 5 alunos experimentais de demonstração para deixar o seu painel 100% limpo? Esta ação não pode ser desfeita.";
                      
                      if (window.confirm(msg)) {
                        try {
                          await onPurgeTestAccounts();
                        } catch (err: any) {
                          alert("Erro ao realizar limpeza: " + (err.message || String(err)));
                        }
                      }
                    }}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 hover:text-white border border-amber-500/25 hover:border-amber-500 font-extrabold text-[11px] py-2 rounded-lg transition duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} className="shrink-0" />
                    <span>Remover Alunos de Demonstração</span>
                  </button>
                </div>
              </div>

              {/* Filtros de Busca e Ordenação */}
              <div className="bg-[#121214] border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Buscar aluno por nome, objetivo..."
                    className="w-full bg-neutral-950 text-xs text-white pl-10 pr-4 py-2.5 rounded-lg border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition"
                  />
                </div>
                
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="text-[11px] text-neutral-400 font-medium font-sans animate-pulse">Ordenar por:</span>
                  <div className="bg-neutral-950 p-1 rounded-lg border border-neutral-800 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setStudentSortBy('name')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition cursor-pointer ${
                        studentSortBy === 'name'
                          ? 'bg-[#39FF14] text-black font-extrabold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      Ordem Alfabética
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentSortBy('joinDate')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition cursor-pointer ${
                        studentSortBy === 'joinDate'
                          ? 'bg-[#39FF14] text-black font-extrabold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      Data de Adesão
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of Student Cards with Search filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAndSortedStudents.map((student) => {
                  const isSelected = selectedStudentId === student.id;
                  const stdEvolution = evolution[student.id] || [];
                  const lastEv = stdEvolution[stdEvolution.length - 1];
                  
                  return (
                    <div 
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`p-4 rounded-xl border transition duration-250 cursor-pointer flex flex-col justify-between ${isSelected ? 'bg-neutral-900 border-[#39FF14]' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'}`}
                    >
                      <div className="flex items-start gap-3">
                        <img 
                          src={student.avatar} 
                          alt={student.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-700 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-between">
                            <h3 className="text-sm font-bold text-white truncate my-0">{student.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${student.status === 'Ativo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-neutral-800 text-neutral-500'}`}>
                              {student.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] bg-[#39FF14]/15 text-white/90 px-2 py-0.5 rounded-full border border-[#39FF14]/30 font-medium font-sans">
                              {student.objective}
                            </span>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {student.age} anos • {student.height.toFixed(2)}m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                        <div className="flex flex-col">
                          <span>Peso Atual: <strong className="text-white font-mono">{lastEv ? `${lastEv.weight} kg` : `${student.weight} kg`}</strong></span>
                          <span className="text-[10px] text-neutral-500 font-mono mt-0.5">Venc: {student.nextPayment}</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const inviteUrl = `${window.location.origin}?role=student&studentId=${student.id}&trainerId=${activeTrainer?.customIdLink || activeTrainer?.id || ''}`;
                            navigator.clipboard.writeText(inviteUrl);
                            setCopiedStudentId(student.id);
                            setTimeout(() => setCopiedStudentId(null), 2000);
                          }}
                          className={`text-[10px] px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all font-mono font-bold cursor-pointer shrink-0 ${
                            copiedStudentId === student.id
                              ? 'bg-[#39FF14] text-black border-[#39FF14]'
                              : 'bg-neutral-900 border-neutral-800 text-[#39FF14] hover:bg-[#39FF14]/10 hover:border-[#39FF14]/30'
                          }`}
                          title="Copiar link de acesso exclusivo deste aluno"
                        >
                          {copiedStudentId === student.id ? (
                            <>
                              <Check size={11} />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Link de Convite</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail view of the selected student */}
              {selectedStudent && (
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 mt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* Left Column: Personal Metadata */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedStudent.avatar} 
                          alt={selectedStudent.name} 
                          className="w-14 h-14 rounded-full object-cover border-2 border-neutral-700 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider">Aluno Selecionado</p>
                          <h3 className="text-lg font-extrabold text-white my-0">{selectedStudent.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5 select-none flex-wrap">
                            <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded-md font-bold tracking-wider ${
                              selectedStudent.status === 'Inativo'
                                ? 'bg-red-950/40 border-red-800 text-red-400'
                                : 'bg-emerald-950/40 border-emerald-800 text-[#39FF14]'
                            }`}>
                              {selectedStudent.status === 'Inativo' ? 'INATIVO (BLOQUEADO)' : 'ATIVO (LIBERADO)'}
                            </span>
                            {selectedStudent.phoneWhatsApp ? (
                              <button
                                onClick={() => {
                                  setWaActiveStudent(selectedStudent);
                                  setWaCustomMessage(`Olá ${selectedStudent.name}, aqui é seu Personal Trainer! Passando para ver como estão indo os treinos.`);
                                  setWaModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] px-1.5 py-0.5 rounded-md font-mono transition-all cursor-pointer"
                                title="Abrir Central ODS de Conectividade WhatsApp"
                              >
                                <Phone size={10} className="shrink-0" />
                                <span>{selectedStudent.phoneWhatsApp}</span>
                              </button>
                            ) : (
                              <span className="text-[9px] text-neutral-500 font-mono italic">(Sem WhatsApp cadastrado)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                          <p className="text-[10px] text-neutral-500 font-mono uppercase">Histórico Técnico</p>
                          <p className="font-medium text-neutral-200 mt-1">{selectedStudent.history || 'Sem histórico prévio.'}</p>
                        </div>
                        <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                          <p className="text-[10px] text-neutral-500 font-mono uppercase text-red-400">Restrições Físicas / Lesões</p>
                          <p className="font-medium text-red-300 mt-1">{selectedStudent.restrictions || 'Sem limitações ou queixas.'}</p>
                        </div>
                      </div>

                      {/* BLASTRONIC CONFIRMATION & VERIFICATION CARD */}
                      <div className="bg-[#121214]/90 p-4 rounded-xl border border-[#39FF14]/15 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${selectedStudent.isProfileComplete ? 'bg-[#39FF14]' : 'bg-amber-400'}`}></span>
                            Status do Convite / Cadastro Aluno
                          </p>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${selectedStudent.isProfileComplete ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/25' : 'bg-amber-400/10 text-amber-300 border border-amber-400/25'}`}>
                            {selectedStudent.isProfileComplete ? 'CONCLUÍDO PELO ALUNO' : 'AGUARDANDO CADASTRO'}
                          </span>
                        </div>

                        {!selectedStudent.isProfileComplete ? (
                          <div className="text-xs text-neutral-400 space-y-2">
                            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-1.5">
                              <p className="text-white font-bold leading-tight flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></span>
                                Aguardando o preenchimento do aluno...
                              </p>
                              <p className="text-[11px] text-neutral-400">
                                O Aluno receberá o link enviado e completará seus dados pessoais, e-mail/WhatsApp, senha e dados de pagamento.
                              </p>
                            </div>
                            <p className="text-[9.5px] text-neutral-500 font-mono text-center">
                              Assim que ele preencher, as informações preenchidas aparecerão aqui para sua confirmação imediata.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 text-xs">
                            <div className="bg-[#0C0C0E] p-3.5 rounded-xl border border-[#39FF14]/20 space-y-2">
                              <p className="text-white font-extrabold flex items-center gap-1 text-[11px]">
                                <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse"></span>
                                Dados Recebidos pelo Link de Convite
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] text-neutral-300 leading-normal font-sans">
                                <div>
                                  <span className="text-neutral-500 font-mono text-[9px] block uppercase">Nome Completo:</span>
                                  <strong className="text-white">{selectedStudent.name}</strong>
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-mono text-[9px] block uppercase">E-mail:</span>
                                  <span className="text-neutral-200 select-all font-mono">{selectedStudent.email || '(Não informado)'}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-mono text-[9px] block uppercase">WhatsApp:</span>
                                  <span className="text-neutral-200 font-mono">{selectedStudent.phoneWhatsApp || '(Não informado)'}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-mono text-[9px] block uppercase">Método de Acesso:</span>
                                  <span className="text-[#39FF14] font-bold font-mono">
                                    {selectedStudent.accessMethod === 'google' ? '⚡ Conta Google (Gmail)' : '🔒 Senha Criada'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-mono text-[9px] block uppercase">Medidas:</span>
                                  <span>{selectedStudent.age} anos • {selectedStudent.weight}kg • {selectedStudent.height}m</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-mono text-[9px] block uppercase">Adesão Financeira:</span>
                                  <span className="text-emerald-400 font-extrabold">✓ Confirmado (Pix/Cartão)</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-emerald-900/10 border border-emerald-500/20 p-2.5 rounded-xl text-neutral-300 text-[11px] leading-relaxed">
                              O aluno preencheu todas as etapas delegadas! Por favor, confirme as informações do perfil abaixo para concluir o onboarding e liberar o acesso total aos treinos.
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onUpdateStudent(selectedStudent.id, {
                                  status: 'Ativo',
                                  history: `Cadastro via convite revisado e aprovado pelo Personal Trainer em ${new Date().toLocaleDateString('pt-BR')}. ` + (selectedStudent.history || '')
                                });
                                alert('Incrível! O perfil do aluno foi devidamente revisado, confirmado e liberado para uso imediato!');
                              }}
                              className="w-full bg-[#39FF14] hover:bg-green-400 text-black font-extrabold py-2.5 rounded-xl font-sans transition-all active:scale-95 text-xs text-center flex items-center justify-center gap-1.5 shadow-md hover:shadow-[#39FF14]/15"
                            >
                              <Check size={14} className="stroke-[3]" />
                              Confirmar Informações & Liberar Acesso Aluno
                            </button>
                          </div>
                        )}
                      </div>

                      {!editingStudentPlan ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[11px] bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono">
                              Plano: <strong className="text-white">{selectedStudent.plan}</strong>
                            </span>
                            <span className="text-[11px] bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono">
                              Valor Mensal: <strong className="text-[#39FF14]">R$ {selectedStudent.value.toFixed(2)}</strong>
                            </span>
                            <span className="text-[11px] bg-neutral-900/20 text-neutral-400 border border-neutral-800/40 rounded-lg px-2.5 py-1.5 font-mono">
                              Matrícula: {selectedStudent.joinedAt}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setTempStudentName(selectedStudent.name || '');
                              setTempStudentPhone(selectedStudent.phoneWhatsApp || '');
                              setTempStudentEmail(selectedStudent.email || '');
                              setTempStudentPassword(selectedStudent.password || '123456');
                              setTempStudentAge(selectedStudent.age || 25);
                              setTempStudentWeight(selectedStudent.weight || 70);
                              setTempStudentHeight(selectedStudent.height || 1.70);
                              setTempStudentObjective(selectedStudent.objective || 'Hipertrofia');
                              setTempStudentRestrictions(selectedStudent.restrictions || '');
                              setTempStudentHistory(selectedStudent.history || '');
                              setTempStudentPlan(selectedStudent.plan);
                              setTempStudentValue(selectedStudent.value);
                              setTempStudentStatus(selectedStudent.status || 'Ativo');
                              setEditingStudentPlan(true);
                            }}
                            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 text-[10px] font-medium text-[#39FF14] transition-all cursor-pointer font-mono"
                          >
                            <Edit3 size={11} />
                            EDITAR DADOS E FICHA
                          </button>
                        </div>
                      ) : (
                        <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 space-y-4 animate-fade-in text-xs">
                          <p className="text-[10px] text-neutral-400 uppercase font-mono font-bold tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]"></span>
                            Editar Ficha Completa & Dados do Aluno: {selectedStudent.name}
                          </p>

                          {/* Section 1: Access Creds */}
                          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 space-y-3">
                            <p className="text-[9px] text-[#39FF14] uppercase font-mono">1. Dados de Identificação e Login</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Nome Completo</label>
                                <input 
                                  type="text" 
                                  value={tempStudentName}
                                  onChange={(e) => setTempStudentName(e.target.value)}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">E-mail / Conta Gmail (Acesso Rápido)</label>
                                <input 
                                  type="email" 
                                  value={tempStudentEmail}
                                  onChange={(e) => setTempStudentEmail(e.target.value)}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">WhatsApp</label>
                                <input 
                                  type="text" 
                                  value={tempStudentPhone}
                                  onChange={(e) => setTempStudentPhone(e.target.value)}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-[#39FF14] outline-none font-sans"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 2: Plan and Contract */}
                          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 space-y-3">
                            <p className="text-[9px] text-[#39FF14] uppercase font-mono">2. Contrato e Status Administrativo</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Tipo de Plano</label>
                                <select 
                                  value={tempStudentPlan}
                                  onChange={(e) => {
                                    const selectType = e.target.value as PlanType;
                                    setTempStudentPlan(selectType);
                                    const matchingMarketing = marketingPlans.find(p => p.id === selectType);
                                    if (matchingMarketing) {
                                      setTempStudentValue(matchingMarketing.price);
                                    }
                                  }}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer font-monoSetting"
                                >
                                  <option value="Mensal">Mensal</option>
                                  <option value="Trimestral">Trimestral</option>
                                  <option value="Anual">Anual</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Valor Comercial (R$)</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={tempStudentValue}
                                  onChange={(e) => setTempStudentValue(Number(e.target.value))}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Acesso do Aluno</label>
                                <select 
                                  value={tempStudentStatus}
                                  onChange={(e) => setTempStudentStatus(e.target.value as 'Ativo' | 'Inativo')}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
                                >
                                  <option value="Ativo">Ativo (Permitir Entrada)</option>
                                  <option value="Inativo">Inativo (Bloqueado por Débito)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Section 3: Physical Specs */}
                          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 space-y-3">
                            <p className="text-[9px] text-[#39FF14] uppercase font-mono">3. Ficha Física e Biotipo (Anamnese)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Objetivo</label>
                                <select 
                                  value={tempStudentObjective}
                                  onChange={(e) => setTempStudentObjective(e.target.value as Objective)}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
                                >
                                  <option value="Hipertrofia">Hipertrofia</option>
                                  <option value="Emagrecimento">Emagrecimento</option>
                                  <option value="Condicionamento">Condicionamento</option>
                                  <option value="Definição">Definição</option>
                                  <option value="Reabilitação">Reabilitação</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Idade (anos)</label>
                                <input 
                                  type="number" 
                                  value={tempStudentAge}
                                  onChange={(e) => setTempStudentAge(Number(e.target.value))}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Peso (kg)</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={tempStudentWeight}
                                  onChange={(e) => setTempStudentWeight(Number(e.target.value))}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Altura (m)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={tempStudentHeight}
                                  onChange={(e) => setTempStudentHeight(Number(e.target.value))}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Histórico de Exercícios</label>
                                <textarea 
                                  rows={2}
                                  value={tempStudentHistory}
                                  onChange={(e) => setTempStudentHistory(e.target.value)}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-red-400 uppercase font-mono mb-1">Restrições / Quadro Clínico</label>
                                <textarea 
                                  rows={2}
                                  value={tempStudentRestrictions}
                                  onChange={(e) => setTempStudentRestrictions(e.target.value)}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-red-200 outline-none resize-none"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800 font-mono">
                            <button 
                              type="button"
                              onClick={() => setEditingStudentPlan(false)}
                              className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-[10px] text-neutral-400 transition cursor-pointer font-bold"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                onUpdateStudent(selectedStudent.id, {
                                  name: tempStudentName.trim(),
                                  phoneWhatsApp: tempStudentPhone.trim(),
                                  email: tempStudentEmail.trim().toLowerCase(),
                                  password: tempStudentPassword,
                                  age: Number(tempStudentAge),
                                  weight: Number(tempStudentWeight),
                                  height: Number(tempStudentHeight),
                                  objective: tempStudentObjective,
                                  restrictions: tempStudentRestrictions,
                                  history: tempStudentHistory,
                                  plan: tempStudentPlan,
                                  value: tempStudentValue,
                                  status: tempStudentStatus
                                });
                                setEditingStudentPlan(false);
                              }}
                              className="px-5 py-2 bg-[#39FF14] text-black hover:bg-green-400 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Check size={12} /> Salvar Ficha Completa
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Student Invitation & Share Login Link */}
                      <div className="bg-[#121214]/60 p-4 rounded-xl border border-[#39FF14]/20 space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full"></span>
                            Link de Acesso Exclusivo (com studentId)
                          </p>
                          <span className="text-[9px] bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20 px-1.5 py-0.5 rounded font-mono font-bold">
                            ENVIAR ALUNO
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                          Compartilhe o link de acesso exclusivo ou envie o convite diretamente via WhatsApp:
                        </p>
                        
                        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                          <span className="text-[10px] font-mono text-[#39FF14] select-all truncate flex-1 leading-none py-1">
                            {window.location.origin}?role=student&studentId={selectedStudent.id}&trainerId={activeTrainer?.customIdLink || activeTrainer?.id || ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const inviteUrl = `${window.location.origin}?role=student&studentId=${selectedStudent.id}&trainerId=${activeTrainer?.customIdLink || activeTrainer?.id || ''}`;
                              navigator.clipboard.writeText(inviteUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="bg-[#39FF14]/10 hover:bg-[#39FF14] hover:text-black text-[#39FF14] text-[10px] font-bold px-3 py-1.5 rounded-md border border-[#39FF14]/30 hover:border-transparent transition flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedLink ? 'Copiado!' : 'Apenas Link'}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const inviteUrl = `${window.location.origin}?role=student&studentId=${selectedStudent.id}&trainerId=${activeTrainer?.customIdLink || activeTrainer?.id || ''}`;
                              const message = `Olá, *${selectedStudent.name}*! Seu acesso ao aplicativo de treinos *GymPulse* foi liberado. Toque no link abaixo e entre direto usando sua Conta do Google:\n\n👉 ${inviteUrl}`;
                              const encodedText = encodeURIComponent(message);
                              const dest = selectedStudent.phoneWhatsApp ? selectedStudent.phoneWhatsApp.replace(/[^0-9]/g, '') : '';
                              window.open(`https://api.whatsapp.com/send?phone=${dest}&text=${encodedText}`, '_blank');
                            }}
                            className="bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold text-xs py-2 w-full rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-lg shadow-green-500/10 hover:scale-[1.01]"
                          >
                            <Phone size={13} />
                            <span>Enviar WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const inviteUrl = `${window.location.origin}?role=student&studentId=${selectedStudent.id}&trainerId=${activeTrainer?.customIdLink || activeTrainer?.id || ''}`;
                              const emailSubject = encodeURIComponent(`Acesso Liberado - Portal do Aluno GymPulse`);
                              const emailBody = encodeURIComponent(`Olá, ${selectedStudent.name}!\n\nSeu acesso ao seu aplicativo de treinos GymPulse foi liberado pelo seu Personal Trainer.\n\nPara acessar seu portal de treinos, toque no link de convite personalizado abaixo e faça login de forma segura usando sua Conta do Google (seu e-mail Gmail):\n👉 ${inviteUrl}\n\nApós o primeiro login, seu acompanhamento será sincronizado de forma 100% direta e automática!\n\nFoco nos treinos!\n\nAtenciosamente,\n${activeTrainer?.name || 'Daniel Personal Coach'}`);
                              window.open(`mailto:${selectedStudent.email || ''}?subject=${emailSubject}&body=${emailBody}`, '_blank');
                            }}
                            className="bg-[#2B85E4] hover:bg-[#1A6BB8] text-white font-extrabold text-xs py-2 w-full rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-lg shadow-blue-500/10 hover:scale-[1.01]"
                          >
                            <Mail size={13} />
                            <span>Enviar por E-mail</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Physical & Evolution summary */}
                    <div className="w-full md:w-[360px] bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-[#39FF14]" />
                          Última Evolução Corporal
                        </h4>

                        {latestEvolution ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-neutral-900 p-2 rounded-lg">
                                <p className="text-[8px] text-neutral-400 font-mono uppercase">PESO</p>
                                <p className="text-sm font-bold text-white font-mono">{latestEvolution.weight}kg</p>
                              </div>
                              <div className="bg-neutral-900 p-2 rounded-lg">
                                <p className="text-[8px] text-neutral-400 font-mono uppercase">IMC</p>
                                <p className="text-sm font-bold text-blue-400 font-mono">{latestEvolution.bmi.toFixed(1)}</p>
                              </div>
                              <div className="bg-neutral-900 p-2 rounded-lg">
                                <p className="text-[8px] text-neutral-400 font-mono uppercase">GORDURA</p>
                                <p className="text-sm font-bold text-emerald-400 font-mono">
                                  {latestEvolution.bodyFat ? `${latestEvolution.bodyFat}%` : '--'}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-neutral-800/80 pt-2.5 space-y-1.5 text-xs">
                              <div className="flex justify-between items-center py-1 border-b border-neutral-900/60 text-neutral-400">
                                <span>Braço D / E:</span>
                                <span className="text-white font-mono font-bold">{latestEvolution.armRight || '--'} / {latestEvolution.armLeft || '--'} cm</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-neutral-900/60 text-neutral-400">
                                <span>Cintura:</span>
                                <span className="text-white font-mono font-bold">{latestEvolution.waist || '--'} cm</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-neutral-900/60 text-neutral-400">
                                <span>Análise:</span>
                                <span className="text-neutral-300 text-right italic truncate max-w-[180px] font-sans" title={latestEvolution.notes}>{latestEvolution.notes || 'Sem anotações'}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-neutral-900/60 text-neutral-400">
                                <span>Data de Avaliação:</span>
                                <span className="text-white font-mono font-bold">{latestEvolution.date}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-neutral-500 space-y-1">
                            <AlertCircle size={20} className="mx-auto" />
                            <p className="text-xs">Nenhum registro físico ainda cadastrado.</p>
                            <p className="text-[10px]">Aguardando dados inseridos pelo aluno ou por você.</p>
                          </div>
                        )}
                      </div>

                      {selectedStudentEvolution.length > 1 && (
                        <div className="mt-4 border-t border-neutral-800/80 pt-3">
                          <p className="text-[9px] text-[#39FF14] font-mono uppercase tracking-wider mb-2 font-bold select-none text-right">▲ PROGRESSO DETECTADO</p>
                          <p className="text-[11px] text-neutral-400 leading-snug">
                            O aluno reduziu <strong className="text-white font-mono">{(selectedStudentEvolution[0].weight - latestEvolution.weight).toFixed(1)}kg</strong> desde a matrícula inicial em {selectedStudentEvolution[0].date}.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete Student action */}
                  <div className="mt-4 pt-4 border-t border-neutral-800/60 flex justify-end">
                    {isConfirmingDelete ? (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 bg-red-950/20 border border-red-500/20 p-3 rounded-xl animate-fade-in text-[11px] w-full sm:w-auto justify-between">
                        <span className="text-red-300 font-sans font-extrabold text-left mb-1 sm:mb-0">
                          Confirmar a exclusão permanente de {selectedStudent.name}?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteStudent(selectedStudent.id);
                              setSelectedStudentId(students.find(s => s.id !== selectedStudent.id)?.id || '');
                              setIsConfirmingDelete(false);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition cursor-pointer"
                          >
                            Sim, Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingDelete(false)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase font-mono tracking-wider transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/5 px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition duration-200 cursor-pointer"
                      >
                        <Trash2 size={13} /> Deletar Aluno do Sistema
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1.5: CADASTRAR ALUNO (SEPARATED REGISTRATION SHEET) */}
          {activeTab === 'cadastrar_aluno' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus size={20} className="text-[#39FF14]" />
                  Cadastrar Novo Aluno no Sistema
                </h2>
                <p className="text-xs text-neutral-400">Preencha o cadastro inicial do seu aluno. Ele poderá acessar o portal utilizando o Gmail cadastrado aqui ou um convite de 1 clique!</p>
              </div>

              {/* Mode Selection Toggles */}
              <div className="flex bg-neutral-900/60 border border-neutral-800 p-1.5 rounded-2xl gap-2 max-w-md">
                <button
                  type="button"
                  onClick={() => setCadastroMode('rapido')}
                  className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    cadastroMode === 'rapido' 
                      ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/10' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  <Zap size={14} /> Pré-cadastro Rápido
                </button>
                <button
                  type="button"
                  onClick={() => setCadastroMode('completo')}
                  className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    cadastroMode === 'completo' 
                      ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/10' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  <Clipboard size={14} /> Ficha Completa
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="bg-[#121214]/60 border border-neutral-800 p-6 rounded-2xl space-y-5 animate-fade-in">
                {/* Information Callout */}
                {cadastroMode === 'rapido' ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3.5 text-xs">
                    ⚡ <strong>Modo Pré-cadastro Rápido:</strong> Cadastre seu aluno instantaneamente informando apenas os dados básicos de identificação e plano. O sistema criará perfis padrão de avaliação física para que você preencha a ficha técnica e os treinos dele com calma no futuro!
                  </div>
                ) : (
                  <div className="bg-[#39FF14]/5 border border-[#39FF14]/15 text-neutral-300 rounded-xl p-3.5 text-xs">
                    📋 <strong>Modo Ficha de Anamnese Completa:</strong> Modifique todos os atributos de treinamento, biométricos e histórico desde o primeiro contato.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Nome Completo do Aluno</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      placeholder="Ex: Ana Silva" 
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-4 py-3 text-xs outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">WhatsApp do Aluno</label>
                    <input 
                      type="tel"
                      required
                      value={newStudent.phoneWhatsApp || ''}
                      onChange={(e) => setNewStudent({...newStudent, phoneWhatsApp: e.target.value})}
                      placeholder="Ex: +5511999999999"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-4 py-3 text-xs outline-none transition font-sans font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Plano Inicial de Cobrança</label>
                    <select 
                      value={newStudent.plan} 
                      onChange={(e) => setNewStudent({...newStudent, plan: e.target.value as PlanType})}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-3.5 py-3 text-xs outline-none transition cursor-pointer"
                    >
                      <option value="Mensal">Mensal (R$ 150/mês)</option>
                      <option value="Trimestral">Trimestral (R$ 140/mês)</option>
                      <option value="Anual">Anual (R$ 90/mês)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Estado de Acesso Inicial</label>
                    <select 
                      value={newStudent.status} 
                      onChange={(e) => setNewStudent({...newStudent, status: e.target.value as 'Ativo' | 'Inativo'})}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-3.5 py-3 text-xs outline-none transition cursor-pointer"
                    >
                      <option value="Ativo">Ativo (Acesso Liberado / Pagamento Confirmado)</option>
                      <option value="Inativo">Inativo (Aguardando Pagamento do Aluno)</option>
                    </select>
                  </div>

                  {cadastroMode === 'completo' && (
                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Objetivo Físico</label>
                      <select 
                        value={newStudent.objective} 
                        onChange={(e) => setNewStudent({...newStudent, objective: e.target.value as Objective})}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-3.5 py-3 text-xs outline-none transition cursor-pointer"
                      >
                        <option value="Hipertrofia">Ganho de Massa (Hipertrofia)</option>
                        <option value="Emagrecimento">Perda de Peso (Emagrecimento)</option>
                        <option value="Condicionamento">Resistência (Condicionamento)</option>
                        <option value="Definição">Definição Muscular</option>
                        <option value="Reabilitação">Tratamento Físico (Reabilitação)</option>
                      </select>
                    </div>
                  )}
                </div>

                {cadastroMode === 'completo' && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Idade (Anos)</label>
                        <input 
                          type="number" 
                          required 
                          value={newStudent.age}
                          onChange={(e) => setNewStudent({...newStudent, age: Number(e.target.value)})}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-4 py-3 text-xs outline-none transition font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Peso Inicial (kg)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          required 
                          value={newStudent.weight}
                          onChange={(e) => setNewStudent({...newStudent, weight: Number(e.target.value)})}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-4 py-3 text-xs outline-none transition font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Altura Inicial (m)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          required 
                          value={newStudent.height}
                          onChange={(e) => setNewStudent({...newStudent, height: Number(e.target.value)})}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-4 py-3 text-xs outline-none transition font-mono" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Histórico de Atividade Física (Breve relato)</label>
                      <textarea 
                        rows={3}
                        value={newStudent.history}
                        onChange={(e) => setNewStudent({...newStudent, history: e.target.value})}
                        placeholder="Ex: Pratica corrida 3x por semana, já treinou musculação antes..." 
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-4 py-3 text-xs outline-none transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-red-400 uppercase font-mono mb-1.5 font-bold tracking-wider">Limitações Ortopédicas / Restrições Médicas</label>
                      <textarea 
                        rows={3}
                        value={newStudent.restrictions}
                        onChange={(e) => setNewStudent({...newStudent, restrictions: e.target.value})}
                        placeholder="Ex: Leve dor na lombar ao agachar, hérnia L4-L5, cirurgia prévia joelho..." 
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#39FF14] text-white rounded-xl px-4 py-3 text-xs outline-none transition resize-none"
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-neutral-800/80 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-[#39FF14] text-black hover:bg-green-400 px-8 py-3.5 rounded-xl text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#39FF14]/10 flex items-center gap-2"
                  >
                    <Plus size={14} /> Confirmar Pré-cadastro do Aluno
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: TREINOS (MONTAGEM DE TREINO) */}
          {activeTab === 'treinos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Dumbbell size={20} className="text-[#39FF14]" />
                    Construtor de Treinos (Ficha Semanal)
                  </h2>
                  <p className="text-xs text-neutral-400">Monte rotinas personalizadas divididas em treinos A, B, C, D e E.</p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-neutral-400">Editar Aluno:</label>
                  <select 
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.objective})</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStudent ? (
                <div className="bg-neutral-900/20 rounded-2xl border border-neutral-800/80 p-4 md:p-5">
                  <div className="flex items-center gap-4 border-b border-neutral-800 pb-3 mb-4 overflow-x-auto">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => (
                      <button
                        key={letter}
                        onClick={() => setEditingSheetLetter(letter)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${editingSheetLetter === letter ? 'bg-[#39FF14] text-black font-extrabold' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'}`}
                      >
                        Treino {letter}
                      </button>
                    ))}
                  </div>

                  {/* List of current exercises on sheet */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#39FF14] font-mono">Exercícios Atuais (Treino {editingSheetLetter})</h4>
                      <span className="text-[10px] text-neutral-400 font-mono bg-neutral-900 px-2 py-0.5 rounded-full">
                        {currentSheetExercises.length} exercícios definidos
                      </span>
                    </div>

                    {currentSheetExercises.length > 0 ? (
                      <div className="bg-neutral-900/40 rounded-xl divide-y divide-neutral-800/50 border border-neutral-800/60">
                        {currentSheetExercises.map((exercise, idx) => (
                          <div key={exercise.id + '_' + idx} className="p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                                <span className="bg-[#39FF14]/10 text-[#39FF14] text-[10px] px-2 py-0.5 rounded font-mono font-bold select-none">{idx + 1}</span>
                                {exercise.name}
                              </h5>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
                                <span>Séries: <strong className="text-neutral-200 font-mono">{exercise.sets}</strong></span>
                                <span>Repetições: <strong className="text-neutral-200 font-mono">{exercise.reps}</strong></span>
                                <span>Carga Alvo: <strong className="text-neutral-200 font-mono">{exercise.weightCc} kg</strong></span>
                                <span>Descanso: <strong className="text-neutral-200 font-mono">{exercise.restSec}s</strong></span>
                              </div>
                              {exercise.notes && (
                                <p className="text-[11px] text-neutral-500 italic mt-1.5">Obs: {exercise.notes}</p>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteExerciseFromSheet(idx)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition cursor-pointer"
                              title="Remover exercício da ficha"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-neutral-950 p-6 rounded-xl text-center border border-dashed border-neutral-800 text-neutral-500">
                        <Dumbbell size={24} className="mx-auto text-neutral-600 mb-2" />
                        <p className="text-xs">Este treino ({editingSheetLetter}) está vazio para {selectedStudent.name}.</p>
                        <p className="text-[10px]">Use o formulário abaixo para adicionar exercícios explicativos/vídeos.</p>
                      </div>
                    )}
                  </div>

                  {/* Add Exercise form */}
                  <form onSubmit={handleAddExerciseToSheet} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1">
                      <Plus size={14} className="text-[#39FF14]" /> Adicionar Exercício ao Treino {editingSheetLetter}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Selecionar Exercício</label>
                        <select
                          value={selectedExerciseId}
                          onChange={(e) => setSelectedExerciseId(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          {EXERCISE_BANK.map((ex) => (
                            <option key={ex.id} value={ex.id}>[{ex.category}] {ex.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Séries</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="10"
                            value={newExerciseSets} 
                            onChange={(e) => setNewExerciseSets(Number(e.target.value))}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white text-center outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Reps</label>
                          <input 
                            type="text" 
                            value={newExerciseReps} 
                            onChange={(e) => setNewExerciseReps(e.target.value)}
                            placeholder="e.g. 10" 
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white text-center outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Descanso (s)</label>
                          <input 
                            type="number" 
                            value={newExerciseRest} 
                            onChange={(e) => setNewExerciseRest(Number(e.target.value))}
                            step="15"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white text-center outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Carga (kg)</label>
                          <input 
                            type="number" 
                            value={newExerciseWeight} 
                            onChange={(e) => setNewExerciseWeight(Number(e.target.value))}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white text-center outline-none" 
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Observações / Dicas de Execução do Personal</label>
                      <input 
                        type="text" 
                        value={newExerciseNotes}
                        onChange={(e) => setNewExerciseNotes(e.target.value)}
                        placeholder="Ex: Controlar descida excêntrica, pico contrátil de 2s, evitar balançar ombros..." 
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="bg-neutral-800 hover:bg-[#39FF14] text-white hover:text-black py-2 px-5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer w-full"
                    >
                      Adicionar Exercício à Ficha
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-12 text-center text-neutral-500">
                  Selecione ou adicione um aluno para começar a gerenciar sua planilha de treinos.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENDA (SESSÕES PREVISTAS) */}
          {activeTab === 'agenda' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar size={20} className="text-[#39FF14]" />
                    Agenda & Calendário Inteligente
                  </h2>
                  <p className="text-xs text-neutral-400">Organize os agendamentos semanais de aulas presenciais e consultorias online.</p>
                </div>
                <button
                  onClick={() => setShowAddEventModal(true)}
                  className="bg-[#39FF14] hover:bg-green-400 text-black py-2 px-4 rounded-xl font-semibold flex items-center gap-1.5 text-xs transition active:scale-95 cursor-pointer"
                >
                  <Plus size={16} /> Novo Agendamento
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column: Upcoming list */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 font-mono">Agendamentos Planejados ({agenda.length})</h3>

                  <div className="space-y-3">
                    {agenda.length > 0 ? (
                      agenda.map((event) => {
                        const isToday = event.date === new Date().toISOString().split('T')[0];
                        return (
                          <div 
                            key={event.id}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isToday ? 'bg-neutral-900/90 border-[#39FF14]/80' : 'bg-neutral-900/30 border-neutral-800'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl border shrink-0 ${event.type === 'Presencial' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                {event.type === 'Presencial' ? <MapPin size={20} /> : <Video size={20} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-white my-0">{event.title}</h4>
                                  {isToday && (
                                    <span className="bg-[#39FF14]/15 text-[#39FF14] text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-black">HOJE</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-neutral-400">
                                  <span className="flex items-center gap-1"><Clock size={12} className="text-[#39FF14]" /> {event.time} ({event.durationMin} min)</span>
                                  <span>• Data: <strong className="text-neutral-300 font-mono">{event.date.split('-').reverse().join('/')}</strong></span>
                                  <span className="bg-neutral-800 flex items-center px-1.5 rounded-md text-[10px] text-neutral-400">{event.type}</span>
                                </div>
                                {event.notes && (
                                  <p className="text-[11px] text-neutral-500 mt-2 italic px-2 border-l-2 border-neutral-700">Meta/Obs: {event.notes}</p>
                                )}
                              </div>
                            </div>

                            <button 
                              onClick={() => onDeleteAgendaEvent(event.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-neutral-800 p-2 rounded-xl transition self-end sm:self-center"
                              title="Remover agendamento"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 bg-neutral-900/20 border border-neutral-800 border-dashed rounded-xl text-center text-neutral-500">
                        Agenda vazia. Cadastre compromissos presenciais e de vídeo.
                      </div>
                    )}
                  </div>
                </div>

                {/* Column: Work hours/Availability summary info */}
                <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#39FF14] font-mono">Disponibilidade Geral</h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="border-b border-neutral-800 pb-2.5">
                      <p className="text-neutral-400 font-bold">Período Ativo:</p>
                      <p className="text-white mt-1">Segunda a Sexta — 06:00 às 21:00</p>
                    </div>
                    <div className="border-b border-neutral-800 pb-2.5">
                      <p className="text-neutral-400 font-bold">Faturamento de Aula:</p>
                      <p className="text-[#39FF14] font-medium mt-1">Cobrança inclusa na assinatura mensal integrada.</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-bold">Sessões Virtuais:</p>
                      <p className="text-blue-400 mt-1">Salas geradas automaticamente e notificadas por WhatsApp.</p>
                    </div>

                    <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 leading-snug">
                      <strong>Lembrete:</strong> Ao deletar um agendamento da agenda, uma notificação de estorno será gerada se o aluno tiver ativado as Push Notifications no aplicativo.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHAT (COMUNICAÇÃO COM O ALUNO) */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-[#39FF14]" />
                    Chat Interno de Feedbacks
                  </h2>
                  <p className="text-xs text-neutral-400">Melhore o engajamento conversando com alunos em tempo real e colhendo feeds.</p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-neutral-400 shrink-0">Conversar com:</label>
                  <select 
                    value={chatStudentId}
                    onChange={(e) => setChatStudentId(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.objective})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chat Viewport Panel */}
              {chatStudentId ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[440px]">
                  
                  {/* Left Column: Switch Students info list view */}
                  <div className="lg:col-span-1 border border-neutral-800 rounded-xl bg-neutral-950 overflow-y-auto hidden lg:block p-2 space-y-1">
                    {students.map((st) => {
                      const sampleMsg = chats[st.id]?.[chats[st.id].length - 1];
                      const isTalking = st.id === chatStudentId;
                      
                      return (
                        <div
                          key={st.id}
                          onClick={() => setChatStudentId(st.id)}
                          className={`p-2.5 rounded-xl transition cursor-pointer text-left ${isTalking ? 'bg-[#39FF14]/10 border border-[#39FF14]/20' : 'hover:bg-neutral-900/60'}`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={st.avatar} alt={st.name} className="w-8 h-8 rounded-full object-cover pointer-events-none" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate my-0">{st.name}</p>
                              <p className="text-[10px] text-neutral-400 truncate mt-0.5">{sampleMsg ? sampleMsg.text : 'Sem mensagens'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Active Messenger window */}
                  <div className="lg:col-span-3 border border-neutral-800 rounded-xl bg-neutral-900/30 flex flex-col h-full relative overflow-hidden justify-between">
                    
                    {/* Header of Active Student Chat */}
                    <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img 
                          src={students.find(s => s.id === chatStudentId)?.avatar} 
                          alt="chatting with" 
                          className="w-7 h-7 rounded-full object-cover pointer-events-none" 
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white my-0">{students.find(s => s.id === chatStudentId)?.name}</h4>
                          <span className="text-[9px] text-[#39FF14] flex items-center gap-1">● Online (Simulado)</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const student = students.find(s => s.id === chatStudentId);
                            if (!student) return;
                            setWaActiveStudent(student);
                            setWaCustomMessage(`Olá ${student.name}, aqui é seu Personal Trainer! Passando para ver como estão indo os treinos.`);
                            setWaModalOpen(true);
                          }}
                          className="bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700/80 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-neutral-700 text-[10px] font-mono font-bold"
                          title="Opções de Conexão Integrada WhatsApp"
                        >
                          <Phone size={11} className="text-[#39FF14]" />
                          <span className="hidden sm:inline">WhatsApp / Contato</span>
                        </button>

                        <button 
                          onClick={() => {
                            const student = students.find(s => s.id === chatStudentId);
                            if (!student) return;
                            setWaActiveStudent(student);
                            setWaCustomMessage(`Olá ${student.name}! Iniciei nossa sala de vídeo chamada ao vivo de consultoria esportiva no GymPulse. Acesse a sala pelo link:`);
                            setWaModalOpen(true);
                          }}
                          className="bg-[#39FF14]/15 text-[#39FF14] hover:bg-[#39FF14]/25 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-[#39FF14]/30 text-[10px] font-mono font-bold"
                          title="Fazer chamada de Vídeo ou Convidar por WhatsApp"
                        >
                          <Video size={11} />
                          <span className="hidden sm:inline">Vídeo Chamada / Conectar</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[300px]">
                      {(chats[chatStudentId] || []).length > 0 ? (
                        (chats[chatStudentId] || []).map((msg, index) => {
                          const isTrainer = msg.sender === 'trainer';
                          return (
                            <div key={msg.id + '_' + index} className={`flex ${isTrainer ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-3 rounded-2xl max-w-[75%] text-xs border ${isTrainer ? 'bg-[#39FF14]/10 text-neutral-100 border-[#39FF14]/20 rounded-tr-none' : 'bg-neutral-800 text-neutral-200 border-neutral-700/80 rounded-tl-none'}`}>
                                <p className="leading-relaxed m-0 break-words">{msg.text}</p>
                                <span className={`block text-[9px] text-right mt-1 font-mono ${isTrainer ? 'text-neutral-400' : 'text-neutral-500'}`}>{msg.timestamp}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-neutral-500 py-12 flex flex-col items-center justify-center">
                          <MessageSquare size={24} className="text-neutral-700 mb-1" />
                          <p className="text-xs">Inicie a conversa com este aluno!</p>
                          <p className="text-[10px]">Envie dicas de treino ou um incentivo motivacional.</p>
                        </div>
                      )}
                    </div>

                    {/* Input Draft controls */}
                    <div className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center gap-2">
                      <input 
                        type="text" 
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendChatMessage();
                        }}
                        placeholder="Digite sua mensagem para o aluno..." 
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                      />
                      <button 
                        onClick={handleSendChatMessage}
                        className="bg-[#39FF14] text-black p-2 rounded-xl hover:bg-green-400 transition cursor-pointer active:scale-95"
                      >
                        <Send size={15} />
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-neutral-500">
                  Nenhum aluno cadastrado para iniciar o chat.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: NOTIFICAÇÕES (AVISOS EM LOTE) */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell size={20} className="text-[#39FF14]" />
                  Avisos Automáticos & Mensagens de CRM
                </h2>
                <p className="text-xs text-neutral-400">Automatize lembretes diários de hidratação, avisos de atualização de treinos e revalidação de planos de assinaturas.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Send notificaton form */}
                <div className="lg:col-span-2 bg-[#121214]/60 p-4 rounded-xl border border-neutral-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Disparar Lembrete / Notificação</h3>

                  {/* Quick templates presets */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-mono text-neutral-500 font-bold">Modelos Rápidos Presets</p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        type="button" 
                        onClick={() => applyTemplate('hidratacao')}
                        className="bg-neutral-900 hover:bg-[#39FF14]/10 border border-neutral-800 hover:border-[#39FF14]/30 px-3 py-1.5 rounded-xl text-[10px] font-bold text-neutral-300 transition"
                      >
                        💧 Lembrete Hidratação
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyTemplate('ficha')}
                        className="bg-neutral-900 hover:bg-[#39FF14]/10 border border-neutral-800 hover:border-[#39FF14]/30 px-3 py-1.5 rounded-xl text-[10px] font-bold text-neutral-300 transition"
                      >
                        🏋️ Atualização Ficha Treino
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyTemplate('motivacao')}
                        className="bg-neutral-900 hover:bg-[#39FF14]/10 border border-neutral-800 hover:border-[#39FF14]/30 px-3 py-1.5 rounded-xl text-[10px] font-bold text-neutral-300 transition"
                      >
                        🔥 Frase Motivacional
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyTemplate('mensalidade')}
                        className="bg-neutral-900 hover:bg-[#39FF14]/10 border border-neutral-800 hover:border-[#39FF14]/30 px-3 py-1.5 rounded-xl text-[10px] font-bold text-neutral-300 transition"
                      >
                        💳 Cobrança / Renovações
                      </button>
                    </div>
                  </div>

                  {notifFeedback && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-pulse">
                      <CheckCircle size={15} /> {notifFeedback}
                    </div>
                  )}

                  <form onSubmit={dispatchNotification} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Destinatário</label>
                        <select 
                          value={notifTargetStudent}
                          onChange={(e) => setNotifTargetStudent(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="all">Fila Geral (Todos os Alunos)</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Canal de Envio</label>
                        <select 
                          value={notifChannel}
                          onChange={(e) => setNotifChannel(e.target.value as any)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="whatsapp">📱 WhatsApp (Simulação API)</option>
                          <option value="push">🔔 Push Notification App</option>
                          <option value="email">✉️ E-mail do Aluno</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Categoria de Lembrete</label>
                        <select 
                          value={notifType}
                          onChange={(e) => setNotifType(e.target.value as any)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="reminder">Cobrança/Aviso Cronometrado</option>
                          <option value="motivation">Citação Motivadora</option>
                          <option value="workout">Nova Planilha Treino</option>
                          <option value="plan">Vencimento de Assinatura</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Título da Mensagem</label>
                      <input 
                        type="text" 
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="Ex: Hora do Treino! 🏋️" 
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Corpo da Mensagem / WhatsApp</label>
                      <textarea
                        required
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        rows={3}
                        placeholder="Digite o texto explicativo..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="bg-[#39FF14] text-black hover:bg-green-400 py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer w-full"
                    >
                      Disparar Mensagem Instantânea
                    </button>
                  </form>
                </div>

                {/* Log of dispatched items */}
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 font-mono">Fila de Disparos Recentes</h3>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-800/60 text-xs">
                        <div className="flex items-center justify-between mb-1 text-[10px] text-neutral-500 font-mono">
                          <span>Para: {notif.studentName}</span>
                          <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 uppercase tracking-wider">{notif.channel}</span>
                        </div>
                        <h4 className="font-bold text-white mb-0.5">{notif.title}</h4>
                        <p className="text-neutral-400 text-[11px] leading-relaxed break-words">{notif.message}</p>
                        <span className="text-[9px] text-neutral-500 mt-1 block text-right font-mono">{notif.sentAt}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: PLANOS E ASSINATURAS */}
          {activeTab === 'planos' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard size={20} className="text-[#39FF14]" />
                  Planos, Vendas e Assinaturas Integradas
                </h2>
                <p className="text-xs text-neutral-400">Configure os planos comercializados na sua consultoria e visualize o faturamento mensal gerado.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Faturamento chart simulation */}
                <div className="bg-[#121214]/60 p-5 rounded-xl border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#39FF14] font-mono">Simulador Financeiro SaaS</h3>
                    <span className="text-xs bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full select-none">Total: 5 meses</span>
                  </div>

                  {/* Graphic columns representation */}
                  <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2">
                    {revenueLogs.map((log, index) => {
                      // Max layout height relative to maximum billing (ex 2150)
                      const pct = Math.max(20, (log.total / 2200) * 100);
                      return (
                        <div key={log.month + '_' + index} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-[10px] text-neutral-400 font-mono">R${log.total}</span>
                          <div 
                            style={{ height: `${pct}%` }}
                            className="bg-[#39FF14]/80 hover:bg-[#39FF14] w-full rounded-t-lg transition-all duration-300 relative group"
                          >
                            <div className="absolute opacity-0 group-hover:opacity-100 bg-neutral-800 border border-neutral-700 p-1.5 rounded text-[8px] text-neutral-200 -top-8 left-1/2 -translate-x-1/2 w-16 text-center shadow-lg transition">
                              {log.payments} assinaturas pagas
                            </div>
                          </div>
                          <span className="text-xs text-white font-semibold font-mono">{log.month}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                    <div>
                      <p>Faturamento Anual Acumulado: <strong className="text-white font-mono">R$ 8.500,00</strong></p>
                    </div>
                    <div>
                      <p className="text-green-400 flex items-center gap-1"><ArrowUpRight size={14} /> +19.4% crescimento</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Plan configurator */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 font-mono">Planos Ativos Oferecidos</h3>
                    <p className="text-[10px] text-neutral-500 font-mono">Dê autonomia para editar os benefícios e valores de cada plano</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {marketingPlans.map((plan) => (
                      <div 
                        key={plan.id}
                        className={`p-4 rounded-xl relative overflow-hidden flex flex-col justify-between ${
                          plan.recommended 
                            ? 'bg-neutral-900 border-[#39FF14] border-2 shadow-lg shadow-[#39FF14]/5' 
                            : 'bg-neutral-900/60 border border-neutral-800'
                        }`}
                      >
                        <div>
                          {plan.recommended ? (
                            <div className="absolute top-0 right-0 bg-[#39FF14] text-black text-[8px] font-sans uppercase font-black py-1 px-2">RECOMENDADO</div>
                          ) : (
                            <div className="absolute top-0 right-0 bg-[#39FF14]/10 text-[#39FF14] text-[8px] font-mono uppercase font-bold py-1 px-2 rounded-bl-lg">
                              {plan.id.toUpperCase()}
                            </div>
                          )}
                          
                          <h4 className="text-xs text-neutral-400 font-mono uppercase mt-1">{plan.title}</h4>
                          <p className={`text-xl font-bold font-mono ${plan.recommended ? 'text-[#39FF14]' : 'text-white'}`}>
                            R$ {plan.price}
                            <span className="text-xs text-neutral-400 font-sans">{plan.period}</span>
                          </p>
                          
                          <ul className="text-[10px] text-neutral-400 space-y-1 pt-2 pb-4">
                            {plan.features.map((feature, idx) => (
                              <li key={idx}>• {feature}</li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => {
                            setEditingPlan(plan);
                            setEditingFeaturesText(plan.features.join('\n'));
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-800/60 text-[10px] font-medium text-neutral-300 transition-colors"
                        >
                          <Edit3 size={11} className="text-[#39FF14]" />
                          Editar Valores & Coisas
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-neutral-900/30 rounded-xl border border-neutral-800 space-y-2">
                    <h4 className="text-xs font-bold text-white">Praticidade Pix e Link de Pagamento</h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Seus alunos recebem no próprio app deles as informações de renovação com Pix Copie e Cole integrado. O app GymPulse automatiza os alertas de cobrança sem constrangimentos e renova os acessos às fichas sem intervenção direta do personal.
                    </p>
                  </div>

                  <div className="p-5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-[#39FF14]" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Meios de Recebimento de Alunos</h4>
                      </div>
                      <span className="text-[8px] font-mono font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/10">CONFIGURAÇÃO DE SAQUE</span>
                    </div>

                    <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                      Defina abaixo para qual conta PIX os seus alunos da consultoria irão transferir as mensalidades. Toda a transação é 100% direta entre você e o aluno.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1.5">Tipo de Chave Pix</label>
                        <select
                          value={profilePixKeyType}
                          onChange={(e) => setProfilePixKeyType(e.target.value as any)}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-2 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition font-sans"
                        >
                          <option value="Chave Aleatória">Chave Aleatória</option>
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                          <option value="Telefone">Telefone</option>
                          <option value="E-mail">E-mail</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1.5">WhatsApp p/ Registro</label>
                        <input
                          type="text"
                          required
                          placeholder="+5511999999999"
                          value={profilePhoneWhatsApp}
                          onChange={(e) => setProfilePhoneWhatsApp(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1.5">Chave Pix de Destino</label>
                      <input
                        type="text"
                        required
                        placeholder="Cole ou digite sua chave..."
                        value={profilePixKey}
                        onChange={(e) => setProfilePixKey(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs font-mono text-[#39FF14] px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest leading-none mb-1">QR Code Pix (Imagem ou link)</label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                        {/* Left: Input Text and Drop Area */}
                        <div className="md:col-span-8 space-y-2">
                          <input
                            type="text"
                            placeholder="Insira a URL ou cole a string Base64 do QR Code..."
                            value={profilePixQrCode}
                            onChange={(e) => setProfilePixQrCode(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 text-xs font-mono text-white px-3 py-2 rounded-xl focus:outline-none focus:border-[#39FF14] transition"
                          />
                          
                          {/* Drag-and-drop Dropzone according to environment guidelines */}
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                              dragActive 
                                ? 'border-[#39FF14] bg-[#39FF14]/5 text-[#39FF14]' 
                                : 'border-neutral-800 hover:border-neutral-700 text-neutral-400 bg-neutral-950/30'
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                            <Upload size={16} className={`${dragActive ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                            <p className="text-[10px] font-sans font-semibold">
                              Arraste e solte o seu QR Code físico aqui ou <span className="text-[#39FF14] underline">clique para selecionar</span>
                            </p>
                            <p className="text-[9px] text-neutral-500">Aceita PNG, JPEG ou GIF</p>
                          </div>
                        </div>

                        {/* Right: Real-time visual sandbox preview of QR Code */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 min-h-[120px]">
                          {profilePixQrCode ? (
                            <div className="space-y-1.5 w-full flex flex-col items-center">
                              <div className="w-20 h-20 bg-white p-1 rounded-lg flex items-center justify-center">
                                <img
                                  src={profilePixQrCode}
                                  alt="PIX QR Code preview"
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setProfilePixQrCode('')}
                                className="text-[9px] text-red-400 hover:text-red-300 font-mono uppercase bg-red-950/15 border border-red-900/20 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Remover QR
                              </button>
                            </div>
                          ) : (
                            <div className="text-center p-2">
                              <Image size={18} className="text-neutral-600 mx-auto mb-1" />
                              <span className="text-[8px] text-neutral-500 font-sans block">Nenhum QR</span>
                              <span className="text-[7px] text-neutral-600 font-sans block leading-tight mt-0.5">Usará simulador de QR Code padrão no portal do aluno</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>



                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateTrainer && activeTrainer) {
                            const updated: Trainer = {
                              ...activeTrainer,
                              pixKeyType: profilePixKeyType,
                              pixKey: profilePixKey.trim(),
                              pixQrCode: profilePixQrCode.trim(),
                              phoneWhatsApp: profilePhoneWhatsApp.trim(),
                              stripeEnabled: profileStripeEnabled,
                              stripePublishableKey: profileStripePublishableKey.trim(),
                              stripeSecretKey: profileStripeSecretKey.trim()
                            };
                            onUpdateTrainer(updated);
                            setSavedReceivingFeedback(true);
                            setTimeout(() => setSavedReceivingFeedback(false), 3000);
                          }
                        }}
                        className="bg-[#39FF14] text-black px-4 py-2 bg-[#39FF14] hover:bg-green-400 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-mono uppercase w-full sm:w-auto"
                      >
                        <Check size={13} /> Gravar Dados de Recebimento Pix
                      </button>
                    </div>

                    {savedReceivingFeedback && (
                      <p className="text-[#39FF14] text-[10px] text-right font-mono animate-pulse">✓ Meios de recebimento salvos com sucesso!</p>
                    )}
                  </div>

                  {/* Dedicated Stripe API Credentials Integration Card */}
                  <div className="p-5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-[#39FF14]" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Integração Direta Stripe</h4>
                      </div>
                      <span className="text-[8px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">CREDENCIAIS EXCLUSIVAS</span>
                    </div>

                    <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                      Habilite pagamentos via cartão de crédito para seus alunos de consultoria conectando sua própria conta Stripe. Se as chaves estiverem em branco ou se a chave secreta expirar, o portal mudará automaticamente para o simulador seguro GymPulse para testes de fluxo.
                    </p>

                    <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-850">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-white font-mono font-bold uppercase block text-left">Habilitar checkout Stripe</span>
                        <span className="text-[9px] text-neutral-500 block text-left">Permite receber por cartão de crédito direto dos alunos</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileStripeEnabled(!profileStripeEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          profileStripeEnabled ? 'bg-[#39FF14]' : 'bg-neutral-850'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                            profileStripeEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {profileStripeEnabled && (
                      <div className="space-y-3 animate-fade-in text-left">
                        <div>
                          <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1.5">Stripe Publishable Key (pk_test_...)</label>
                          <input
                            type="text"
                            placeholder="Ex: pk_test_51Nx..."
                            value={profileStripePublishableKey}
                            onChange={(e) => setProfileStripePublishableKey(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 text-xs font-mono text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1.5">Stripe Secret Key (sk_test_... ou rk_test_...)</label>
                          <div className="relative">
                            <input
                              type={showSecretKeyField ? 'text' : 'password'}
                              placeholder="Ex: sk_test_51Nx... ou rk_test_..."
                              value={profileStripeSecretKey}
                              onChange={(e) => setProfileStripeSecretKey(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 text-xs font-mono text-white pl-3 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSecretKeyField(!showSecretKeyField)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition cursor-pointer"
                            >
                              {showSecretKeyField ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          <p className="text-[8px] font-mono text-neutral-550 mt-1 leading-normal">
                            🔒 <strong>Segurança de Credenciais Garantida:</strong> Sua Secret Key é transmitida através de tráfego HTTPS criptografado direto ponta-a-ponta e armazenada de forma segura na nuvem da consultoria.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateTrainer && activeTrainer) {
                            const updated: Trainer = {
                              ...activeTrainer,
                              pixKeyType: profilePixKeyType,
                              pixKey: profilePixKey.trim(),
                              pixQrCode: profilePixQrCode.trim(),
                              phoneWhatsApp: profilePhoneWhatsApp.trim(),
                              stripeEnabled: profileStripeEnabled,
                              stripePublishableKey: profileStripePublishableKey.trim(),
                              stripeSecretKey: profileStripeSecretKey.trim()
                            };
                            onUpdateTrainer(updated);
                            setSavedReceivingFeedback(true);
                            setTimeout(() => setSavedReceivingFeedback(false), 3000);
                          }
                        }}
                        className="bg-indigo-600 hover:bg-[#39FF14] hover:text-black text-white px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-mono uppercase w-full sm:w-auto"
                      >
                        <Check size={13} /> Gravar Credenciais Stripe
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: HISTÓRICO DE ACESSOS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock size={20} className="text-[#39FF14]" />
                  Log de Auditoria e Acessos (Sincronizado)
                </h2>
                <p className="text-xs text-neutral-400">Rastreie e audite os logins e acessos ao sistema por profissionais e alunos em tempo real na base de dados.</p>
              </div>

              <div className="bg-[#121214]/60 rounded-xl border border-neutral-800 overflow-hidden shadow-black/40 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-[#18181b] text-[10px] uppercase font-mono tracking-wider text-neutral-400 border-b border-neutral-800">
                      <tr>
                        <th className="px-5 py-3.5">Data e Hora</th>
                        <th className="px-5 py-3.5">Função</th>
                        <th className="px-5 py-3.5">Usuário</th>
                        <th className="px-5 py-3.5">Ações Registradas</th>
                        <th className="px-5 py-3.5 text-right">Plataforma/Dispositivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/40 font-sans">
                      {accessLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-900/40 transition">
                          <td className="px-5 py-3.5 font-mono text-[#39FF14] whitespace-nowrap">{log.timestamp}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${log.role === 'trainer' ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {log.role === 'trainer' ? 'Personal' : 'Aluno'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-white truncate max-w-[150px]">{log.userName}</td>
                          <td className="px-5 py-3.5 text-neutral-200">{log.action}</td>
                          <td className="px-5 py-3.5 text-neutral-400 font-mono text-[10px] text-right whitespace-nowrap">{log.device}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {accessLogs.length === 0 && (
                  <div className="p-12 text-center text-neutral-500 space-y-2">
                    <AlertCircle size={28} className="mx-auto text-neutral-600" />
                    <p className="text-xs">Nenhum log de acesso registrado na auditoria.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: PERSONALIZAR & CONFIGURAÇÕES */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings size={20} className="text-[#39FF14]" style={{ color: profileThemeColor }} />
                    Configurações & Personalização do Sistema
                  </h2>
                  <p className="text-xs text-neutral-400">Customize a identidade visual, configure seus links integrados, métodos de pagamento e chaves de API.</p>
                </div>
                
                {settingsSavedFeedback && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                    <CheckCircle size={15} />
                    <span>{settingsSavedFeedback}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveGlobalSettings} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* CARD 1: PERSONALIZAÇÃO VISUAL (COLOR PICKER) */}
                  <div className="bg-[#121214]/60 p-6 rounded-2xl border border-neutral-800 space-y-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3 mb-4">
                        <span className="p-1.5 rounded-lg bg-[#39FF14]/15 border border-[#39FF14]/30" style={{ backgroundColor: `${profileThemeColor}1A`, borderColor: `${profileThemeColor}4D` }}>
                          <span className="block w-4 h-4 rounded-full" style={{ backgroundColor: profileThemeColor }} />
                        </span>
                        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-200 font-mono">🎨 Identidade Visual (Cor Primária)</h3>
                      </div>

                      <div className="space-y-4">
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Selecione o tom de cor principal que define a sua marca de assessoria esportiva. Essa cor se aplica dinamicamente em botões, bordas acesas, efeitos de seleção, cronômetros de treino e no portal de acesso dos alunos!
                        </p>

                        <div>
                          <label className="block text-[10px] text-neutral-500 uppercase font-mono tracking-widest font-bold mb-2">Paleta de Cores Recomendadas</label>
                          <div className="flex flex-wrap gap-2.5">
                            {[
                              { name: 'Limão Cyber (Padrão)', value: '#39FF14' },
                              { name: 'Azul Elétrico', value: '#00E5FF' },
                              { name: 'Teal Fit', value: '#00F5D4' },
                              { name: 'Roxo Força', value: '#B026FF' },
                              { name: 'Orquídea', value: '#FF007F' },
                              { name: 'Fúcsia', value: '#E91E63' },
                              { name: 'Vermelho Fênix', value: '#FF4D4D' },
                              { name: 'Laranja Energético', value: '#FFA500' },
                              { name: 'Sol de Ouro', value: '#FFEE00' }
                            ].map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setProfileThemeColor(preset.value)}
                                className={`w-8 h-8 rounded-full border-2 transition relative ${
                                  profileThemeColor === preset.value 
                                    ? 'border-white scale-110 shadow-md shadow-white/20' 
                                    : 'border-transparent hover:scale-105 hover:border-neutral-700'
                                }`}
                                style={{ backgroundColor: preset.value }}
                                title={preset.name}
                              >
                                {profileThemeColor === preset.value && (
                                  <span className="absolute inset-0 flex items-center justify-center text-black text-xs font-black">
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Inline color picker inputs */}
                        <div className="pt-2">
                          <label className="block text-[10px] text-neutral-500 uppercase font-mono tracking-widest font-bold mb-2">Seletor de Cor Livre (Color Picker)</label>
                          <div className="flex items-center gap-4 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                            <input
                              type="color"
                              value={profileThemeColor}
                              onChange={(e) => setProfileThemeColor(e.target.value)}
                              className="w-12 h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-neutral-400 font-mono">Código hexadecimal:</p>
                              <p className="text-xs font-mono font-bold text-white uppercase">{profileThemeColor}</p>
                            </div>
                            <span 
                              className="text-[9px] px-2 py-1 font-mono font-bold rounded"
                              style={{ backgroundColor: `${profileThemeColor}20`, color: profileThemeColor, border: `1px solid ${profileThemeColor}40` }}
                            >
                              COR SELECIONADA
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: DADOS PÚBLICOS & CANAL DE ACESSO */}
                  <div className="bg-[#121214]/60 p-6 rounded-2xl border border-neutral-800 space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3 mb-2">
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Users size={16} />
                      </span>
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-200 font-mono font-bold">👤 Configuração do Canal & Identidade</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                          Nome de Apresentação / Marca
                        </label>
                        <input
                          type="text"
                          required
                          value={profileTrainerName}
                          onChange={(e) => setProfileTrainerName(e.target.value)}
                          className="w-full bg-[#0a0a0c] border border-neutral-800 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                          Prefixo Personalizado do seu Link Único
                        </label>
                        <div className="flex items-center bg-[#0a0a0c] border border-neutral-800 rounded-xl px-3 py-2.5 focus-within:border-neutral-700">
                          <span className="text-[10px] font-mono text-neutral-500 select-none">/?trainerId=</span>
                          <input
                            type="text"
                            required
                            value={profileTrainerLink}
                            onChange={(e) => setProfileTrainerLink(e.target.value)}
                            className="flex-1 bg-transparent text-xs text-white ml-1 focus:outline-none"
                          />
                        </div>
                        <p className="text-[9px] font-mono text-neutral-500 mt-1">
                          Link definitivo: <span className="underline" style={{ color: profileThemeColor }}>{window.location.origin}/?trainerId={profileTrainerLink}</span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                          Telefone Comercial (WhatsApp de Suporte)
                        </label>
                        <input
                          type="text"
                          required
                          value={profilePhoneWhatsApp}
                          onChange={(e) => setProfilePhoneWhatsApp(e.target.value)}
                          className="w-full bg-[#0a0a0c] border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none transition"
                          placeholder="+5511999999999"
                        />
                        <p className="text-[9px] text-neutral-500 mt-1">Insira com DDI (+55), código de área e o número completo para os chats integrados.</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* BOTTOM COMPOSITE ACTION PANEL */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto text-black font-extrabold text-xs px-8 py-3 rounded-xl transition duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg"
                    style={{ backgroundColor: profileThemeColor }}
                  >
                    Salvar Todas as Configurações
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* MODAL 2: ADICIONAR COMPROMISSO NA AGENDA */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowAddEventModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Calendar size={20} className="text-[#39FF14]" /> Agendar Sessão de Aluno
            </h3>
            <p className="text-xs text-neutral-400 mb-6 font-sans">Cadastre compromissos de treino com horários específicos para os seus alunos.</p>

            <form onSubmit={handleScheduleEvent} className="space-y-4">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Título do Compromisso / Foco de Aula</label>
                <input 
                  type="text" 
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Ex: Treino Presencial Integrado Pernas - Ana" 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Selecionar Aluno</label>
                  <select 
                    value={newEvent.studentId}
                    onChange={(e) => setNewEvent({...newEvent, studentId: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">Nenhum (Compromisso Administrativo / Outro)</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Modalidade da Sessão</label>
                  <select 
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value as 'Presencial' | 'Online'})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="Presencial">Presencial (Personal na Academia)</option>
                    <option value="Online">Online (Simulado Vídeo-Plataforma)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Data</label>
                  <input 
                    type="date" 
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Hora Início</label>
                  <input 
                    type="time" 
                    required
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Duração (Minutos)</label>
                  <input 
                    type="number" 
                    value={newEvent.durationMin}
                    onChange={(e) => setNewEvent({...newEvent, durationMin: Number(e.target.value)})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono text-center"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Metas / Observações Rápidas</label>
                  <input 
                    type="text"
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                    placeholder="Ex: Aquecimento articular, avaliação de cargas nos sets 3 e 4..." 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button 
                  type="button" 
                  onClick={() => setShowAddEventModal(false)}
                  className="text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[#39FF14] text-black px-5 py-2.5 rounded-xl text-xs font-bold transition hover:bg-green-400"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR VANTAGENS E VALOR DE PLANO */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button 
              onClick={() => setEditingPlan(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard size={20} className="text-[#39FF14]" /> Editar Plano de Marketing: {editingPlan.id}
            </h3>
            <p className="text-xs text-neutral-400 mb-6 font-sans">Atualize o valor, a recomendação e a lista de benefícios e coisas inclusas neste plano.</p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateMarketingPlan) {
                  const items = editingFeaturesText
                    .split('\n')
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
                  
                  onUpdateMarketingPlan({
                    ...editingPlan,
                    features: items
                  });
                }
                setEditingPlan(null);
              }} 
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Título de Exibição do Plano</label>
                <input 
                  type="text" 
                  required
                  value={editingPlan.title}
                  onChange={(e) => setEditingPlan({...editingPlan, title: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Valor Unitário Mensal (R$)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Destaque Exclusivo</label>
                  <div className="flex items-center h-10">
                    <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={!!editingPlan.recommended}
                        onChange={(e) => setEditingPlan({...editingPlan, recommended: e.target.checked})}
                        className="rounded border-neutral-800 bg-neutral-950 text-[#39FF14] focus:ring-[#39FF14] w-4 h-4"
                      />
                      Destacar como Recomendado
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Vantagens / Diferenciais do Plano (Uma por linha)</label>
                <textarea 
                  rows={4}
                  required
                  value={editingFeaturesText}
                  onChange={(e) => setEditingFeaturesText(e.target.value)}
                  placeholder="Ex: Planilha de Treino Semanal&#10;Suporte por Chat&#10;Consultoria Online"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-sans leading-relaxed"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button 
                  type="button" 
                  onClick={() => setEditingPlan(null)}
                  className="text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[#39FF14] text-black px-5 py-2.5 rounded-xl text-xs font-bold transition hover:bg-green-400"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Integrated WhatsApp Connection Dialog */}
      {waModalOpen && waActiveStudent && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative animate-scale-up shadow-2xl">
            <button
              onClick={() => {
                setWaModalOpen(false);
                setWaActiveStudent(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex p-3 rounded-full bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366]">
                <MessageSquare size={24} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight font-mono">Central WhatsApp & Conexão</h3>
              <p className="text-[11px] text-neutral-400">
                Selecione como quer interagir com seu aluno <strong className="text-[#39FF14]">{waActiveStudent.name}</strong> por canais de comunicação direta:
              </p>
            </div>

            <div className="space-y-4">
              {/* Opção 1: Mensagem de Texto */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5 uppercase">
                    <MessageCircle size={14} className="text-[#25D366]" /> 1. Enviar Mensagem de Texto
                  </span>
                  <span className="text-[9px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 font-mono">WhatsApp Web/App</span>
                </div>
                
                <textarea
                  value={waCustomMessage}
                  onChange={(e) => setWaCustomMessage(e.target.value)}
                  placeholder="Escreva sua mensagem personalizada..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#39FF14] transition-all resize-none h-16 font-sans"
                />

                <button
                  onClick={() => {
                    const phoneDigits = waActiveStudent.phoneWhatsApp ? waActiveStudent.phoneWhatsApp.replace(/\D/g, '') : '';
                    if (phoneDigits) {
                      window.open(`https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(waCustomMessage)}`, '_blank');
                    } else {
                      alert('Este aluno ainda não cadastrou o número de WhatsApp.');
                    }
                  }}
                  className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-black font-extrabold text-[11px] py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={12} />
                  <span>Enviar Mensagem via WhatsApp</span>
                </button>
              </div>

              {/* Opção 2: Ligação Telefônica / Voz */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5 uppercase">
                  <Phone size={14} className="text-[#39FF14]" /> 2. Fazer Chamada / Ligação
                </span>
                
                <p className="text-[10px] text-neutral-400">
                  Inicie uma ligação de voz padrão no celular ou use o WhatsApp padrão para contatar rápido.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${waActiveStudent.phoneWhatsApp?.replace(/\D/g, '') || ''}`}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold text-[10px] py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border border-neutral-700"
                  >
                    <Smartphone size={12} />
                    <span>Ligação Celular</span>
                  </a>
                  <button
                    onClick={() => {
                      const phoneDigits = waActiveStudent.phoneWhatsApp ? waActiveStudent.phoneWhatsApp.replace(/\D/g, '') : '';
                      if (phoneDigits) {
                        window.open(`https://api.whatsapp.com/send?phone=${phoneDigits}&text=Olá%20${encodeURIComponent(waActiveStudent.name)}%2C%20podemos%20fazer%20uma%20ligaçao%20de%20voz%20rápida%20pelo%20WhatsApp%3F`, '_blank');
                      } else {
                        alert('Este aluno ainda não cadastrou o número de WhatsApp.');
                      }
                    }}
                    className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-extrabold text-[10px] py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <MessageSquare size={12} fill="#25D366" className="text-[#25D366]" />
                    <span>Ligar no WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Opção 3: Iniciar Chamada de Vídeo */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-[#39FF14]/20 space-y-3 shadow-md shadow-[#39FF14]/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#39FF14] font-mono flex items-center gap-1.5 uppercase">
                    <Video size={14} /> 3. Vídeo Chamada de Treino ao Vivo
                  </span>
                  <span className="text-[8px] bg-[#39FF14]/15 border border-[#39FF14]/30 px-1.5 py-0.5 rounded text-[#39FF14] font-mono font-black animate-pulse">Recomendado</span>
                </div>

                <p className="text-[10px] text-neutral-400">
                  Geramos uma sala de vídeo-conferência ultra-veloz e segura via Jitsi Meet, e oferecemos para enviar o link direto no WhatsApp dele!
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const trainerId = activeTrainer?.id || 'trainer';
                      const roomUrl = `https://meet.jit.si/GymPulse-Call-${waActiveStudent.id}-${trainerId}`;
                      
                      // 1. Send internal chat message
                      onSendMessage(waActiveStudent.id, `🎥 Profissional iniciou uma chamada de vídeo de treino online! Entre na sala ao vivo:\n${roomUrl}`);
                      
                      // 2. Open room
                      window.open(roomUrl, '_blank');
                    }}
                    className="w-full bg-[#39FF14] text-black font-extrabold text-[11px] py-2.5 rounded-lg transition-all hover:bg-[#39FF14]/90 cursor-pointer flex items-center justify-center gap-1.5 group"
                  >
                    <Video size={13} className="group-hover:scale-110 transition-transform" />
                    <span>Abrir Sala de Aula ao Vivo</span>
                  </button>

                  <button
                    onClick={() => {
                      const phoneDigits = waActiveStudent.phoneWhatsApp ? waActiveStudent.phoneWhatsApp.replace(/\D/g, '') : '';
                      const trainerId = activeTrainer?.id || 'trainer';
                      const roomUrl = `https://meet.jit.si/GymPulse-Call-${waActiveStudent.id}-${trainerId}`;
                      const videoCallMessage = `Olá ${waActiveStudent.name}! Escrevi seus novos treinos e estou te convidando para nossa vídeo-chamada de treino ao vivo no GymPulse. Acesse a sala por aqui: ${roomUrl}`;
                      
                      if (phoneDigits) {
                        window.open(`https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(videoCallMessage)}`, '_blank');
                      } else {
                        alert('Este aluno ainda não cadastrou o número de WhatsApp.');
                      }
                    }}
                    className="w-full bg-transparent hover:bg-neutral-800 text-neutral-300 font-extrabold text-[10px] py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border border-neutral-800"
                  >
                    <MessageSquare size={12} className="text-[#25D366]" />
                    <span>Convidar Aluno via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SaaS License Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative my-8 animate-scale-up shadow-2xl">
            <button
              onClick={() => {
                if (licensePaymentLoadingStep === 0) {
                  setShowUpgradeModal(false);
                }
              }}
              disabled={licensePaymentLoadingStep > 0 && licensePaymentLoadingStep < 4}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex p-3 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/25 text-[#39FF14]">
                <CreditCard size={24} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight font-mono">Regularizar Assinatura SaaS GymPulse</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Escolha o plano e o meio de pagamento ideal para reativar seu acesso total sem restrições.
              </p>
            </div>

            {/* Plan Selector inside payment module */}
            <div className="mb-5 space-y-2">
              <label className="block text-[10px] text-neutral-400 font-mono font-black uppercase tracking-widest leading-none">
                1. Escolha o seu Plano de Licença
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'Mensal', price: 'R$ 39,90', period: '/mês', desc: 'Ideal p/ testar' },
                  { key: 'Trimestral', price: 'R$ 97,00', period: '/trimestre', desc: 'Melhor custo' },
                  { key: 'Anual', price: 'R$ 297,00', period: '/ano', desc: 'Economia máxima' }
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      if (licensePaymentLoadingStep === 0) {
                        setLicenseSelectedPlan(p.key as PlanType);
                      }
                    }}
                    disabled={licensePaymentLoadingStep > 0}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer group ${
                      licenseSelectedPlan === p.key
                        ? 'bg-[#39FF14]/10 border-[#39FF14] text-white'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider">{p.key}</span>
                      {licenseSelectedPlan === p.key && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]"></span>
                      )}
                    </div>
                    <p className="text-xs font-black text-white font-mono mt-1">
                      {p.price}
                      <span className="text-[9px] font-normal text-neutral-400">{p.period}</span>
                    </p>
                    <p className="text-[8px] text-neutral-500 font-sans group-hover:text-neutral-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="space-y-2 mb-5">
              <label className="block text-[10px] text-neutral-400 font-mono font-black uppercase tracking-widest leading-none">
                2. Selecione o Meio de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    if (licensePaymentLoadingStep === 0) {
                      setLicensePaymentMethod('pix');
                    }
                  }}
                  disabled={licensePaymentLoadingStep > 0}
                  className={`py-2 rounded-lg text-xs font-black uppercase font-mono tracking-wider transition cursor-pointer ${
                    licensePaymentMethod === 'pix'
                      ? 'bg-[#39FF14] text-black shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  ⚡ Pix Instante
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (licensePaymentLoadingStep === 0) {
                      setLicensePaymentMethod('stripe');
                    }
                  }}
                  disabled={licensePaymentLoadingStep > 0}
                  className={`py-2 rounded-lg text-xs font-black uppercase font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                    licensePaymentMethod === 'stripe'
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <CreditCard size={12} /> Cartão (Stripe)
                </button>
              </div>
            </div>

            {/* Dynamic content depending on payment method */}
            {licensePaymentLoadingStep > 0 ? (
              /* Transaction Processing Loader */
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-6 text-center space-y-4">
                {licensePaymentLoadingStep < 4 ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-6">
                    <div className="w-10 h-10 border-4 border-dashed border-[#39FF14] rounded-full animate-spin"></div>
                    <div className="space-y-1">
                      <p className="text-xs text-white font-mono uppercase tracking-widest font-black animate-pulse">
                        {licensePaymentLoadingStep === 1 && 'Contatando API Stripe...'}
                        {licensePaymentLoadingStep === 2 && 'Autorizando Token de Cartão...'}
                        {licensePaymentLoadingStep === 3 && 'Aguardando Webhook de Ativação...'}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-sans">
                        {licensePaymentLoadingStep === 1 && 'Preparando conexões criptografadas de ponta a ponta.'}
                        {licensePaymentLoadingStep === 2 && 'Stripe está processando as credenciais de segurança.'}
                        {licensePaymentLoadingStep === 3 && 'Recebendo confirmação de transação e liberando licença.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 py-6 animate-scale-up">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[#39FF14] flex items-center justify-center animate-bounce">
                      <Check size={24} />
                    </div>
                    <p className="text-sm font-black text-white font-mono uppercase tracking-wider">Assinatura Ativada!</p>
                    <p className="text-xs text-neutral-400 font-sans max-w-xs leading-relaxed">
                      Seu plano <strong>{licenseSelectedPlan}</strong> foi efetivado no Stripe e reativado com sucesso. Boas vendas!
                    </p>
                  </div>
                )}
              </div>
            ) : licensePaymentMethod === 'pix' ? (
              /* Pix Checkout block */
              <div className="space-y-3">
                <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-xl space-y-4 text-center">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400">
                    <span>Validade de transação:</span>
                    <span className="text-amber-400 font-bold tracking-tight">10:00 min</span>
                  </div>

                  <div className="bg-white p-2.5 text-center w-32 h-32 mx-auto flex items-center justify-center rounded-xl border border-neutral-200 shadow-lg relative">
                    <div className="grid grid-cols-4 gap-1.5 w-full h-full opacity-90 select-none">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`rounded-sm ${(i * 3 + 1) % 5 === 0 ? 'bg-black' : 'bg-neutral-100'}`} />
                      ))}
                    </div>
                    <div className="absolute w-8 h-8 bg-neutral-900 rounded-full border-2 border-white flex items-center justify-center shadow">
                      <span className="text-[9px] font-mono font-black text-[#39FF14]">PIX</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-[9px] text-neutral-500 font-mono uppercase tracking-widest leading-none">Chave Copie e Cole GymPulse</label>
                    <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800/60 flex items-center gap-2">
                      <pre className="text-[10px] overflow-hidden truncate font-mono text-neutral-400 flex-1 select-all">
                        0002012658001BR.GOV.BCB.PIX0136gympulse-license-saas-{licenseSelectedPlan.toLowerCase()}-active-39e
                      </pre>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`0002012658001BR.GOV.BCB.PIX0136gympulse-license-saas-${licenseSelectedPlan.toLowerCase()}-active-39e`);
                          setCopiedDashboardPix(true);
                          setTimeout(() => setCopiedDashboardPix(false), 2000);

                          // Fully automated detection simulated callback
                          setTimeout(() => {
                            setLicensePaymentLoadingStep(1);
                            setTimeout(() => {
                              setLicensePaymentLoadingStep(3);
                              setTimeout(() => {
                                if (onUpdateTrainer && activeTrainer) {
                                  onUpdateTrainer({
                                    ...activeTrainer,
                                    subscriptionStatus: 'paid',
                                    selectedPlan: licenseSelectedPlan
                                  });
                                }
                                setLicensePaymentLoadingStep(4);
                                setTimeout(() => {
                                  setLicensePaymentLoadingStep(0);
                                  setShowUpgradeModal(false);
                                }, 2000);
                              }, 1200);
                            }, 1200);
                          }, 1500);
                        }}
                        className="text-[#39FF14] hover:text-green-400 cursor-pointer p-1"
                        title="Copiar PIX"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                    {copiedDashboardPix && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono text-[#39FF14] font-black animate-pulse">✓ Chave copiada! Detectando recebimento do Pix automático...</p>
                        <p className="text-[9px] text-neutral-400 font-sans">Aguarde alguns segundos enquanto o robô processa o webhook.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLicensePaymentLoadingStep(1);
                      setTimeout(() => {
                        setLicensePaymentLoadingStep(3);
                        setTimeout(() => {
                          if (onUpdateTrainer && activeTrainer) {
                            onUpdateTrainer({
                              ...activeTrainer,
                              subscriptionStatus: 'paid',
                              selectedPlan: licenseSelectedPlan
                            });
                          }
                          setLicensePaymentLoadingStep(4);
                          setTimeout(() => {
                            setLicensePaymentLoadingStep(0);
                            setShowUpgradeModal(false);
                          }, 2000);
                        }, 1200);
                      }, 1200);
                    }}
                    className="flex-1 bg-[#39FF14] text-black font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-[#39FF14]/15 hover:shadow-[#39FF14]/30 cursor-pointer text-center uppercase font-mono tracking-wider"
                  >
                    Confirmar via Pix
                  </button>
                </div>
              </div>
            ) : (
              /* Stripe Redirect Board */
              <div className="space-y-4 animate-fade-in">
                <div className="bg-neutral-950 border border-neutral-850 p-6 rounded-2xl text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                    <Lock size={26} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-xs text-white font-mono uppercase tracking-widest font-black">Pagamento Direto via Stripe</p>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans max-w-sm mx-auto">
                      Você selecionou o plano <strong className="text-white text-xs">{licenseSelectedPlan}</strong>. Nós conectamos diretamente ao gateway de pagamentos criptografado oficial da <strong>Stripe</strong>.
                    </p>
                  </div>

                  <div className="bg-[#0f1015] border border-neutral-850 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono max-w-xs mx-auto">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Valor da licença:</span>
                    <span className="text-white font-black text-sm">
                      {licenseSelectedPlan === 'Mensal' ? 'R$ 39,90/mês' : licenseSelectedPlan === 'Trimestral' ? 'R$ 97,00/trimestre' : 'R$ 297,00/ano'}
                    </span>
                  </div>

                  {saasStripeError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-left space-y-2.5 animate-scale-up">
                      <div>
                        <p className="text-[10px] font-mono text-red-500 uppercase font-black leading-none flex items-center gap-1">
                          ⚠️ Erro do Stripe (Permissão/Chave)
                        </p>
                        <p className="text-[10px] text-neutral-300 leading-normal font-sans mt-1">
                          {saasStripeError}
                        </p>
                        <p className="text-[9px] text-[#39FF14] font-sans leading-tight pt-1">
                          Dica: Se você usou uma Restricted Key (rk_test_...), edite a chave no painele Stripe e conceda permissão de <strong>Write</strong> para <strong>Checkout Sessions</strong>. Ou use a Secret Key padrão (sk_test_...).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleBypassStripeSaaSSimulate}
                        className="w-full bg-[#39FF14] hover:bg-[#34e212] text-black font-mono uppercase font-black text-[10px] tracking-wide py-2 px-3 rounded-lg text-center cursor-pointer transition shadow-[0_4px_12px_rgba(57,255,20,0.15)]"
                      >
                        ⚡ Ignorar Erro e Usar Pagamento Simulado (Testar)
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 justify-center text-[10px] text-neutral-500 font-mono">
                    <Check size={12} className="text-indigo-400" />
                    <span>Ambiente 100% seguro certificado PCI-DSS</span>
                  </div>
                </div>

                <div className="flex gap-2 font-mono pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-bold text-xs py-3.5 rounded-xl transition cursor-pointer text-center"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleStripeCheckoutSaaS}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 cursor-pointer text-center uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Lock size={12} className="text-indigo-200" /> Ir para o Stripe
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {/* Trainer Profile Configuration Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative animate-scale-up">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1 mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Configurações de Canal & Licença</h3>
              <p className="text-xs text-neutral-400">Configure seu link de indicação de alunos e selecione sua proposta SaaS.</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateTrainer && activeTrainer) {
                  const updated: Trainer = {
                    ...activeTrainer,
                    name: profileTrainerName.trim(),
                    customIdLink: profileTrainerLink.trim().toLowerCase().replace(/\s+/g, '-'),
                    selectedPlan: profileTrainerPlan,
                    pixKeyType: profilePixKeyType,
                    pixKey: profilePixKey.trim(),
                    phoneWhatsApp: profilePhoneWhatsApp.trim(),
                    stripeEnabled: profileStripeEnabled,
                    stripePublishableKey: profileStripePublishableKey.trim(),
                    stripeSecretKey: profileStripeSecretKey.trim(),
                    themeColor: profileThemeColor
                  };
                  onUpdateTrainer(updated);
                  setShowProfileModal(false);
                }
              }}
              className="space-y-4 max-h-[80vh] overflow-y-auto pr-1"
            >
              <div>
                <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                  Seu nome ou marca principal
                </label>
                <input
                  type="text"
                  required
                  value={profileTrainerName}
                  onChange={(e) => setProfileTrainerName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                  Prefixo personalizado do seu link único
                </label>
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5">
                  <span className="text-[10px] font-mono text-neutral-500 select-none">/?trainerId=</span>
                  <input
                    type="text"
                    required
                    value={profileTrainerLink}
                    onChange={(e) => setProfileTrainerLink(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white ml-1 focus:outline-none"
                  />
                </div>
                <p className="text-[9px] font-mono text-neutral-500 mt-1">
                  Seu link definitivo será: <span className="text-[#39FF14]">{window.location.origin}/?trainerId={profileTrainerLink}</span>
                </p>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                  🎨 Cor do Sistema (Personalização Visual)
                </label>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-3">
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    Selecione a cor de destaque principal para a sua consultoria (botoes, bordas, indicadores de treino dos seus alunos):
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { name: 'Limão (Padrão)', value: '#39FF14' },
                      { name: 'Azul Cyber', value: '#00E5FF' },
                      { name: 'Teal Fit', value: '#00F5D4' },
                      { name: 'Roxo Força', value: '#B026FF' },
                      { name: 'Fúcsia', value: '#FF007F' },
                      { name: 'Vermelho', value: '#FF4D4D' },
                      { name: 'Laranja', value: '#FFA500' },
                      { name: 'Ouro', value: '#FFEE00' }
                    ].map((pst) => (
                      <button
                        key={pst.value}
                        type="button"
                        onClick={() => setProfileThemeColor(pst.value)}
                        className={`w-7 h-7 rounded-full border-2 transition relative ${
                          profileThemeColor === pst.value 
                            ? 'border-white scale-110 shadow-md shadow-white/10' 
                            : 'border-transparent hover:scale-105 hover:border-neutral-700'
                        }`}
                        style={{ backgroundColor: pst.value }}
                        title={pst.name}
                      >
                        {profileThemeColor === pst.value && (
                          <span className="absolute inset-0 flex items-center justify-center text-black text-[9px] font-extrabold">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-neutral-900">
                    <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono font-bold">Ou escolha livremente:</span>
                    <input
                      type="color"
                      value={profileThemeColor}
                      onChange={(e) => setProfileThemeColor(e.target.value)}
                      className="w-8 h-6 bg-transparent border-none cursor-pointer rounded overflow-hidden"
                    />
                    <span className="text-[10px] font-mono text-neutral-300 font-bold uppercase bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                      {profileThemeColor}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest">
                    Plano Selecionado do SaaS GymPulse
                  </label>
                  <span className="text-[8px] font-mono font-bold bg-[#39FF14]/10 text-[#39FF14] px-1.5 py-0.5 rounded border border-[#39FF14]/20">TAXA DE USO</span>
                </div>
                
                <p className="text-[10px] text-neutral-400 font-sans leading-normal mb-2 bg-[#121214] p-3 rounded-xl border border-neutral-850">
                  ⚠️ <strong>Atenção Personal:</strong> Este plano é a licença de uso que você paga ao <strong>GymPulse</strong> para poder utilizar toda a plataforma (gerar seus links exclusivos, cadastrar alunos de forma ilimitada e usar o app). Os planos de treino que você cobra dos seus alunos são configurados na aba <strong>"Planos"</strong> da sua consultoria!
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'Mensal', price: 'R$ 39,90/m', label: 'Mensal' },
                    { key: 'Trimestral', price: 'R$ 97,00/t', label: 'Trimestral' },
                    { key: 'Anual', price: 'R$ 297,00/a', label: 'Anual' }
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setProfileTrainerPlan(p.key as any)}
                      className={`p-2 rounded-lg text-center border transition cursor-pointer ${
                        profileTrainerPlan === p.key
                          ? 'bg-[#39FF14]/15 border-[#39FF14] text-[#39FF14]'
                          : 'bg-neutral-950/45 border-neutral-850 text-neutral-400'
                      }`}
                    >
                      <p className="text-[10px] font-extrabold">{p.label}</p>
                      <p className="text-[8px] font-mono mt-0.5">{p.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#39FF14] text-black px-5 py-2.5 rounded-xl text-xs font-bold transition hover:bg-green-400 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSimulatedStripe && (
        <SimulatedStripeCheckout
          planName={licenseSelectedPlan}
          price={
            licenseSelectedPlan === 'Mensal' ? 39.90 : 
            licenseSelectedPlan === 'Trimestral' ? 97.00 : 
            licenseSelectedPlan === 'Semestral' ? 180.00 : 297.00
          }
          studentName={activeTrainer?.name || 'Daniel Coach'}
          onSuccess={() => {
            setShowSimulatedStripe(false);
            setLicensePaymentLoadingStep(4); // Trigger success step
            if (onUpdateTrainer && activeTrainer) {
              onUpdateTrainer({
                ...activeTrainer,
                subscriptionStatus: 'paid',
                selectedPlan: licenseSelectedPlan
              });
            }
            setTimeout(() => {
              setLicensePaymentLoadingStep(0);
            }, 5000);
          }}
          onCancel={() => {
            setShowSimulatedStripe(false);
            setLicensePaymentLoadingStep(0);
          }}
        />
      )}

    </motion.div>
  );
}

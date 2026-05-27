import React, { useState } from 'react';
import { 
  Users, Dumbbell, Calendar, MessageSquare, Bell, CreditCard, 
  Plus, Trash2, Edit3, CheckCircle, TrendingUp, DollarSign, 
  AlertCircle, Star, Search, Send, Smile, Phone, Video, 
  MapPin, Clock, ArrowUpRight, BarChart2, Check, X, Award
} from 'lucide-react';
import { Student, Exercise, TrainingSheet, EvolutionRecord, AgendaEvent, ChatMessage, AppNotification, RevenueLog, Objective, PlanType, WorkoutExercise } from '../types';
import { EXERCISE_BANK } from '../mockData';

interface TrainerDashboardProps {
  students: Student[];
  sheets: Record<string, TrainingSheet>;
  evolution: Record<string, EvolutionRecord[]>;
  agenda: AgendaEvent[];
  chats: Record<string, ChatMessage[]>;
  notifications: AppNotification[];
  revenueLogs: RevenueLog[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (id: string, data: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onUpdateSheet: (studentId: string, sheet: TrainingSheet) => void;
  onAddAgendaEvent: (event: AgendaEvent) => void;
  onDeleteAgendaEvent: (id: string) => void;
  onSendMessage: (studentId: string, text: string) => void;
  onSendNotification: (notification: AppNotification) => void;
  onTriggerAutoResponse: (studentId: string) => void;
}

export default function TrainerDashboard({
  students,
  sheets,
  evolution,
  agenda,
  chats,
  notifications,
  revenueLogs,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onUpdateSheet,
  onAddAgendaEvent,
  onDeleteAgendaEvent,
  onSendMessage,
  onSendNotification,
  onTriggerAutoResponse
}: TrainerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'alunos' | 'agenda' | 'treinos' | 'chat' | 'notificacoes' | 'planos'>('alunos');
  
  // States for forms and modal toggles
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    age: 25,
    weight: 70,
    height: 1.75,
    objective: 'Hipertrofia',
    restrictions: '',
    history: '',
    plan: 'Mensal',
    status: 'Ativo'
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
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
    const createdStudent: Student = {
      id: studentId,
      name: newStudent.name,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150&auto=format&fit=crop&q=80`,
      age: Number(newStudent.age),
      weight: Number(newStudent.weight),
      height: Number(newStudent.height),
      objective: (newStudent.objective as Objective) || 'Hipertrofia',
      restrictions: newStudent.restrictions || 'Nenhuma restrição informada.',
      history: newStudent.history || 'Iniciante.',
      plan: (newStudent.plan as PlanType) || 'Mensal',
      status: 'Ativo',
      joinedAt: new Date().toLocaleDateString('pt-BR'),
      nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      value: newStudent.plan === 'Semestral' ? 120.00 : newStudent.plan === 'Trimestral' ? 140.00 : 150.00
    };

    onAddStudent(createdStudent);
    setSelectedStudentId(studentId);
    setShowAddStudentModal(false);
    // reset form
    setNewStudent({
      name: '',
      age: 25,
      weight: 70,
      height: 1.75,
      objective: 'Hipertrofia',
      restrictions: '',
      history: '',
      plan: 'Mensal',
      status: 'Ativo'
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

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-sans pb-16">
      
      {/* Upper Stats bar */}
      <div className="bg-[#121214] border-b border-neutral-800 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="text-[#39FF14] h-8 w-2 bg-[#39FF14] rounded-full inline-block"></span>
              GymPulse <span className="text-xs bg-[#39FF14]/10 text-[#39FF14] px-2.5 py-0.5 rounded-full border border-[#39FF14]/20 font-mono tracking-widest uppercase">TRAINER CORE</span>
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 mt-1">Simulação completa do painel do treinador principal.</p>
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
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-3 mb-2">GERENCIAMENTO</p>
          
          <button 
            onClick={() => setActiveTab('alunos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left ${activeTab === 'alunos' ? 'bg-[#18181b] border-l-4 border-[#39FF14] text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Users size={18} className={activeTab === 'alunos' ? 'text-[#39FF14]' : ''} />
              <span>Alunos</span>
            </div>
            <span className="text-xs bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full">{students.length}</span>
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

          <div className="bg-neutral-900/60 rounded-2xl p-4.5 border border-neutral-800/80 mt-6 hidden lg:block">
            <h4 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-2">
              <Award size={14} className="text-[#39FF14]" />
              Dica de Desempenho SaaS
            </h4>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Mantenha as fichas atualizadas semanalmente. Alunos que recebem lembretes de hidratação e treino têm frequência 42% maior na academia!
            </p>
          </div>
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
                  <p className="text-xs text-neutral-400">Gerencie informações, objetivos físicos e monitore a evolução corporal.</p>
                </div>
                <button 
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-[#39FF14] hover:bg-green-400 text-black py-2 px-4 rounded-xl font-semibold flex items-center gap-1.5 text-xs transition active:scale-95 cursor-pointer"
                >
                  <Plus size={16} /> Cadastrar Novo Aluno
                </button>
              </div>

              {/* Grid of Student Cards with Search filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((student) => {
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
                        <span>Peso Atual: <strong className="text-white font-mono">{lastEv ? `${lastEv.weight} kg` : `${student.weight} kg`}</strong></span>
                        <span className="text-[10px] text-neutral-500 font-mono">Venc: {student.nextPayment}</span>
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

                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-[#39FF14]/5 text-neutral-300 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono">
                          Plano: <strong className="text-white">{selectedStudent.plan}</strong>
                        </span>
                        <span className="text-xs bg-[#39FF14]/5 text-neutral-300 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono">
                          Valor Mensal: <strong className="text-[#39FF14]">R$ {selectedStudent.value.toFixed(2)}</strong>
                        </span>
                        <span className="text-xs bg-[#39FF14]/0 text-neutral-300 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono">
                          Matrícula: {selectedStudent.joinedAt}
                        </span>
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

                            <div className="border-t border-neutral-800/80 pt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <div className="flex justify-between py-1 border-b border-neutral-900/60 text-neutral-400">
                                <span>Braço D / E:</span>
                                <span className="text-white font-mono">{latestEvolution.armRight || '--'} / {latestEvolution.armLeft || '--'} cm</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-neutral-900/60 text-neutral-400">
                                <span>Cintura:</span>
                                <span className="text-white font-mono">{latestEvolution.waist || '--'} cm</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-neutral-900/60 text-neutral-400">
                                <span>Análise:</span>
                                <span className="text-neutral-300 italic truncate font-sans">{latestEvolution.notes}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-neutral-900/60 text-neutral-400">
                                <span>Data Avalição:</span>
                                <span className="text-white font-mono">{latestEvolution.date}</span>
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
                    <button 
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o cadastro de ${selectedStudent.name}?`)) {
                          onDeleteStudent(selectedStudent.id);
                          setSelectedStudentId(students[0]?.id || '');
                        }
                      }}
                      className="text-red-400 hover:text-red-300 text-xs font-mono flex items-center gap-1 transition"
                    >
                      <Trash2 size={13} /> Deletar Aluno do Sistema
                    </button>
                  </div>
                </div>
              )}
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
                      
                      <div className="flex items-center gap-1 text-neutral-400">
                        <button className="p-1 hover:bg-neutral-800 rounded transition"><Phone size={14} /></button>
                        <button className="p-1 hover:bg-neutral-800 rounded transition"><Video size={14} /></button>
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
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 font-mono">Planos Ativos Oferecidos</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-[#39FF14]/10 text-[#39FF14] text-[8px] font-mono uppercase font-bold py-1 px-2 rounded-bl-lg">MENSAL</div>
                      <h4 className="text-xs text-neutral-400 font-mono uppercase">Plano Mensal</h4>
                      <p className="text-xl font-bold text-white font-mono">R$ 150<span className="text-xs text-neutral-400 font-sans">/m</span></p>
                      <ul className="text-[10px] text-neutral-400 space-y-1 pt-2">
                        <li>• Planilha Treino A-E</li>
                        <li>• Suporte Conversa Chat</li>
                        <li>• Cobrança automática</li>
                      </ul>
                    </div>

                    <div className="bg-neutral-900 border-[#39FF14] border-2 p-4 rounded-xl space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-[#39FF14] text-black text-[8px] font-sans uppercase font-black py-1 px-2">RECOMENDADO</div>
                      <h4 className="text-xs text-neutral-400 font-mono uppercase">Plano Trimestral</h4>
                      <p className="text-xl font-bold text-[#39FF14] font-mono">R$ 140<span className="text-xs text-neutral-300 font-sans">/m</span></p>
                      <ul className="text-[10px] text-neutral-400 space-y-1 pt-2">
                        <li>• Planilha Treino A-E</li>
                        <li>• Suporte Conversa Chat</li>
                        <li>• Monitor de Medidas</li>
                        <li>• Treino presencial semanal</li>
                      </ul>
                    </div>

                    <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-400 text-[8px] font-mono uppercase font-bold py-1 px-2 rounded-bl-lg">SEMESTRAL</div>
                      <h4 className="text-xs text-neutral-400 font-mono uppercase">Plano Semestral</h4>
                      <p className="text-xl font-bold text-white font-mono">R$ 120<span className="text-xs text-neutral-400 font-sans">/m</span></p>
                      <ul className="text-[10px] text-neutral-400 space-y-1 pt-2">
                        <li>• Planilha Treino A-E</li>
                        <li>• Suporte Conversa e Áudio</li>
                        <li>• Avaliação Física Completa</li>
                        <li>• Suporte Premium 24/7</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-900/30 rounded-xl border border-neutral-800 space-y-2">
                    <h4 className="text-xs font-bold text-white">Praticidade Pix e Link de Pagamento</h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Seus alunos recebem no próprio app deles as informações de renovação com Pix Copie e Cole integrado. O app GymPulse automatiza os alertas de cobrança sem constrangimentos e renova os acessos às fichas sem intervenção direta do personal.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: ADICIONAR ALUNO */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowAddStudentModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Plus size={20} className="text-[#39FF14]" /> Cadastrar Novo Aluno no GymPulse
            </h3>
            <p className="text-xs text-neutral-400 mb-6 font-sans">Adicione as informações de contato, biotipo, histórico e plano esportivo.</p>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder="Ex: Ana Silva" 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Objetivo Físico</label>
                  <select 
                    value={newStudent.objective} 
                    onChange={(e) => setNewStudent({...newStudent, objective: e.target.value as Objective})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Hipertrofia">Ganho de Massa (Hipertrofia)</option>
                    <option value="Emagrecimento">Perda de Peso (Emagrecimento)</option>
                    <option value="Condicionamento">Resistência (Condicionamento)</option>
                    <option value="Definição">Definição Muscular</option>
                    <option value="Reabilitação">Tratamento Físico (Reabilitação)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Idade (Anos)</label>
                  <input 
                    type="number" 
                    required 
                    value={newStudent.age}
                    onChange={(e) => setNewStudent({...newStudent, age: Number(e.target.value)})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Peso Inicial (kg)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    value={newStudent.weight}
                    onChange={(e) => setNewStudent({...newStudent, weight: Number(e.target.value)})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Altura Inicial (m)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={newStudent.height}
                    onChange={(e) => setNewStudent({...newStudent, height: Number(e.target.value)})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Plano Inicial</label>
                  <select 
                    value={newStudent.plan} 
                    onChange={(e) => setNewStudent({...newStudent, plan: e.target.value as PlanType})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Mensal">Mensal (R$ 150/mês)</option>
                    <option value="Trimestral">Trimestral (R$ 140/mês)</option>
                    <option value="Semestral">Semestral (R$ 120/mês)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Estado de Acesso</label>
                  <select 
                    value={newStudent.status} 
                    onChange={(e) => setNewStudent({...newStudent, status: e.target.value as 'Ativo' | 'Inativo'})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Ativo">Ativo (Acesso Liberado Fichas)</option>
                    <option value="Inativo">Inativo (Acesso Suspenso)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Histórico de Atividade Física</label>
                <textarea 
                  rows={2}
                  value={newStudent.history}
                  onChange={(e) => setNewStudent({...newStudent, history: e.target.value})}
                  placeholder="Ex: Pratica corrida 3x por semana, já treinou musculação antes..." 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1 text-red-400">Limitações / Patologias Articulares / Contraindicações</label>
                <textarea 
                  rows={2}
                  value={newStudent.restrictions}
                  onChange={(e) => setNewStudent({...newStudent, restrictions: e.target.value})}
                  placeholder="Ex: Leve dor na lombar ao agachar, hérnia L4-L5, cirurgia prévia joelho direito..." 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button 
                  type="button" 
                  onClick={() => setShowAddStudentModal(false)}
                  className="text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[#39FF14] text-black px-5 py-2.5 rounded-xl text-xs font-bold transition hover:bg-green-400"
                >
                  Criar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, TrendingUp, MessageSquare, CreditCard, 
  Play, Pause, RotateCcw, Check, CheckCircle2, 
  Award, Clock, Eye, AlertCircle, Plus, Send, ChevronRight, 
  HelpCircle, Copy, Smartphone, CheckSquare, Sparkles, MessageCircle, X,
  FileText
} from 'lucide-react';
import { Student, Exercise, TrainingSheet, EvolutionRecord, ChatMessage, Objective, PlanType, WorkoutExercise } from '../types';
import { EXERCISE_BANK } from '../mockData';
import { exportStudentReport } from '../utils/pdfGenerator';

interface StudentDashboardProps {
  students: Student[];
  sheets: Record<string, TrainingSheet>;
  evolution: Record<string, EvolutionRecord[]>;
  chats: Record<string, ChatMessage[]>;
  activeStudentId: string;
  onSelectStudent: (id: string) => void;
  onUpdateSheetExercises: (studentId: string, letter: 'A' | 'B' | 'C' | 'D' | 'E', exercises: WorkoutExercise[]) => void;
  onAddEvolutionRecord: (studentId: string, record: EvolutionRecord) => void;
  onSendMessage: (studentId: string, text: string) => void;
  onCompleteWorkout: (studentId: string, workoutLetter: 'A' | 'B' | 'C' | 'D' | 'E') => void;
}

export default function StudentDashboard({
  students,
  sheets,
  evolution,
  chats,
  activeStudentId,
  onSelectStudent,
  onUpdateSheetExercises,
  onAddEvolutionRecord,
  onSendMessage,
  onCompleteWorkout
}: StudentDashboardProps) {
  const currentStudent = students.find(s => s.id === activeStudentId) || students[0];
  
  // Tabs: workout, performance, chat, subscript
  const [activeTab, setActiveTab] = useState<'treino' | 'evolucao' | 'chat' | 'plano'>('treino');
  const [activeLetter, setActiveLetter] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  // Exercise player overlay details state
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Training timer/stopwatch state
  const [timerMaxSeconds, setTimerMaxSeconds] = useState(90);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerIsActive, setTimerIsActive] = useState(false);

  // Evolution record inputs
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newArmR, setNewArmR] = useState('');
  const [newArmL, setNewArmL] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newLegR, setNewLegR] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [evolutionSuccess, setEvolutionSuccess] = useState(false);

  // Student chat input
  const [chatDraft, setChatDraft] = useState('');

  // Pix payment success mock toast
  const [pixCopied, setPixCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Workout state completion checklist & loads tracking
  const studentSheet = sheets[currentStudent?.id] || { A: [], B: [], C: [], D: [], E: [] };
  const currentExercises = studentSheet[activeLetter] || [];
  const [localWorkoutStates, setLocalWorkoutStates] = useState<Record<string, { completedSets: boolean[]; userLoggedWeight: number; userFeedback: string }>>({});

  // Reset states when switcher changes
  useEffect(() => {
    const defaultStates: typeof localWorkoutStates = {};
    currentExercises.forEach(ex => {
      defaultStates[ex.id] = {
        completedSets: Array(ex.sets).fill(false),
        userLoggedWeight: ex.weightCc,
        userFeedback: ''
      };
    });
    setLocalWorkoutStates(defaultStates);
  }, [activeLetter, activeStudentId]);

  // Rest timer tick
  useEffect(() => {
    let interval: any = null;
    if (timerIsActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerIsActive(false);
      // Optional: Play a tiny subtle sound effect if audio is permissible, otherwise just pulse the UI
    }
    return () => clearInterval(interval);
  }, [timerIsActive, timerSeconds]);

  const handleToggleTimer = () => {
    setTimerIsActive(!timerIsActive);
  };

  const handleResetTimer = (seconds: number = timerMaxSeconds) => {
    setTimerSeconds(seconds);
    setTimerMaxSeconds(seconds);
    setTimerIsActive(false);
  };

  const handleStartTimerPreset = (seconds: number) => {
    setTimerMaxSeconds(seconds);
    setTimerSeconds(seconds);
    setTimerIsActive(true);
  };

  // Toggle checklist for individual set (e.g. Set 1 of 4)
  const toggleSetComplete = (exId: string, setIdx: number) => {
    const prevState = localWorkoutStates[exId] || { completedSets: [], userLoggedWeight: 0, userFeedback: '' };
    const nextCompleted = [...(prevState.completedSets)];
    nextCompleted[setIdx] = !nextCompleted[setIdx];

    setLocalWorkoutStates({
      ...localWorkoutStates,
      [exId]: {
        ...prevState,
        completedSets: nextCompleted
      }
    });

    // Auto trigger recovery timer when finishing a set!
    if (nextCompleted[setIdx]) {
      const exerciseItem = currentExercises.find(e => e.id === exId);
      const restSec = exerciseItem ? exerciseItem.restSec : 90;
      handleStartTimerPreset(restSec);
    }
  };

  const updateLoggedWeight = (exId: string, val: number) => {
    const prevState = localWorkoutStates[exId] || { completedSets: [], userLoggedWeight: 0, userFeedback: '' };
    setLocalWorkoutStates({
      ...localWorkoutStates,
      [exId]: {
        ...prevState,
        userLoggedWeight: val
      }
    });
  };

  const updateLoggedFeedback = (exId: string, text: string) => {
    const prevState = localWorkoutStates[exId] || { completedSets: [], userLoggedWeight: 0, userFeedback: '' };
    setLocalWorkoutStates({
      ...localWorkoutStates,
      [exId]: {
        ...prevState,
        userFeedback: text
      }
    });
  };

  const handleSendStudentMessage = () => {
    if (!chatDraft.trim()) return;
    onSendMessage(currentStudent.id, chatDraft);
    setChatDraft('');
  };

  // Finish whole workout and log progress
  const handleSubmitWorkoutSheet = () => {
    // Notify parent
    onCompleteWorkout(currentStudent.id, activeLetter);
    
    // Auto insert completed message into chat
    const exerciseSummary = (Object.entries(localWorkoutStates) as [string, { completedSets: boolean[]; userLoggedWeight: number; userFeedback: string }][])
      .map(([id, st]) => {
        const item = currentExercises.find(e => e.id === id);
        if (!item) return '';
        const setsCompletedCount = st.completedSets.filter(Boolean).length;
        return `• ${item.name}: Feito ${setsCompletedCount}/${item.sets} séries com ${st.userLoggedWeight}kg. ${st.userFeedback ? `Feed: ${st.userFeedback}` : ''}`;
      })
      .filter(Boolean)
      .join('\n');

    const completionMsg = `💪 Treino ${activeLetter} Concluído no App!\n\n${exerciseSummary || 'Exercícios marcados como válidos.'}`;
    onSendMessage(currentStudent.id, completionMsg);

    alert(`Parabéns ${currentStudent.name}! Treino ${activeLetter} concluído e registrado com sucesso. Seu Personal Trainer recebeu as cargas no painel!`);
    setActiveTab('evolucao');
  };

  // Submit physical measurements
  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    const w = Number(newWeight);
    const calculatedBmi = w / (currentStudent.height * currentStudent.height);
    
    const record: EvolutionRecord = {
      id: 'r_' + Date.now(),
      studentId: currentStudent.id,
      date: new Date().toISOString().split('T')[0],
      weight: w,
      bmi: calculatedBmi,
      bodyFat: newBodyFat ? Number(newBodyFat) : undefined,
      armRight: newArmR ? Number(newArmR) : undefined,
      armLeft: newArmL ? Number(newArmL) : undefined,
      waist: newWaist ? Number(newWaist) : undefined,
      chest: newChest ? Number(newChest) : undefined,
      legRight: newLegR ? Number(newLegR) : undefined,
      notes: newNotes || 'Nova pesagem cadastrada no portal.'
    };

    onAddEvolutionRecord(currentStudent.id, record);
    setEvolutionSuccess(true);
    
    // Clear inputs
    setNewWeight('');
    setNewBodyFat('');
    setNewArmR('');
    setNewArmL('');
    setNewWaist('');
    setNewChest('');
    setNewLegR('');
    setNewNotes('');

    setTimeout(() => {
      setEvolutionSuccess(false);
    }, 4000);
  };

  const copyPixKey = () => {
    setPixCopied(true);
    setTimeout(() => {
      setPixCopied(false);
    }, 2500);
  };

  const currentStudentEvolution = evolution[currentStudent?.id] || [];

  const handleExportPDF = () => {
    exportStudentReport(currentStudent, currentStudentEvolution, studentSheet);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-sans pb-16">
      
      {/* Student App Header bar / Sandbox controller */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border-b border-neutral-800 py-5 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
              Área Exclusiva do Aluno
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white mt-1 flex items-center gap-2">
              Meu App <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md font-sans font-medium">Visualizador</span>
            </h1>
          </div>

          {/* Persona Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-2 rounded-xl border border-neutral-800">
            <span className="text-xs text-neutral-400 shrink-0 select-none">Logado como:</span>
            <select
              value={activeStudentId}
              onChange={(e) => onSelectStudent(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-white outline-none cursor-pointer pr-1"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.objective})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main layout container restricted for smartphone-like width or general central view */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full flex flex-col gap-6">
        
        {/* Profile Card Summary */}
        <div className="bg-[#121214] border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-32 h-32 bg-[#39FF14]/5 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-3 z-10">
            <img 
              src={currentStudent.avatar} 
              alt={currentStudent.name} 
              className="w-11 h-11 rounded-full object-cover border border-neutral-700 pointer-events-none"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest leading-none font-bold">Minha Conta</p>
              <h2 className="text-md font-bold text-white mt-1 my-0">{currentStudent.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30 px-1.5 py-0.5 rounded font-bold">
                  Foco: {currentStudent.objective}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {currentStudent.age} anos • {currentStudent.height.toFixed(2)}m • {currentStudent.weight}kg
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between sm:justify-end gap-3.5 z-10">
            <div className="text-right space-y-0.5 hidden sm:block">
              <p className="text-[9px] text-neutral-500 font-mono uppercase font-bold">Minha Assessoria</p>
              <p className="text-xs font-bold text-[#39FF14]">{currentStudent.plan} de consultoria</p>
              <p className="text-[10px] text-neutral-400">Personal Trainer Oficial</p>
            </div>

            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 bg-[#39FF14]/10 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14]/30 hover:border-transparent rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 active:scale-95 cursor-pointer shadow-lg shadow-black/25"
              title="Gerar PDF para compartilhamento externo"
            >
              <FileText size={14} className="shrink-0" />
              <span>Gerar PDF Resumo</span>
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs inside App viewport */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900/80 rounded-xl border border-neutral-800 font-mono text-xs text-center">
          <button 
            onClick={() => setActiveTab('treino')}
            className={`py-2 px-1 rounded-lg transition font-bold uppercase select-none ${activeTab === 'treino' ? 'bg-[#39FF14] text-black' : 'text-neutral-400 hover:text-white'}`}
          >
            Treino
          </button>
          <button 
            onClick={() => setActiveTab('evolucao')}
            className={`py-2 px-1 rounded-lg transition font-bold uppercase select-none ${activeTab === 'evolucao' ? 'bg-[#39FF14] text-black' : 'text-neutral-400 hover:text-white'}`}
          >
            Evolução
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`py-2 px-1 rounded-lg transition font-bold uppercase select-none ${activeTab === 'chat' ? 'bg-[#39FF14] text-black' : 'text-neutral-400 hover:text-white'}`}
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('plano')}
            className={`py-2 px-1 rounded-lg transition font-bold uppercase select-none ${activeTab === 'plano' ? 'bg-[#39FF14] text-black' : 'text-neutral-400 hover:text-white'}`}
          >
            Plano
          </button>
        </div>

        {/* Tab 1 Content: Active Workout */}
        {activeTab === 'treino' && (
          <div className="space-y-4">
            
            {/* Split selectors */}
            <div className="flex items-center justify-between gap-1 border-b border-neutral-800 pb-3 h-11 overflow-x-auto">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                const sheetExercisesCount = (sheetExercisesCount => sheetExercisesCount)(studentSheet[letter]?.length || 0);
                const hasEx = sheetExercisesCount > 0;
                
                return (
                  <button
                    key={letter}
                    onClick={() => setActiveLetter(letter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 ${activeLetter === letter ? 'bg-neutral-800 text-white border border-[#39FF14]' : 'bg-neutral-900/40 text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Treino {letter}
                    {hasEx && (
                      <span className="w-2.5 h-2.5 bg-[#39FF14]/80 text-[6px] text-black rounded-full flex items-center justify-center font-bold">
                        {sheetExercisesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Rest Timer Panel (Floating Widget-like inside workout view) */}
            <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 gap-y-1">
              <div className="flex items-center gap-2">
                <Clock size={16} className={`${timerIsActive ? 'text-[#39FF14] animate-spin' : 'text-neutral-400'}`} />
                <span className="text-xs font-mono text-neutral-400">TEMPO DE DESCANSO:</span>
                <span className="text-lg font-bold text-white font-mono">{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleToggleTimer}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold px-3 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                >
                  {timerIsActive ? 'Pausar' : 'Iniciar'}
                </button>
                <button 
                  onClick={() => handleResetTimer(90)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[11px] px-2 py-1 rounded transition cursor-pointer"
                  title="90s Padrão"
                >
                  <RotateCcw size={12} />
                </button>
                
                {/* Custom quick preset intervals */}
                <div className="flex items-center gap-1">
                  <button onClick={() => handleStartTimerPreset(45)} className="bg-neutral-950 text-neutral-500 hover:text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-neutral-800 transition">45s</button>
                  <button onClick={() => handleStartTimerPreset(60)} className="bg-neutral-950 text-neutral-500 hover:text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-neutral-800 transition">60s</button>
                  <button onClick={() => handleStartTimerPreset(90)} className="bg-neutral-950 text-neutral-500 hover:text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-neutral-800 transition">90s</button>
                </div>
              </div>
            </div>

            {/* List of active exercises */}
            <div className="space-y-4">
              {currentExercises.length > 0 ? (
                currentExercises.map((exercise, idx) => {
                  const state = localWorkoutStates[exercise.id] || { completedSets: [], userLoggedWeight: exercise.weightCc, userFeedback: '' };
                  const setsCheckArray = state.completedSets;
                  const setsFinishedCount = setsCheckArray.filter(Boolean).length;
                  const isExerciseFullyCompleted = setsFinishedCount === exercise.sets;

                  // Find base exercise in bank for demo videos integration
                  const bankEx = EXERCISE_BANK.find(e => e.id === exercise.exerciseId);

                  return (
                    <div 
                      key={exercise.id}
                      className={`p-4 rounded-xl border bg-neutral-950 transition duration-200 ${isExerciseFullyCompleted ? 'border-green-500/80 bg-green-500/[0.02]' : 'border-neutral-800'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] font-mono rounded-full flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-white my-0">{exercise.name}</h3>
                          </div>

                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-[#39FF14]">
                            <span>{exercise.sets} séries x {exercise.reps} reps</span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-neutral-400">Descanso: {exercise.restSec}s</span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-neutral-400">Meta Carga: {exercise.weightCc} kg</span>
                          </div>

                          {exercise.notes && (
                            <p className="text-[11px] text-neutral-500 italic mt-2 leading-relaxed">Personal: {exercise.notes}</p>
                          )}
                        </div>

                        {/* Integration explanatory video trigger */}
                        {bankEx && (
                          <button 
                            onClick={() => setSelectedExercise(bankEx)}
                            className="text-[#39FF14] hover:bg-[#39FF14]/15 border border-[#39FF14]/30 px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Play size={10} className="fill-[#39FF14]" /> Ver Execução
                          </button>
                        )}
                      </div>

                      {/* Series checklist controller */}
                      <div className="mt-4 pt-4 border-t border-neutral-900/60 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        
                        {/* Checked indices buttons */}
                        <div className="space-y-1.5 w-full md:w-auto">
                          <p className="text-[9px] uppercase font-mono tracking-wider font-bold text-neutral-500">Marcar Séries Concluídas</p>
                          <div className="flex items-center gap-2.5">
                            {setsCheckArray.map((isDone, setIndex) => (
                              <button
                                key={setIndex}
                                onClick={() => toggleSetComplete(exercise.id, setIndex)}
                                className={`w-8 h-8 rounded-lg font-mono text-[11px] font-extrabold border transition cursor-pointer flex items-center justify-center ${isDone ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                              >
                                {setIndex + 1}
                                {isDone && <Check size={10} className="absolute mt-5 bg-neutral-900 text-[#39FF14] p-0.5 rounded-full border border-neutral-800" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Real-time Load used logger & Comments */}
                        <div className="grid grid-cols-2 gap-2 w-full md:w-[320px]">
                          <div>
                            <label className="block text-[8px] text-neutral-500 uppercase font-mono mb-1">Carga de Hoje (Kg)</label>
                            <input 
                              type="number" 
                              value={state.userLoggedWeight}
                              onChange={(e) => updateLoggedWeight(exercise.id, Number(e.target.value))}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center text-white outline-none" 
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] text-neutral-500 uppercase font-mono mb-1">Feedback de Esforço</label>
                            <input 
                              type="text" 
                              value={state.userFeedback}
                              onChange={(e) => updateLoggedFeedback(exercise.id, e.target.value)}
                              placeholder="Fácil, Pesado, Dor..." 
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-sans" 
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center bg-neutral-900/30 rounded-xl border border-dashed border-neutral-800 text-neutral-500 space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-neutral-700" />
                  <p className="text-xs font-semibold">Hoje é dia de descanso! 🧘</p>
                  <p className="text-[10px] text-neutral-500">Nenhum treino programado na ficha {activeLetter}. Hidrate-se e recupere os músculos para render amanhã!</p>
                </div>
              )}
            </div>

            {currentExercises.length > 0 && (
              <div className="pt-4 border-t border-neutral-900 flex justify-end">
                <button
                  onClick={handleSubmitWorkoutSheet}
                  className="bg-[#39FF14] hover:bg-green-400 text-black py-3 px-6 rounded-xl font-bold text-sm tracking-tight transition active:scale-95 cursor-pointer w-full flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Finalizar Meu Treino de Hoje!
                </button>
              </div>
            )}

          </div>
        )}

        {/* Tab 2 Content: Student measurement entry & stats tracking */}
        {activeTab === 'evolucao' && (
          <div className="space-y-6">
            
            {/* Visual SVG Progress line Chart showing historical weight */}
            <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#39FF14] font-mono mb-4 flex items-center gap-1.5">
                <TrendingUp size={15} /> Histórico de Peso Corporal (Curva de Progresso)
              </h3>

              {currentStudentEvolution.length > 1 ? (
                <div className="space-y-4">
                  {/* Clean SVG drawing paths mapped linearly */}
                  <div className="h-44 w-full relative pt-2">
                    <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />

                      {/* Calculations */}
                      {(() => {
                        const weights = currentStudentEvolution.map(r => r.weight);
                        const minW = Math.min(...weights) - 2;
                        const maxW = Math.max(...weights) + 2;
                        const diffW = maxW - minW || 1;

                        const points = currentStudentEvolution.map((record, idx) => {
                          const x = (idx / (currentStudentEvolution.length - 1)) * 500;
                          const y = 90 - ((record.weight - minW) / diffW) * 80;
                          return { x, y, weight: record.weight, date: record.date };
                        });

                        const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                        
                        return (
                          <>
                            {/* Area projection */}
                            <path 
                              d={`${pathD} L 500 100 L 0 100 Z`} 
                              fill="url(#greenGlow)" 
                              opacity="0.1" 
                            />
                            {/* Primary spline line */}
                            <path 
                              d={pathD} 
                              fill="none" 
                              stroke="#39FF14" 
                              strokeWidth="2.5" 
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* Dots */}
                            {points.map((p, index) => (
                              <g key={index}>
                                <circle cx={p.x} cy={p.y} r="4" fill="#09090b" stroke="#39FF14" strokeWidth="2" />
                                <text x={p.x} y={p.y - 10} fill="#ffffff" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                  {p.weight}kg
                                </text>
                              </g>
                            ))}
                            
                            <defs>
                              <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#39FF14" />
                                <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </>
                        );
                      })()}
                    </svg>

                    {/* X Axis Labels */}
                    <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-2 uppercase">
                      {currentStudentEvolution.map((rec, i) => (
                        <span key={i}>{rec.date.split('-').slice(1).join('/')}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 leading-normal">
                    Seu peso corporal está sendo atualizado de forma constante. Uma variação descendente de gordura e ascendente de massa muscular indica ótima resposta biológica.
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500 space-y-1">
                  <AlertCircle size={20} className="mx-auto text-neutral-600" />
                  <p className="text-xs">Gráfico requer pelo menos doas atualizações físicas cadastradas para traçar a curva.</p>
                </div>
              )}
            </div>

            {/* Entry Form to add corporal evaluation */}
            <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <Plus size={16} className="text-[#39FF14]" /> Registrar Minhas Medidas de Hoje
              </h3>

              {evolutionSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} /> Medidas salvas com sucesso! Observe a atualização dos dados físicos.
                </div>
              )}

              <form onSubmit={handleAddMeasurement} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Peso Atual (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      required
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="e.g. 64.2" 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Gordura % (Opcional)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={newBodyFat}
                      onChange={(e) => setNewBodyFat(e.target.value)}
                      placeholder="e.g. 18.5" 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Braço Direito (cm)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={newArmR}
                      onChange={(e) => setNewArmR(e.target.value)}
                      placeholder="e.g. 32" 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Braço Esquerdo (cm)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={newArmL}
                      onChange={(e) => setNewArmL(e.target.value)}
                      placeholder="e.g. 31.8" 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Cintura (cm)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={newWaist}
                      onChange={(e) => setNewWaist(e.target.value)}
                      placeholder="e.g. 74" 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Tórax (cm)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={newChest}
                      onChange={(e) => setNewChest(e.target.value)}
                      placeholder="e.g. 96" 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-mono mb-1">Coxa Direita (cm)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={newLegR}
                      onChange={(e) => setNewLegR(e.target.value)}
                      placeholder="e.g. 58" 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <button 
                      type="submit"
                      className="bg-neutral-800 hover:bg-[#39FF14] text-white hover:text-black font-bold h-9.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Salvar Cadastro
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* List historic items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#39FF14] font-mono">Histórico Computado Geral</h4>
              <div className="space-y-4">
                {currentStudentEvolution.slice().reverse().map((record) => (
                  <div key={record.id} className="p-4 bg-neutral-900/30 rounded-xl border border-neutral-800 text-xs">
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-2 mb-2">
                      <span className="font-mono text-neutral-400 text-[10px]">DATA: {record.date.split('-').reverse().join('/')}</span>
                      <span className="bg-[#39FF14]/15 text-[#39FF14] px-2 py-0.5 rounded font-mono font-bold font-sans text-[10px]">IMC: {record.bmi.toFixed(1)}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1">
                      <div>
                        <p className="text-[9px] text-neutral-500 font-mono uppercase">Peso</p>
                        <p className="font-bold text-white mt-0.5">{record.weight} kg</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-neutral-500 font-mono uppercase">Gordura Corporal</p>
                        <p className="font-bold text-white mt-0.5">{record.bodyFat ? `${record.bodyFat}%` : 'Não reg.'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-neutral-500 font-mono uppercase">Bíceps D/E</p>
                        <p className="font-bold text-white mt-0.5">{record.armRight || '--'} / {record.armLeft || '--'} cm</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-neutral-500 font-mono uppercase">Cintura</p>
                        <p className="font-bold text-white mt-0.5">{record.waist || '--'} cm</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[9px] text-neutral-500 font-mono uppercase font-bold text-[#39FF14]">Anotações</p>
                        <p className="text-neutral-400 text-[11px] truncate mt-0.5 leading-none">{record.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3 Content: Direct Chat Messaging with Video/Audio demo */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="bg-[#121214] p-4 rounded-xl border border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#39FF14] rounded-full animate-ping"></div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Personal Trainer Disponível</h3>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Feedback geralmente em menos de 1 hora!</span>
            </div>

            {/* Chat Messages Window */}
            <div className="border border-neutral-800 rounded-2xl bg-neutral-950 p-4 h-[350px] overflow-y-auto space-y-3.5">
              {(chats[currentStudent.id] || []).length > 0 ? (
                (chats[currentStudent.id] || []).map((msg, index) => {
                  const isStudent = msg.sender === 'student';
                  return (
                    <div key={msg.id + '_' + index} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-[75%] text-xs border ${isStudent ? 'bg-[#39FF14]/10 text-neutral-100 border-[#39FF14]/20 rounded-tr-none' : 'bg-neutral-900 text-neutral-200 border-neutral-800 rounded-tl-none'}`}>
                        <p className="leading-relaxed whitespace-pre-line m-0">{msg.text}</p>
                        <span className="block text-[8px] text-neutral-500 text-right mt-1 font-mono">{msg.timestamp}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-neutral-600 py-12 flex flex-col items-center justify-center h-full">
                  <MessageSquare size={24} className="mb-1" />
                  <p className="text-xs font-semibold">Envie sua dúvida ou áudio hoje para o personal!</p>
                </div>
              )}
            </div>

            {/* Message Bar Entry */}
            <div className="bg-[#121214] p-3 rounded-xl border border-neutral-800 flex items-center gap-2">
              <input 
                type="text" 
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendStudentMessage();
                }}
                placeholder="Pergunte sobre séries, nutrição, faça uploads..." 
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
              <button 
                onClick={handleSendStudentMessage}
                className="bg-[#39FF14] text-black p-2.5 rounded-xl hover:bg-green-400 transition cursor-pointer"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4 Content: Subscriptions detailing & simulated billing updates */}
        {activeTab === 'plano' && (
          <div className="space-y-6">
            
            <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 bg-[#39FF14] text-black text-[9px] font-mono tracking-wider px-3.5 py-1 uppercase rounded-bl-lg font-bold">ASSINATURA ATIVA</div>
              
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Meu Plano Contratado</h3>
              
              <div className="space-y-1">
                <h4 className="text-xl font-black text-[#39FF14]">{currentStudent.plan} de Assessoria Esportiva</h4>
                <p className="text-xs text-neutral-300">Mensalidade integrada com renovação programada automática.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 border-t border-b border-neutral-800/80 py-4 font-mono text-xs">
                <div>
                  <p className="text-neutral-500 text-[10px] uppercase font-mono">Vencimento Próximo</p>
                  <p className="text-white font-bold mt-1 text-md">{currentStudent.nextPayment}</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-[10px] uppercase font-mono">Valor Mensal Equivalente</p>
                  <p className="text-emerald-400 font-bold mt-1 text-md">R$ {currentStudent.value.toFixed(2)} / mês</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-[10px] uppercase font-mono">Método de Renovação</p>
                  <p className="text-blue-400 font-bold mt-1 text-md">Pix ou Cartão Digital</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Consulte os dados abaixo para adiantar ou renovar o pagamento de forma segura. A confirmação de pagamento atualiza o faturamento do seu personal instantaneamente no CRM dele!
                </p>
              </div>
            </div>

            {/* Simulated Payment Trigger widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: Pix payments simulation */}
              <div className="bg-[#121214]/60 p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Smartphone size={16} className="text-[#39FF14]" /> Pagamento via PIX Copie & Cole
                </h4>

                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-900 font-mono text-[9px] text-[#39FF14] text-center select-all cursor-pointer truncate">
                  00020101021126580014BR.GOV.BCB.PIX0136gympulse-payments-production202605273e
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyPixKey}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} /> {pixCopied ? 'Chave Copiada!' : 'Copiar Chave Pix'}
                  </button>
                </div>

                {pixCopied && (
                  <p className="text-[10px] text-green-400 font-bold text-center animate-bounce">✔ Chave Pix Pix Copiada para Área de Transferência!</p>
                )}
              </div>

              {/* Box 2: Confirmation / Sandbox webhook simulation */}
              <div className="bg-[#121214]/60 p-4 rounded-xl border border-neutral-800 space-y-3.5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <CheckCircle2 size={16} className="text-blue-400" /> Simular Baixa de Cobrança (Sandbox)
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-normal mt-1.5">
                    Como esta é uma versão integrada, clique abaixo para simular que o banco confirmou a baixa e liberou a mensalidade do aluno.
                  </p>
                </div>

                {paymentSuccess ? (
                  <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-center text-xs font-bold animate-pulse">
                    💳 Renovação Simulada com Sucesso! faturamento acrescido no Personal.
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setPaymentSuccess(true);
                      setTimeout(() => setPaymentSuccess(false), 4000);
                    }}
                    className="bg-[#39FF14] hover:bg-green-400 text-black py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Simular Aprovação de Pix R$ {currentStudent.value.toFixed(2)}
                  </button>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* EXERCISE VIDEO MODAL PLAYER OVERLAY */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-5 relative shadow-2xl space-y-4">
            
            <button 
              onClick={() => setSelectedExercise(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg transition"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] bg-[#39FF14]/15 text-[#39FF14] px-2 py-0.5 rounded font-mono uppercase font-bold">
                {selectedExercise.category}
              </span>
              <h3 className="text-md font-bold text-white mt-1.5 my-0 pr-6">{selectedExercise.name}</h3>
            </div>

            {/* Video iframe embed */}
            <div className="aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800/80 relative">
              <iframe 
                src={selectedExercise.videoUrl} 
                title={selectedExercise.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="w-full h-full border-none"
              ></iframe>
            </div>

            <div className="space-y-1">
              <h5 className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">Guia Técnico Prático de Execução</h5>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">{selectedExercise.description}</p>
            </div>

            <button 
              onClick={() => setSelectedExercise(null)}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer w-full"
            >
              Ciente, Fechar Vídeo instrutivo
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

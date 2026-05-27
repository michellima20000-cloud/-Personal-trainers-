import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, TrendingUp, MessageSquare, CreditCard, 
  Play, Pause, RotateCcw, Check, CheckCircle2, 
  Award, Clock, Eye, AlertCircle, Plus, Send, ChevronRight, 
  HelpCircle, Copy, Smartphone, CheckSquare, Sparkles, MessageCircle, X,
  FileText, LogOut, Activity, ExternalLink, RefreshCw
} from 'lucide-react';
import { Student, Exercise, TrainingSheet, EvolutionRecord, ChatMessage, Objective, PlanType, WorkoutExercise, AccessLog } from '../types';
import { EXERCISE_BANK } from '../mockData';
import { exportStudentReport } from '../utils/pdfGenerator';
import ExerciseVisualizer from './ExerciseVisualizer';

interface StudentDashboardProps {
  students: Student[];
  sheets: Record<string, TrainingSheet>;
  evolution: Record<string, EvolutionRecord[]>;
  chats: Record<string, ChatMessage[]>;
  activeStudentId: string;
  accessLogs: AccessLog[];
  onSelectStudent: (id: string) => void;
  onUpdateSheetExercises: (studentId: string, letter: 'A' | 'B' | 'C' | 'D' | 'E', exercises: WorkoutExercise[]) => void;
  onAddEvolutionRecord: (studentId: string, record: EvolutionRecord) => void;
  onSendMessage: (studentId: string, text: string) => void;
  onCompleteWorkout: (studentId: string, workoutLetter: 'A' | 'B' | 'C' | 'D' | 'E') => void;
  onLogout?: () => void;
}

const EXERCISE_DETAILS: Record<string, {
  musclesPrimary: string[];
  musclesSecondary: string[];
  breathing: { concentric: string; eccentric: string };
  commonMistakes: string[];
  setupSteps: string[];
}> = {
  'Peito': {
    musclesPrimary: ['Peitoral Maior', 'Deltoide Anterior (Fibras Claviculares)'],
    musclesSecondary: ['Tríceps Braquial', 'Serrátil Anterior', 'Sinergistas Estabilizadores'],
    breathing: { concentric: 'Expire pela boca ao empurrar (fase concêntrica)', eccentric: 'Inspire pelo nariz ao descer o peso de forma controlada' },
    commonMistakes: ['Tirar os ombros de trás (perda de adução das escápulas)', 'Descer a barra rápido demais batendo no peitoral', 'Estender excessivamente os cotovelos sem manter tensão ativa'],
    setupSteps: ['Mantenha os calcanhares impulsionados contra o chão firmemente', 'Tracione suas escápulas para trás e para baixo (posição ativa)', 'Posicione os braços em um ângulo seguro de 45º a 60º em relação ao corpo']
  },
  'Costas': {
    musclesPrimary: ['Latíssimo do Dorso (Dorsal)', 'Trapézio Intermediário/Inferior', 'Romboides'],
    musclesSecondary: ['Bíceps Braquial', 'Deltoide Posterior', 'Redondo Maior', 'Braquial'],
    breathing: { concentric: 'Expire pela boca ao tracionar/puxar a barra', eccentric: 'Inspire controladamente enquanto devolve a carga' },
    commonMistakes: ['Usar o tronco para dar impulso (efeito gangorra)', 'Iniciar o movimento flexionando os braços antes das escápulas', 'Deixar os ombros subirem em direção às orelhas'],
    setupSteps: ['Mantenha os joelhos semi-flexionados e quadril empinado para estabilização', 'Realize a "depressão escapular" ativa antes de iniciar a tração', 'Puxe direcionando os cotovelos para trás e em direção ao quadril']
  },
  'Ombro': {
    musclesPrimary: ['Deltoide Lateral', 'Deltoide Anterior', 'Deltoide Posterior'],
    musclesSecondary: ['Trapézio Superior', 'Tríceps Braquial', 'Supraespinhal'],
    breathing: { concentric: 'Expire ao elevar os braços/halteres', eccentric: 'Inspire de forma contínua durante o retorno' },
    commonMistakes: ['Subir os braços acima da linha dos ombros desalinhando o manguito', 'Curvar a coluna para trás para compensar carga pesada', 'Balançar o corpo inteiro'],
    setupSteps: ['Projete o peitoral levemente para cima para estabilizar a coluna', 'Mantenha os cotovelos levemente flexionados e levemente rotacionados anteriorizados', 'Faça movimentos concêntricos potentes, sem usar impulsão']
  },
  'Bíceps': {
    musclesPrimary: ['Bíceps Braquial (Cabeça Curta e Longa)', 'Braquial'],
    musclesSecondary: ['Braquiorradial', 'Pronador Redondo', 'Flexores do Antebraço'],
    breathing: { concentric: 'Expire totalmente no topo do movimento de flexão', eccentric: 'Inspire lentamente sustentando o peso na descida' },
    commonMistakes: ['Projetar os cotovelos para frente ajudando no topo', 'Encurtar amplitude não estendendo o cotovelo completamente', 'Fazer movimentos rápidos perdendo a fase negativa'],
    setupSteps: ['Trave os cotovelos firmemente nas costelas do seu tronco', 'Mantenha os ombros neutros e o peito bem aberto', 'Sinta a contração esmagando o bíceps no ápice da subida']
  },
  'Tríceps': {
    musclesPrimary: ['Tríceps Braquial (Cabeças Lateral, Medial e Longa)'],
    musclesSecondary: ['Ancôneo', 'Músculos Extensores do Punho e Dedos'],
    breathing: { concentric: 'Expire na extensão total dos membros superiores', eccentric: 'Inspire enquanto flexiona controlando a aproximação' },
    commonMistakes: ['Afastar os cotovelos para os lados perdendo alinhamento', 'Realizar o exercício com o ombro projetado para frente', 'Utilizar movimentos pendulares'],
    setupSteps: ['Trave os ombros imóveis e mantenha os cotovelos paralelos', 'Foque na força isolada do tríceps estendendo até o final', 'Aperte ativamente os tríceps na contração máxima de pico']
  },
  'Pernas': {
    musclesPrimary: ['Quadríceps Femoral', 'Glúteo Máximo', 'Posteriores da Coxa (Isquiotibiais)'],
    musclesSecondary: ['Eretores da Espinha', 'Gastrocnêmio (Panturrilhas)', 'Sinergistas do Core'],
    breathing: { concentric: 'Expire ao empurrar o solo para subir', eccentric: 'Inspire descendo o quadril de forma estável' },
    commonMistakes: ['Joelhos colapsando para dentro (valgo dinâmico de joelho)', 'Retirar o calcanhar do solo jogando a carga nos dedos', 'Arredondar a coluna lombar na descida máxima'],
    setupSteps: ['Posicione os pés alinhados com a largura dos ombros, apontando levemente para fora', 'Contraia o abdômen ("bracing") ativamente para blindar o tronco', 'Inicie descendo através da articulação do quadril, como se fosse se sentar']
  },
  'Glúteos': {
    musclesPrimary: ['Glúteo Máximo', 'Glúteo Médio', 'Quadríceps Femoral'],
    musclesSecondary: ['Músculos Isquiotibiais (Posteriores)', 'Eretores Espinhais de Lombar'],
    breathing: { concentric: 'Expire na subida comprimindo forte a musculatura', eccentric: 'Inspire descendo o quadril com controle mecânico' },
    commonMistakes: ['Hiperestender as costas comprimindo as vértebras', 'Não estender totalmente o quadril de forma completa', 'Não impulsionar a subida a partir do calcanhar'],
    setupSteps: ['Apoie os calcanhares alinhados projetando força vertical reto para cima', 'Mantenha o queixo ligeiramente recolhido para manter a curvatura cervical', 'Trave o abdômen e esmague os glúteos de forma consciente no topo']
  },
  'Abdômen': {
    musclesPrimary: ['Reto Abdominal', 'Oblíquo Interno e Externo'],
    musclesSecondary: ['Transverso do Abdômen', 'Psoas Maior (Estabilizadores de Core)'],
    breathing: { concentric: 'Sopre todo o ar esvaziando o pulmão na contração máxima', eccentric: 'Inspire alongando a parede abdominal sem desleixar as costas' },
    commonMistakes: ['Puxar a cabeça forçando a cervical desnecessariamente', 'Subir girando o tronco usando flexores do quadril em vez de abdômen', 'Fazer os movimentos rápidos demais'],
    setupSteps: ['Sinta as costelas se aproximando do osso do quadril ativamente', 'Esqueça os braços na nuca, apoie-os cruzados no tórax', 'Mantenha a lombar bem apoiada no colchonete ou banco']
  },
  'Cardio': {
    musclesPrimary: ['Sistema Cardiorrespiratório', 'Gasto Metabólico Integral'],
    musclesSecondary: ['Gastrocnêmio', 'Sóleo', 'Quadríceps', 'Isquiotibiais'],
    breathing: { concentric: 'Mantenha a respiração cadenciada e constante', eccentric: 'Evite apneia (trancamento de ar)' },
    commonMistakes: ['Impactar os pés de forma pesada ou correr curvado', 'Não monitorar batimentos ou exceder limites sem progressão lenta', 'Postura de ombros elevados'],
    setupSteps: ['Utilize tênis com amortecimento ideal e confortável', 'Contraia levemente o core para dar sustentação vertical ao corpo', 'Inicie em ritmo calmo aumentando a intensidade de forma progressiva']
  }
};

export default function StudentDashboard({
  students,
  sheets,
  evolution,
  chats,
  activeStudentId,
  accessLogs,
  onSelectStudent,
  onUpdateSheetExercises,
  onAddEvolutionRecord,
  onSendMessage,
  onCompleteWorkout,
  onLogout
}: StudentDashboardProps) {
  const currentStudent = students.find(s => s.id === activeStudentId) || students[0];
  
  // Tabs: workout, performance, chat, subscript
  const [activeTab, setActiveTab] = useState<'treino' | 'evolucao' | 'chat' | 'plano'>('treino');
  const [activeLetter, setActiveLetter] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  // Exercise player overlay details state
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedExerciseWeight, setSelectedExerciseWeight] = useState<number>(20);
  const [exerciseModalTab, setExerciseModalTab] = useState<'virtual' | 'video'>('virtual');
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(true);
  const [metronomeProgress, setMetronomeProgress] = useState<number>(0);
  const [metronomePhase, setMetronomePhase] = useState<'eccentric' | 'concentric' | 'pause' | 'ready'>('concentric');
  const [checkedGuideSteps, setCheckedGuideSteps] = useState<Record<string, boolean>>({});

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

  // Metronome simulator logic for exercise demonstrations (repetition pacing guide)
  useEffect(() => {
    if (!selectedExercise || !isMetronomeActive) {
      setMetronomeProgress(0);
      setMetronomePhase('ready');
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) % 7500;
      
      if (elapsed < 3000) {
        // Eccentric (lowering/stretching): 0s to 3s
        setMetronomePhase('eccentric');
        setMetronomeProgress(Math.max(0, 100 - (elapsed / 3000) * 100));
      } else if (elapsed < 4200) {
        // Pause/Isometria: 3s to 4.2s
        setMetronomePhase('pause');
        setMetronomeProgress(0);
      } else if (elapsed < 6200) {
        // Concentric (pushing/pulling up, execution force): 4.2s to 6.2s
        setMetronomePhase('concentric');
        setMetronomeProgress(Math.min(100, ((elapsed - 4200) / 2000) * 100));
      } else {
        // Peak Contraction / Rest: 6.2s to 7.5s
        setMetronomePhase('ready');
        setMetronomeProgress(100);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [selectedExercise, isMetronomeActive]);

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

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-transparent rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 active:scale-95 cursor-pointer shadow-lg shadow-black/25"
                title="Sair da minha conta"
              >
                <LogOut size={14} className="shrink-0" />
                <span>Sair</span>
              </button>
            )}
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
                            onClick={() => {
                              setSelectedExercise(bankEx);
                              setSelectedExerciseWeight(state.userLoggedWeight || exercise.weightCc || 15);
                            }}
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

            {/* My Login / Session Access Logs Section */}
            <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono font-semibold">
                <Clock size={16} className="text-[#39FF14]" /> Histórico de Acessos Recentes (Segurança)
              </h4>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Abaixo estão registrados os acessos recentes vinculados à sua conta na base de dados sincronizada:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {accessLogs
                  .filter(log => log.role === 'student' && log.userId === currentStudent.id)
                  .map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></div>
                        <div>
                          <p className="font-semibold text-white">{log.action}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{log.timestamp} • {log.device}</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/35 px-2 py-0.5 rounded-full font-mono font-extrabold uppercase">
                        ATIVO
                      </span>
                    </div>
                  ))}

                {accessLogs.filter(log => log.role === 'student' && log.userId === currentStudent.id).length === 0 && (
                  <p className="text-xs text-neutral-500 font-mono text-center py-2">Nenhum registro de acesso recente.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* EXERCISE VIDEO MODAL PLAYER OVERLAY */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-5 md:p-6 relative shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
            
            {/* Close Modal button */}
            <button 
              onClick={() => {
                setSelectedExercise(null);
                setIsMetronomeActive(false);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 hover:bg-neutral-800/80 rounded-xl transition duration-150 cursor-pointer"
              title="Fechar painel"
            >
              <X size={18} />
            </button>

            {/* Title and Badge Info */}
            <div className="space-y-1.5">
              <span className="text-[9px] bg-[#39FF14]/15 text-[#39FF14] px-2.5 py-1 rounded-md font-mono uppercase font-extrabold border border-[#39FF14]/20">
                {selectedExercise.category}
              </span>
              <h3 className="text-base md:text-lg font-bold text-white mt-2 my-0 pr-10 tracking-tight flex items-center gap-2">
                <Dumbbell size={18} className="text-[#39FF14]" />
                {selectedExercise.name}
              </h3>
            </div>

            {/* Custom Interactive Tab Controls */}
            <div className="flex border-b border-neutral-800 gap-1 mt-2">
              <button
                onClick={() => setExerciseModalTab('virtual')}
                className={`px-4 py-2 text-xs font-extrabold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${exerciseModalTab === 'virtual' ? 'border-[#39FF14] text-[#39FF14]' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
              >
                <Sparkles size={13} className="text-[#39FF14]" />
                Guia Virtual de Postura por IA
              </button>
              <button
                onClick={() => setExerciseModalTab('video')}
                className={`px-4 py-2 text-xs font-extrabold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${exerciseModalTab === 'video' ? 'border-[#39FF14] text-[#39FF14]' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
              >
                <Play size={11} className={exerciseModalTab === 'video' ? 'text-[#39FF14]' : ''} />
                Vídeo de Execução Real
              </button>
            </div>

            {/* Tab Render: VIRTUAL AI PACER AND METRONOME */}
            {exerciseModalTab === 'virtual' ? (
              <div className="space-y-4">
                {/* AI Animation Simulator screen */}
                <ExerciseVisualizer 
                  exerciseId={selectedExercise.id} 
                  exerciseName={selectedExercise.name} 
                  category={selectedExercise.category}
                  weight={selectedExerciseWeight}
                />

                {/* Visualizer header metrics with Metronome trigger switch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Activity size={12} className="text-[#39FF14] animate-pulse" />
                    <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-neutral-400">Biometria e Ritmo Ativo</span>
                  </div>
                  
                  <button 
                    onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                    className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white px-3 py-1 rounded-lg text-[9px] font-extrabold font-mono uppercase tracking-wider transition cursor-pointer border border-neutral-700/80 active:scale-95"
                  >
                    {isMetronomeActive ? <Pause size={10} className="fill-white" /> : <Play size={10} className="fill-white" />}
                    Simulador {isMetronomeActive ? 'Ativo 🟢' : 'Pausado 🔴'}
                  </button>
                </div>

                {/* Simulated rep-progress metrics panel */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#39FF14]/5 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Progress pacer cylinder */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-800/80 pb-3 md:pb-0 md:pr-3">
                    <span className="text-[8px] font-mono font-extrabold uppercase tracking-widest text-neutral-500 mb-2">Padrão Rep.</span>
                    
                    <div className="w-12 h-24 bg-neutral-900 rounded-full border border-neutral-800 p-1 flex flex-col justify-end relative shadow-inner overflow-hidden">
                      <div 
                        className="w-full rounded-full transition-all duration-75 relative"
                        style={{ 
                          height: `${metronomeProgress}%`,
                          background: metronomePhase === 'concentric' 
                            ? 'linear-gradient(180deg, #39FF14 0%, #1a9e04 100%)' 
                            : metronomePhase === 'pause'
                              ? 'linear-gradient(180deg, #22d3ee 0%, #0891b2 100%)'
                              : metronomePhase === 'eccentric'
                                ? 'linear-gradient(180deg, #f97316 0%, #c2410c 100%)'
                                : 'linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)',
                          boxShadow: metronomePhase === 'concentric' 
                            ? '0 0 10px rgba(57,255,20,0.4)' 
                            : metronomePhase === 'pause'
                              ? '0 0 10px rgba(34,211,238,0.4)'
                              : metronomePhase === 'eccentric'
                                ? '0 0 10px rgba(249,115,22,0.4)'
                                : '0 0 10px rgba(168,85,247,0.4)'
                        }}
                      >
                        <div className="absolute top-1 left-1 right-1 h-1.5 bg-white/40 rounded-full animate-pulse" />
                      </div>

                      {/* Scale ticks */}
                      <div className="absolute inset-y-1.5 inset-x-0 flex flex-col justify-between pointer-events-none text-neutral-700 font-mono text-[8px] px-1 select-none font-bold">
                        <span>PICO</span>
                        <span className="border-t border-neutral-800/80 w-full" />
                        <span className="border-t border-neutral-800/80 w-full" />
                        <span>ESTRELA</span>
                      </div>
                    </div>
                  </div>

                  {/* Breathing feedback panel and execution cadence instructions */}
                  <div className="md:col-span-9 flex flex-col justify-between space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-mono tracking-widest font-extrabold text-neutral-400">Diretriz da Cadência</span>
                        {isMetronomeActive && (
                          <div className="flex items-center gap-1 font-mono text-[8px] font-bold text-[#39FF14]">
                            <span className="w-1 h-1 bg-[#39FF14] rounded-full animate-ping" />
                            ACOMPANHE O CICLO
                          </div>
                        )}
                      </div>

                      {/* Dynamic phase alert board */}
                      <div className={`mt-1.5 p-3 rounded-xl border text-center transition-all ${
                        metronomePhase === 'concentric' 
                          ? 'bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]'
                          : metronomePhase === 'pause'
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-450'
                            : metronomePhase === 'eccentric'
                              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                              : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      }`}>
                        <p className="text-[10px] font-mono uppercase tracking-wider font-extrabold m-0">
                          {metronomePhase === 'concentric' 
                            ? '▲ ▲ ▲ Fase Concêntrica (Puxar/Empurrar)'
                            : metronomePhase === 'pause'
                              ? '◆ ◆ ◆ Transição Ativa / Isometria'
                              : metronomePhase === 'eccentric'
                                ? '▼ ▼ ▼ Fase Excêntrica (Suster a descida)'
                                : '■ ■ ■ Pico Estático de Contração'}
                        </p>
                        <p className="text-[11px] text-neutral-200 mt-1 leading-normal font-sans">
                          {metronomePhase === 'concentric' 
                            ? 'Vença a inércia acelerando a carga de forma firme e explosiva.'
                            : metronomePhase === 'pause'
                              ? 'Evite o efeito mola. Mantenha estabilizado na parte inferior do movimento.'
                              : metronomePhase === 'eccentric'
                                ? 'Segure a resistência aplicando força contrária por 3 segundos.'
                                : 'Aperte ao máximo e contraia a musculatura-chave de esforço.'}
                        </p>
                      </div>
                    </div>

                    {/* Integrated dynamic breathing helper */}
                    <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        metronomePhase === 'concentric' 
                          ? 'bg-[#39FF14]/20 text-[#39FF14] scale-105 shadow-md shadow-[#39FF14]/10' 
                          : metronomePhase === 'eccentric' 
                            ? 'bg-orange-500/20 text-orange-450 scale-95' 
                            : 'bg-cyan-500/20 text-cyan-400 scale-100'
                      }`}>
                        <Activity className={`${isMetronomeActive && 'animate-pulse'}`} size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] uppercase font-mono tracking-wider text-neutral-450 font-bold leading-none">Respiração Sincronizada por IA</p>
                        <p className="text-[11px] font-bold text-white mt-1 leading-normal">
                          {metronomePhase === 'concentric' 
                            ? 'Expiração ativa: Sopre o ar pela boca'
                            : metronomePhase === 'eccentric'
                              ? 'Inspiração lenta: Puxe o ar pelo nariz'
                              : 'Mantenha o ar retido esmagando o core'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biomechanics and muscle mapping */}
                {(() => {
                  const categoryKey = EXERCISE_DETAILS[selectedExercise.category] 
                    ? selectedExercise.category 
                    : 'Peito';
                  const detail = EXERCISE_DETAILS[categoryKey];

                  return (
                    <div className="space-y-4">
                      {/* Sub-panels grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Target agonist muscle card */}
                        <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-xl space-y-1.5">
                          <span className="text-[9px] text-[#39FF14] uppercase font-mono font-bold tracking-wider block">Músculos Principais alvos</span>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.musclesPrimary.map((m, idx) => (
                              <span key={idx} className="bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Synergistic auxiliary muscles card */}
                        <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-xl space-y-1.5">
                          <span className="text-[9px] text-neutral-450 uppercase font-mono font-bold tracking-wider block">Músculos Auxiliares (Sinergistas)</span>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.musclesSecondary.map((m, idx) => (
                              <span key={idx} className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded-lg text-[10px]">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Interactive guidance checklists */}
                      <div className="bg-neutral-950/50 border border-neutral-800 p-3.5 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-mono text-neutral-400 font-extrabold tracking-wider flex items-center gap-1.5">
                            <CheckSquare size={12} className="text-[#39FF14]" />
                            Checklist Biomecânico de Postura
                          </span>
                          <span className="text-[8px] text-neutral-500 font-mono">Confirme os alinhamentos</span>
                        </div>
                        <div className="space-y-2">
                          {detail.setupSteps.map((step, idx) => {
                            const stepIdKey = `${selectedExercise.id}_step_${idx}`;
                            const isDone = !!checkedGuideSteps[stepIdKey];
                            return (
                              <label 
                                key={idx}
                                onClick={() => setCheckedGuideSteps(p => ({ ...p, [stepIdKey]: !isDone }))}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border transition duration-200 cursor-pointer text-[11px] ${
                                  isDone 
                                    ? 'bg-[#39FF14]/5 border-[#39FF14]/20 text-neutral-100' 
                                    : 'bg-neutral-900/40 border-neutral-800/50 text-neutral-400 hover:border-neutral-800 hover:text-neutral-300'
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isDone}
                                  onChange={() => {}} // Click handler of label is utilized instead
                                  className="sr-only"
                                />
                                <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                                  isDone 
                                    ? 'bg-[#39FF14] border-[#39FF14] text-black' 
                                    : 'border-neutral-700 bg-neutral-950'
                                }`}>
                                  {isDone && <Check size={10} strokeWidth={4} />}
                                </span>
                                <span className="leading-snug">{step}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Biomechanics Avoid Mistakes block */}
                      <div className="bg-red-500/5 border border-red-500/15 p-3 rounded-xl space-y-1.5 text-[11px]">
                        <span className="text-[9px] text-red-400 uppercase font-mono font-bold tracking-wider flex items-center gap-1.5">
                          <AlertCircle size={11} className="text-red-400" />
                          Erros Mecânicos a Serem Evitados
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-neutral-300 leading-relaxed font-normal">
                          {detail.commonMistakes.map((mistake, idx) => (
                            <li key={idx}>{mistake}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Brief description */}
                <div className="space-y-1 bg-neutral-950/20 p-2 rounded-xl">
                  <h5 className="text-[9px] uppercase font-mono tracking-wider font-bold text-neutral-400">Instruções Práticas Adicionais</h5>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">{selectedExercise.description}</p>
                </div>
              </div>
            ) : (
              /* Tab Render: OFFICIAL EMBEDDED VIDEO */
              <div className="space-y-4">
                {/* Embedded Video Box */}
                <div className="aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800/85 relative shadow-2xl">
                  <iframe 
                    src={selectedExercise.videoUrl} 
                    title={selectedExercise.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full border-none absolute inset-0 z-10"
                  ></iframe>
                  {/* Loader proxy inside */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 text-[11px] p-5 text-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-neutral-500" />
                    <span className="font-extrabold text-neutral-300">Carregando Reprodutor de Vídeo YouTube...</span>
                    <span className="text-neutral-500">Se o iframe não exibir nada devido a bloqueios de cookies das diretrizes de sandbox, use o atalho abaixo.</span>
                  </div>
                </div>

                {/* Fallback YouTube Launcher Option */}
                <div className="bg-neutral-950 p-4.5 rounded-xl border border-neutral-800/80 space-y-3">
                  <div className="space-y-1">
                    <h5 className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-[#39FF14] flex items-center gap-1.5">
                      <Sparkles size={11} />
                      Atalho Execução em Nova Guia de Alta Resolução
                    </h5>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans font-normal">
                      As diretrizes de isolamento de navegação de algumas versões do Chrome ou firewalls corporativos podem bloquear a reprodução direta de redes de mídia de terceiros dentro do iframe de testes do aplicativo. 
                      Para garantir visualização perfeita de forma instantânea, use o lançador abaixo para carregar o vídeo na qualidade máxima oficial de tutoriais do YouTube 
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const watchUrl = selectedExercise.videoUrl.replace('/embed/', '/watch?v=');
                      window.open(watchUrl, '_blank');
                    }}
                    className="w-full bg-[#39FF14] hover:bg-[#32dd12] text-black font-extrabold py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-[#39FF14]/15 font-mono uppercase text-center"
                  >
                    <ExternalLink size={13} strokeWidth={3} />
                    Abrir no YouTube (Nova Aba Segura)
                  </button>
                </div>
              </div>
            )}

            {/* Bottom acknowledgement button */}
            <button 
              onClick={() => {
                setSelectedExercise(null);
                setIsMetronomeActive(false);
              }}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold py-3 rounded-xl text-xs transition duration-150 cursor-pointer w-full text-center active:scale-98 shadow-md"
            >
              Entendido, Retornar à Planilha de Treino
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

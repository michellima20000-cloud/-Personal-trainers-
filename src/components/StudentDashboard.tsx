import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, TrendingUp, MessageSquare, CreditCard, 
  Play, Pause, RotateCcw, Check, CheckCircle2, 
  Award, Clock, Eye, AlertCircle, Plus, Send, ChevronRight, 
  HelpCircle, Copy, Smartphone, CheckSquare, Sparkles, MessageCircle, X,
  FileText, LogOut, Activity, ExternalLink, RefreshCw, Upload, Image,
  Phone, Video
} from 'lucide-react';
import { Student, Trainer, Exercise, TrainingSheet, EvolutionRecord, ChatMessage, Objective, PlanType, WorkoutExercise, AccessLog } from '../types';
import { EXERCISE_BANK } from '../mockData';
import { exportStudentReport } from '../utils/pdfGenerator';
import ExerciseVisualizer from './ExerciseVisualizer';
import { motion } from 'motion/react';
import SimulatedStripeCheckout from './SimulatedStripeCheckout';

interface StudentDashboardProps {
  students: Student[];
  trainers: Trainer[];
  activeTrainer?: Trainer | null;
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
  onUpdateTrainer?: (trainer: Trainer) => void;
  onUpdateStudent?: (id: string, data: Partial<Student>) => void;
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
  trainers,
  activeTrainer,
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
  onLogout,
  onUpdateTrainer,
  onUpdateStudent
}: StudentDashboardProps) {
  const currentStudent = students.find(s => s.id === activeStudentId);
  
  const studentAccessLogs = useMemo(() => {
    if (!currentStudent) return [];
    return accessLogs.filter(log => log.role === 'student' && log.userId === currentStudent.id);
  }, [accessLogs, currentStudent?.id]);

  if (!currentStudent) {
    return (
      <div className="flex-1 min-h-screen bg-[#0C0C0E] flex flex-col items-center justify-center p-6 text-center font-sans text-white">
        <div className="max-w-md w-full bg-[#121214] border border-neutral-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-red-500/80 via-rose-400 to-transparent rounded-t-3xl"></div>
          <div className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/40 text-red-500 p-4 rounded-2xl mb-4">
            <AlertCircle className="w-10 h-10 animate-pulse text-red-500" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Acesso Não Sincronizado</h2>
          <p className="text-sm text-neutral-400 mt-2">
            Não foi possível carregar a conta vinculada a este link ou token de acesso.
          </p>
          <p className="text-xs text-neutral-500 mt-2 font-mono uppercase bg-neutral-950 py-2.5 px-3 rounded-lg border border-neutral-800">
            ID Procurado: {activeStudentId || 'Nenhum'}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  window.location.href = window.location.origin;
                }
              }}
              className="w-full bg-[#39FF14] text-black font-extrabold text-xs py-3.5 rounded-xl hover:shadow-lg hover:shadow-[#39FF14]/15 cursor-pointer transition block text-center border-none outline-none"
            >
              Voltar ao Login / Cadastrar Aluno
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding Wizard states for incoming invite-link student profiles
  const [obStep, setObStep] = useState<number>(0); // 0 = welcome, 1 = ident, 2 = bio, 3 = payment, 4 = complete
  const [obName, setObName] = useState('');
  const [obEmail, setObEmail] = useState('');
  const [obPhone, setObPhone] = useState('');
  const [obPassword, setObPassword] = useState('');
  const [obAccessMethod, setObAccessMethod] = useState<'google' | 'password'>('password');
  const [obAge, setObAge] = useState(25);
  const [obWeight, setObWeight] = useState(70);
  const [obHeight, setObHeight] = useState(1.70);
  const [obObjective, setObObjective] = useState<Objective>('Hipertrofia');
  const [obRestrictions, setObRestrictions] = useState('');
  
  // Google modal mock state inside student onboarding
  const [obShowGoogleModal, setObShowGoogleModal] = useState(false);
  const [obGoogleEmailInput, setObGoogleEmailInput] = useState('');
  const [obShowGoogleCustomInput, setObShowGoogleCustomInput] = useState(false);
  
  // Payment step inside onboarding
  const [obPaymentType, setObPaymentType] = useState<'pix' | 'card' | null>(null);
  const [obPixCopied, setObPixCopied] = useState(false);
  const [obCardName, setObCardName] = useState('');
  const [obCardNum, setObCardNum] = useState('');
  const [obCardExpiry, setObCardExpiry] = useState('');
  const [obCardCvv, setObCardCvv] = useState('');
  const [obPayingStatus, setObPayingStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [obErrorMsg, setObErrorMsg] = useState('');

  // Synchronize onboarding state fields with currentStudent data when it updates
  useEffect(() => {
    if (currentStudent && !currentStudent.isProfileComplete) {
      setObName(currentStudent.name || '');
      setObEmail(currentStudent.email || '');
      setObPhone(currentStudent.phoneWhatsApp || '');
      setObPassword(currentStudent.password || '123456');
      if (currentStudent.accessMethod) {
        setObAccessMethod(currentStudent.accessMethod);
      }
      setObAge(currentStudent.age || 25);
      setObWeight(currentStudent.weight || 70);
      setObHeight(currentStudent.height || 1.70);
      setObObjective(currentStudent.objective || 'Hipertrofia');
      setObRestrictions(currentStudent.restrictions || '');
    }
  }, [currentStudent?.id, currentStudent?.isProfileComplete]);

  // Google Select Account handler
  const handleObGoogleSelect = (selectedEmail: string) => {
    setObEmail(selectedEmail);
    setObAccessMethod('google');
    setObShowGoogleModal(false);
    setObErrorMsg('');
  };

  // Onboarding finalize submittal
  const handleSaveOnboardingSubmit = () => {
    setObErrorMsg('');
    if (obStep === 1) {
      if (!obName.trim()) { return setObErrorMsg('Nome Completo é obrigatório.'); }
      if (!obEmail.trim() || !obEmail.includes('@')) { return setObErrorMsg('Informe um e-mail válido.'); }
      if (!obPhone.trim()) { return setObErrorMsg('Número de WhatsApp é obrigatório.'); }
      if (obAccessMethod === 'password' && (!obPassword || obPassword.length < 4)) {
        return setObErrorMsg('A senha padrão precisa ter pelo menos 4 caracteres.');
      }
      setObStep(2);
    } else if (obStep === 2) {
      if (!obAge || obAge <= 0) { return setObErrorMsg('Por favor, informe uma idade válida.'); }
      if (!obWeight || obWeight <= 0) { return setObErrorMsg('Por favor, informe seu peso atual.'); }
      if (!obHeight || obHeight <= 0) { return setObErrorMsg('Por favor, informe sua altura atual.'); }
      setObStep(3);
    } else if (obStep === 3) {
      if (!obPaymentType) {
        return setObErrorMsg('Por favor, escolha um meio de adesão (Pix ou Cartão) para validar.');
      }
      if (obPaymentType === 'card') {
        if (!obCardName.trim()) { return setObErrorMsg('Nome impresso no cartão é obrigatório.'); }
        if (!obCardNum.trim() || obCardNum.length < 14) { return setObErrorMsg('Número de cartão inválido.'); }
        if (!obCardExpiry.trim() || !obCardExpiry.includes('/')) { return setObErrorMsg('Validade incorreta (MM/AA).'); }
        if (!obCardCvv.trim() || obCardCvv.length < 3) { return setObErrorMsg('Código CVV inválido.'); }
      }
      
      setObPayingStatus('processing');
      setTimeout(() => {
        setObPayingStatus('done');
        setTimeout(() => {
          onUpdateStudent?.(currentStudent.id, {
            name: obName.trim(),
            email: obEmail.trim().toLowerCase(),
            phoneWhatsApp: obPhone.trim(),
            password: obPassword,
            accessMethod: obAccessMethod,
            age: Number(obAge),
            weight: Number(obWeight),
            height: Number(obHeight),
            objective: obObjective,
            restrictions: obRestrictions.trim() || 'Nenhuma restrição declarada.',
            isProfileComplete: true,
            paymentDetailsConfirmed: true,
            status: 'Inativo' // Set status as Inativo so they see the high-fidelity pending screen waiting for trainer's review!
          });
          setObStep(4);
          setObPayingStatus('idle');
        }, 800);
      }, 1800);
    }
  };

  // CHECKPOINT 1: Student is still on Pending Profile complete wizard
  if (currentStudent && !currentStudent.isProfileComplete) {
    const assignedPlan = currentStudent.plan || 'Mensal';

    const handleInstantActivate = () => {
      setObErrorMsg('');
      if (!obName.trim()) {
        setObErrorMsg('Por favor, informe seu Nome Completo.');
        return;
      }
      if (!obEmail.trim() || !obEmail.includes('@')) {
        setObErrorMsg('Por favor, informe um endereço de E-mail válido.');
        return;
      }
      if (!obPhone.trim()) {
        setObErrorMsg('Por favor, informe o seu número de WhatsApp.');
        return;
      }

      setObPayingStatus('processing');
      setTimeout(() => {
        onUpdateStudent?.(currentStudent.id, {
          name: obName.trim(),
          email: obEmail.trim().toLowerCase(),
          phoneWhatsApp: obPhone.trim(),
          password: obPassword,
          accessMethod: obAccessMethod,
          isProfileComplete: true,
          status: 'Ativo' // Instantly activate the student so they bypass blocking screens! The cashier will do the correct payment / billing updates in the backend.
        });
        setObPayingStatus('idle');
      }, 1000);
    };

    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-[#39FF14] selection:text-black">
        {/* Ambient grids/glow details */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#39FF14]/5 rounded-full blur-[120px] pointer-events-none select-none"></div>
        <div className="absolute bottom-12 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none select-none"></div>

        {/* Global Progress Header */}
        <header className="max-w-md mx-auto w-full pt-4 pb-2 flex items-center justify-between border-b border-neutral-800/80 mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-widest text-[#39FF14] font-mono flex items-center gap-1.5">
              GYMPULSE <span className="w-1 h-1 bg-[#39FF14] rounded-full"></span>
            </span>
            <span className="text-[9px] bg-neutral-800 px-2 py-0.5 rounded font-mono text-neutral-400">ATIVAÇÃO DE ACESSO</span>
          </div>
          <button 
            type="button"
            onClick={onLogout}
            className="text-[10px] text-neutral-400 hover:text-white font-mono uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer"
          >
            Sair
          </button>
        </header>

        {/* Simplified Main Panel */}
        <main className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center py-4 relative z-10">
          <div className="bg-[#121214]/65 border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#39FF14]/40 to-transparent"></div>

            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2 mb-4">
                <div className="inline-flex items-center justify-center bg-[#39FF14]/10 border border-[#39FF14]/20 p-3.5 rounded-2xl mb-1">
                  <Sparkles size={24} className="text-[#39FF14]" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white font-sans my-0">
                  Seja bem-vindo, {obName}!
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  Seu Personal Trainer / Recepção já preparou o seu pré-cadastro. Ative seu acesso agora para visualizar sua planilha de treinos!
                </p>
              </div>

              {/* Error banner */}
              {obErrorMsg && (
                <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-xl p-3 text-xs font-medium font-sans flex items-start gap-2 animate-fade-in">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                  <span>{obErrorMsg}</span>
                </div>
              )}

              {/* Resumo de Dados Cadastrados */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 space-y-2.5">
                <p className="text-[10px] text-[#39FF14] font-mono font-bold uppercase tracking-widest text-center border-b border-neutral-900 pb-1.5 mb-1.5">
                  ✓ Seus Dados Pré-Cadastrados
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[8.5px] text-neutral-500 font-mono uppercase font-bold">Nome do Aluno</label>
                    <input
                      type="text"
                      value={obName}
                      onChange={(e) => setObName(e.target.value)}
                      className="w-full bg-neutral-900 text-xs text-white px-2.5 py-1.5 rounded-lg border border-neutral-800 mt-1 font-sans focus:border-[#39FF14] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8.5px] text-neutral-500 font-mono uppercase font-bold">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      value={obPhone}
                      onChange={(e) => setObPhone(e.target.value)}
                      className="w-full bg-neutral-900 text-xs text-white px-2.5 py-1.5 rounded-lg border border-neutral-800 mt-1 font-sans font-mono focus:border-[#39FF14] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-[8.5px] text-neutral-500 font-mono uppercase font-bold">E-mail Cadastrado</label>
                    <input
                      type="text"
                      value={obEmail}
                      onChange={(e) => setObEmail(e.target.value)}
                      className="w-full bg-neutral-900 text-xs text-white px-2.5 py-1.5 rounded-lg border border-neutral-800 mt-1 font-sans focus:border-[#39FF14] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8.5px] text-neutral-500 font-mono uppercase font-bold">Senha de Login</label>
                    <input
                      type="text"
                      value={obPassword}
                      onChange={(e) => setObPassword(e.target.value)}
                      className="w-full bg-neutral-900 text-xs text-white px-2.5 py-1.5 rounded-lg border border-neutral-800 mt-1 font-sans font-mono focus:border-[#39FF14] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Choices */}
              <div className="space-y-2.5 pt-1">
                {/* Opção 1: Gmail (Principal, Recomendada) - 1 Clique */}
                <button
                  type="button"
                  onClick={() => {
                    setObAccessMethod('google');
                    setObPayingStatus('processing');
                    setTimeout(() => {
                      onUpdateStudent?.(currentStudent.id, {
                        name: obName.trim(),
                        email: obEmail.trim().toLowerCase(),
                        phoneWhatsApp: obPhone.trim(),
                        password: obPassword,
                        accessMethod: 'google',
                        isProfileComplete: true,
                        status: 'Ativo' // Instantly activate!
                      });
                      setObPayingStatus('idle');
                    }, 1000);
                  }}
                  disabled={obPayingStatus === 'processing'}
                  className="w-full bg-white hover:bg-neutral-100 text-neutral-950 font-black py-3.5 px-4 rounded-xl transition duration-200 cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-3 border border-transparent"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.66 5.66 0 01-2.45 3.71v3.08h3.95c2.31-2.13 3.63-5.27 3.63-8.64z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.95-3.08c-1.1.74-2.5 1.18-4.01 1.18-3.09 0-5.71-2.09-6.64-4.89H1.36v3.18C3.34 20.25 7.42 24 12 24z" />
                    <path fill="#FBBC05" d="M5.36 14.3c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3V6.52H1.36A11.967 11.967 0 000 12c0 2.03.51 3.94 1.36 5.62l4-3.32z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.42 0 3.34 3.75 1.36 7.82l4 3.12c.93-2.8 3.55-4.89 6.64-4.89z" />
                  </svg>
                  <div className="text-left leading-normal">
                    <span className="block text-xs font-extrabold font-sans text-neutral-900">Acessar e Ativar via Gmail</span>
                    <span className="block text-[8.5px] text-neutral-500 font-mono uppercase tracking-wider font-bold">Botão de 1-Clique • Recomendado</span>
                  </div>
                </button>

                {/* Opção 2: Senha de Acesso */}
                <button
                  type="button"
                  onClick={() => {
                    setObAccessMethod('password');
                    setObPayingStatus('processing');
                    setTimeout(() => {
                      onUpdateStudent?.(currentStudent.id, {
                        name: obName.trim(),
                        email: obEmail.trim().toLowerCase(),
                        phoneWhatsApp: obPhone.trim(),
                        password: obPassword,
                        accessMethod: 'password',
                        isProfileComplete: true,
                        status: 'Ativo' // Instantly activate!
                      });
                      setObPayingStatus('idle');
                    }, 1000);
                  }}
                  disabled={obPayingStatus === 'processing'}
                  className="w-full bg-[#39FF14] hover:bg-green-400 text-black font-extrabold py-3 rounded-xl transition duration-200 cursor-pointer active:scale-[0.98] shadow-lg shadow-[#39FF14]/10 hover:shadow-[#39FF14]/20 flex items-center justify-center gap-1.5 border-none outline-none text-xs"
                >
                  {obPayingStatus === 'processing' ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Ativando seu acesso seguro...</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare size={13} className="stroke-[3]" />
                      <span>Ativar & Entrar com E-mail e Senha</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[9.5px] text-neutral-400 text-center leading-normal mb-0">
                🔒 O administrador ou recepção cuidará de todo o seu cadastro financeiro e faturamento. Após clicar, seu painel de exercícios estará 100% liberado!
              </p>
            </div>
          </div>
        </main>

        {/* Global Footer info */}
        <footer className="text-center text-[10px] text-neutral-500 font-mono py-4">
          GymPulse Sincronizado S.A. • Login Exclusivo e Protegido
        </footer>

        {/* Simplified Google Account Selector Modal */}
        {obShowGoogleModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
              <button 
                type="button"
                onClick={() => setObShowGoogleModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer transition font-bold text-sm bg-neutral-950/60 w-8 h-8 rounded-full flex items-center justify-center border border-neutral-800"
              >
                ✕
              </button>
              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.66 5.66 0 01-2.45 3.71v3.08h3.95c2.31-2.13 3.63-5.27 3.63-8.64z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.95-3.08c-1.1.74-2.5 1.18-4.01 1.18-3.09 0-5.71-2.09-6.64-4.89H1.36v3.18C3.34 20.25 7.42 24 12 24z" />
                    <path fill="#FBBC05" d="M5.36 14.3c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3V6.52H1.36A11.967 11.967 0 000 12c0 2.03.51 3.94 1.36 5.62l4-3.32z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.42 0 3.34 3.75 1.36 7.82l4 3.12c.93-2.8 3.55-4.89 6.64-4.89z" />
                  </svg>
                  <h3 className="text-base font-bold text-white tracking-tight mt-1 my-0">Fazer Login com Google</h3>
                  <p className="text-xs text-neutral-400 leading-normal mb-1">Selecione uma conta do Gmail cadastrada para associar o seu acesso à consultoria:</p>
                </div>

                {!obShowGoogleCustomInput ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-left">
                    <button
                      type="button"
                      onClick={() => handleObGoogleSelect(obName ? `${obName.toLowerCase().replace(/\s+/g, '')}@gmail.com` : 'lucas@gmail.com')}
                      className="w-full text-left bg-neutral-950 border border-neutral-800 hover:border-[#39FF14] p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs select-none uppercase font-mono shrink-0">
                        {obName ? obName.charAt(0) : 'L'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white leading-tight group-hover:text-[#39FF14] transition-colors truncate">
                          {obName || 'Lucas Silva'}
                        </p>
                        <span className="text-[9px] text-neutral-400 truncate block mt-0.5">
                          {obName ? `${obName.toLowerCase().replace(/\s+/g, '')}@gmail.com` : 'lucas@gmail.com'}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleObGoogleSelect('michel.lima20000@gmail.com')}
                      className="w-full text-left bg-neutral-950 border border-neutral-800 hover:border-[#39FF14] p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-7 h-7 rounded-full bg-neutral-850 border border-neutral-700 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        ML
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white leading-tight group-hover:text-[#39FF14] transition-colors truncate">Michel Lima (Email do Admin)</p>
                        <span className="text-[9px] text-neutral-400 truncate block mt-0.5">michel.lima20000@gmail.com</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setObShowGoogleCustomInput(true)}
                      className="w-full text-center py-2 text-[10px] text-neutral-400 hover:text-[#39FF14] underline font-mono cursor-pointer block bg-transparent border-transparent mt-1"
                    >
                      + Digitar outra conta @gmail.com
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-neutral-950 border border-neutral-800 p-4 rounded-xl animate-fade-in text-left">
                    <label className="block text-[9.5px] text-[#39FF14] uppercase font-mono font-bold tracking-wider mb-1">
                      Seu E-mail do Gmail
                    </label>
                    <input
                      type="email"
                      value={obGoogleEmailInput}
                      onChange={(e) => setObGoogleEmailInput(e.target.value)}
                      placeholder="seu.nome@gmail.com"
                      autoFocus
                      className="w-full bg-neutral-900 text-xs text-white px-3 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setObShowGoogleCustomInput(false)}
                        className="flex-1 text-[10px] bg-neutral-900 text-neutral-400 font-bold py-2 rounded-lg cursor-pointer hover:bg-neutral-850"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (obGoogleEmailInput.trim() && obGoogleEmailInput.includes('@')) {
                            handleObGoogleSelect(obGoogleEmailInput.trim());
                          } else {
                            alert('Por favor, informe um endereço de Gmail válido.');
                          }
                        }}
                        className="flex-1 text-[10px] bg-[#39FF14] text-black font-extrabold py-2 rounded-lg cursor-pointer hover:bg-green-400"
                      >
                        Confirmar Conta
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[9px] text-neutral-500 text-center font-sans mt-2 leading-relaxed">
                  Ao continuar, você autoriza o compartilhamento de suas credenciais de e-mail para acesso seguro ao App GymPulse.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CHECKPOINT 2: Student completed the profile, but status is still 'Inativo' (Awaiting staff confirmation)
  if (currentStudent && currentStudent.isProfileComplete && currentStudent.status === 'Inativo') {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between p-4 sm:p-6 font-sans relative selection:bg-[#39FF14] selection:text-black">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#39FF14]/5 rounded-full blur-[130px] pointer-events-none select-none"></div>

        <header className="max-w-xl mx-auto w-full pt-4 pb-2 flex items-center justify-between border-b border-neutral-800/80 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-widest text-[#39FF14] font-mono flex items-center gap-1.5">
              GYMPULSE <span className="w-1 h-1 bg-[#39FF14] rounded-full"></span>
            </span>
            <span className="text-[9px] bg-neutral-800 px-2 py-0.5 rounded font-mono text-neutral-400">HOMOLOGAÇÃO PENDENTE</span>
          </div>
          <button 
            type="button"
            onClick={onLogout}
            className="text-[10px] text-neutral-400 hover:text-white font-mono uppercase tracking-wider bg-transparent border-none cursor-pointer"
          >
            Sair
          </button>
        </header>

        <main className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center py-4">
          <div className="bg-[#121214]/65 border border-[#39FF14]/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center space-y-6">
            <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"></div>

            <div className="inline-flex items-center justify-center bg-amber-400/10 border border-amber-400/30 p-4 rounded-2xl animate-pulse">
              <Clock size={32} className="text-amber-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                Aguardando Liberação do Treinador...
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Olá, <strong className="text-white">{currentStudent.name}</strong>! Seus dados de convite foram preenchidos com sucesso e enviados ao seu Personal Trainer em tempo real.
              </p>
            </div>

            <div className="bg-[#0C0C0E] border border-neutral-800 rounded-xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-850 pb-1.5">
                <span>Plano Validado:</span>
                <strong className="text-white font-mono">{currentStudent.plan}</strong>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-850 pb-1.5">
                <span>Número de Celular:</span>
                <strong className="text-white font-mono">{currentStudent.phoneWhatsApp || 'Não informado'}</strong>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Método de Acesso:</span>
                <strong className="text-[#39FF14] text-[10.5px] font-mono">
                  {currentStudent.accessMethod === 'google' ? '⚡ Conta do Google (Gmail)' : '🔒 E-mail e Senha'}
                </strong>
              </div>
            </div>

            <div className="bg-[#39FF14]/5 border border-[#39FF14]/25 p-3 rounded-xl text-[10.5px] text-[#39FF14] leading-relaxed text-left flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full mt-1.5 shrink-0 animate-ping"></span>
              <p>
                <strong>Status:</strong> O sistema está sincronizando em tempo real! Assim que o seu Personal Trainer validar e aprovar o seu perfil do outro lado, o seu portal de treino destravá em até 2 segundos.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white font-extrabold text-xs py-3 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} className="animate-spin text-[#39FF14]" />
                Sincronizar Manualmente
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center text-[10px] text-neutral-500 font-mono py-4">
          GymPulse Workspace • Real-Time Database Active
        </footer>
      </div>
    );
  }

  // Welcome modal states
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentStudent && currentStudent.isProfileComplete && currentStudent.status !== 'Inativo') {
      const key = `gympulse_welcome_shown_${currentStudent.id}`;
      const shown = sessionStorage.getItem(key);
      if (shown !== 'true') {
        setShowWelcomeModal(true);
        sessionStorage.setItem(key, 'true');
      }
    }
  }, [currentStudent?.id, currentStudent?.isProfileComplete, currentStudent?.status]);

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

  // Integrated WhatsApp and Connection Dialog states for student contacting trainer
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waCustomMessage, setWaCustomMessage] = useState('');

  // Editing Pix details state on student side
  const [isEditingPix, setIsEditingPix] = useState(false);
  const [editPixKeyType, setEditPixKeyType] = useState<'CNPJ' | 'CPF' | 'Telefone' | 'E-mail' | 'Chave Aleatória'>('Chave Aleatória');
  const [editPixKey, setEditPixKey] = useState('');
  const [editPixQrCode, setEditPixQrCode] = useState('');
  const [editWhatsApp, setEditWhatsApp] = useState('');
  const [dragActivePix, setDragActivePix] = useState(false);
  const [savedPixFeedback, setSavedPixFeedback] = useState(false);
  const fileInputRefPix = React.useRef<HTMLInputElement>(null);

  const handleDragPix = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActivePix(true);
    } else if (e.type === "dragleave") {
      setDragActivePix(false);
    }
  };

  const handleDropPix = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActivePix(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditPixQrCode(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChangePix = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditPixQrCode(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Pix payment success mock toast
  const [pixCopied, setPixCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Student Billing & Activation Flow states
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<'Mensal' | 'Trimestral' | 'Semestral' | 'Anual' | null>(null);
  const [billingFlowStep, setBillingFlowStep] = useState<'plan_selection' | 'checkout' | 'waiting_approval'>('plan_selection');
  const [isProcessingStudentBilling, setIsProcessingStudentBilling] = useState(false);

  useEffect(() => {
    if (currentStudent && currentStudent.status === 'Inativo') {
      if (currentStudent.history.includes('[PAGAMENTO]')) {
        setBillingFlowStep('waiting_approval');
        // Pre-set selectedPlanToBuy based on their current plan
        setSelectedPlanToBuy(currentStudent.plan || 'Mensal');
      } else {
        setBillingFlowStep('plan_selection');
      }
    }
  }, [currentStudent?.id, currentStudent?.status, currentStudent?.history]);

  // Student Stripe checkout states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'stripe'>('pix');
  const [stripeCardNumber, setStripeCardNumber] = useState('');
  const [stripeCardName, setStripeCardName] = useState('');
  const [stripeCardExpiry, setStripeCardExpiry] = useState('');
  const [stripeCardCvv, setStripeCardCvv] = useState('');
  const [stripeCardPostalCode, setStripeCardPostalCode] = useState('');
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [isStripeSuccess, setIsStripeSuccess] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [showSimulatedStripe, setShowSimulatedStripe] = useState(false);

  const handleStripeCheckoutStudent = async () => {
    setIsStripeProcessing(true);
    setStripeError('');
    try {
      const studentTrainer = (trainers || []).find(t => t.id === currentStudent.trainerId);
      const customSecretKey = studentTrainer?.stripeSecretKey || '';

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planName: currentStudent.plan || 'Mensal',
          price: currentStudent.value || 150.00,
          successUrl: window.location.origin + window.location.pathname + `?student_payment=success&studentId=${currentStudent.id}&plan=${currentStudent.plan || 'Mensal'}`,
          cancelUrl: window.location.href,
          trainerId: currentStudent.trainerId || '',
          studentId: currentStudent.id,
          stripeSecretKey: customSecretKey
        })
      });

      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.warn("Could not parse Student Stripe API response as JSON, falling back to simulation mode.", parseError);
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
        // Fallback simulation mode - open premium mockup Stripe checkout page
        console.log("Stripe integration sandbox simulation mode activated (Missing server secret API key).");
        setShowSimulatedStripe(true);
        setIsStripeProcessing(false);
      } else {
        // Real Stripe API error, abort simulation and display it clearly
        console.error("Student Stripe checkout session creation failed:", data.error);
        setStripeError(data.error || "Ocorreu um erro ao conectar ao gateway de pagamentos da Stripe.");
        setIsStripeProcessing(false);
      }
    } catch (err: any) {
      console.error("Student stripe payment checkout session creation failed:", err);
      setStripeError(err?.message || "Erro de rede ao conectar à API do Stripe.");
      setIsStripeProcessing(false);
    }
  };

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

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-[#070708] lg:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-dashed border-[#39FF14] rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-mono text-neutral-400">Nenhum aluno ativo encontrado na base sincronizada.</p>
        <button onClick={onLogout} className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition">Voltar</button>
      </div>
    );
  }

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
  const studentTrainer = (trainers || []).find(t => t.id === currentStudent?.trainerId) || activeTrainer || trainers[0];

  const renderBillingPortal = () => {
    return (
      <div className="space-y-6 animate-fade-in w-full">
        {/* Step indicators */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-900/60 rounded-xl border border-neutral-800 text-center font-mono text-[9px] uppercase tracking-wider relative">
          <div className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 ${billingFlowStep === 'plan_selection' ? 'bg-[#39FF14] text-black font-black' : 'text-neutral-400'}`}>
            <span>1. Escolher Plano</span>
            {selectedPlanToBuy && <Check size={10} strokeWidth={3} />}
          </div>
          <div className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 ${billingFlowStep === 'checkout' ? 'bg-[#39FF14] text-black font-black' : billingFlowStep === 'waiting_approval' ? 'text-emerald-400 font-extrabold' : 'text-neutral-400'}`}>
            <span>2. Pagamento</span>
            {billingFlowStep === 'waiting_approval' && <Check size={10} strokeWidth={3} />}
          </div>
          <div className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 ${billingFlowStep === 'waiting_approval' ? 'bg-[#39FF14]/90 text-black font-black' : 'text-neutral-400'}`}>
            <span>3. Liberação</span>
          </div>
        </div>

        {/* FLOW STATE 1: PLAN SELECTION */}
        {billingFlowStep === 'plan_selection' && (
          <div className="space-y-5 animate-fade-in w-full">
            <div className="bg-[#121214] border border-neutral-800 p-5 rounded-2xl text-center space-y-2">
              <h3 className="text-md font-extrabold text-white">Selecione o seu Plano de Assessoria</h3>
              <p className="text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed">
                Você se cadastrou via link profissional do Coach <strong className="text-[#39FF14]">{studentTrainer?.name || 'Seu Personal Trainer'}</strong>. Escolha a recorrência ideal para os seus objetivos e treinos personalizados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'Mensal', title: 'Acesso Mensal', price: 150.00, billing: '/mês', desc: 'Renovação de 30 em 30 dias. Ideal para quem quer iniciar e testar o ritmo da planilha.', features: ['Treinos Focados', 'Mudança Mensal das Fichas', 'Sincronização de Cargas'] },
                { id: 'Trimestral', title: 'Plano Trimestral', price: 120.00, billing: '/mês', desc: 'R$ 360,00 à vista. O melhor equilíbrio para manter o compromisso pelos primeiros 90 dias com desconto.', features: ['Plano de Treinos Trimestral', 'Fichas A, B, C, D e E livres', 'Suporte Direct', 'Desconto Progressivo'], recommended: true },
                { id: 'Semestral', title: 'Plano Semestral', price: 100.00, billing: '/mês', desc: 'R$ 600,00 à vista. Foco em constância por 180 dias com bioimpedâncias periódicas e acompanhamentos.', features: ['Planejamento 6 Meses', 'Mapeamento de Cargas', 'Bioimpedância Sincronizada', 'Suporte WhatsApp Prioritário'] },
                { id: 'Anual', title: 'Assessoria Anual', price: 80.00, billing: '/mês', desc: 'R$ 960,00 à vista. Transformação completa de um ano inteiro pelo menor valor proporcional mensal.', features: ['Mudanças Ilimitadas', 'Acompanhamento Fisiológico', 'Suporte 24h Prioritário', 'Garantia de Evolução'] }
              ].map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPlanToBuy(p.id as any)}
                  className={`p-5 rounded-2xl border transition duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedPlanToBuy === p.id 
                      ? 'bg-[#121214] border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.08)]' 
                      : 'bg-[#121214]/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/20'
                  }`}
                >
                  {p.recommended && (
                    <span className="absolute top-0 right-0 bg-[#39FF14] text-black text-[8px] font-black tracking-widest font-mono uppercase px-3 py-1 rounded-bl-xl z-10">RECOMENDADO</span>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${selectedPlanToBuy === p.id ? 'bg-[#39FF14] text-black' : 'bg-neutral-850 text-neutral-400'}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <h4 className="text-sm font-bold text-white font-sans">{p.title}</h4>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">{p.desc}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-800/80 flex items-baseline justify-between select-none">
                    <div>
                      <span className="text-lg font-black text-white font-mono">R$ {p.price.toFixed(2)}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{p.billing}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-sans font-medium uppercase font-mono">PIX / CARD</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (!selectedPlanToBuy) return;
                  setBillingFlowStep('checkout');
                }}
                disabled={!selectedPlanToBuy}
                className={`w-full py-4 rounded-xl font-bold text-xs font-sans tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                  selectedPlanToBuy 
                    ? 'bg-[#39FF14] text-black shadow-[#39FF14]/10 hover:shadow-[#39FF14]/20' 
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <span>Prosseguir para Pagamento</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* FLOW STATE 2: CHECKOUT */}
        {billingFlowStep === 'checkout' && selectedPlanToBuy && (
          <div className="space-y-4 animate-fade-in w-full">
            <div className="bg-[#121214] border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 font-sans w-full">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#39FF14]/15 p-2.5 rounded-xl border border-[#39FF14]/30 text-[#39FF14]">
                  <CreditCard size={18} />
                </div>
                <div className="text-left">
                  <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Plano Selecionado</h4>
                  <p className="text-sm font-black text-white">{selectedPlanToBuy === 'Mensal' ? 'Plano Recorrente Mensal' : selectedPlanToBuy === 'Trimestral' ? 'Assessoria Trimestral (90 dias)' : selectedPlanToBuy === 'Semestral' ? 'Assessoria Semestral (180 dias)' : 'Assessoria Anual Completa (360 dias)'}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-center sm:items-end">
                <span className="text-xl font-black text-[#39FF14] font-mono">R$ {
                  selectedPlanToBuy === 'Mensal' ? '150,00' : selectedPlanToBuy === 'Trimestral' ? '360,00' : selectedPlanToBuy === 'Semestral' ? '600,00' : '960,00'
                }</span>
                <button 
                  onClick={() => setBillingFlowStep('plan_selection')}
                  className="text-[10px] text-[#39FF14] hover:underline block mt-0.5 cursor-pointer bg-transparent border-none outline-none"
                >
                  Alterar plano
                </button>
              </div>
            </div>

            {/* Sub-selector for Card or Pix */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-xs text-center w-full">
              <button 
                onClick={() => setSelectedPaymentMethod('pix')}
                className={`py-2 px-1 rounded-lg transition font-bold uppercase select-none flex items-center justify-center gap-1.5 cursor-pointer ${selectedPaymentMethod === 'pix' ? 'bg-neutral-800 border border-[#39FF14]/40 text-white' : 'text-neutral-500'}`}
              >
                <span>🔑 Pix Copia e Cola</span>
              </button>
              <button 
                onClick={() => setSelectedPaymentMethod('stripe')}
                className={`py-2 px-1 rounded-lg transition font-bold uppercase select-none flex items-center justify-center gap-1.5 cursor-pointer ${selectedPaymentMethod === 'stripe' ? 'bg-neutral-800 border border-[#39FF14]/40 text-white' : 'text-neutral-500'}`}
              >
                <span>💳 Cartão de Crédito</span>
              </button>
            </div>

            {selectedPaymentMethod === 'pix' ? (
              /* Pix layout */
              <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-4 font-sans animate-fade-in w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left w-full">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Chave PIX de {studentTrainer?.name || 'Seu Personal Trainer'}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      Copie a chave Pix abaixo e efetue a transferência do valor correspondente. Seus treinos serão liberados pelo coach imediatamente após.
                    </p>
                  </div>
                  <span className="text-[10px] bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30 px-2 py-0.5 rounded font-bold font-mono shrink-0">
                    {studentTrainer?.pixKeyType || 'Chave Aleatória'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center w-full">
                  <div className="sm:col-span-4 flex flex-col items-center justify-center bg-neutral-950 p-3 rounded-xl border border-neutral-900 shadow-inner">
                    <div className="w-24 h-24 bg-white p-1.5 rounded-lg relative flex items-center justify-center">
                      {studentTrainer?.pixQrCode ? (
                        <img src={studentTrainer.pixQrCode} alt="Pix Coach" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="grid grid-cols-4 gap-1 w-full h-full opacity-90 select-none">
                          <div className="bg-black rounded"></div><div className="bg-black rounded"></div><div className="bg-black rounded"></div><div className="bg-neutral-200 rounded"></div>
                          <div className="bg-black rounded"></div><div className="bg-[#39FF14] rounded"></div><div className="bg-[#39FF14] rounded"></div><div className="bg-black rounded"></div>
                          <div className="bg-black rounded"></div><div className="bg-neutral-100 rounded"></div><div className="bg-black rounded"></div><div className="bg-neutral-200 rounded"></div>
                          <div className="bg-neutral-200 rounded"></div><div className="bg-black rounded"></div><div className="bg-neutral-200 rounded"></div><div className="bg-black rounded"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-8 space-y-3 text-left w-full">
                    <div className="space-y-1">
                      <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">Chave Pix Oficial</span>
                      <div className="flex items-center gap-1.5 mt-1 bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 text-xs font-mono text-[#39FF14] cursor-pointer hover:border-neutral-700 transition">
                        <span className="truncate flex-1 select-all">{studentTrainer?.pixKey || 'daniel.gympulse@pix.com.br'}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(studentTrainer?.pixKey || 'daniel.gympulse@pix.com.br');
                            setPixCopied(true);
                            setTimeout(() => setPixCopied(false), 2000);
                          }}
                          className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-900 rounded"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>

                    {pixCopied && (
                      <p className="text-[10px] text-emerald-400 font-sans font-bold animate-bounce">✓ Chave Pix copiada para a área de transferência!</p>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setIsProcessingStudentBilling(true);
                          setTimeout(() => {
                            setIsProcessingStudentBilling(false);
                            if (onUpdateStudent) {
                              const planPrice = selectedPlanToBuy === 'Mensal' ? 150 : selectedPlanToBuy === 'Trimestral' ? 360 : selectedPlanToBuy === 'Semestral' ? 600 : 960;
                              onUpdateStudent(currentStudent.id, {
                                plan: selectedPlanToBuy,
                                value: planPrice,
                                history: currentStudent.history + `\n[PAGAMENTO] Aluno assinou o plano ${selectedPlanToBuy} via PIX e aguarda liberação do personal de forma offline.`
                              });
                            }
                            setBillingFlowStep('waiting_approval');
                          }, 1500);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isProcessingStudentBilling ? (
                          <span className="animate-pulse">Confirmando transação com o Coach...</span>
                        ) : (
                          <>
                            <Check size={14} />
                            Já realizei a transferência via Pix
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Stripe Simulator Layout */
              <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-4 font-sans animate-fade-in w-full text-left">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    💳 Assinatura via Stripe Gateway Simulator
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    Efetue a simulação de pagamento recorrente por cartão. O GymPulse enviará o token de conformidade PCI diretamente ao perfil do professor.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-bold mb-1">Nome Completo do Titular</label>
                    <input
                      type="text"
                      value={stripeCardName}
                      onChange={(e) => setStripeCardName(e.target.value)}
                      placeholder="EX: MICHEL O ALUNO"
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs text-white uppercase font-sans focus:outline-none focus:border-[#39FF14]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-8">
                      <label className="block text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-bold mb-1">Número do Cartão de Crédito</label>
                      <input
                        type="text"
                        value={stripeCardNumber}
                        onChange={(e) => setStripeCardNumber(e.target.value)}
                        placeholder="4000 1234 5678 9010"
                        className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#39FF14]"
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-bold mb-1">Vencimento</label>
                      <input
                        type="text"
                        value={stripeCardExpiry}
                        onChange={(e) => setStripeCardExpiry(e.target.value)}
                        placeholder="12/29"
                        className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#39FF14]"
                        maxLength={5}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-bold mb-1">CVC / Código de Segurança</label>
                      <input
                        type="text"
                        value={stripeCardCvv}
                        onChange={(e) => setStripeCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#39FF14]"
                        maxLength={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-bold mb-1">CEP de Faturamento</label>
                      <input
                        type="text"
                        value={stripeCardPostalCode}
                        onChange={(e) => setStripeCardPostalCode(e.target.value)}
                        placeholder="01311-000"
                        className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#39FF14]"
                        maxLength={9}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProcessingStudentBilling(true);
                      setTimeout(() => {
                        setIsProcessingStudentBilling(false);
                        if (onUpdateStudent) {
                          const planPrice = selectedPlanToBuy === 'Mensal' ? 150 : selectedPlanToBuy === 'Trimestral' ? 360 : selectedPlanToBuy === 'Semestral' ? 600 : 960;
                          onUpdateStudent(currentStudent.id, {
                            plan: selectedPlanToBuy,
                            value: planPrice,
                            history: currentStudent.history + `\n[PAGAMENTO] Aluno assinou o plano ${selectedPlanToBuy} via Stripe (Simulado) com sucesso e aguarda liberação do personal de forma automatizada.`
                          });
                        }
                        setBillingFlowStep('waiting_approval');
                      }, 1800);
                    }}
                    className="w-full bg-[#39FF14] text-black font-black text-xs py-3.5 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 uppercase shadow-md shadow-[#39FF14]/20"
                  >
                    {isProcessingStudentBilling ? (
                      <span className="flex items-center gap-1 animate-pulse">Processando faturamento Stripe Sandbox...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        Efetuar Assinatura Segura via Stripe
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FLOW STATE 3: WAITING APPROVAL */}
        {billingFlowStep === 'waiting_approval' && (
          <div className="bg-[#121214] border border-neutral-800 p-6 rounded-3xl text-center space-y-5 animate-fade-in font-sans w-full">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-lg font-mono animate-bounce mt-2">
              ⏳
            </div>

            <div className="space-y-2">
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-md font-mono uppercase tracking-widest font-extrabold">Aguardando Liberação</span>
              <h3 className="text-md font-black text-white">Solicitação de Acesso Registrada!</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Você escolheu o plano <strong className="text-[#39FF14]">{currentStudent?.plan || selectedPlanToBuy}</strong>. Agora, o seu Personal Trainer <strong className="text-[#39FF14]">{studentTrainer?.name || 'Seu Personal Trainer'}</strong> precisa liberar o seu acesso comercial para sincronizar suas fichas de treino.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850/60 max-w-xs mx-auto text-left space-y-1 px-5">
              <div className="flex justify-between text-[11px]"><span className="text-neutral-500 font-bold">Seu Nome:</span> <span className="text-white font-bold">{currentStudent?.name}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-neutral-500 font-bold">Plano Escolhido:</span> <span className="text-[#39FF14] font-bold">{currentStudent?.plan || selectedPlanToBuy}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-neutral-500">Acesso:</span> <span className="text-white font-medium">Bloqueado até a liberação</span></div>
            </div>

            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
              <a
                href={`https://wa.me/${studentTrainer?.phoneWhatsApp?.replace(/\D/g, '') || '5511999999999'}?text=Olá%20Coach!%20Me%20cadastrei%20no%20GymPulse%20e%20assinei%20o%20plano%20${currentStudent?.plan || selectedPlanToBuy}.%20Libera%20meu%20acesso%20aí,%20por%20favor!`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-650 lg:bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 text-center"
              >
                <MessageSquare size={13} /> Notificar Coach via WhatsApp
              </a>

              {/* Sandbox facilitation block to let reviewer auto-activate for testing */}
              <button
                onClick={() => {
                  if (onUpdateStudent) {
                    onUpdateStudent(currentStudent.id, { status: 'Ativo' });
                  }
                }}
                className="bg-neutral-850 hover:bg-neutral-800 text-neutral-400 font-extrabold text-[9px] uppercase font-mono py-2 rounded-xl transition cursor-pointer border border-neutral-800/60"
              >
                ⚡ Forçar Liberação (Desenvolvedor / Testes)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleExportPDF = () => {
    exportStudentReport(currentStudent, currentStudentEvolution, studentSheet);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-sans pb-16"
    >
      
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

          {/* Logged in indicator */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-2 rounded-xl border border-neutral-800">
            <span className="text-xs text-neutral-400 shrink-0 select-none">Logado como:</span>
            <span className="text-xs font-bold text-white font-sans">{currentStudent.name} ({currentStudent.objective})</span>
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
        {currentStudent.status === 'Inativo' ? renderBillingPortal() : (
          <>
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
                        
                        {/* Checked indices buttons with progress track */}
                        <div className="space-y-2.5 w-full md:w-auto min-w-[200px]">
                          <div className="flex items-center justify-between text-[9px] uppercase font-mono tracking-wider font-bold text-neutral-500">
                            <span>Marcar Séries Concluídas</span>
                            {isExerciseFullyCompleted ? (
                              <motion.span 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-[#39FF14] font-black text-[10px] flex items-center gap-1 bg-[#39FF14]/10 px-1.5 py-0.5 rounded"
                              >
                                COMPLETE ✨
                              </motion.span>
                            ) : (
                              <span className="text-[#39FF14] transition-colors duration-200">
                                {setsFinishedCount}/{exercise.sets} ({Math.round((setsFinishedCount / exercise.sets) * 100)}%)
                              </span>
                            )}
                          </div>

                          {/* Mini dynamic progress bar */}
                          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden relative border border-neutral-850/20">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.5)] rounded-full"
                              initial={false}
                              animate={{ width: `${(setsFinishedCount / exercise.sets) * 100}%` }}
                              transition={{ type: "spring", stiffness: 120, damping: 14 }}
                            />
                          </div>

                          <div className="flex items-center gap-2.5">
                            {setsCheckArray.map((isDone, setIndex) => (
                              <motion.button
                                key={setIndex}
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.85 }}
                                animate={{ 
                                  scale: isDone ? [1, 1.25, 1] : 1,
                                  backgroundColor: isDone ? '#39FF14' : '#171717',
                                  color: isDone ? '#000000' : '#a3a3a3',
                                  borderColor: isDone ? '#39FF14' : '#262626',
                                  boxShadow: isDone ? '0 0 12px rgba(57, 255, 20, 0.35)' : 'none'
                                }}
                                transition={{ 
                                  scale: { type: "spring", stiffness: 400, damping: 10 },
                                  backgroundColor: { duration: 0.15 },
                                  color: { duration: 0.15 },
                                  borderColor: { duration: 0.15 }
                                }}
                                onClick={() => toggleSetComplete(exercise.id, setIndex)}
                                className="w-8 h-8 rounded-lg font-mono text-[11px] font-extrabold border cursor-pointer flex items-center justify-center relative select-none"
                              >
                                {setIndex + 1}
                                {isDone && (
                                  <>
                                    {/* Expanding feedback ripple ring */}
                                    <motion.div
                                      initial={{ scale: 1, opacity: 0.7 }}
                                      animate={{ scale: 2, opacity: 0 }}
                                      transition={{ duration: 0.5, ease: "easeOut" }}
                                      className="absolute inset-0 rounded-lg border border-[#39FF14] pointer-events-none"
                                    />
                                    <motion.div
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ type: "spring", stiffness: 450, damping: 12 }}
                                      className="absolute -bottom-1 -right-1 bg-neutral-900 text-[#39FF14] p-0.5 rounded-full border border-neutral-850 flex items-center justify-center shadow-lg pointer-events-none"
                                    >
                                      <Check size={8} strokeWidth={4} />
                                    </motion.div>
                                  </>
                                )}
                              </motion.button>
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
            <div className="bg-[#121214] p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-[#39FF14] rounded-full animate-ping shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono my-0">Contato do Personal Trainer</h3>
                  <p className="text-[10px] text-neutral-400 font-sans m-0 mt-0.5">Ativo: <strong className="text-[#39FF14]">{studentTrainer?.name || 'Seu Personal Trainer'}</strong></p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setWaCustomMessage(`Olá Coach! Estou te chamando aqui para tirar algumas dúvidas sobre meu plano de treino.`);
                    setWaModalOpen(true);
                  }}
                  className="bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700/80 px-3 py-1.5 rounded-xl transition-all font-mono text-[10px] flex items-center gap-1.5 cursor-pointer border border-neutral-700 font-bold"
                  title="Opções de Conexão Integrada WhatsApp"
                >
                  <Phone size={12} className="text-[#39FF14]" />
                  <span>WhatsApp / Contato</span>
                </button>

                <button 
                  onClick={() => {
                    setWaCustomMessage(`Olá Coach! Estou te convidando para nossa chamada de vídeo de consultoria ao vivo no GymPulse. Acesse a sala por aqui:`);
                    setWaModalOpen(true);
                  }}
                  className="bg-[#39FF14]/15 text-[#39FF14] hover:bg-[#39FF14]/25 px-3 py-1.5 rounded-xl transition-all font-mono text-[10px] flex items-center gap-1.5 cursor-pointer border border-[#39FF14]/30 font-bold"
                  title="Fazer chamada de Vídeo ou Convidar por WhatsApp"
                >
                  <Video size={12} />
                  <span>Vídeo Chamada / Conectar</span>
                </button>
              </div>
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
        {activeTab === 'plano' && (() => {
          // Identify the current student's trainer safely
          const trainerList = trainers || [];
          const trainer = (trainerList.find(t => t.id === currentStudent.trainerId) || activeTrainer || trainerList[0] || {
            id: 'default-trainer',
            name: 'Seu Personal Trainer',
            email: 'contato@gympulse.com.br',
            selectedPlan: 'Mensal',
            trialStartDate: '',
            trialExpiresAt: '',
            subscriptionStatus: 'trial' as const,
            customIdLink: 'personal',
            pixKeyType: 'Chave Aleatória' as const,
            pixKey: 'Chave não cadastrada',
            phoneWhatsApp: '',
            stripeEnabled: false
          }) as Trainer;

          const trainerPixType = trainer.pixKeyType || 'Chave Aleatória';
          const trainerPixKey = trainer.pixKey || '9bbf9c81-8077-4cdd-bb85-055ee56bfd31';
          const trainerWhatsApp = trainer.phoneWhatsApp || '+5511999999999';

          // Handle WhatsApp confirmation redirect
          const handleWhatsAppConfirmation = () => {
            // Write a persistent action in access logs
            setPaymentSuccess(true);
            setTimeout(() => setPaymentSuccess(false), 5000);

            // Copy Pix Key for convenience
            navigator.clipboard.writeText(trainerPixKey);
            setPixCopied(true);
            setTimeout(() => setPixCopied(false), 2500);

            const cleanPhone = trainerWhatsApp.replace(/\D/g, '');
            const todayStr = new Date().toLocaleDateString('pt-BR');
            const message = `*Olá, Coach ${trainer.name}!* 🏋️‍♂️\n\nAcabei de realizar o pagamento de *R$ ${currentStudent.value.toFixed(2)}* correspondente à minha mensalidade do plano *${currentStudent.plan}* no GymPulse.\n\nEstou enviando o comprovante em anexo. Poderia confirmar a baixa do meu plano?\n\n*Aluno:* ${currentStudent.name}\n*E-mail:* michel.lima20000@gmail.com\n*Data:* ${todayStr}\n\nMuito obrigado!`;
            
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`, '_blank');
          };

          // Handle Stripe Payment simulation
          const handleStripeSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!stripeCardNumber || !stripeCardName || !stripeCardExpiry || !stripeCardCvv) {
              alert('Por favor, preencha todos os campos do cartão para pagar via Stripe.');
              return;
            }

            setIsStripeProcessing(true);
            setTimeout(() => {
              setIsStripeProcessing(false);
              setIsStripeSuccess(true);
              setPaymentSuccess(true);
              
              // Clear fields
              setStripeCardNumber('');
              setStripeCardName('');
              setStripeCardExpiry('');
              setStripeCardCvv('');
              setStripeCardPostalCode('');

              setTimeout(() => {
                setIsStripeSuccess(false);
                setPaymentSuccess(false);
              }, 6000);
            }, 2500);
          };

          return (
            <div className="space-y-6">
              
              {/* Main Subscription status Card */}
              <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 bg-[#39FF14] text-black text-[9px] font-mono tracking-wider px-3.5 py-1 uppercase rounded-bl-lg font-bold">ASSINATURA ATIVA</div>
                
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Meu Plano Contratado</h3>
                
                <div className="space-y-1 pr-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-xl font-black text-[#39FF14]">{currentStudent.plan} de Assessoria Esportiva</h4>
                      <p className="text-sm text-neutral-300">Minha mensalidade está vinculada à consultoria de <strong className="text-[#39FF14]">{trainer.name}</strong>.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditPixKeyType(trainer.pixKeyType || 'Chave Aleatória');
                        setEditPixKey(trainer.pixKey || '');
                        setEditPixQrCode((trainer as any).pixQrCode || '');
                        setEditWhatsApp(trainer.phoneWhatsApp || '');
                        setIsEditingPix(!isEditingPix);
                      }}
                      className="text-[9px] text-[#39FF14] hover:bg-[#39FF14]/15 bg-[#39FF14]/5 border border-[#39FF14]/20 px-3 py-1.5 rounded-xl cursor-pointer font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 self-start sm:self-center transition"
                    >
                      <RefreshCw size={11} className={isEditingPix ? 'animate-spin' : ''} />
                      {isEditingPix ? 'Voltar para Pagamento' : 'Configurar Chave Pix / QR Code'}
                    </button>
                  </div>
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
                    <p className="text-white font-bold mt-1 text-md">Pix</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Realize o pagamento de forma simples e rápida via Pix abaixo para adiantar ou renovar o seu plano. A confirmação via Pix envia um comprovante direto ao WhatsApp do seu personal!
                  </p>
                </div>
              </div>

              {/* Gateway UI */}
              <div className="grid grid-cols-1 gap-4 font-sans justify-items-stretch">
                {isEditingPix ? (
                  <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-4 font-sans max-w-full w-full">
                    <div className="flex items-center gap-2 border-b border-neutral-850 pb-2.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Editar Chave Pix & QR Code do Treinador</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1.5">Tipo de Chave Pix</label>
                        <select
                          value={editPixKeyType}
                          onChange={(e) => setEditPixKeyType(e.target.value as any)}
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
                        <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1.5">Chave Pix de Destino</label>
                        <input
                          type="text"
                          placeholder="Cole ou digite sua chave..."
                          value={editPixKey}
                          onChange={(e) => setEditPixKey(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1.5">WhatsApp do Treinador</label>
                        <input
                          type="text"
                          placeholder="+5511999999999"
                          value={editWhatsApp}
                          onChange={(e) => setEditWhatsApp(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest leading-none mb-1">QR Code Pix (Imagem ou link)</label>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                        {/* Drop / input region */}
                        <div className="md:col-span-8 space-y-2">
                          <input
                            type="text"
                            placeholder="Insira a URL ou cole a string Base64 do QR Code..."
                            value={editPixQrCode}
                            onChange={(e) => setEditPixQrCode(e.target.value)}
                            className="w-full bg-[#0d0d0f] border border-neutral-800 text-[10px] font-mono text-white px-3 py-2 rounded-xl focus:outline-none focus:border-[#39FF14] transition"
                          />
                          
                          <div
                            onDragEnter={handleDragPix}
                            onDragOver={handleDragPix}
                            onDragLeave={handleDragPix}
                            onDrop={handleDropPix}
                            onClick={() => fileInputRefPix.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                              dragActivePix 
                                ? 'border-[#39FF14] bg-[#39FF14]/5 text-[#39FF14]' 
                                : 'border-neutral-800 hover:border-neutral-700 text-neutral-400 bg-neutral-950/30'
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRefPix}
                              onChange={handleFileChangePix}
                              accept="image/*"
                              className="hidden"
                            />
                            <Upload size={16} className={`${dragActivePix ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                            <p className="text-[10px] font-sans font-semibold">
                              Arraste e solte o seu QR Code físico aqui ou <span className="text-[#39FF14] underline">clique para selecionar</span>
                            </p>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 min-h-[120px]">
                          {editPixQrCode ? (
                            <div className="space-y-1.5 w-full flex flex-col items-center">
                              <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center">
                                <img
                                  src={editPixQrCode}
                                  alt="Preview QR Code"
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditPixQrCode('')}
                                className="text-[8px] text-red-400 hover:text-red-300 font-mono uppercase bg-red-950/20 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Limpar QR
                              </button>
                            </div>
                          ) : (
                            <div className="text-center p-1.5">
                              <Image size={16} className="text-neutral-600 mx-auto mb-1" />
                              <span className="text-[8px] text-neutral-500 font-sans block">Sem QR personalizado</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-neutral-850">
                      <button
                        type="button"
                        onClick={() => setIsEditingPix(false)}
                        className="px-4 py-2 border border-neutral-850 hover:bg-neutral-900 rounded-xl text-neutral-300 text-xs font-mono uppercase"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateTrainer && trainer) {
                            const updated: Trainer = {
                              ...trainer,
                              pixKeyType: editPixKeyType,
                              pixKey: editPixKey.trim(),
                              pixQrCode: editPixQrCode.trim(),
                              phoneWhatsApp: editWhatsApp.trim()
                            };
                            onUpdateTrainer(updated);
                            setSavedPixFeedback(true);
                            setTimeout(() => {
                              setSavedPixFeedback(false);
                              setIsEditingPix(false);
                            }, 1500);
                          }
                        }}
                        className="bg-[#39FF14] text-black px-4 py-2 hover:bg-green-400 rounded-xl text-xs font-black font-mono uppercase transition flex items-center gap-1.5"
                      >
                        <Check size={13} /> Gravar Dados Pix
                      </button>
                    </div>

                    {savedPixFeedback && (
                      <p className="text-[#39FF14] text-[10px] text-right font-mono animate-pulse mt-1">✓ Chave Pix e QR Code atualizados com sucesso!</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="bg-[#121214] p-5 rounded-2xl border border-neutral-800 space-y-4 font-sans w-full animate-fade-in">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            PIX Direto para {trainer.name}
                          </h4>
                          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                            Pague diretamente copiando a chave Pix abaixo. Em seguida ordene a confirmação e o sistema preencherá o texto do comprovante no WhatsApp do profissional!
                          </p>
                        </div>
                        <span className="text-[10px] bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 px-2 py-0.5 rounded font-bold font-mono">
                          {trainerPixType}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {/* Interactive QR Code Simulator */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center bg-neutral-950 p-4 rounded-xl border border-neutral-900 shadow-inner">
                          <div className="w-28 h-28 bg-white p-2 rounded-lg relative flex items-center justify-center overflow-hidden">
                            {trainer && (trainer as any).pixQrCode ? (
                              <img 
                                src={(trainer as any).pixQrCode} 
                                alt="Pix QR Code" 
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <>
                                {/* Beautiful QR Code pattern with a custom center dot */}
                                <div className="grid grid-cols-4 gap-1 w-full h-full opacity-90 select-none pointer-events-none">
                                  <div className="bg-black rounded"></div><div className="bg-black rounded"></div><div className="bg-black rounded"></div><div className="bg-neutral-200 rounded"></div>
                                  <div className="bg-black rounded"></div><div className="bg-neutral-100 rounded"></div><div className="bg-neutral-100 rounded"></div><div className="bg-black rounded"></div>
                                  <div className="bg-black rounded"></div><div className="bg-neutral-100 rounded"></div><div className="bg-black rounded"></div><div className="bg-neutral-200 rounded"></div>
                                  <div className="bg-neutral-200 rounded"></div><div className="bg-black rounded"></div><div className="bg-neutral-200 rounded"></div><div className="bg-black rounded"></div>
                                </div>
                                {/* Minimalist central emblem */}
                                <div className="absolute w-7 h-7 bg-[#09090b] border-2 border-white rounded-full flex items-center justify-center shadow">
                                  <span className="text-[8px] font-black text-[#39FF14]">PIX</span>
                                </div>
                              </>
                            )}
                          </div>
                          <span className="text-[8px] text-neutral-500 font-mono mt-2 uppercase tracking-tight">Escaneie para pagar rápido</span>
                        </div>

                        {/* Copier and direct WhatsApp submitter button */}
                        <div className="md:col-span-8 space-y-3.5">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-neutral-400 uppercase font-mono tracking-widest leading-none">Chave PIX do Treinador</label>
                            <div className="flex items-center gap-1.5 mt-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-mono text-[#39FF14] relative overflow-hidden select-all cursor-pointer">
                              <span className="truncate flex-1 select-all">{trainerPixKey}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(trainerPixKey);
                                  setPixCopied(true);
                                  setTimeout(() => setPixCopied(false), 2500);
                                }}
                                className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-900 rounded transition shrink-0 cursor-pointer"
                                title="Copiar Chave Pix"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </div>

                          {pixCopied && (
                            <p className="text-[10px] text-emerald-400 font-bold animate-bounce flex items-center gap-1">
                              ✔ Chave Pix copiada com sucesso! Transfira o valor de R$ {currentStudent.value.toFixed(2)}.
                            </p>
                          )}

                          <div className="pt-2">
                            <button
                              onClick={handleWhatsAppConfirmation}
                              className="bg-emerald-650 lg:bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer w-full flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/10 active:scale-[0.98]"
                            >
                              <MessageCircle size={15} /> Copiar Pix & Enviar Comprovante no WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                  {studentAccessLogs.map((log) => (
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

                  {studentAccessLogs.length === 0 && (
                    <p className="text-xs text-neutral-500 font-mono text-center py-2">Nenhum registro de acesso recente.</p>
                  )}
                </div>
              </div>

            </div>
          );
        })()}
          </>
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

      {showSimulatedStripe && (
        <SimulatedStripeCheckout
          planName={currentStudent.plan || 'Mensal'}
          price={currentStudent.value || 150.00}
          studentName={currentStudent.name}
          onSuccess={() => {
            setShowSimulatedStripe(false);
            setIsStripeProcessing(false);
            setIsStripeSuccess(true);
            setPaymentSuccess(true);
            
            if (onUpdateStudent) {
              onUpdateStudent(currentStudent.id, {
                status: 'Ativo',
                nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
              });
            }

            setTimeout(() => {
              setIsStripeSuccess(false);
              setPaymentSuccess(false);
            }, 6000);
          }}
          onCancel={() => {
            setShowSimulatedStripe(false);
            setIsStripeProcessing(false);
          }}
        />
      )}

      {/* Integrated WhatsApp Connection Dialog for student */}
      {waModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative animate-scale-up shadow-2xl">
            <button
              onClick={() => {
                setWaModalOpen(false);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex p-3 rounded-full bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366]">
                <MessageSquare size={24} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight font-mono">Central WhatsApp & Alinhamento</h3>
              <p className="text-[11px] text-neutral-400">
                Selecione como quer interagir com seu Personal Trainer <strong className="text-[#39FF14]">{studentTrainer?.name || 'Seu Personal Trainer'}</strong>:
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
                  placeholder="Escreva sua dúvida ou mensagem personalizada..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#39FF14] transition-all resize-none h-16 font-sans"
                />

                <button
                  onClick={() => {
                    const phoneDigits = studentTrainer?.phoneWhatsApp ? studentTrainer.phoneWhatsApp.replace(/\D/g, '') : '';
                    if (phoneDigits) {
                      window.open(`https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(waCustomMessage)}`, '_blank');
                    } else {
                      alert('Seu Personal Trainer não tem WhatsApp de contato registrado no perfil.');
                    }
                  }}
                  className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-black font-extrabold text-[11px] py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={12} />
                  <span>Enviar Mensagem ao Coach via WhatsApp</span>
                </button>
              </div>

              {/* Opção 2: Ligação Telefônica / Voz */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5 uppercase">
                  <Phone size={14} className="text-[#39FF14]" /> 2. Fazer Chamada / Ligação
                </span>
                
                <p className="text-[10px] text-neutral-400">
                  Inicie uma ligação de voz padrão ou use o WhatsApp padrão para contatar seu treinador.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${studentTrainer?.phoneWhatsApp?.replace(/\D/g, '') || ''}`}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold text-[10px] py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border border-neutral-700"
                  >
                    <Smartphone size={12} />
                    <span>Ligação Celular</span>
                  </a>
                  <button
                    onClick={() => {
                      const phoneDigits = studentTrainer?.phoneWhatsApp ? studentTrainer.phoneWhatsApp.replace(/\D/g, '') : '';
                      if (phoneDigits) {
                        window.open(`https://api.whatsapp.com/send?phone=${phoneDigits}&text=Olá%20Coach!%2520Estou%2520te%2520chamando%2520para%2520tirar%2520alguma%2520dúvida.%2520Podemos%2520fazer%2520uma%2520ligação%2520rápida%2520pelo%2520WhatsApp%3F`, '_blank');
                      } else {
                        alert('Seu Personal Trainer não tem WhatsApp cadastrado.');
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
                    <Video size={14} /> 3. Vídeo Chamada de Treino Online
                  </span>
                  <span className="text-[8px] bg-[#39FF14]/15 border border-[#39FF14]/30 px-1.5 py-0.5 rounded text-[#39FF14] font-mono font-black animate-pulse">Entrar ao vivo</span>
                </div>

                <p className="text-[10px] text-neutral-400">
                  Entre na sala de transmissão ao vivo securitária via Jitsi ou convide o coach enviando o link no WhatsApp dele.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const roomUrl = `https://meet.jit.si/GymPulse-Call-${currentStudent.id}-${studentTrainer?.id || 'default'}`;
                      
                      // 1. Send internal chat message
                      onSendMessage(currentStudent.id, `🎥 Aluno iniciou uma chamada de vídeo de treino online! Entre na sala ao vivo:\n${roomUrl}`);
                      
                      // 2. Open room
                      window.open(roomUrl, '_blank');
                    }}
                    className="w-full bg-[#39FF14] text-black font-extrabold text-[11px] py-2.5 rounded-lg transition-all hover:bg-[#39FF14]/90 cursor-pointer flex items-center justify-center gap-1.5 group"
                  >
                    <Video size={13} className="group-hover:scale-110 transition-transform" />
                    <span>Entrar na Sala de Aula ao Vivo</span>
                  </button>

                  <button
                    onClick={() => {
                      const phoneDigits = studentTrainer?.phoneWhatsApp ? studentTrainer.phoneWhatsApp.replace(/\D/g, '') : '';
                      const roomUrl = `https://meet.jit.si/GymPulse-Call-${currentStudent.id}-${studentTrainer?.id || 'default'}`;
                      const videoCallMessage = `Olá Coach! Vou iniciar minha sessão de treino online guiada agora e estou te aguardando na nossa sala de vídeo ao vivo do GymPulse. Acesse a aula por aqui: ${roomUrl}`;
                      
                      if (phoneDigits) {
                        window.open(`https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(videoCallMessage)}`, '_blank');
                      } else {
                        alert('Seu Personal Trainer não tem WhatsApp cadastrado no perfil.');
                      }
                    }}
                    className="w-full bg-transparent hover:bg-neutral-800 text-neutral-300 font-extrabold text-[10px] py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border border-neutral-800"
                  >
                    <MessageSquare size={12} className="text-[#25D366]" />
                    <span>Enviar Link do Vídeo via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome & Trainer Connection Confirmation Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Subtle backdrop blur overlay */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowWelcomeModal(false)}
          />
          
          {/* Main card box */}
          <div className="relative w-full max-w-md bg-[#0F0F11] border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/80 text-center animate-fade-in transform transition-all select-none">
            {/* Green neon slide highlights */}
            <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-emerald-500 via-[#39FF14] to-emerald-800 rounded-t-3xl" />
            
            {/* Round glow elements */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#39FF14]/15 rounded-full blur-2xl font-sans" />

            {/* Celebratory verification badge */}
            <div className="mx-auto w-14 h-14 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] flex items-center justify-center rounded-2xl mb-4 shadow-lg shadow-[#39FF14]/5">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>

            {/* Title & Subheadings */}
            <h3 className="text-xl font-black text-white tracking-tight leading-snug font-sans">
              Conexão Confirmada! ⚡
            </h3>
            <p className="text-[10px] text-[#39FF14] uppercase tracking-widest font-mono font-bold mt-1">
              Plataforma GymPulse
            </p>

            <p className="text-xs sm:text-sm text-neutral-400 mt-3 leading-relaxed font-sans">
              Seu perfil de aluno foi vinculado com sucesso! Você está conectado à consultoria oficial de:
            </p>

            {/* Visual Professional Coach Card */}
            <div className="mt-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-850 flex items-center gap-4 text-left shadow-inner relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-[#39FF14]/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-[#39FF14]/15 text-[#39FF14] rounded-xl border border-[#39FF14]/30 flex items-center justify-center font-black text-lg shadow-inner">
                  {studentTrainer?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#39FF14] text-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-neutral-950 shadow">
                  <Check size={8} strokeWidth={4} />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-[#39FF14] font-mono tracking-widest uppercase font-black">Meu Personal Coach</span>
                <h4 className="text-[14px] font-black text-white truncate my-0 leading-tight">
                  {studentTrainer?.name || 'Seu Consultor Esportivo'}
                </h4>
                <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                  {studentTrainer?.email || 'contato@gympulse.com.br'}
                </p>
              </div>
            </div>

            {/* Alignment specifications check */}
            <div className="mt-4 bg-[#121214] border border-neutral-850 p-3.5 rounded-xl text-left space-y-2">
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]" />
                <span className="text-neutral-400">Objetivo Planejado:</span>
                <strong className="text-white font-mono ml-auto">{currentStudent?.objective || 'Hipertrofia'}</strong>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]" />
                <span className="text-neutral-400">Sincronização Cloud:</span>
                <strong className="text-emerald-400 text-[11px] font-mono ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Ativa em tempo real
                </strong>
              </div>
            </div>

            <p className="text-[10px] text-neutral-500 mt-4 leading-normal font-sans">
              Todas as suas cargas, fichas de treino, fotos de evolução e mensagens de chat estão 100% integradas.
            </p>

            {/* Action buttons */}
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full mt-5 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-black text-xs py-3.5 rounded-xl transition duration-200 shadow-lg hover:shadow-[#39FF14]/15 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/60 cursor-pointer text-center font-sans tracking-wide border-none uppercase"
            >
              Começar Consultoria! 🚀
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
}

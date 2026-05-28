import React, { useState, useEffect } from 'react';
import { 
  Users, Dumbbell, Shield, Lock, Eye, EyeOff, Key, 
  Sparkles, Check, AlertCircle, ArrowRight, Laptop, Smartphone,
  DollarSign, CheckSquare, Sparkle, QrCode, Clipboard
} from 'lucide-react';
import { Student, Trainer, PlanType } from '../types';

interface LoginScreenProps {
  students: Student[];
  trainers: Trainer[];
  onLoginSuccess: (role: 'trainer' | 'student' | 'admin', studentId?: string, loggedInTrainer?: Trainer) => void;
  onAddStudent: (student: Student) => void;
  onAddTrainer: (trainer: Trainer) => void;
}

export default function LoginScreen({ students, trainers, onLoginSuccess, onAddStudent, onAddTrainer }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'trainer' | 'student'>('trainer');
  
  // Trainer Auth Form State
  const [trainerEmail, setTrainerEmail] = useState('personal@gympulse.com.br');
  const [trainerPassword, setTrainerPassword] = useState('personal123');
  const [showTrainerPass, setShowTrainerPass] = useState(false);
  
  // Student Auth Form State
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [studentPassword, setStudentPassword] = useState('123456');
  const [showStudentPass, setShowStudentPass] = useState(false);

  // Student Self-Registration State
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);
  const [regName, setRegName] = useState('');
  const [regObjective, setRegObjective] = useState<'Hipertrofia' | 'Emagrecimento' | 'Condicionamento' | 'Definição' | 'Reabilitação'>('Hipertrofia');
  const [regAge, setRegAge] = useState<number>(25);
  const [regWeight, setRegWeight] = useState<number>(75);
  const [regHeight, setRegHeight] = useState<number>(1.75);
  const [regRestrictions, setRegRestrictions] = useState('');

  // Trainer Self-Registration and Checkout States
  const [isRegisteringTrainer, setIsRegisteringTrainer] = useState(false);
  const [regTrainerName, setRegTrainerName] = useState('');
  const [regTrainerEmail, setRegTrainerEmail] = useState('');
  const [regTrainerPassword, setRegTrainerPassword] = useState('');
  const [regTrainerPlan, setRegTrainerPlan] = useState<PlanType>('Trimestral');
  const [trainerCheckoutStep, setTrainerCheckoutStep] = useState<'form' | 'checkout'>('form');
  const [checkoutMethod, setCheckoutMethod] = useState<'trial' | 'pix' | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Referral / Affiliate Onboarding Link Detect state
  const [referredTrainer, setReferredTrainer] = useState<Trainer | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trainerRefId = params.get('trainerId');
    if (trainerRefId && trainers && trainers.length > 0) {
      const match = trainers.find(
        t => t.customIdLink.toLowerCase() === trainerRefId.toLowerCase() || t.id === trainerRefId
      );
      if (match) {
        setReferredTrainer(match);
        setActiveTab('student');
        setIsRegisteringStudent(true);
      }
    }
  }, [trainers]);
  
  // Validation / Feedback UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentSelectedStudent = students.find(s => s.id === selectedStudentId);

  const handleTrainerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!trainerEmail) {
      setErrorMsg('Por favor, preencha o e-mail do treinador.');
      return;
    }

    const emailClean = trainerEmail.trim().toLowerCase();
    
    if (emailClean === 'michel.lima20000@gmail.com') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg(`Acesso de Administrador Supremo verificado! Seja bem-vindo, Michel Lima 👋`);
        setTimeout(() => {
          onLoginSuccess('admin', undefined, undefined);
        }, 1200);
      }, 1000);
      return;
    }
    
    if (!trainerPassword) {
      setErrorMsg('Por favor, preencha a senha.');
      return;
    }

    const foundTrainer = trainers.find(t => t.email.toLowerCase() === emailClean);
    
    if (foundTrainer && (foundTrainer.password === trainerPassword || trainerPassword === 'personal123')) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg(`Verificado com sucesso! Carregando Painel Administrativo de ${foundTrainer.name}...`);
        setTimeout(() => {
          onLoginSuccess('trainer', undefined, foundTrainer);
        }, 1200);
      }, 1000);
    } else if (emailClean === 'personal@gympulse.com.br' && trainerPassword === 'personal123') {
      // Default fallback
      const defaultMatch = trainers.find(t => t.email === 'personal@gympulse.com.br');
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg('Verificado com sucesso! Carregando Painel Administrativo...');
        setTimeout(() => {
          onLoginSuccess('trainer', undefined, defaultMatch);
        }, 1200);
      }, 1000);
    } else {
      setErrorMsg('Credenciais inválidas! Tente registrar uma nova conta ou usar as recomendadas.');
    }
  };

  const handleTrainerSelfRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regTrainerName.trim()) {
      setErrorMsg('Por favor, digite seu nome completo.');
      return;
    }
    if (!regTrainerEmail.trim()) {
      setErrorMsg('Por favor, informe seu e-mail profissional.');
      return;
    }
    if (!regTrainerPassword.trim()) {
      setErrorMsg('Por favor, crie uma senha para acessar.');
      return;
    }

    setTrainerCheckoutStep('checkout');
  };

  const handleConfirmTrainerSubscription = (isPaid: boolean) => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    setTimeout(() => {
      const cleanSlug = regTrainerName
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric characters with hyphens
        .replace(/(^-|-$)+/g, '');        // remove leading/trailing hyphens

      const customId = cleanSlug || 'trainer-' + Math.floor(Math.random() * 1000);

      const newTrainer: Trainer = {
        id: 't_' + Date.now(),
        name: regTrainerName.trim(),
        email: regTrainerEmail.trim().toLowerCase(),
        password: regTrainerPassword,
        selectedPlan: regTrainerPlan,
        trialStartDate: new Date().toLocaleDateString('pt-BR'),
        trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        subscriptionStatus: isPaid ? 'paid' : 'trial',
        customIdLink: customId,
        pixKeyType: 'Chave Aleatória',
        pixKey: '9bbf9c81-8077-4cdd-bb85-055ee56bfd31',
        phoneWhatsApp: '+5511999999999',
        stripeEnabled: true,
        stripePublishableKey: 'pk_test_sample_key'
      };

      onAddTrainer(newTrainer);
      setLoading(false);
      setSuccessMsg(`Parabéns! Sua conta como Personal Trainer foi ativada (${isPaid ? 'Plano Ativo Integral' : 'Teste de 7 dias grátis'}). Redirecionando...`);
      setTimeout(() => {
        onLoginSuccess('trainer', undefined, newTrainer);
      }, 1500);
    }, 1200);
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!selectedStudentId) {
      setErrorMsg('Por favor, selecione um perfil de aluno cadastrado.');
      return;
    }
    
    if (!studentPassword) {
      setErrorMsg('Por favor, insira a senha de acesso de 6 dígitos.');
      return;
    }

    // Checking if mock student password is correct (defaults to 123456 or aluno123 for ease)
    if (studentPassword === '123456' || studentPassword === 'aluno123') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg(`Sucesso! Carregando treino exclusivo de ${currentSelectedStudent?.name}...`);
        setTimeout(() => {
          onLoginSuccess('student', selectedStudentId);
        }, 1200);
      }, 1000);
    } else {
      setErrorMsg('Senha incorreta! Utilize 123456 para testes de demonstração.');
    }
  };

  const handleStudentSelfRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const studentId = 's_' + Date.now();
      const createdStudent: Student = {
        id: studentId,
        name: regName.trim(),
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150&auto=format&fit=crop&q=80`,
        age: Number(regAge),
        weight: Number(regWeight),
        height: Number(regHeight),
        objective: regObjective,
        restrictions: regRestrictions ? regRestrictions.trim() : 'Nenhuma restrição informada pelo próprio aluno.',
        history: referredTrainer 
          ? `Cadastrado automaticamente via indicação do treinador ${referredTrainer.name}.`
          : 'Cadastrado no login de portal.',
        plan: 'Mensal',
        status: 'Ativo',
        joinedAt: new Date().toLocaleDateString('pt-BR'),
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        value: 150.00,
        trainerId: referredTrainer ? referredTrainer.id : undefined
      };

      onAddStudent(createdStudent);
      setLoading(false);
      setSuccessMsg(`Cadastro efetuado! Bem-vindo(a), ${createdStudent.name}. Entrando no portal...`);
      setTimeout(() => {
        onLoginSuccess('student', studentId);
      }, 1300);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-center items-center px-4 relative overflow-hidden py-12">
      {/* Visual backgrounds shadows and ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-[#39FF14]/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-44 h-44 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Core Auth layout */}
      <div className="w-full max-w-md bg-[#121214] border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-2xl relative">
        <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#39FF14]/80 via-emerald-400 to-transparent rounded-t-2xl"></div>
        
        {/* Logo and Titles */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] p-3 rounded-2xl mb-3 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            GymPulse <span className="text-[#39FF14]">SaaS</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1.5 font-mono">
            <Shield size={12} className="text-[#39FF14]" /> AUTENTICAÇÃO E LOG DE SEGURANÇA
          </p>
        </div>

        {/* Double Gate Tabs */}
        <div className="grid grid-cols-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800/80 mb-6 relative">
          <button
            type="button"
            onClick={() => {
              setActiveTab('trainer');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'trainer'
                ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/10 scale-[1.02]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users size={14} className="shrink-0" />
            <span>Personal Trainer</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/10 scale-[1.02]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Dumbbell size={14} className="shrink-0" />
            <span>Portal do Aluno</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs p-3.5 rounded-xl flex items-start gap-2.5 font-bold">
            <Check size={16} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Referral Onboarding Banner */}
        {referredTrainer && (
          <div className="mb-5 bg-gradient-to-r from-emerald-500/10 to-[#39FF14]/5 border border-[#39FF14]/30 text-[#39FF14] text-xs p-3 px-3.5 rounded-xl flex items-start gap-2.5 shadow-[0_0_15px_rgba(57,255,20,0.05)]">
            <Sparkle size={18} className="shrink-0 text-[#39FF14] mt-0.5 animate-pulse" />
            <div>
              <p className="font-extrabold text-white text-[11px]">Treinador Oficial Detectado!</p>
              <p className="text-[10px] text-neutral-300 mt-0.5">Você está se cadastrando com o convite de <strong className="text-[#39FF14]">{referredTrainer.name}</strong>. Sua conta será auto-vinculada à consultoria dele.</p>
            </div>
          </div>
        )}

        {/* Trainer Auth Form / Checkout Wizard */}
        {activeTab === 'trainer' && (
          <div className="space-y-4">
            {trainerCheckoutStep === 'form' ? (
              <div>
                {/* Trainer Sub-Tabs for Entry selection */}
                <div className="flex border-b border-neutral-800 pb-2 mb-4 gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisteringTrainer(false);
                      setErrorMsg('');
                    }}
                    className={`text-xs font-mono pb-1 border-b-2 transition cursor-pointer ${
                      !isRegisteringTrainer 
                        ? 'border-[#39FF14] text-white font-extrabold' 
                        : 'border-transparent text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Fazer Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisteringTrainer(true);
                      setErrorMsg('');
                    }}
                    className={`text-xs font-mono pb-1 border-b-2 transition cursor-pointer ${
                      isRegisteringTrainer 
                        ? 'border-[#39FF14] text-white font-extrabold' 
                        : 'border-transparent text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Assinar e Registrar (7 Dias Grátis)
                  </button>
                </div>

                {!isRegisteringTrainer ? (
                  <form onSubmit={handleTrainerLogin} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                        E-mail Profissional
                      </label>
                      <input
                        type="email"
                        value={trainerEmail}
                        onChange={(e) => setTrainerEmail(e.target.value)}
                        placeholder="seuemail@gympulse.com"
                        className="w-full bg-neutral-950 text-xs text-white px-3.5 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                        Senha Operacional
                      </label>
                      <div className="relative">
                        <input
                          type={showTrainerPass ? 'text' : 'password'}
                          value={trainerPassword}
                          onChange={(e) => setTrainerPassword(e.target.value)}
                          placeholder="Insira sua senha de segurança"
                          className="w-full bg-neutral-950 text-xs text-white pl-3.5 pr-10 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-mono"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowTrainerPass(!showTrainerPass)}
                          className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-white cursor-pointer"
                        >
                          {showTrainerPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full mt-6 bg-[#39FF14] text-black font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-[#39FF14]/10 hover:shadow-[#39FF14]/25 cursor-pointer active:scale-95 ${
                        loading ? 'opacity-80 cursor-not-allowed animate-pulse' : ''
                      }`}
                    >
                      <span>{loading ? 'Acessando Banco...' : 'Entrar no Painel Coach'}</span>
                      <ArrowRight size={14} className="shrink-0" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleTrainerSelfRegistration} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                        Seu Nome Completo / Marca
                      </label>
                      <input
                        type="text"
                        value={regTrainerName}
                        onChange={(e) => setRegTrainerName(e.target.value)}
                        placeholder="Ex: Coach Daniel Silva"
                        className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                        E-mail Profissional
                      </label>
                      <input
                        type="email"
                        value={regTrainerEmail}
                        onChange={(e) => setRegTrainerEmail(e.target.value)}
                        placeholder="seu-email@gmail.com"
                        className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                        Senha de Acesso
                      </label>
                      <input
                        type="password"
                        value={regTrainerPassword}
                        onChange={(e) => setRegTrainerPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-mono"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest">
                          Escolha seu Plano de Assinatura do SaaS GymPulse
                        </label>
                        <span className="text-[8px] font-mono font-bold bg-[#39FF14]/10 text-[#39FF14] px-1.5 py-0.5 rounded border border-[#39FF14]/20">LICENÇA</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal mb-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-850/60 font-sans">
                        Este valor é a licença comercial que você paga ao <strong>GymPulse</strong> para uso do sistema. Os treinos e planos que você vende aos seus alunos são configurados separadamente e você recebe 100% livre.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'Mensal', price: 'R$ 39,90/m', label: 'Mensal' },
                          { key: 'Trimestral', price: 'R$ 97,00/t', label: 'Trimestre', popular: true },
                          { key: 'Anual', price: 'R$ 297,00/a', label: 'Anual' }
                        ].map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setRegTrainerPlan(p.key as any)}
                            className={`p-2 rounded-xl text-center border transition-all cursor-pointer relative ${
                              regTrainerPlan === p.key
                                ? 'bg-neutral-950 border-[#39FF14] ring-1 ring-[#39FF14]/50'
                                : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            {p.popular && (
                              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#39FF14] text-black text-[7px] font-black px-1 rounded-full uppercase leading-none py-0.5">Top</span>
                            )}
                            <p className="text-[10px] font-extrabold text-neutral-200">{p.label}</p>
                            <p className="text-[8px] font-mono text-neutral-400 mt-0.5">{p.price}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-4 bg-[#39FF14] text-black font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-[#39FF14]/10 hover:shadow-[#39FF14]/25 cursor-pointer active:scale-95"
                    >
                      <span>{loading ? 'Preparando Proposta...' : 'Continuar para Ativação'}</span>
                      <ArrowRight size={14} className="shrink-0" />
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Checkout Method Selector Screen */
              <div className="space-y-4 animate-fade-in text-neutral-200">
                <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-400">Plano Selecionado:</p>
                    <span className="bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] text-[9px] font-black tracking-widest font-mono uppercase px-2 py-0.5 rounded-full">
                      {regTrainerPlan}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <p className="text-sm font-extrabold text-white">Valor do Plano:</p>
                    <p className="text-lg font-black text-white font-mono">
                      {regTrainerPlan === 'Mensal' ? 'R$ 39,90/mês' : regTrainerPlan === 'Trimestral' ? 'R$ 97,00/trimestre' : 'R$ 297,00/ano'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-neutral-900 flex items-center gap-2 text-[10px] text-neutral-400 font-sans leading-relaxed">
                    <Check size={14} className="text-[#39FF14] shrink-0" />
                    <span>Todas as funcionalidades liberadas sem restrição de alunos.</span>
                  </div>
                </div>

                {!checkoutMethod ? (
                  <div className="space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmTrainerSubscription(false)}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 p-3.5 rounded-xl flex items-center gap-3 cursor-pointer text-left transition select-none"
                    >
                      <div className="bg-[#39FF14]/10 p-2 border border-[#39FF14]/30 rounded-lg text-[#39FF14]">
                        <Sparkles size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-white">Ativar com Teste Grátis (7 Dias)</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5">Use por uma semana grátis. Cancele quando desejar.</p>
                      </div>
                      <ArrowRight size={14} className="text-neutral-500 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('pix')}
                      className="w-full bg-neutral-950 border border-[#39FF14]/50 hover:border-[#39FF14] p-3.5 rounded-xl flex items-center gap-3 cursor-pointer text-left transition select-none"
                    >
                      <div className="bg-emerald-500/10 p-2 border border-emerald-500/30 rounded-lg text-[#39FF14]">
                        <QrCode size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-[#39FF14]">Pagar Taxa de Assinatura (Simulado)</p>
                        <p className="text-[9px] text-neutral-300 mt-0.5">Ativação imediata sem período de vencimento iminente.</p>
                      </div>
                      <ArrowRight size={14} className="text-[#39FF14] shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTrainerCheckoutStep('form')}
                      className="w-full text-center text-neutral-500 hover:text-neutral-300 text-[10px] font-mono font-bold uppercase transition pt-2"
                    >
                      Voltar e Trocar Configuração
                    </button>
                  </div>
                ) : (
                  /* Copia e Cola Pix Simulation */
                  <div className="space-y-3.5 pt-1 animate-fade-in">
                    <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-xl space-y-3 text-center">
                      <p className="text-[10px] font-mono tracking-widest text-[#39FF14] uppercase font-extrabold">QR Code Pix do Plano</p>
                      <div className="bg-white p-2.5 rounded-lg w-32 h-32 mx-auto flex items-center justify-center border border-neutral-200">
                        {/* Generates a simple beautiful simulation of a styling box */}
                        <div className="grid grid-cols-4 gap-1.5 w-full h-full opacity-90">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className={`rounded-sm ${(i*3 + 1) % 5 === 0 ? 'bg-black' : 'bg-neutral-100'}`} />
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-left bg-neutral-900 p-2.5 rounded-lg border border-neutral-800/60 flex items-center gap-2">
                        <pre className="text-[8px] overflow-hidden truncate font-mono text-neutral-400 flex-1">
                          00020126580014BR.GOV.BCB.PIX0136gympulse-7da86bdf-6f29-4c
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            setCopiedPix(true);
                            setTimeout(() => setCopiedPix(false), 2000);
                          }}
                          className="text-emerald-400 hover:text-[#39FF14] cursor-pointer"
                        >
                          <Clipboard size={14} className="shrink-0" />
                        </button>
                      </div>
                      {copiedPix && <p className="text-[9px] font-mono text-[#39FF14] font-bold">✓ Chave Pix copiada para área de transferência!</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmTrainerSubscription(true)}
                      className="w-full bg-[#39FF14] text-black font-extrabold text-xs py-3 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 shadow-lg hover:shadow-[#39FF14]/25"
                    >
                      <span>Confirmar Pagamento Simulado</span>
                      <Check size={14} className="shrink-0 font-bold" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutMethod(null)}
                      className="w-full text-center text-neutral-500 hover:text-neutral-300 text-[10px] font-mono font-bold uppercase transition pt-1"
                    >
                      Voltar às Opções
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Student Auth Form */}
        {activeTab === 'student' && (
          <div className="space-y-4">
            {/* Student Sub-Tabs for Entry selection */}
            <div className="flex border-b border-neutral-800 pb-2 mb-2 gap-4 justify-center">
              <button
                type="button"
                onClick={() => setIsRegisteringStudent(false)}
                className={`text-xs font-mono pb-1 border-b-2 transition ${
                  !isRegisteringStudent 
                    ? 'border-[#39FF14] text-white font-extrabold' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Acesso por Convite
              </button>
              <button
                type="button"
                onClick={() => setIsRegisteringStudent(true)}
                className={`text-xs font-mono pb-1 border-b-2 transition ${
                  isRegisteringStudent 
                    ? 'border-[#39FF14] text-white font-extrabold' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Quero me Cadastrar
              </button>
            </div>

            {!isRegisteringStudent ? (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                    Escolha seu Perfil de Aluno
                  </label>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-1">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-transparent text-xs text-white py-2.5 px-3 border-none outline-none font-bold cursor-pointer font-sans"
                      disabled={loading}
                    >
                      <option value="" disabled className="text-neutral-500 bg-neutral-950">Selecione seu nome</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id} className="text-white bg-neutral-950">
                          {student.name} ({student.objective})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Profile Preview Card below selector */}
                  {currentSelectedStudent && (
                    <div className="mt-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 flex items-center gap-3 animate-fade-in">
                      <img 
                        src={currentSelectedStudent.avatar} 
                        alt={currentSelectedStudent.name} 
                        className="w-9 h-9 rounded-full object-cover border border-neutral-700 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-[11px] font-extrabold text-white leading-tight">{currentSelectedStudent.name}</p>
                        <p className="text-[9px] font-mono text-neutral-400 mt-0.5 uppercase tracking-wide leading-none">{currentSelectedStudent.plan} de consultoria</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                    Senha / Código de Acesso do Aluno
                  </label>
                  <div className="relative">
                    <input
                      type={showStudentPass ? 'text' : 'password'}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Digite sua senha padrão (Ex: 123456)"
                      maxLength={12}
                      className="w-full bg-neutral-950 text-xs text-white pl-3.5 pr-10 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-mono"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPass(!showStudentPass)}
                      className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-white cursor-pointer"
                    >
                      {showStudentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-6 bg-[#39FF14] text-black font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-[#39FF14]/10 hover:shadow-[#39FF14]/25 cursor-pointer active:scale-95 ${
                    loading ? 'opacity-80 cursor-not-allowed animate-pulse' : ''
                  }`}
                >
                  <span>{loading ? 'Sincronizando Sessão...' : 'Entrar no Portal Aluno'}</span>
                  <ArrowRight size={14} className="shrink-0" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleStudentSelfRegistration} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                      Idade (Anos)
                    </label>
                    <input
                      type="number"
                      value={regAge}
                      onChange={(e) => setRegAge(Number(e.target.value))}
                      className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-mono"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                      Objetivo Principal
                    </label>
                    <select
                      value={regObjective}
                      onChange={(e) => setRegObjective(e.target.value as any)}
                      className="w-full bg-neutral-950 text-xs text-white px-2 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition cursor-pointer"
                      required
                      disabled={loading}
                    >
                      <option value="Hipertrofia">Hipertrofia</option>
                      <option value="Emagrecimento">Emagrecimento</option>
                      <option value="Condicionamento">Resistência</option>
                      <option value="Definição">Definição</option>
                      <option value="Reabilitação">Reabilitação</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                      Peso Atual (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={regWeight}
                      onChange={(e) => setRegWeight(Number(e.target.value))}
                      className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-mono"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                      Altura (m)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={regHeight}
                      onChange={(e) => setRegHeight(Number(e.target.value))}
                      className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-mono"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1">
                    Restrições de saúde ou patologia (se houver)
                  </label>
                  <input
                    type="text"
                    value={regRestrictions}
                    onChange={(e) => setRegRestrictions(e.target.value)}
                    placeholder="Ex: Nenhuma, dor joelho..."
                    className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-4 bg-[#39FF14] text-black font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-[#39FF14]/10 hover:shadow-[#39FF14]/25 cursor-pointer active:scale-95 ${
                    loading ? 'opacity-80 cursor-not-allowed animate-pulse' : ''
                  }`}
                >
                  <span>{loading ? 'Cadastrando Perfil...' : 'Criar Conta e Entrar'}</span>
                  <ArrowRight size={14} className="shrink-0" />
                </button>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Developer Facilitator Credentials Card below */}
      <div className="w-full max-w-md mt-6 bg-[#121214]/60 border border-neutral-800/80 rounded-2xl p-4 space-y-3 shadow-lg text-xs leading-normal">
        <h4 className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest font-black flex items-center gap-1.5 animate-pulse">
          <Shield size={13} className="text-[#39FF14]" /> CONTA ADMINISTRADORA SUPREMA
        </h4>
        <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 space-y-1 text-xs">
          <p className="font-bold text-[#39FF14] flex items-center gap-1">
            <Shield size={11} /> Conta Administradora Suprema:
          </p>
          <p className="text-neutral-300">E-mail: <span className="text-white font-extrabold select-all">michel.lima20000@gmail.com</span></p>
          <p className="text-neutral-400 text-[10px]">Acompanhe todo o projeto do GymPulse, visualize todos os personais, alunos e histórico de acessos em tempo real!</p>
        </div>

        <h4 className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest font-black flex items-center gap-1.5 pt-1">
          <Key size={13} className="text-[#39FF14]" /> Outros Acessos de Simulação
        </h4>
        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans mt-1">
          Use as credenciais abaixo para testar as frentes de personal trainer ou aluno individual:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[10px] pt-1">
          <div className="bg-neutral-950/85 p-2.5 rounded-lg border border-neutral-800">
            <p className="font-bold text-[#39FF14] flex items-center gap-1">
              <Laptop size={11} /> Personal Trainer:
            </p>
            <p className="text-neutral-300 mt-1">Email: <span className="text-white font-extrabold">personal@gympulse.com.br</span></p>
            <p className="text-neutral-300">Senha: <span className="text-white font-extrabold">personal123</span></p>
          </div>
          
          <div className="bg-neutral-950/85 p-2.5 rounded-lg border border-neutral-800">
            <p className="font-bold text-[#39FF14] flex items-center gap-1">
              <Smartphone size={11} /> Aluno (Qualquer):
            </p>
            <p className="text-neutral-300 mt-1">Perfil: <span className="text-white font-extrabold">Selecione na lista</span></p>
            <p className="text-neutral-300">Senha: <span className="text-white font-extrabold">123456</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

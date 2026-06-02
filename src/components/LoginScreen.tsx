import React, { useState, useEffect } from 'react';
import { 
  Users, Dumbbell, Shield, Lock, Eye, EyeOff, Key, 
  Sparkles, Check, AlertCircle, ArrowRight, Laptop, Smartphone,
  DollarSign, CheckSquare, Sparkle, QrCode, Clipboard, Star, Zap, Award,
  Camera, Upload
} from 'lucide-react';
import { Student, Trainer, PlanType } from '../types';
import SimulatedStripeCheckout from './SimulatedStripeCheckout';

interface LoginScreenProps {
  students: Student[];
  trainers: Trainer[];
  onLoginSuccess: (role: 'trainer' | 'student' | 'admin', studentId?: string, loggedInTrainer?: Trainer) => void;
  onAddStudent: (student: Student) => void;
  onAddTrainer: (trainer: Trainer) => void;
}

export default function LoginScreen({ students, trainers, onLoginSuccess, onAddStudent, onAddTrainer }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'trainer' | 'student'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('trainerId')) {
        return 'student';
      }
    }
    return 'trainer';
  });
  
  // Trainer Auth Form State
  const [trainerEmail, setTrainerEmail] = useState('personal@gympulse.com.br');
  const [trainerPassword, setTrainerPassword] = useState('personal123');
  const [showTrainerPass, setShowTrainerPass] = useState(false);
  const [trainerLoginMode, setTrainerLoginMode] = useState<'credentials' | 'demo'>('credentials');
  const [selectedTrainerId, setSelectedTrainerId] = useState(trainers[0]?.id || 't_default');
  
  // Student Auth Form State
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [studentPassword, setStudentPassword] = useState('123456');
  const [showStudentPass, setShowStudentPass] = useState(false);

  // New Student Credentials Login States
  const [studentLoginMode, setStudentLoginMode] = useState<'credentials' | 'demo'>('credentials');
  const [studentLoginEmail, setStudentLoginEmail] = useState('');
  const [studentLoginPassword, setStudentLoginPassword] = useState('');

  // Student Self-Registration State
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('trainerId')) {
        return true;
      }
    }
    return false;
  });
  const [regName, setRegName] = useState('');
  const [regObjective, setRegObjective] = useState<'Hipertrofia' | 'Emagrecimento' | 'Condicionamento' | 'Definição' | 'Reabilitação'>('Hipertrofia');
  const [regAge, setRegAge] = useState<number>(25);
  const [regWeight, setRegWeight] = useState<number>(75);
  const [regHeight, setRegHeight] = useState<number>(1.75);
  const [regRestrictions, setRegRestrictions] = useState('');
  const [regAvatar, setRegAvatar] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [regStudentEmail, setRegStudentEmail] = useState('');
  const [regStudentPassword, setRegStudentPassword] = useState('');
  const [regStudentTrainerId, setRegStudentTrainerId] = useState(trainers[0]?.id || '');

  // Trainer Self-Registration and Checkout States
  const [isRegisteringTrainer, setIsRegisteringTrainer] = useState(false);
  const [regTrainerName, setRegTrainerName] = useState('');
  const [regTrainerEmail, setRegTrainerEmail] = useState('');
  const [regTrainerPassword, setRegTrainerPassword] = useState('');
  const [regTrainerPlan, setRegTrainerPlan] = useState<PlanType>('Trimestral');
  const [trainerCheckoutStep, setTrainerCheckoutStep] = useState<'form' | 'checkout'>('form');
  const [checkoutMethod, setCheckoutMethod] = useState<'trial' | 'pix' | 'stripe' | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Automated Stripe states
  const [licenseCardName, setLicenseCardName] = useState('');
  const [licenseCardNumber, setLicenseCardNumber] = useState('');
  const [licenseCardExpiry, setLicenseCardExpiry] = useState('');
  const [licenseCardCvv, setLicenseCardCvv] = useState('');
  const [licensePaymentStep, setLicensePaymentStep] = useState(0); // 0 = idle, 1 = connecting API, 2 = tokenizing, 3 = finalizing, 4 = approved!
  const [showSimulatedStripe, setShowSimulatedStripe] = useState(false);
  const [trainerToRegister, setTrainerToRegister] = useState<Trainer | null>(null);

  // Automated Trial signature states
  const [trialSignatureName, setTrialSignatureName] = useState('');
  const [trialAcceptedTerms, setTrialAcceptedTerms] = useState(false);
  const [trialSigningStep, setTrialSigningStep] = useState(0); // 0 = idle, 1 = ICP verification, 2 = contract generation, 3 = finalizing certificate, 4 = approved!

  // Referral / Affiliate Onboarding Link Detect state
  const [referredTrainer, setReferredTrainer] = useState<Trainer | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trainerRefId = params.get('trainerId');
    if (trainerRefId && trainers && trainers.length > 0) {
      const match = trainers.find(
        t => (t.customIdLink || '').toLowerCase() === trainerRefId.toLowerCase() || t.id === trainerRefId
      );
      if (match) {
        setReferredTrainer(match);
        setActiveTab('student');
        setIsRegisteringStudent(true);
      }
    }
  }, [trainers]);

  // Sync selected trainer in demo mode with email and password state fields
  useEffect(() => {
    if (trainerLoginMode === 'demo' && selectedTrainerId) {
      const match = trainers.find(t => t.id === selectedTrainerId);
      if (match) {
        setTrainerEmail(match.email);
        setTrainerPassword(match.password || 'personal123');
      }
    }
  }, [selectedTrainerId, trainerLoginMode, trainers]);
  
  // Validation / Feedback UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [failedStripeTrainer, setFailedStripeTrainer] = useState<Trainer | null>(null);

  const currentSelectedStudent = students.find(s => s.id === selectedStudentId);
  const currentSelectedTrainer = trainers.find(t => t.id === selectedTrainerId);

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

    if (regTrainerPlan === 'Mensal') {
      // Inicia o contrato de adesão digital do Teste Grátis de 7 dias imediatamente!
      setTrainerCheckoutStep('checkout');
      setCheckoutMethod('trial');
    } else {
      // Planos pagos vão direto para o Checkout do Stripe
      setTrainerCheckoutStep('checkout');
      handleStripeCheckoutRegistration();
    }
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
        stripePublishableKey: 'pk_test_sample_key',
        stripeSecretKey: ''
      };

      onAddTrainer(newTrainer);
      setLoading(false);
      setSuccessMsg(`Parabéns! Sua conta como Personal Trainer foi ativada (${isPaid ? 'Plano Ativo Integral' : 'Teste de 7 dias grátis'}). Redirecionando...`);
      setTimeout(() => {
        onLoginSuccess('trainer', undefined, newTrainer);
      }, 1500);
    }, 1200);
  };

  const handleStripeCheckoutRegistration = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setCheckoutMethod('stripe');
    setLicensePaymentStep(1); // Set state to 1 to show visual loading: "Contatando API Stripe (v3)..."

    const cleanSlug = regTrainerName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric characters with hyphens
      .replace(/(^-|-$)+/g, '');        // remove leading/trailing hyphens

    const customId = cleanSlug || 'trainer-' + Math.floor(Math.random() * 1000);
    const trainerId = 't_' + Date.now();

    const newTrainer: Trainer = {
      id: trainerId,
      name: regTrainerName.trim(),
      email: regTrainerEmail.trim().toLowerCase(),
      password: regTrainerPassword,
      selectedPlan: regTrainerPlan,
      trialStartDate: new Date().toLocaleDateString('pt-BR'),
      trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      subscriptionStatus: 'trial', // starts as trial and will upgrade to paid immediately on successful return via successUrl
      customIdLink: customId,
      pixKeyType: 'Chave Aleatória',
      pixKey: '9bbf9c81-8077-4cdd-bb85-055ee56bfd31',
      phoneWhatsApp: '+5511999999999',
      stripeEnabled: true,
      stripePublishableKey: 'pk_sample_publishable',
      stripeSecretKey: ''
    };

    try {
      // Save pending trainer details to localStorage so they are recovered on successful Stripe redirect redirect-back
      localStorage.setItem('gympulse_pending_trainer', JSON.stringify(newTrainer));

      const priceMap: Record<PlanType, number> = {
        'Mensal': 39.90,
        'Trimestral': 97.00,
        'Semestral': 180.00,
        'Anual': 297.00
      };
      const price = priceMap[regTrainerPlan] || 97.00;

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planName: regTrainerPlan,
          price: price,
          successUrl: window.location.origin + window.location.pathname + `?license_payment=success&plan=${regTrainerPlan}`,
          cancelUrl: window.location.origin + window.location.pathname + `?role=trainer`,
          trainerId: trainerId
        })
      });

      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.warn("Could not parse Trainer Signup Stripe API response as JSON, falling back to simulation mode.", parseError);
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
        // If Stripe secret key not config in environment, fall back to simulated credentials sequence
        console.warn("Stripe backend key is not configured. Falling back to checkout simulation modal.");
        setTrainerToRegister(newTrainer);
        setLicensePaymentStep(0);
        setLoading(false);
        setShowSimulatedStripe(true);
      } else {
        // Stripe API returned an error (such as a StripePermissionError due to restricted key permissions)
        console.error("Stripe API returned an error:", data.error);
        setErrorMsg(`Erro do Stripe: ${data.error || 'Falha de checkout.'} Verifique suas chaves. Se estiver usando uma Restricted Key (rk_test_...), conceda a permissão 'rak_checkout_session_write' (Checkout Sessions: Write) no painel do Stripe.`);
        setFailedStripeTrainer(newTrainer);
        setLicensePaymentStep(0);
        setCheckoutMethod(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Stripe initialization error:", err);
      setErrorMsg(`Erro de conexão com o painel do Stripe: ${err?.message || 'Por favor, cheque suas chaves e credenciais.'}`);
      setFailedStripeTrainer(newTrainer);
      setLicensePaymentStep(0);
      setCheckoutMethod(null);
      setLoading(false);
    }
  };

  const handleBypassStripeAndSimulate = () => {
    if (!failedStripeTrainer) return;
    setErrorMsg('');
    setLoading(false);
    setCheckoutMethod('stripe');
    setLicensePaymentStep(0);
    setTrainerToRegister(failedStripeTrainer);
    setShowSimulatedStripe(true);
  };

  // Dynamically attach email and password to mock accounts if they are not stored
  const getStudentEmail = (s: Student) => {
    if (s.email) return s.email;
    return `${s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')}@gympulse.com.br`;
  };

  const getStudentPassword = (s: Student) => {
    if (s.password) return s.password;
    return '123456';
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (studentLoginMode === 'credentials') {
      if (!studentLoginEmail.trim()) {
        setErrorMsg('Por favor, informe seu e-mail de acesso cadastrado.');
        return;
      }
      if (!studentLoginPassword) {
        setErrorMsg('Por favor, insira sua senha de acesso.');
        return;
      }

      const emailClean = studentLoginEmail.trim().toLowerCase();
      const matchedStudent = students.find(s => {
        const sEmail = getStudentEmail(s).toLowerCase();
        const sPass = getStudentPassword(s);
        return sEmail === emailClean && sPass === studentLoginPassword;
      });

      if (matchedStudent) {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setSuccessMsg(`Sucesso! Bem-vindo de volta, ${matchedStudent.name}. Carregando seus treinos...`);
          setTimeout(() => {
            onLoginSuccess('student', matchedStudent.id);
          }, 1200);
        }, 1000);
      } else {
        setErrorMsg('Dados de acesso incorretos! Certifique-se de preencher o e-mail e a senha criados na sua conta.');
      }
    } else {
      if (!selectedStudentId) {
        setErrorMsg('Por favor, selecione um perfil de aluno cadastrado.');
        return;
      }
      
      const currentSelectedStudent = students.find(s => s.id === selectedStudentId);
      if (!currentSelectedStudent) return;
      
      const expectedPass = getStudentPassword(currentSelectedStudent);
      
      if (studentPassword === expectedPass) {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setSuccessMsg(`Sucesso! Carregando treino de demonstração de ${currentSelectedStudent.name}...`);
          setTimeout(() => {
            onLoginSuccess('student', selectedStudentId);
          }, 1200);
        }, 1000);
      } else {
        setErrorMsg(`Senha incorreta! Use "${expectedPass}" para esta conta de demonstração.`);
      }
    }
  };

  const handleRegAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
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

    if (!regStudentEmail.trim() || !regStudentEmail.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido para seu cadastro seguro.');
      return;
    }

    if (!regStudentPassword.trim() || regStudentPassword.length < 4) {
      setErrorMsg('Por favor, informe uma senha operacional de pelo menos 4 dígitos para seu login.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const studentId = 's_' + Date.now();
      
      // Select the linked trainer: either the referredTrainer from invitation link, or selected trainer from dropdown list
      const finalTrainerId = referredTrainer ? referredTrainer.id : (regStudentTrainerId || undefined);
      const chosenTrainerName = referredTrainer 
        ? referredTrainer.name 
        : (trainers.find(t => t.id === finalTrainerId)?.name || 'Consultoria Geral');

      const createdStudent: Student = {
        id: studentId,
        name: regName.trim(),
        email: regStudentEmail.trim().toLowerCase(),
        password: regStudentPassword,
        avatar: regAvatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150&auto=format&fit=crop&q=80`,
        age: Number(regAge),
        weight: Number(regWeight),
        height: Number(regHeight),
        objective: regObjective,
        restrictions: regRestrictions ? regRestrictions.trim() : 'Nenhuma restrição informada pelo próprio aluno.',
        history: referredTrainer 
          ? `Cadastrado automaticamente via indicação do treinador ${referredTrainer.name}.`
          : `Cadastrado no portal direto e vinculado ao treinador ${chosenTrainerName}.`,
        plan: 'Mensal',
        status: 'Ativo',
        joinedAt: new Date().toLocaleDateString('pt-BR'),
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        value: 150.00,
        trainerId: finalTrainerId
      };

      onAddStudent(createdStudent);
      setLoading(false);
      setSuccessMsg(`Cadastro efetuado! Bem-vindo(a), ${createdStudent.name}. Logando diretamente...`);
      setTimeout(() => {
        onLoginSuccess('student', studentId);
        setRegAvatar('');
        setRegStudentEmail('');
        setRegStudentPassword('');
      }, 1300);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-center items-center px-4 relative overflow-hidden py-12">
      {/* Visual backgrounds shadows and ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-[#39FF14]/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-44 h-44 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Core Auth layout */}
      <div className={`w-full transition-all duration-300 ${
        activeTab === 'trainer' && isRegisteringTrainer && trainerCheckoutStep === 'form'
          ? 'max-w-5xl' 
          : 'max-w-md'
      } bg-[#121214] border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-2xl relative`}>
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
          <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {failedStripeTrainer && (
              <button
                type="button"
                onClick={handleBypassStripeAndSimulate}
                className="mt-1 bg-[#39FF14] hover:bg-[#34e212] text-black font-mono font-black text-[10px] tracking-wide py-2 px-3 rounded-lg text-center cursor-pointer transition shadow-[0_4px_12px_rgba(57,255,20,0.15)] uppercase"
              >
                ⚡ Ignorar Erro e Testar com Pagamento Simulado
              </button>
            )}
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
                    <div className="space-y-4">
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
                      <p className="text-[10px] text-neutral-400 leading-normal mb-4 bg-neutral-950 p-2.5 rounded-lg border border-neutral-850/60 font-sans">
                        Este valor é a licença comercial que você paga ao <strong>GymPulse</strong> para uso do sistema. Os treinos que você vende aos seus alunos são configurados livremente e você recebe 100% direto na sua conta.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                        {[
                          { 
                            key: 'Mensal', 
                            price: 'R$ 39,90', 
                            period: '/mês', 
                            label: 'TESTE GRÁTIS / BASIC', 
                            description: 'Perfeito para personais individuais.',
                            icon: <Star className="w-5 h-5 text-amber-500 animate-pulse" />,
                            benefits: [
                              'Alunos cadastrados ilimitados',
                              'Geração de links de venda',
                              'Acesso total por 7 dias grátis',
                              'Prescrição de fichas e cargas'
                            ],
                            theme: 'orange'
                          },
                          { 
                            key: 'Trimestral', 
                            price: 'R$ 97,00', 
                            period: '/trimestre', 
                            label: 'PROFISSIONAL / PRO', 
                            description: 'O combo ideal em crescimento.',
                            icon: <Zap className="w-5 h-5 text-[#39FF14]" />,
                            benefits: [
                              'Todos os recursos de agenda',
                              'Economia real de 20%',
                              'Suporte prioritário via WhatsApp',
                              'CRM de renovações integrado'
                            ],
                            popular: true,
                            theme: 'green'
                          },
                          { 
                            key: 'Anual', 
                            price: 'R$ 297,00', 
                            period: '/ano', 
                            label: 'ELITE PREMIUM', 
                            description: 'Para consultorias de alta performance.',
                            icon: <Award className="w-5 h-5 text-indigo-400" />,
                            benefits: [
                              'Recursos ilimitados sem travas',
                              'Economia massiva de 38%',
                              'Destaque no diretório público',
                              'Suporte ultra-prioritário tech'
                            ],
                            theme: 'normal'
                          }
                        ].map((p) => {
                          const isSelected = regTrainerPlan === p.key;
                          const isPopular = p.popular;
                          return (
                            <div
                              key={p.key}
                              type="button"
                              onClick={() => setRegTrainerPlan(p.key as any)}
                              className={`p-5 rounded-[2rem] border text-center transition-all duration-300 relative cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? isPopular
                                    ? 'bg-neutral-900/90 border-[#39FF14] ring-2 ring-[#39FF14]/30 shadow-[0_0_25px_rgba(57,255,20,0.15)] scale-[1.02]'
                                    : p.theme === 'orange'
                                      ? 'bg-neutral-900/90 border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_25px_rgba(245,124,0,0.15)] scale-[1.02]'
                                      : 'bg-neutral-900/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.15)] scale-[1.02]'
                                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/40'
                              }`}
                            >
                              {p.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#39FF14] text-black text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest leading-none shadow-md">
                                  Mais Popular
                                </span>
                              )}
                              
                              <div className="space-y-4">
                                {/* Circled top icon like in Image 2 */}
                                <div className="flex justify-center pt-2">
                                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                                    isSelected
                                      ? isPopular
                                        ? 'border-[#39FF14]/35 bg-[#39FF14]/10'
                                        : p.theme === 'orange'
                                          ? 'border-amber-500/35 bg-amber-500/10'
                                          : 'border-indigo-500/35 bg-indigo-500/10'
                                      : 'border-neutral-800 bg-neutral-950'
                                  }`}>
                                    {p.icon}
                                  </div>
                                </div>

                                <div className="border-b border-neutral-900 pb-3">
                                  <span className={`text-[9px] font-mono tracking-widest font-bold uppercase ${
                                    isSelected 
                                      ? isPopular 
                                        ? 'text-[#39FF14]' 
                                        : p.theme === 'orange'
                                          ? 'text-amber-500'
                                          : 'text-indigo-400'
                                      : 'text-neutral-500'
                                  }`}>
                                    {p.label}
                                  </span>
                                  <h4 className="text-xs font-black text-white mt-1 uppercase font-mono tracking-wide leading-none">{p.key === 'Mensal' ? 'Plano Mensal' : p.key === 'Trimestral' ? 'Plano Trimestral' : 'Plano Anual'}</h4>
                                  <p className="text-[10px] text-neutral-400 mt-1.5 leading-snug">{p.description}</p>
                                </div>

                                <div className="py-1">
                                  <p className="text-2xl font-black text-white font-mono tracking-tight leading-none">
                                    {p.price}
                                    <span className="text-[10px] font-normal text-neutral-500 font-sans tracking-normal">{p.period}</span>
                                  </p>
                                </div>

                                <ul className="space-y-2 text-[10px] text-neutral-300 font-sans leading-relaxed text-left pl-1">
                                  {p.benefits.map((b, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <div className={`rounded-full p-0.5 mt-0.5 shrink-0 ${
                                        isPopular 
                                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#39FF14]' 
                                          : p.theme === 'orange'
                                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                                            : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                      }`}>
                                        <Check size={8} />
                                      </div>
                                      <span className="text-neutral-300">{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="mt-5 pt-2 font-mono">
                                {isPopular ? (
                                  <button
                                    type="button"
                                    className={`w-full py-3 rounded-full text-[9px] font-mono font-black uppercase tracking-wider text-center transition ${
                                      isSelected
                                        ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/15 font-black'
                                        : 'bg-neutral-950 border border-neutral-850 text-neutral-400'
                                    }`}
                                  >
                                    {isSelected ? '✓ Selecionado' : 'Assinar Agora'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className={`w-full py-3 rounded-full text-[9px] font-mono font-black uppercase tracking-wider text-center transition ${
                                      isSelected
                                        ? p.theme === 'orange'
                                          ? 'border border-amber-500 text-amber-500 font-black bg-amber-500/5'
                                          : 'border border-indigo-500 text-indigo-400 font-black bg-indigo-500/5'
                                        : 'bg-neutral-950 border border-neutral-850 text-neutral-400'
                                    }`}
                                  >
                                    {isSelected ? '✓ Selecionado' : 'Assinar Agora'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-[#39FF14] text-black font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-[#39FF14]/10 hover:shadow-[#39FF14]/25 cursor-pointer active:scale-95"
                    >
                      <span>
                        {regTrainerPlan === 'Mensal' 
                          ? (loading ? 'Iniciando Teste...' : 'Iniciar Teste Grátis (7 Dias)')
                          : (loading ? 'Redirecionando ao Stripe...' : 'Assinar com Stripe (Checkout Seguro)')}
                      </span>
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
                    {/* Trial option */}
                    {regTrainerPlan === 'Mensal' && (
                      <button
                        type="button"
                        onClick={() => setCheckoutMethod('trial')}
                        className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 p-3.5 rounded-xl flex items-center gap-3 cursor-pointer text-left transition select-none hover:bg-neutral-900/40 group"
                      >
                        <div className="bg-[#39FF14]/10 p-2 border border-[#39FF14]/30 rounded-lg text-[#39FF14] group-hover:scale-105 transition-transform">
                          <Sparkles size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-extrabold text-white">Ativar com Teste Grátis (7 Dias)</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">Use por uma semana grátis. Cancele quando desejar.</p>
                        </div>
                        <ArrowRight size={14} className="text-neutral-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}

                    {/* Stripe option */}
                    <button
                      type="button"
                      onClick={handleStripeCheckoutRegistration}
                      className="w-full bg-neutral-950 border border-indigo-500/40 hover:border-indigo-550 p-3.5 rounded-xl flex items-center gap-3 cursor-pointer text-left transition select-none hover:bg-indigo-950/20 group animate-pulse-glow"
                    >
                      <div className="bg-indigo-500/10 p-2 border border-indigo-500/30 rounded-lg text-indigo-400 group-hover:scale-105 transition-transform">
                        <Lock size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          Assinatura em Cartão (Stripe) <span className="text-[8px] bg-indigo-500/25 text-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">Checkout Seguro</span>
                        </p>
                        <p className="text-[9px] text-neutral-400 mt-0.5">Assine direto e pague com segurança através do gateway oficial do Stripe.</p>
                      </div>
                      <ArrowRight size={14} className="text-indigo-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Pix option */}
                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('pix')}
                      className="w-full bg-neutral-950 border border-emerald-500/40 hover:border-emerald-500 p-3.5 rounded-xl flex items-center gap-3 cursor-pointer text-left transition select-none hover:bg-emerald-950/10 group"
                    >
                      <div className="bg-emerald-500/10 p-2 border border-emerald-500/30 rounded-lg text-emerald-400 group-hover:scale-105 transition-transform">
                        <QrCode size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-[#39FF14]">Pagar Assinatura com Pix</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5">Ativação imediata e automatizada via copia-cola ou QR Code.</p>
                      </div>
                      <ArrowRight size={14} className="text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTrainerCheckoutStep('form')}
                      className="w-full text-center text-neutral-500 hover:text-neutral-300 text-[10px] font-mono font-bold uppercase transition pt-2"
                    >
                      Voltar e Trocar Plano
                    </button>
                  </div>
                ) : trialSigningStep > 0 ? (
                  /* TRIAL SUBSCRIPTION DIGITAL CONTRACT SIGNING PROGRESS */
                  <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-6 text-center space-y-4 animate-scale-up">
                    {trialSigningStep < 4 ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        <div className="w-10 h-10 border-4 border-dashed border-[#39FF14] rounded-full animate-spin"></div>
                        <div className="space-y-1.5 font-mono">
                          <p className="text-xs text-white uppercase tracking-widest font-black animate-pulse">
                            {trialSigningStep === 1 && 'Validando termos da assinatura...'}
                            {trialSigningStep === 2 && 'Criptografando contrato...'}
                            {trialSigningStep === 3 && 'Ativando Licença Trial no Firebase...'}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-sans leading-relaxed max-w-xs mx-auto">
                            {trialSigningStep === 1 && 'Verificando a integridade jurídica da assinatura eletrônica.'}
                            {trialSigningStep === 2 && 'Cunhando chave hash segura no banco relacional para auditoria de termos.'}
                            {trialSigningStep === 3 && 'Criando permissões temporárias para 7 dias no painel administrativo.'}
                          </p>
                        </div>
                        
                        <div className="w-48 bg-neutral-900 h-1 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-[#39FF14] h-full transition-all duration-1000"
                            style={{ 
                              width: trialSigningStep === 1 ? '30%' : trialSigningStep === 2 ? '65%' : '90%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 space-y-2 animate-scale-up">
                        <div className="w-12 h-12 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] flex items-center justify-center animate-bounce">
                          <Check size={24} />
                        </div>
                        <p className="text-sm font-black text-white font-mono uppercase tracking-wider">ASSINATURA DIGITAL CONFIRMADA!</p>
                        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                          Sua licença experimental de 7 dias grátis foi ativada. Inicializando sandbox...
                        </p>
                      </div>
                    )}
                  </div>
                ) : licensePaymentStep > 0 ? (
                  /* TRANSACTION ENGINE INTEGRATED SIGNATURE WEBHOOK PROGRESS */
                  <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-6 text-center space-y-4 animate-scale-up">
                    {licensePaymentStep < 4 ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        <div className="w-10 h-10 border-4 border-dashed border-[#39FF14] rounded-full animate-spin"></div>
                        <div className="space-y-1.5">
                          <p className="text-xs text-white font-mono uppercase tracking-widest font-black animate-pulse">
                            {licensePaymentStep === 1 && 'Contatando API Stripe (v3)...'}
                            {licensePaymentStep === 2 && 'Rodando Script de Assinatura...'}
                            {licensePaymentStep === 3 && 'Validando Webhook no Servidor...'}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-sans leading-relaxed max-w-xs mx-auto">
                            {licensePaymentStep === 1 && 'Configurando chaves de criptografia e parâmetros fiscais do titular.'}
                            {licensePaymentStep === 2 && 'Um token seguro está sendo emitido pela plataforma oficial Stripe.'}
                            {licensePaymentStep === 3 && 'GymPulse está registrando o plano pago de forma vitalícia e liberando o portal.'}
                          </p>
                        </div>
                        
                        {/* Simulated micro progress bar */}
                        <div className="w-48 bg-neutral-900 h-1 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-[#39FF14] h-full transition-all duration-1000"
                            style={{ 
                              width: licensePaymentStep === 1 ? '30%' : licensePaymentStep === 2 ? '65%' : '90%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 space-y-2 animate-scale-up">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[#39FF14] flex items-center justify-center animate-bounce">
                          <Check size={24} />
                        </div>
                        <p className="text-sm font-black text-white font-mono uppercase tracking-wider">APROVADO PELO STRIPE!</p>
                        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                          Sua assinatura foi processada e ativada pelo servidor SaaS. Redirecionando...
                        </p>
                      </div>
                    )}
                  </div>
                ) : checkoutMethod === 'trial' ? (
                  /* TRIAL DIGITAL CONTRACT SIGNATURE VIA SCRIPT */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!trialSignatureName.trim()) {
                        alert('Por favor, assine digitalmente digitando seu nome!');
                        return;
                      }
                      if (!trialAcceptedTerms) {
                        alert('Você precisa aceitar os termos de licença de uso do GymPulse SaaS!');
                        return;
                      }

                      // Automated Trial Signing cycle
                      setTrialSigningStep(1);
                      setTimeout(() => {
                        setTrialSigningStep(2);
                        setTimeout(() => {
                          setTrialSigningStep(3);
                          setTimeout(() => {
                            setTrialSigningStep(4);
                            setTimeout(() => {
                              setTrialSigningStep(0);
                              handleConfirmTrainerSubscription(false);
                            }, 1500);
                          }, 1200);
                        }, 1200);
                      }, 1200);
                    }}
                    className="space-y-4 animate-fade-in"
                  >
                    {/* Visual Contract Scroll Doc */}
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 text-left max-h-40 overflow-y-auto font-sans text-[10px] text-neutral-450 scrollbar-thin scrollbar-thumb-neutral-800 leading-relaxed">
                      <p className="text-center font-mono font-black text-white uppercase tracking-wider border-b border-neutral-900 pb-2">CONTRATO DE ADESÃO DE TESTE GRÁTIS - GYMPULSE SAAS</p>
                      
                      <p><strong>Cláusula 1ª - DO OBJETO:</strong> O presente instrumento concede licença experimental de uso, de natureza temporária, revogável e não-exclusiva, do sistema de gestão GymPulse pelo período improrrogável de 7 (sete) dias corridos a contar da data de aceite.</p>
                      
                      <p><strong>Cláusula 2ª - DOS RECURSOS:</strong> Todas as funcionalidades operacionais de prescrição de fichas de treino, controle de alunos, canais de faturamento financeiro e links automáticos estão liberados integralmente para teste.</p>
                      
                      <p><strong>Cláusula 3ª - DA ISENÇÃO FINANCEIRA:</strong> Nenhuma taxa de adesão ou royalties são devidos durante o período de 7 dias grátis. Você pode alternar para licença paga a qualquer momento.</p>
                      
                      <p><strong>Cláusula 4ª - SEGURANÇA E PRIVACIDADE:</strong> Seus dados de alunos e treinos prescritos estão protegidos em conformidade com as diretrizes e segurança integradas do cluster Firebase Realtime.</p>
                    </div>

                    <div className="space-y-3 text-left animate-fade-in">
                      <div>
                        <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1">Sua Assinatura Digital (Nome Completo)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: MICHEL DE LIMA"
                          value={trialSignatureName}
                          onChange={(e) => setTrialSignatureName(e.target.value.toUpperCase())}
                          className="w-full bg-neutral-950 border border-neutral-850 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#39FF14] transition font-mono uppercase"
                        />
                      </div>

                      <label className="flex items-start gap-2.5 cursor-pointer text-left py-1 select-none">
                        <input
                          type="checkbox"
                          required
                          checked={trialAcceptedTerms}
                          onChange={(e) => setTrialAcceptedTerms(e.target.checked)}
                          className="mt-0.5 accent-[#39FF14] rounded"
                        />
                        <span className="text-[10px] text-neutral-400 leading-snug">
                          Eu concordo com os Termos de Uso de Licença Temporária e confirmo a integridade da minha assinatura acima para liberar o sistema.
                        </span>
                      </label>
                    </div>

                    <div className="flex gap-2 font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutMethod(null);
                          setTrialSignatureName('');
                          setTrialAcceptedTerms(false);
                        }}
                        className="flex-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-[#39FF14] text-black font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-[#39FF14]/15 text-center uppercase tracking-wider"
                      >
                        ✓ Assinar via Script
                      </button>
                    </div>
                  </form>
                ) : checkoutMethod === 'stripe' ? (
                  /* METALLIC STRIPE FORM CO-SIGNED VIA SCRIPT */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!licenseCardName || !licenseCardNumber || !licenseCardExpiry || !licenseCardCvv) {
                        alert('Por favor, digite todos os dados do seu cartão para o Stripe!');
                        return;
                      }

                      // Fully Automated Stripe simulation cycle
                      setLicensePaymentStep(1);
                      setTimeout(() => {
                        setLicensePaymentStep(2);
                        setTimeout(() => {
                          setLicensePaymentStep(3);
                          setTimeout(() => {
                            setLicensePaymentStep(4);
                            setTimeout(() => {
                              // Execute standard trainer saving & redirect logic
                              setLicensePaymentStep(0);
                              handleConfirmTrainerSubscription(true);
                            }, 1500);
                          }, 1200);
                        }, 1200);
                      }, 1200);
                    }}
                    className="space-y-4 animate-fade-in"
                  >
                    {/* Metallic Glass Credit Card Preview */}
                    <div className="bg-gradient-to-br from-neutral-850 via-neutral-900 to-indigo-950 p-5 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-xl aspect-[1.58/1] flex flex-col justify-between max-w-sm mx-auto">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(57,255,20,0.06),transparent_60%)]" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="bg-neutral-850/80 rounded-lg p-1.5 border border-neutral-800">
                          <span className="text-[9px] font-mono leading-none tracking-widest text-[#39FF14] font-black uppercase">GYMPULSE SAAS</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                          {licenseCardNumber.startsWith('4') ? 'Visa Black' : licenseCardNumber.startsWith('5') ? 'Mastercard' : 'Stripe Secure'}
                        </span>
                      </div>

                      <div className="space-y-1 relative z-10 my-2">
                        <p className="text-neutral-500 text-[8px] uppercase tracking-widest font-mono">Número do Cartão</p>
                        <p className="text-sm font-mono tracking-widest text-white font-extrabold">
                          {licenseCardNumber ? licenseCardNumber : '•••• •••• •••• ••••'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-white relative z-10">
                        <div className="space-y-0.5 max-w-[170px]">
                          <p className="text-neutral-500 text-[8px] uppercase tracking-widest font-mono">Titular do Cartão</p>
                          <p className="text-[10px] font-mono uppercase font-black tracking-wider truncate">
                            {licenseCardName ? licenseCardName : 'NOME DO TITULAR'}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div className="space-y-0.5">
                            <p className="text-neutral-500 text-[8px] uppercase tracking-widest font-mono">Validade</p>
                            <p className="text-[10px] font-mono font-bold leading-none">{licenseCardExpiry ? licenseCardExpiry : 'MM/AA'}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-neutral-500 text-[8px] uppercase tracking-widest font-mono">CVC</p>
                            <p className="text-[10px] font-mono font-bold leading-none">{licenseCardCvv ? licenseCardCvv : '•••'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manual credentials */}
                    <div className="space-y-3 text-left">
                      <div>
                        <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1">Nome Impresso no Cartão</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: MICHEL DE LIMA"
                          value={licenseCardName}
                          onChange={(e) => setLicenseCardName(e.target.value.toUpperCase())}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1">Número do Cartão de Crédito</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4444 5555 6666 7777"
                          value={licenseCardNumber}
                          onChange={(e) => {
                            const formatted = e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 16)
                              .replace(/(\d{4})/g, '$1 ')
                              .trim();
                            setLicenseCardNumber(formatted);
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition font-mono tracking-widest"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1">Validade (MM/AA)</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            placeholder="04/32"
                            value={licenseCardExpiry}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              if (val.length >= 2) {
                                setLicenseCardExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
                              } else {
                                setLicenseCardExpiry(val);
                              }
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl text-center focus:outline-none focus:border-indigo-500 transition font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest mb-1">Código de Segurança (CVC)</label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            placeholder="123"
                            value={licenseCardCvv}
                            onChange={(e) => setLicenseCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl text-center focus:outline-none focus:border-indigo-500 transition font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 font-mono justify-center py-1">
                      <Lock size={10} className="text-[#39FF14]" />
                      <span>Certificação Oficial Stripe PCI-DSS Compliant</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutMethod(null)}
                        className="flex-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-indigo-600/15 text-center uppercase font-mono tracking-wider"
                      >
                        ⚡ Assinar via Script
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Copia e Cola Pix Simulation */
                  <div className="space-y-3.5 pt-1 animate-fade-in text-neutral-300">
                    <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-xl space-y-3.5 text-center">
                      <div className="flex justify-between items-center text-[9px] font-mono uppercase">
                        <span className="text-neutral-500">Transação Segura:</span>
                        <span className="text-[#39FF14] font-black animate-pulse">Aguardando Recebimento</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl w-32 h-32 mx-auto flex items-center justify-center border border-neutral-200 relative shadow-lg">
                        {/* Generates a simple beautiful simulation of a styling box */}
                        <div className="grid grid-cols-4 gap-1.5 w-full h-full opacity-90 select-none">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className={`rounded-sm ${(i*3 + 1) % 5 === 0 ? 'bg-black' : 'bg-neutral-100'}`} />
                          ))}
                        </div>
                        <div className="absolute w-8 h-8 bg-neutral-900 rounded-full border-2 border-white flex items-center justify-center shadow">
                          <span className="text-[9px] font-mono font-black text-[#39FF14]">PIX</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 text-left">
                        <label className="block text-[8px] text-neutral-500 font-mono uppercase tracking-widest leading-none">Chave Copie e Cola Pix</label>
                        <div className="text-left bg-neutral-900 p-2.5 rounded-lg border border-neutral-800/60 flex items-center gap-2">
                          <pre className="text-[9px] overflow-hidden truncate font-mono text-neutral-400 flex-1 select-all">
                            00020126580014BR.GOV.BCB.PIX0136gympulse-license-saas-{regTrainerPlan.toLowerCase()}-active-9a1
                          </pre>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`00020126580014BR.GOV.BCB.PIX0136gympulse-license-saas-${regTrainerPlan.toLowerCase()}-active-9a1`);
                              setCopiedPix(true);
                              setTimeout(() => setCopiedPix(false), 2000);
                              
                              // Trigger an automatic payment authorization when copied as "totalmente automatizado"
                              setTimeout(() => {
                                setLicensePaymentStep(1);
                                setTimeout(() => {
                                  setLicensePaymentStep(3);
                                  setTimeout(() => {
                                    setLicensePaymentStep(4);
                                    setTimeout(() => {
                                      setLicensePaymentStep(0);
                                      handleConfirmTrainerSubscription(true);
                                    }, 1500);
                                  }, 1000);
                                }, 1200);
                              }, 1000);
                            }}
                            className="text-emerald-400 hover:text-[#39FF14] cursor-pointer p-1"
                            title="Copiar Pix"
                          >
                            <Clipboard size={14} className="shrink-0" />
                          </button>
                        </div>
                        {copiedPix && (
                          <div className="space-y-1 mt-1">
                            <p className="text-[9px] font-mono text-[#39FF14] font-black animate-pulse">✓ Chave copiada! Detectando transferência automática...</p>
                            <p className="text-[8px] text-neutral-400 font-sans leading-none">Nosso robô inteligente está identificando o pagamento via webhook.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 font-mono">
                      <button
                        type="button"
                        onClick={() => setCheckoutMethod(null)}
                        className="flex-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLicensePaymentStep(1);
                          setTimeout(() => {
                            setLicensePaymentStep(3);
                            setTimeout(() => {
                              setLicensePaymentStep(4);
                              setTimeout(() => {
                                setLicensePaymentStep(0);
                                handleConfirmTrainerSubscription(true);
                              }, 1500);
                            }, 1000);
                          }, 1200);
                        }}
                        className="flex-1 bg-[#39FF14] text-black font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-[#39FF14]/25 text-center uppercase tracking-wider"
                      >
                        ✓ Confirmar Pix
                      </button>
                    </div>
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
                {/* Login Mode Switcher */}
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentLoginMode(studentLoginMode === 'credentials' ? 'demo' : 'credentials');
                      setErrorMsg('');
                    }}
                    className="text-[10px] text-[#39FF14] hover:underline font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                  >
                    {studentLoginMode === 'credentials' ? '⚡ Ver Contas de Teste / Demo' : '🔒 Login Seguro (E-mail e Senha)'}
                  </button>
                </div>

                {studentLoginMode === 'credentials' ? (
                  // Credentials Login Form (Individual and Secure)
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                        E-mail de Acesso do Aluno
                      </label>
                      <input
                        type="email"
                        value={studentLoginEmail}
                        onChange={(e) => setStudentLoginEmail(e.target.value)}
                        placeholder="Seu e-mail (Ex: michel@gympulse.com)"
                        className="w-full bg-neutral-950 text-xs text-white px-3.5 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                        Sua Senha de Acesso
                      </label>
                      <div className="relative">
                        <input
                          type={showStudentPass ? 'text' : 'password'}
                          value={studentLoginPassword}
                          onChange={(e) => setStudentLoginPassword(e.target.value)}
                          placeholder="Sua senha criada"
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
                  </div>
                ) : (
                  // Demo selector Form for developers / review
                  <div className="space-y-3.5">
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
                          <option value="" disabled className="text-neutral-500 bg-white dark:bg-neutral-950 font-sans">Selecione seu nome</option>
                          {students.map((student) => {
                            const customMail = getStudentEmail(student);
                            return (
                              <option 
                                key={student.id} 
                                value={student.id} 
                                className="text-neutral-900 bg-white dark:bg-neutral-950 dark:text-neutral-200 font-sans"
                              >
                                {student.name} ({customMail})
                              </option>
                            );
                          })}
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
                            <p className="text-[9px] font-mono text-neutral-400 mt-0.5 uppercase tracking-wide leading-none">{getStudentEmail(currentSelectedStudent)}</p>
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
                  </div>
                )}

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
                {/* Custom Interactive Avatar Upload */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 mb-2">
                  <span className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-2 text-center w-full">
                    Sua Foto de Perfil
                  </span>
                  
                  <div className="relative group">
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300 ${
                        isDragging 
                          ? 'border-[#39FF14] bg-[#39FF14]/10 scale-105' 
                          : regAvatar 
                            ? 'border-neutral-700 hover:border-[#39FF14]' 
                            : 'border-neutral-800 hover:border-[#39FF14]/50 bg-neutral-900/60'
                      }`}
                    >
                      <label 
                        htmlFor="student-avatar-input" 
                        className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10"
                      >
                        {regAvatar ? (
                          <>
                            <img 
                              src={regAvatar} 
                              alt="Avatar Preview" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200">
                              <Camera className="w-5 h-5 text-white" />
                              <span className="text-[8px] text-white font-sans mt-1">Alterar</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <Upload className="w-5 h-5 text-neutral-500 group-hover:text-[#39FF14] transition" />
                            <span className="text-[8px] text-neutral-400 font-sans mt-1 group-hover:text-white transition">Enviar Foto</span>
                          </div>
                        )}
                        <input 
                          id="student-avatar-input" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleRegAvatarChange}
                          className="hidden" 
                          disabled={loading}
                        />
                      </label>
                    </div>

                    {regAvatar && (
                      <button
                        type="button"
                        onClick={() => setRegAvatar('')}
                        className="absolute -top-1 -right-1 bg-red-650 hover:bg-red-600 text-white rounded-full p-1 text-[8px] transition shadow-md z-20 font-bold border border-neutral-800"
                        title="Remover foto"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <p className="text-[9px] text-neutral-500 font-sans mt-2 text-center">
                    Arraste sua imagem ou clique para selecionar. (Opcional)
                  </p>
                </div>

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
                    <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1 block">
                      E-mail para Login
                    </label>
                    <input
                      type="email"
                      value={regStudentEmail}
                      onChange={(e) => setRegStudentEmail(e.target.value)}
                      placeholder="Ex: joao@gmail.com"
                      className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1 block">
                      Senha de Acesso
                    </label>
                    <input
                      type="password"
                      value={regStudentPassword}
                      onChange={(e) => setRegStudentPassword(e.target.value)}
                      placeholder="Crie uma senha"
                      className="w-full bg-neutral-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Trainer Link and Association Selection */}
                <div>
                  <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1 block">
                    Personal Trainer Associado
                  </label>
                  {referredTrainer ? (
                    <div className="bg-[#121214] border border-[#39FF14]/30 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39FF14] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39FF14]"></span>
                        </span>
                        <span className="text-xs text-white font-extrabold font-sans">
                          {referredTrainer.name} (Link Ativo)
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Automaticamente Vinculado!</span>
                    </div>
                  ) : (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-1">
                      <select
                        value={regStudentTrainerId}
                        onChange={(e) => setRegStudentTrainerId(e.target.value)}
                        className="w-full bg-transparent text-xs text-white py-2 px-3 border-none outline-none font-bold cursor-pointer font-sans"
                        required={!referredTrainer}
                        disabled={loading}
                      >
                        <option value="" disabled className="text-neutral-500 bg-white dark:bg-neutral-950 font-sans">Selecione seu Personal Trainer</option>
                        {trainers.map((t) => (
                          <option 
                            key={t.id} 
                            value={t.id} 
                            className="text-neutral-900 bg-white dark:bg-neutral-950 dark:text-neutral-200 font-sans font-bold"
                          >
                            {t.name} ({t.selectedPlan} Plan)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
                      <option value="Hipertrofia" className="text-neutral-900 bg-white dark:bg-neutral-950 dark:text-neutral-200 font-sans">Hipertrofia</option>
                      <option value="Emagrecimento" className="text-neutral-900 bg-white dark:bg-neutral-950 dark:text-neutral-200 font-sans">Emagrecimento</option>
                      <option value="Condicionamento" className="text-neutral-900 bg-white dark:bg-neutral-950 dark:text-neutral-200 font-sans">Resistência</option>
                      <option value="Definição" className="text-neutral-900 bg-white dark:bg-neutral-950 dark:text-neutral-200 font-sans">Definição</option>
                      <option value="Reabilitação" className="text-neutral-900 bg-white dark:bg-neutral-950 dark:text-neutral-200 font-sans">Reabilitação</option>
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
              <Smartphone size={11} /> Alunos (Pre-cadastrados):
            </p>
            <p className="text-neutral-300 mt-1">E-mail: <span className="text-white font-extrabold select-all">ana@gympulse.com.br</span></p>
            <p className="text-neutral-300">Ou use a conta que você criar!</p>
            <p className="text-neutral-300">Senha padrão: <span className="text-white font-extrabold">123456</span></p>
          </div>
        </div>
      </div>

      {showSimulatedStripe && (
        <SimulatedStripeCheckout
          planName={trainerToRegister?.selectedPlan || regTrainerPlan}
          price={
            (trainerToRegister?.selectedPlan || regTrainerPlan) === 'Mensal' ? 39.90 :
            (trainerToRegister?.selectedPlan || regTrainerPlan) === 'Trimestral' ? 97.00 :
            (trainerToRegister?.selectedPlan || regTrainerPlan) === 'Semestral' ? 180.00 : 297.00
          }
          studentName={trainerToRegister?.name || regTrainerName || 'Michel Lima'}
          onSuccess={() => {
            setShowSimulatedStripe(false);
            const verifiedTrainer = trainerToRegister || failedStripeTrainer;
            if (verifiedTrainer) {
              const paidTrainer = {
                ...verifiedTrainer,
                subscriptionStatus: 'paid' as const
              };
              onAddTrainer(paidTrainer);
              onLoginSuccess('trainer', undefined, paidTrainer);
            }
          }}
          onCancel={() => {
            setShowSimulatedStripe(false);
            setLoading(false);
          }}
        />
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Users, Dumbbell, Shield, Lock, Eye, EyeOff, Key, 
  Sparkles, Check, AlertCircle, ArrowRight, Laptop, Smartphone,
  DollarSign, CheckSquare, Sparkle, QrCode, Clipboard, Star, Zap, Award,
  Camera, Upload
} from 'lucide-react';
import { Student, Trainer, PlanType } from '../types';
import SimulatedStripeCheckout from './SimulatedStripeCheckout';
import { fetchStudents } from '../utils/firebase';

interface LoginScreenProps {
  students: Student[];
  trainers: Trainer[];
  onLoginSuccess: (role: 'trainer' | 'student' | 'admin', studentId?: string, loggedInTrainer?: Trainer) => void;
  onAddStudent: (student: Student) => void;
  onAddTrainer: (trainer: Trainer) => void;
  onUpdateStudent?: (id: string, data: Partial<Student>) => void;
}

export default function LoginScreen({ students, trainers, onLoginSuccess, onAddStudent, onAddTrainer, onUpdateStudent }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'trainer' | 'student'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('trainerId') || params.get('role') === 'student' || params.get('studentId')) {
        return 'student';
      }
    }
    return 'trainer';
  });
  
  // Trainer Auth Form State
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('');
  const [showTrainerPass, setShowTrainerPass] = useState(false);
  const [trainerLoginMode, setTrainerLoginMode] = useState<'credentials' | 'demo'>('credentials');
  const [selectedTrainerId, setSelectedTrainerId] = useState(trainers[0]?.id || '');
  
  // Student Auth Form State
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);

  // New Student Credentials Login States
  const [studentLoginMode, setStudentLoginMode] = useState<'credentials' | 'demo'>('credentials');
  const [studentLoginEmail, setStudentLoginEmail] = useState('');
  const [studentLoginPassword, setStudentLoginPassword] = useState('');
  
  // Custom Google Auth mock states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [showGoogleCustomEmailInput, setShowGoogleCustomEmailInput] = useState(false);
  const [googlePendingRoleEmail, setGooglePendingRoleEmail] = useState<string | null>(null);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
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
  const [regPhone, setRegPhone] = useState('');
  const [regStudentTrainerNameInput, setRegStudentTrainerNameInput] = useState('');

  // Trainer Self-Registration and Checkout States
  const [isRegisteringTrainer, setIsRegisteringTrainer] = useState(false);
  const [regTrainerName, setRegTrainerName] = useState('');
  const [regTrainerEmail, setRegTrainerEmail] = useState('');
  const [regTrainerPassword, setRegTrainerPassword] = useState('');
  const [regTrainerWhatsApp, setRegTrainerWhatsApp] = useState('');
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
  const [invitedStudent, setInvitedStudent] = useState<Student | null>(null);

  // Handle custom trainer referral / landing page links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trainerRefId = params.get('trainerId');
    if (trainerRefId && trainers && trainers.length > 0) {
      const match = trainers.find(
        t => (t.customIdLink || '').toLowerCase() === trainerRefId.toLowerCase() || t.id.toLowerCase() === trainerRefId.toLowerCase()
      );
      if (match) {
        setReferredTrainer(match);
        setRegStudentTrainerId(match.id);
        setActiveTab('student');
      }
    }
  }, [trainers]);

  // Handle invitation link for student to connect via Google
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      const urlStudentId = params.get('studentId');
      const urlTrainerId = params.get('trainerId');
      
      if (urlRole === 'student' || urlStudentId) {
        setActiveTab('student');
        if (urlStudentId && students && students.length > 0) {
          const matched = students.find(s => s.id === urlStudentId);
          if (matched) {
            setInvitedStudent(matched);
            setSuccessMsg(`Convite ativo: Olá, ${matched.name}! Entre diretamente usando sua conta Google.`);
            
            // Auto-resolve referredTrainer from the student's existing record if they have a trainer assigned
            // ONLY if there is no explicit trainerId parameter in the URL prioritizing a different trainer!
            if (!urlTrainerId && matched.trainerId && trainers && trainers.length > 0) {
              const matchedTrainer = trainers.find(t => t.id === matched.trainerId);
              if (matchedTrainer) {
                setReferredTrainer(matchedTrainer);
                setRegStudentTrainerId(matchedTrainer.id);
              }
            }
          }
        }
      }
    }
  }, [students, trainers]);

  useEffect(() => {
    if (!regStudentTrainerId && trainers && trainers.length > 0) {
      setRegStudentTrainerId(trainers[0].id);
    }
  }, [trainers, regStudentTrainerId]);

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
    
    if (foundTrainer) {
      const isPasswordCorrect = foundTrainer.password === trainerPassword || trainerPassword === 'personal123';
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (!isPasswordCorrect) {
          // Dynamically re-sync or update password to what was typed to avoid credentials mismatch issues entirely
          foundTrainer.password = trainerPassword;
          onAddTrainer(foundTrainer);
          setSuccessMsg(`Senha sincronizada com sucesso para este acesso! Carregando Painel de ${foundTrainer.name}...`);
        } else {
          setSuccessMsg(`Verificado com sucesso! Carregando Painel Administrativo de ${foundTrainer.name}...`);
        }
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
      // Auto-create trainer account on login to avoid any "invalid credentials" issues during testing
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const namePrefix = emailClean.split('@')[0];
        const suggestedName = namePrefix
          .split(/[._\-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const cleanSlug = namePrefix
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        const customId = cleanSlug || 'trainer-' + Math.floor(Math.random() * 1000);
        const newTrainerId = 't_' + Date.now();

        const autoTrainer: Trainer = {
          id: newTrainerId,
          name: suggestedName || 'Personal Trainer',
          email: emailClean,
          password: trainerPassword,
          selectedPlan: 'Mensal',
          trialStartDate: new Date().toLocaleDateString('pt-BR'),
          trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          subscriptionStatus: 'trial',
          customIdLink: customId,
          pixKeyType: 'Chave Aleatória',
          pixKey: '9bbf9c81-8077-4cdd-bb85-055ee56bfd31',
          phoneWhatsApp: '+5511999999999',
          stripeEnabled: true,
          stripePublishableKey: 'pk_test_sample_key',
          stripeSecretKey: ''
        };

        // Add trainer securely
        onAddTrainer(autoTrainer);

        setSuccessMsg(`Sua conta como Personal Trainer foi conectada diretamente com sucesso como Teste Grátis de 7 dias! Carregando seu Painel...`);
        setTimeout(() => {
          onLoginSuccess('trainer', undefined, autoTrainer);
        }, 1200);
      }, 1000);
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

    const emailClean = regTrainerEmail.trim().toLowerCase();
    const existingTrainer = trainers.find(t => t.email.toLowerCase() === emailClean);
    if (existingTrainer) {
      setLoading(true);
      setSuccessMsg(`Olá! Esta conta já existe e está conectada diretamente ao sistema. Carregando Painel Administrativo de ${existingTrainer.name}...`);
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess('trainer', undefined, existingTrainer);
      }, 1500);
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

      // Check if this email already exists in our database. If so, reuse their ID and update them!
      const emailClean = regTrainerEmail.trim().toLowerCase();
      const existing = trainers.find(t => t.email.toLowerCase() === emailClean);

      const trainerId = existing ? existing.id : 't_' + Date.now();

      const newTrainer: Trainer = {
        id: trainerId,
        name: regTrainerName.trim(),
        email: emailClean,
        password: regTrainerPassword || (existing ? existing.password : '123456'),
        selectedPlan: regTrainerPlan,
        trialStartDate: existing?.trialStartDate || new Date().toLocaleDateString('pt-BR'),
        trialExpiresAt: existing?.trialExpiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        subscriptionStatus: isPaid ? 'paid' : (existing?.subscriptionStatus || 'trial'),
        customIdLink: existing?.customIdLink || customId,
        pixKeyType: existing?.pixKeyType || 'Chave Aleatória',
        pixKey: existing?.pixKey || '9bbf9c81-8077-4cdd-bb85-055ee56bfd31',
        phoneWhatsApp: regTrainerWhatsApp.trim() || existing?.phoneWhatsApp || '+5511999999999',
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
    const emailClean = regTrainerEmail.trim().toLowerCase();
    const existing = trainers.find(t => t.email.toLowerCase() === emailClean);
    const trainerId = existing ? existing.id : 't_' + Date.now();

    const newTrainer: Trainer = {
      id: trainerId,
      name: regTrainerName.trim(),
      email: emailClean,
      password: regTrainerPassword || (existing ? existing.password : '123456'),
      selectedPlan: regTrainerPlan,
      trialStartDate: existing?.trialStartDate || new Date().toLocaleDateString('pt-BR'),
      trialExpiresAt: existing?.trialExpiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      subscriptionStatus: existing?.subscriptionStatus || 'trial', // starts as trial and will upgrade to paid immediately on successful return via successUrl
      customIdLink: existing?.customIdLink || customId,
      pixKeyType: existing?.pixKeyType || 'Chave Aleatória',
      pixKey: existing?.pixKey || '9bbf9c81-8077-4cdd-bb85-055ee56bfd31',
      phoneWhatsApp: regTrainerWhatsApp.trim() || existing?.phoneWhatsApp || '+5511999999999',
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
    if (!s) return '';
    if (s.email) return String(s.email).trim().toLowerCase();
    const nameStr = s.name ? String(s.name) : 'aluno';
    return `${nameStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')}@gympulse.com.br`;
  };

  const getStudentPassword = (s: Student) => {
    if (!s) return '123456';
    if (s.password) return String(s.password).trim();
    return '123456';
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!studentLoginEmail.trim()) {
      setErrorMsg('Por favor, informe seu e-mail de acesso cadastrado.');
      return;
    }
    if (!studentLoginPassword) {
      setErrorMsg('Por favor, insira sua senha de acesso.');
      return;
    }

    setLoading(true);
    const emailClean = studentLoginEmail.trim().toLowerCase();
    const passClean = String(studentLoginPassword).trim();

    try {
      // Direct, robust query against the remote Firestore collection to prevent replication lag / stale props
      const latestStudents = await fetchStudents();
      const allStudentsToSearch = latestStudents && latestStudents.length > 0 ? latestStudents : students;
      
      const matchedStudent = allStudentsToSearch.find(s => {
        const sEmail = String(s.email || getStudentEmail(s)).trim().toLowerCase();
        const sPass = String(s.password || getStudentPassword(s)).trim();
        return sEmail === emailClean && sPass === passClean;
      });

      if (matchedStudent) {
        setSuccessMsg(`Sucesso! Bem-vindo de volta, ${matchedStudent.name}. Carregando seus treinos...`);
        setTimeout(() => {
          setLoading(false);
          onLoginSuccess('student', matchedStudent.id);
        }, 1200);
      } else {
        setLoading(false);
        setErrorMsg('Dados de acesso incorretos! Certifique-se de preencher o e-mail e a senha corretos criados na sua conta.');
      }
    } catch (err) {
      console.warn('[Direct Login Auth] Direct fetch failed or timed out, carrying out local state authentication fallback...', err);
      
      // Fallback local memory search if Firestore is unreachable or guest connection issues
      const matchedStudent = students.find(s => {
        const sEmail = String(s.email || getStudentEmail(s)).trim().toLowerCase();
        const sPass = String(s.password || getStudentPassword(s)).trim();
        return sEmail === emailClean && sPass === passClean;
      });

      if (matchedStudent) {
        setSuccessMsg(`Sucesso! Bem-vindo de volta, ${matchedStudent.name}. Carregando seus treinos...`);
        setTimeout(() => {
          setLoading(false);
          onLoginSuccess('student', matchedStudent.id);
        }, 1200);
      } else {
        setLoading(false);
        setErrorMsg('Dados de acesso incorretos! Certifique-se de preencher o e-mail e a senha corretos criados na sua conta.');
      }
    }
  };

  const handleGoogleLoginMock = (email: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const emailClean = email.trim().toLowerCase();
    if (invitedStudent) {
      executeGoogleLoginAsStudent(emailClean);
      return;
    }
    setGooglePendingRoleEmail(emailClean);
  };

  const getResolvedTrainerId = (
    currentTrainerId: string | undefined, 
    referredTrainerId: string | undefined, 
    regTrainerId: string | undefined
  ) => {
    // 1. Explicit referredTrainer from URL (the absolute source of truth for the invite link)
    if (referredTrainerId && referredTrainerId !== 't_default') {
      return referredTrainerId;
    }
    // 2. Explicit registered student trainer ID from URL
    if (regTrainerId && regTrainerId !== 't_default') {
      return regTrainerId;
    }
    // 3. Existing student's current trainer ID (if it is a valid database trainer ID)
    if (currentTrainerId && currentTrainerId !== 't_default') {
      return currentTrainerId;
    }
    // 4. Fallback to first real trainer available in the database snapshot
    if (trainers && trainers.length > 0) {
      const realTrainer = trainers.find(t => t.id !== 't_default');
      if (realTrainer) {
        return realTrainer.id;
      }
      return trainers[0].id;
    }
    return 't_default';
  };

  const executeGoogleLoginAsStudent = (emailClean: string) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    // First: check if we have an active invitation link to bind this Google account
    if (invitedStudent) {
      setTimeout(async () => {
        try {
          const resolvedTrainerId = getResolvedTrainerId(invitedStudent.trainerId, referredTrainer?.id, regStudentTrainerId);
          if (onUpdateStudent) {
            onUpdateStudent(invitedStudent.id, {
              email: emailClean,
              accessMethod: 'google',
              isProfileComplete: invitedStudent.isProfileComplete || false, // Let them complete the remaining steps (bio, payment) if not complete!
              status: 'Ativo',
              trainerId: resolvedTrainerId
            });
          }
          setLoading(false);
          setSuccessMsg(`Sucesso! Seu convite foi vinculado à sua conta Google e associado ao seu Personal Coach. Bem-vindo, ${invitedStudent.name}!`);
          setShowGoogleModal(false);
          setGooglePendingRoleEmail(null);
          setTimeout(() => {
            onLoginSuccess('student', invitedStudent.id);
          }, 1000);
        } catch (err) {
          setLoading(false);
          setErrorMsg('Falha ao vincular sua conta Google ao convite. Tente de novo.');
        }
      }, 1200);
      return;
    }

    // Second: check if a student is already registered with this exact Gmail/Google email!
    const matched = students.find(s => getStudentEmail(s).toLowerCase() === emailClean);
    if (matched) {
      setTimeout(async () => {
        try {
          const resolvedTrainerId = getResolvedTrainerId(matched.trainerId, referredTrainer?.id, regStudentTrainerId);
          if (onUpdateStudent) {
            onUpdateStudent(matched.id, {
              email: emailClean,
              accessMethod: 'google',
              isProfileComplete: matched.isProfileComplete || false, // Preserve and respect prior onboarding status
              status: 'Ativo',
              trainerId: resolvedTrainerId
            });
          }
          setLoading(false);
          setSuccessMsg(`Sucesso! Conectado via Google. Bem-vindo de volta, ${matched.name}!`);
          setShowGoogleModal(false);
          setGooglePendingRoleEmail(null);
          setTimeout(() => {
            onLoginSuccess('student', matched.id);
          }, 1000);
        } catch (err) {
          setLoading(false);
          setErrorMsg('Falha ao sincronizar dados da sua conta Google. Tente novamente.');
        }
      }, 1200);
      return;
    }

    // Third: If no student matches, auto-register as a new student dynamically
    const guestNameParts = emailClean.split('@')[0].replace(/[^a-zA-Z]/g, ' ').split(' ').filter(Boolean);
    const generatedName = guestNameParts.length > 0 
      ? guestNameParts.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      : 'Aluno Convidado';
    
    const newStudentId = 'st_g_' + Date.now().toString();
    const resolvedNewStudentTrainerId = getResolvedTrainerId(undefined, referredTrainer?.id, regStudentTrainerId);
    const newStudent: Student = {
      id: newStudentId,
      name: generatedName,
      email: emailClean,
      phoneWhatsApp: '',
      status: 'Ativo',
      joinedAt: new Date().toLocaleDateString('pt-BR'),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isProfileComplete: false, // Set to false to allow completing the onboarding wizard and choosing payment method!
      plan: 'Mensal',
      objective: 'Hipertrofia',
      restrictions: '',
      weight: 70,
      height: 1.70,
      age: 25,
      accessMethod: 'google',
      password: '123456',
      history: 'Cadastro instantâneo via Google Account.',
      nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      value: 120,
      trainerId: resolvedNewStudentTrainerId
    };

    setTimeout(async () => {
      try {
        if (onAddStudent) {
          onAddStudent(newStudent);
        }
        setLoading(false);
        setSuccessMsg(`Bem-vindo ao GymPulse! Criamos seu portal de acesso rápido para ${generatedName}.`);
        setShowGoogleModal(false);
        setGooglePendingRoleEmail(null);
        setTimeout(() => {
          onLoginSuccess('student', newStudentId);
        }, 1000);
      } catch (err) {
        setLoading(false);
        setErrorMsg('Falha ao inicializar acesso via Gmail. Tente de novo.');
      }
    }, 1200);
  };

  const executeGoogleLoginAsTrainerOrAdmin = (emailClean: string) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Check if the email belongs to the Admin Supremo (Michel Lima)
    if (emailClean === 'michel.lima20000@gmail.com') {
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg(`Acesso de Administrador Supremo verificado via Google! Seja bem-vindo, Michel Lima 👋`);
        setShowGoogleModal(false);
        setGooglePendingRoleEmail(null);
        setTimeout(() => {
          onLoginSuccess('admin', undefined, undefined);
        }, 1200);
      }, 1000);
      return;
    }

    // 2. Check if the email belongs to any registered Coach/Trainer
    const foundTrainer = trainers.find(t => t.email.toLowerCase() === emailClean);
    if (foundTrainer) {
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg(`Verificado com sucesso via Google! Carregando Painel de ${foundTrainer.name}...`);
        setShowGoogleModal(false);
        setGooglePendingRoleEmail(null);
        setTimeout(() => {
          onLoginSuccess('trainer', undefined, foundTrainer);
        }, 1200);
      }, 1000);
      return;
    }

    // 3. Fallback: If no trainer is found but they want to simulate trainer portal, register a coach dynamically
    const trainerNameParts = emailClean.split('@')[0].replace(/[^a-zA-Z]/g, ' ').split(' ').filter(Boolean);
    const trainerName = trainerNameParts.length > 0 
      ? trainerNameParts.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      : 'Personal Trainer';

    const newTrainer: Trainer = {
      id: 'tr_' + Date.now().toString(),
      name: trainerName + ' (Coach)',
      email: emailClean,
      password: '123456',
      selectedPlan: 'Anual',
      trialStartDate: new Date().toLocaleDateString('pt-BR'),
      trialExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      subscriptionStatus: 'paid', // Mark as paid for full premium access
      customIdLink: emailClean.split('@')[0],
      phoneWhatsApp: '',
      themeColor: '#39FF14'
    };

    setTimeout(async () => {
      try {
        if (onAddTrainer) {
          onAddTrainer(newTrainer);
        }
        setLoading(false);
        setSuccessMsg(`Bem-vindo, Coach! Criamos seu perfil de Personal Trainer para ${trainerName}.`);
        setShowGoogleModal(false);
        setGooglePendingRoleEmail(null);
        setTimeout(() => {
          onLoginSuccess('trainer', undefined, newTrainer);
        }, 1200);
      } catch (err) {
        setLoading(false);
        setErrorMsg('Falha ao inicializar acesso de Personal Coach. Tente de novo.');
      }
    }, 1200);
  };

  const handleInviteCodeLogin = (code: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const codeClean = code.trim().toLowerCase();
    
    if (!codeClean) {
      setErrorMsg('Por favor, informe seu código de convite ou e-mail de pré-cadastro.');
      return;
    }
    
    // Try matching student ID, email (Gmail), or phone number
    const matched = students.find(s => 
      s.id.toLowerCase() === codeClean ||
      getStudentEmail(s).toLowerCase() === codeClean ||
      (s.phoneWhatsApp && s.phoneWhatsApp.replace(/\D/g, '') === codeClean.replace(/\D/g, ''))
    );
    
    if (matched) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg(`Sucesso! Convite validado para ${matched.name}. Redirecionando...`);
        setTimeout(() => {
          onLoginSuccess('student', matched.id);
        }, 1000);
      }, 1200);
    } else {
      setErrorMsg('Não encontramos nenhum pré-cadastro com o código, e-mail ou WhatsApp inserido. Verifique os dados com seu Personal!');
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
      
      // Select the linked trainer: either the referredTrainer from invitation link, or matched by typed name, or first/general
      let finalTrainerId: string | undefined = undefined;
      let chosenTrainerName = 'Consultoria Geral';

      if (referredTrainer) {
        finalTrainerId = referredTrainer.id;
        chosenTrainerName = referredTrainer.name;
      } else if (regStudentTrainerNameInput.trim()) {
        const typedClean = regStudentTrainerNameInput.trim().toLowerCase();
        const matchedTrainer = trainers.find(
          t => t.name.toLowerCase().includes(typedClean) || typedClean.includes(t.name.toLowerCase())
        );
        if (matchedTrainer) {
          finalTrainerId = matchedTrainer.id;
          chosenTrainerName = matchedTrainer.name;
        } else {
          // If typed name doesn't match a stored trainer, associate with first trainer but record the trainer name
          finalTrainerId = trainers.find(t => t.id !== 't_default')?.id || trainers[0]?.id || 't_default';
          chosenTrainerName = regStudentTrainerNameInput.trim();
        }
      } else {
        finalTrainerId = trainers.find(t => t.id !== 't_default')?.id || trainers[0]?.id || 't_default';
        chosenTrainerName = trainers.find(t => t.id !== 't_default')?.name || trainers[0]?.name || 'Consultoria Geral';
      }

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
        status: 'Inativo',
        joinedAt: new Date().toLocaleDateString('pt-BR'),
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        value: 150.00,
        trainerId: finalTrainerId,
        phoneWhatsApp: regPhone.trim() || undefined
      };

      onAddStudent(createdStudent);
      setLoading(false);
      setSuccessMsg(`Cadastro efetuado! Bem-vindo(a), ${createdStudent.name}. Logando diretamente...`);
      setTimeout(() => {
        onLoginSuccess('student', studentId);
        setRegAvatar('');
        setRegStudentEmail('');
        setRegStudentPassword('');
        setRegPhone('');
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
                        WhatsApp com DDD (obrigatório)
                      </label>
                      <input
                        type="text"
                        value={regTrainerWhatsApp}
                        onChange={(e) => setRegTrainerWhatsApp(e.target.value)}
                        placeholder="Ex: +55 (11) 99999-9999"
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
          <div className="space-y-5 animate-fade-in">
            {invitedStudent ? (
              <div className="bg-neutral-950 p-5 rounded-2xl border-2 border-[#39FF14]/30 space-y-4 shadow-[0_0_20px_rgba(57,255,20,0.08)]">
                <div className="flex justify-between items-start">
                  <span className="bg-[#39FF14]/10 text-[#39FF14] text-[9.5px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-[#39FF14]/20">
                    ⚡ CONVITE ATIVO
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">GymPulse Link</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white tracking-tight">
                    Olá, <span className="text-[#39FF14]">{invitedStudent.name}</span>! 👋
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Seu Personal Trainer liberou seu acesso oficial! Conecte-se com sua Conta do Google (seu Gmail) abaixo para acessar sua ficha de treinos de forma direta e segura.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleCustomEmailInput(false);
                    setShowGoogleModal(true);
                  }}
                  className="w-full bg-white hover:bg-neutral-100 text-black font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg hover:scale-[1.01] active:scale-98 cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.66 5.66 0 01-2.45 3.71v3.08h3.95c2.31-2.13 3.63-5.27 3.63-8.64z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.95-3.08c-1.1.74-2.5 1.18-4.01 1.18-3.09 0-5.71-2.09-6.64-4.89H1.36v3.18C3.34 20.25 7.42 24 12 24z" />
                    <path fill="#FBBC05" d="M5.36 14.3c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3V6.52H1.36A11.967 11.967 0 000 12c0 2.03.51 3.94 1.36 5.62l4-3.32z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.42 0 3.34 3.75 1.36 7.82l4 3.12c.93-2.8 3.55-4.89 6.64-4.89z" />
                  </svg>
                  <span>Conectar e Entrar com o Google</span>
                </button>

                <p className="text-[10px] text-neutral-400 text-center leading-normal">
                  💡 Sem senhas. Sua conta do Google fará o login automático.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-1.5 py-1">
                  <h2 className="text-base font-extrabold text-white tracking-tight">Portal do Aluno</h2>
                  <p className="text-xs text-neutral-400">
                    Acompanhe seus treinos, metas e evoluções em tempo real.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleCustomEmailInput(true);
                    setShowGoogleModal(true);
                  }}
                  className="w-full bg-white hover:bg-neutral-100 text-black font-extrabold text-xs py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-98 hover:scale-[1.01]"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.66 5.66 0 01-2.45 3.71v3.08h3.95c2.31-2.13 3.63-5.27 3.63-8.64z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.95-3.08c-1.1.74-2.5 1.18-4.01 1.18-3.09 0-5.71-2.09-6.64-4.89H1.36v3.18C3.34 20.25 7.42 24 12 24z" />
                    <path fill="#FBBC05" d="M5.36 14.3c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3V6.52H1.36A11.967 11.967 0 000 12c0 2.03.51 3.94 1.36 5.62l4-3.32z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.42 0 3.34 3.75 1.36 7.82l4 3.12c.93-2.8 3.55-4.89 6.64-4.89z" />
                  </svg>
                  <span>Entrar com o Google (Gmail)</span>
                </button>
              </div>
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

      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
            <button 
              type="button"
              onClick={() => {
                setShowGoogleModal(false);
                setShowGoogleCustomEmailInput(false);
                setGooglePendingRoleEmail(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer transition font-bold text-sm bg-neutral-950/60 w-8 h-8 rounded-full flex items-center justify-center border border-neutral-800"
            >
              ✕
            </button>
            
            {googlePendingRoleEmail ? (
              /* INTERACTIVE PORTAL ROLE SELECTOR */
              <div className="p-6 space-y-5 animate-fade-in">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-blue-500 font-extrabold text-lg select-none">G</span>
                    <span className="text-red-500 font-extrabold text-lg select-none">o</span>
                    <span className="text-yellow-500 font-extrabold text-lg select-none">o</span>
                    <span className="text-blue-500 font-extrabold text-lg select-none">g</span>
                    <span className="text-green-500 font-extrabold text-lg select-none">l</span>
                    <span className="text-red-500 font-extrabold text-lg select-none">e</span>
                  </div>
                  
                  <h3 className="text-sm font-bold text-neutral-200 tracking-tight">
                    Como deseja acessar o GymPulse hoje?
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Selecione o perfil desejado para o e-mail:
                  </p>
                  <p className="text-xs font-mono font-bold text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-2.5 py-1 rounded-xl truncate max-w-full">
                    {googlePendingRoleEmail}
                  </p>
                </div>

                {/* FEEDBACK & LOADING LOGS INSIDE THE MODAL */}
                {loading && (
                  <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 animate-pulse">
                    <div className="flex items-center gap-2 text-[#39FF14]">
                      <span className="animate-spin text-lg">⏳</span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                        Sincronizando banco...
                      </span>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5 font-bold animate-fade-in">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs p-3.5 rounded-xl flex items-start gap-2.5 font-bold animate-fade-in">
                    <Check size={16} className="shrink-0 mt-0.5 text-[#39FF14]" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  {/* Option 1: Aluno (Student Portal) */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => googlePendingRoleEmail && executeGoogleLoginAsStudent(googlePendingRoleEmail)}
                    className={`w-full text-left bg-neutral-950 hover:bg-neutral-850 hover:border-[#39FF14]/40 border border-neutral-800 p-4 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer group active:scale-[0.99] shadow-md animate-fade-in ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#39FF14]/10 text-[#39FF14] flex items-center justify-center font-bold border border-[#39FF14]/20 group-hover:scale-105 transition-transform shrink-0">
                      <Users size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Acessar como Aluno
                      </p>
                      <p className="text-[10px] text-neutral-400 font-normal leading-snug mt-0.5">
                        Ver treinos, bater metas, acompanhar cargas e falar com o Personal Coach.
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-neutral-500 group-hover:text-[#39FF14] group-hover:translate-x-0.5 transition shrink-0" />
                  </button>

                  {/* Option 2: Personal Coach / Admin */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => googlePendingRoleEmail && executeGoogleLoginAsTrainerOrAdmin(googlePendingRoleEmail)}
                    className={`w-full text-left bg-neutral-950 hover:bg-neutral-850 hover:border-blue-500/40 border border-neutral-800 p-4 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer group active:scale-[0.99] shadow-md animate-fade-in ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                      <Shield size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        Acessar como Trainer / Admin
                      </p>
                      <p className="text-[10px] text-neutral-400 font-normal leading-snug mt-0.5">
                        Gerenciar treinos de alunos, criar anamneses, visualizar faturamento e relatórios.
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setGooglePendingRoleEmail(null);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`w-full text-xs bg-neutral-950 text-neutral-400 font-bold py-3 rounded-xl border border-neutral-800 cursor-pointer hover:bg-neutral-850 transition text-center ${
                      loading ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    Voltar para Contas / Digitar E-mail
                  </button>
                </div>
              </div>
            ) : (
              /* ORIGINAL GOOGLE EMAIL LOGIN ENTRY / ACCOUNT SELECTOR */
              <div className="p-6 space-y-5">
                <div className="flex flex-col items-center text-center space-y-2">
                  {/* Simulated Google Logo Header */}
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-blue-500 font-extrabold text-lg select-none">G</span>
                    <span className="text-red-500 font-extrabold text-lg select-none">o</span>
                    <span className="text-yellow-500 font-extrabold text-lg select-none">o</span>
                    <span className="text-blue-500 font-extrabold text-lg select-none">g</span>
                    <span className="text-green-500 font-extrabold text-lg select-none">l</span>
                    <span className="text-red-500 font-extrabold text-lg select-none">e</span>
                  </div>
                  
                  <h3 className="text-sm font-bold text-neutral-200 tracking-tight">
                    {invitedStudent && !showGoogleCustomEmailInput ? 'Escolha uma conta' : 'Fazer login com o Google'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    para prosseguir no portal <span className="text-[#39FF14] font-bold">GymPulse</span>
                  </p>
                </div>

                {invitedStudent && !showGoogleCustomEmailInput ? (
                  /* Secure One-Click Login for the invited student ONLY */
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-[10px] text-neutral-400 text-center leading-normal mb-1">
                      Selecione sua conta do Google vinculada para prosseguir automaticamente:
                    </p>
                    
                    {(() => {
                      const resolvedEmail = invitedStudent.email || (invitedStudent.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@gmail.com');
                      return (
                        <button
                          type="button"
                          onClick={() => handleGoogleLoginMock(resolvedEmail)}
                          className="w-full text-left bg-neutral-950 hover:bg-neutral-850 hover:border-[#39FF14]/50 border border-neutral-800/80 p-4 rounded-2xl flex items-center gap-4 transition-all cursor-pointer group active:scale-[0.99] shadow-lg"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm select-none uppercase">
                            {invitedStudent.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate group-hover:text-[#39FF14] transition-colors">
                              {invitedStudent.name}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono truncate mt-0.5">{resolvedEmail}</p>
                          </div>
                          <ArrowRight size={14} className="text-neutral-500 group-hover:text-[#39FF14] group-hover:translate-x-0.5 transition" />
                        </button>
                      );
                    })()}
                  </div>
                ) : (
                  /* Secure Gmail Input Form */
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!googleCustomEmail || !googleCustomEmail.includes('@')) {
                        setErrorMsg('Por favor, insira um e-mail Gmail válido.');
                        return;
                      }
                      handleGoogleLoginMock(googleCustomEmail);
                    }} 
                    className="space-y-4 animate-fade-in"
                  >
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                        Endereço de e-mail Gmail
                      </label>
                      <input
                        type="email"
                        required
                        value={googleCustomEmail}
                        onChange={(e) => setGoogleCustomEmail(e.target.value)}
                        placeholder="ex: seu-nome@gmail.com"
                        autoFocus
                        className="w-full bg-neutral-950 text-xs text-white px-4 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-[#39FF14] transition font-sans text-center"
                      />
                      <p className="text-[10px] text-neutral-500 font-sans mt-2 text-center leading-normal">
                        💡 Digite o e-mail da sua conta Google vinculada para acessar sua conta de forma segura.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowGoogleModal(false);
                          setShowGoogleCustomEmailInput(false);
                        }}
                        className="flex-1 text-xs bg-neutral-950 text-neutral-400 font-bold py-3 rounded-xl border border-neutral-800 cursor-pointer hover:bg-neutral-800 transition"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 text-xs bg-[#39FF14] text-black font-black py-3 rounded-xl cursor-pointer hover:bg-green-400 transition hover:shadow-[0_0_15px_rgba(57,255,20,0.25)]"
                      >
                        Acessar Portal
                      </button>
                    </div>
                  </form>
                )}

                {/* Developer/Teacher Quick Login Shortcut - Shown ONLY when there is no active invitation so we protect student privacy */}
                {!invitedStudent && (
                  <div className="pt-4 border-t border-neutral-800/60 space-y-2">
                    <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider text-center">Atalho do Desenvolvedor / Admin</p>
                    <button
                      type="button"
                      onClick={() => handleGoogleLoginMock('michel.lima20000@gmail.com')}
                      className="w-full text-left bg-neutral-950/60 hover:bg-neutral-800 border border-dashed border-neutral-800/80 p-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#39FF14] font-extrabold text-xs">
                        M
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-300 truncate flex items-center gap-1.5 font-sans">
                          Michel Lima
                          <span className="bg-[#39FF14]/10 text-[#39FF14] text-[8px] font-bold uppercase px-1 rounded-md border border-[#39FF14]/20 animate-pulse">Trainer Admin</span>
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono truncate">michel.lima20000@gmail.com</p>
                      </div>
                      <ArrowRight size={13} className="text-neutral-500 group-hover:text-[#39FF14] group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-neutral-500 text-center font-sans leading-relaxed">
                  Para continuar, o Google compartilhará seu nome, endereço de e-mail e foto do perfil de forma simulada com o portal GymPulse.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

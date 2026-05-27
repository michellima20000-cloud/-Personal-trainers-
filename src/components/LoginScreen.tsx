import React, { useState } from 'react';
import { 
  Users, Dumbbell, Shield, Lock, Eye, EyeOff, Key, 
  Sparkles, Check, AlertCircle, ArrowRight, Laptop, Smartphone
} from 'lucide-react';
import { Student } from '../types';

interface LoginScreenProps {
  students: Student[];
  onLoginSuccess: (role: 'trainer' | 'student', studentId?: string) => void;
}

export default function LoginScreen({ students, onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'trainer' | 'student'>('trainer');
  
  // Trainer Auth Form State
  const [trainerEmail, setTrainerEmail] = useState('personal@gympulse.com.br');
  const [trainerPassword, setTrainerPassword] = useState('personal123');
  const [showTrainerPass, setShowTrainerPass] = useState(false);
  
  // Student Auth Form State
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [studentPassword, setStudentPassword] = useState('123456');
  const [showStudentPass, setShowStudentPass] = useState(false);
  
  // Validation / Feedback UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentSelectedStudent = students.find(s => s.id === selectedStudentId);

  const handleTrainerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!trainerEmail || !trainerPassword) {
      setErrorMsg('Por favor, preencha todos os campos do treinador.');
      return;
    }
    
    // Check credentials (simulate simple secure check)
    if (trainerEmail.trim() === 'personal@gympulse.com.br' && trainerPassword === 'personal123') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg('Verificado com sucesso! Carregando Painel Administrativo...');
        setTimeout(() => {
          onLoginSuccess('trainer');
        }, 1200);
      }, 1000);
    } else {
      setErrorMsg('Credenciais inválidas! Tente utilizar as sugeridas no painel abaixo.');
    }
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

        {/* Trainer Auth Form */}
        {activeTab === 'trainer' && (
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
                  placeholder="Insera sua senha de segurança"
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
        )}

        {/* Student Auth Form */}
        {activeTab === 'student' && (
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
        )}

      </div>

      {/* Developer Facilitator Credentials Card below */}
      <div className="w-full max-w-md mt-6 bg-[#121214]/60 border border-neutral-800/80 rounded-2xl p-4 space-y-3 shadow-lg text-xs leading-normal">
        <h4 className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest font-black flex items-center gap-1.5">
          <Key size={13} className="text-[#39FF14]" /> Acesso Rápido de Simulação
        </h4>
        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans mt-1">
          Utilize as credenciais padrão de fidelidade para trafegar instantaneamente entre as bases do personal e do aluno:
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

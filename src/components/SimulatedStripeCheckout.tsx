import React, { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck, CreditCard, Calendar, User, Globe, HelpCircle } from 'lucide-react';

interface SimulatedStripeCheckoutProps {
  planName: string;
  price: number;
  onSuccess: () => void;
  onCancel: () => void;
  studentName?: string;
}

export default function SimulatedStripeCheckout({
  planName,
  price,
  onSuccess,
  onCancel,
  studentName = 'Michel Lima'
}: SimulatedStripeCheckoutProps) {
  const [email, setEmail] = useState('michel.lima20000@gmail.com');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState(studentName);
  const [country, setCountry] = useState('Brasil');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0=idle, 1=validating, 2=secure_checks, 3=completing
  const [errorMsg, setErrorMsg] = useState('');

  // Handle card input formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const parts = value.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCvc(value);
  };

  const handleSubmitPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setErrorMsg('Número do cartão inválido. Em modo teste, digite 16 dígitos (ex: 4242 4242 4242 4242).');
      return;
    }
    if (expiry.length < 5) {
      setErrorMsg('Data de validade inválida (Use o formato MM/AA).');
      return;
    }
    if (cvc.length < 3) {
      setErrorMsg('CVC inválido (Digite 3 dígitos).');
      return;
    }
    if (!cardName.trim()) {
      setErrorMsg('Nome impresso no cartão é obrigatório.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);
    setProcessingStep(1);

    // Simulate Stripe payment steps
    setTimeout(() => {
      setProcessingStep(2); // Secure authorization checks
      setTimeout(() => {
        setProcessingStep(3); // Completing invoice webhooks
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fa] text-[#1e293b] font-sans overflow-y-auto flex flex-col justify-between min-h-screen">
      
      {/* Stripe Official Test Mode Warning Banner */}
      <div className="bg-[#facc15] text-[#713f12] text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 shadow-sm">
        <span className="bg-[#eab308] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">Modo de Teste</span>
        <span>Este checkout está em modo de simulação oficial do Stripe Sandbox para demonstração. Use o cartão de teste <strong className="font-mono bg-white/50 px-1 rounded">4242 4242 4242 4242</strong>.</span>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 py-8 lg:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 flex-1 items-stretch">
        
        {/* Left Column: Product Info & Order Detail (Stripe Slate Theme) */}
        <div className="md:col-span-5 flex flex-col justify-between py-2 text-[#475569]">
          <div className="space-y-6">
            <button 
              onClick={onCancel}
              className="flex items-center gap-2 text-xs font-semibold text-[#4f46e5] hover:text-[#4338ca] transition-colors font-sans focus:outline-none"
            >
              <ArrowLeft size={14} /> Voltar para GymPulse
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center shadow">
                <span className="text-white font-black text-xs">GP</span>
              </div>
              <span className="text-sm font-bold text-slate-800 tracking-tight font-mono uppercase">GymPulse Ltda.</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-mono tracking-widest text-[#64748b]">Inscrição Recorrente</span>
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Plano {planName}
              </h1>
              <span className="text-slate-500 text-xs">Acesso total à plataforma de consultoria do profissional</span>
            </div>

            <div className="flex items-baseline gap-1 pt-4 border-t border-slate-200">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                R$ {price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs text-slate-500 font-medium">BRL</span>
            </div>

            <div className="space-y-3.5 pt-6">
              <div className="flex justify-between text-xs font-sans">
                <span>Plano {planName}</span>
                <span className="font-semibold text-slate-800">R$ {price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans pb-3 border-b border-dashed border-slate-200">
                <span>Imposto sobre vendas (0%)</span>
                <span className="text-slate-400">R$ 0,00</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 font-mono">
                <span>Total estimado hoje</span>
                <span>R$ {price.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          <div className="pt-8 md:pt-0 space-y-2 text-[11px] text-slate-400 font-mono">
            <p className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              Conexão criptografada via HTTPS (AES-256)
            </p>
            <p>Seu pagamento é processado diretamente pelo servidor seguro do Stripe Sandbox de teste.</p>
          </div>
        </div>

        {/* Right Column: Checkout Form (Classic Stripe Payment UI) */}
        <div className="md:col-span-7 bg-white p-6 lg:p-8 rounded-2xl border border-slate-200/80 shadow-md self-center max-w-xl w-full">
          {isProcessing ? (
            /* Secure processing sequence modal overlay or layout */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-5 animate-scale-up">
              <div className="w-14 h-14 border-4 border-slate-100 border-t-[#6366f1] rounded-full animate-spin"></div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-950 font-mono uppercase tracking-widest animate-pulse">
                  {processingStep === 1 && 'Contatando Servidor Stripe...'}
                  {processingStep === 2 && 'Rodando Autenticação 3D Secure...'}
                  {processingStep === 3 && 'Aprovando Fatura de Serviço...'}
                </h3>
                <p className="text-xs text-slate-500 font-sans max-w-xs leading-normal">
                  {processingStep === 1 && 'Validando chaves criptográficas RSA e hashes privados do cartão.'}
                  {processingStep === 2 && 'Enviando desafio biométrico do banco emissor para aprovação em piloto.'}
                  {processingStep === 3 && 'Sucesso! Sincronizando com os webhooks GymPulse e finalizando.'}
                </p>
              </div>
              <div className="pt-2 text-[10px] text-slate-400 font-mono uppercase tracking-widest bg-slate-50 px-3 py-1 rounded">
                Ambiente Licenciado Stripe v3
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitPay} className="space-y-5 font-sans">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
                Pague com cartão de crédito
              </h2>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 text-left">
                  {errorMsg}
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Endereço de e-mail</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] bg-white text-slate-950 outline-none transition"
                />
              </div>

              {/* Card Details Group */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Informações do cartão</label>
                <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:border-[#6366f1] focus-within:ring-1 focus-within:ring-[#6366f1] transition bg-white">
                  
                  {/* Card Number */}
                  <div className="flex items-center px-3.5 border-b border-slate-200">
                    <CreditCard size={16} className="text-slate-400 mr-2.5 shrink-0" />
                    <input 
                      type="text"
                      required
                      placeholder="1234 5678 1234 5678"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full py-2.5 text-sm outline-none bg-white text-slate-950 font-mono"
                    />
                    <div className="flex gap-1 pl-2 font-mono text-[9px] font-black text-slate-400 uppercase select-none">
                      <span>Visa</span>
                      <span>MC</span>
                    </div>
                  </div>

                  {/* Expiry & CVC */}
                  <div className="grid grid-cols-2">
                    <div className="flex items-center px-3.5 border-r border-slate-200">
                      <Calendar size={14} className="text-slate-400 mr-2 shrink-0" />
                      <input 
                        type="text"
                        required
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="w-full py-2.5 text-sm outline-none bg-white text-slate-950 font-mono"
                      />
                    </div>
                    <div className="flex items-center px-3.5">
                      <Lock size={14} className="text-slate-400 mr-2 shrink-0" />
                      <input 
                        type="password"
                        required
                        placeholder="CVC"
                        value={cvc}
                        onChange={handleCvcChange}
                        className="w-full py-2.5 text-sm outline-none bg-white text-slate-950 font-mono"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-mono italic">
                  * Você pode usar e preencher qualquer cartão de teste fictício para testar.
                </p>
              </div>

              {/* Name on Card */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Nome no cartão</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Nome completo impresso"
                    className="w-full border border-slate-300 rounded-lg pl-10 pr-3.5 py-2.5 text-sm focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] bg-white text-slate-950 outline-none transition uppercase"
                  />
                </div>
              </div>

              {/* Country & Postal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 font-sans">País ou região</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-3.5 text-slate-400" />
                    <select 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg pl-8 pr-3.5 py-2.5 text-sm focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] bg-white text-slate-950 outline-none transition cursor-pointer appearance-none"
                    >
                      <option value="Brasil">Brasil</option>
                      <option value="Estados Unidos">Estados Unidos</option>
                      <option value="Portugal">Portugal</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 font-sans">Código Postal (CEP)</label>
                  <input 
                    type="text" 
                    placeholder="01000-000"
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] bg-white text-slate-950 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] text-white py-3 px-4 rounded-lg font-bold text-sm tracking-wide transition shadow-lg shadow-indigo-650/15 select-none cursor-pointer text-center"
                >
                  Pagar R$ {price.toFixed(2).replace('.', ',')}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-normal">
                Ao finalizar, você confirma que está em ambiente integrado de simulação.<br/>
                Os dados inseridos não serão cobrados ou expostos.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Footer footer-secure */}
      <div className="bg-[#f1f5f9] border-t border-slate-200 py-4 text-center text-slate-400 text-[10px] font-medium flex items-center justify-center gap-3 select-none">
        <span className="font-bold flex items-center gap-1"><Lock size={10} className="text-slate-400" /> stripe</span>
        <span>•</span>
        <span>Termos de Serviço</span>
        <span>•</span>
        <span>Privacidade</span>
      </div>

    </div>
  );
}

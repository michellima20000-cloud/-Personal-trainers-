import { Student, Exercise, TrainingSheet, EvolutionRecord, AgendaEvent, ChatMessage, AppNotification, RevenueLog, MarketingPlan } from './types';

// Standard Exercise Bank
export const EXERCISE_BANK: Exercise[] = [
  {
    id: 'e1',
    name: 'Supino Reto com Barra',
    category: 'Peito',
    videoUrl: 'https://www.youtube.com/embed/sqOw2Y6u9as',
    description: 'Deite no banco, mantenha os pés firmes no chão, desça a barra até o peito preservando as escápulas aduzidas e empurre.'
  },
  {
    id: 'e2',
    name: 'Crucifixo Halteres no Banco Plano',
    category: 'Peito',
    videoUrl: 'https://www.youtube.com/embed/8-PCoHIdD0U',
    description: 'Abra os braços de forma semicircular controlando a descida, e retorne contraindo o peitoral.'
  },
  {
    id: 'e3',
    name: 'Puxada alta (Pulldown) na Pulley',
    category: 'Costas',
    videoUrl: 'https://www.youtube.com/embed/YpS8VfS7fM4',
    description: 'Puxe a barra em direção ao peitoral, ativando as dorsais e evitando balanços excessivos.'
  },
  {
    id: 'e4',
    name: 'Remada Curvada com Barra',
    category: 'Costas',
    videoUrl: 'https://www.youtube.com/embed/Z0oD9S8UaV0',
    description: 'Incline o tronco à frente, mantenha a coluna neutra e puxe a barra na linha do umbigo.'
  },
  {
    id: 'e5',
    name: 'Desenvolvimento com Halteres',
    category: 'Ombro',
    videoUrl: 'https://www.youtube.com/embed/Ssh60mcoX0c',
    description: 'Sentado com apoio na lombar, empurre os halteres para cima acima da cabeça controlando o retorno.'
  },
  {
    id: 'e6',
    name: 'Elevação Lateral com Halter',
    category: 'Ombro',
    videoUrl: 'https://www.youtube.com/embed/3VcKaX8hNdk',
    description: 'Eleve os halteres lateralmente mantendo uma leve flexão nos cotovelos até a linha dos ombros.'
  },
  {
    id: 'e7',
    name: 'Rosca Direta com Barra W',
    category: 'Bíceps',
    videoUrl: 'https://www.youtube.com/embed/fIWP-SR75gM',
    description: 'Contraia os bíceps trazendo a barra em direção aos ombros sem afastar os cotovelos do tronco.'
  },
  {
    id: 'e8',
    name: 'Tríceps Corda no Pulley',
    category: 'Tríceps',
    videoUrl: 'https://www.youtube.com/embed/1vGlvF384f8',
    description: 'Estenda totalmente os braços para baixo, abrindo as pontas da corda ao final da contração.'
  },
  {
    id: 'e9',
    name: 'Agachamento Livre com Barra',
    category: 'Pernas',
    videoUrl: 'https://www.youtube.com/embed/EP-m9Uo8GZ4',
    description: 'Posicione a barra nos trapézios, desça quadril abaixo da linha dos joelhos mantendo o peito erguido.'
  },
  {
    id: 'e10',
    name: 'Leg Press 45º',
    category: 'Pernas',
    videoUrl: 'https://www.youtube.com/embed/yF_U5j77UAs',
    description: 'Apoie os pés na plataforma na largura dos ombros, desça flexionando os joelhos a 90 graus e empurre.'
  },
  {
    id: 'e11',
    name: 'Cadeira Extensora',
    category: 'Pernas',
    videoUrl: 'https://www.youtube.com/embed/K8O2mR5z_tI',
    description: 'Extensão completa de joelhos mantendo a contração de pico no topo por 1 segundo.'
  },
  {
    id: 'e12',
    name: 'Mesa Flexora',
    category: 'Pernas',
    videoUrl: 'https://www.youtube.com/embed/n4aO69Z0q-Y',
    description: 'Deite-se de bruços, flexione as pernas trazendo o rolo até a região do glúteo controlando a descida.'
  },
  {
    id: 'e13',
    name: 'Elevação Pélvica',
    category: 'Glúteos',
    videoUrl: 'https://www.youtube.com/embed/Y_T2j9CWhpY',
    description: 'Apoie as costas no banco, posicione a carga no quadril e contraia os glúteos erguendo a pelve.'
  },
  {
    id: 'e14',
    name: 'Abdominal Supra na Polia',
    category: 'Abdômen',
    videoUrl: 'https://www.youtube.com/embed/c04E9z4f2Ew',
    description: 'Ajoelhado na polia com a corda na nuca, contraia o abdômen trazendo os cotovelos em direção aos joelhos.'
  },
  {
    id: 'e15',
    name: 'Corrida na Esteira (HIIT)',
    category: 'Cardio',
    videoUrl: 'https://www.youtube.com/embed/8-9-BovL3u4',
    description: 'Intercale 1 minuto de tiro de alta velocidade com 1 minuto de caminhada ativa para recuperação.'
  }
];

// Initial Students List
export const INITIAL_STUDENTS: Student[] = [];

// Initial Training Sheets for Students
export const INITIAL_SHEETS: Record<string, TrainingSheet> = {};

// Initial History of Measurements and Evolution for Students
export const INITIAL_EVOLUTION_RECORDS: Record<string, EvolutionRecord[]> = {};

// Scheduled Appointments (Calendar Event Database)
export const INITIAL_AGENDA: AgendaEvent[] = [];

// Initial Chat messages databases
export const INITIAL_CHATS: Record<string, ChatMessage[]> = {};

// Automated Notification logs database representation
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// Financial metrics database representation
export const REVENUE_LOGS: RevenueLog[] = [];

export const INITIAL_MARKETING_PLANS: MarketingPlan[] = [
  {
    id: 'Mensal',
    title: 'Plano Mensal',
    price: 150,
    period: '/m',
    features: ['Planilha Treino A-E', 'Suporte Conversa Chat', 'Cobrança automática'],
    recommended: false
  },
  {
    id: 'Trimestral',
    title: 'Plano Trimestral',
    price: 140,
    period: '/m',
    features: ['Planilha Treino A-E', 'Suporte Conversa Chat', 'Monitor de Medidas', 'Treino presencial semanal'],
    recommended: true
  },
  {
    id: 'Anual',
    title: 'Plano Anual',
    price: 90,
    period: '/m',
    features: ['Planilha Treino A-E', 'Suporte Conversa e Áudio', 'Avaliação Física Completa', 'Acompanhamento de Metas & Peso', 'Acesso 12 Meses Premium'],
    recommended: false
  }
];

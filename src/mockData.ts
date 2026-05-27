import { Student, Exercise, TrainingSheet, EvolutionRecord, AgendaEvent, ChatMessage, AppNotification, RevenueLog } from './types';

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
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    name: 'Ana Silva',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    age: 26,
    weight: 62.5,
    height: 1.68,
    objective: 'Hipertrofia',
    restrictions: 'Nenhuma restrição articular ou cardiovascular relevante.',
    history: 'Pratica musculação há 1 ano de forma irregular. Busca ganhar massa magra geral.',
    plan: 'Semestral',
    status: 'Ativo',
    joinedAt: '12/01/2026',
    nextPayment: '12/07/2026',
    value: 120.00
  },
  {
    id: 's2',
    name: 'Carlos Souza',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    age: 38,
    weight: 94.2,
    height: 1.76,
    objective: 'Emagrecimento',
    restrictions: 'Leve condromalácia patelar no joelho direito (evitar agachamento ultra profundo e impactos severos).',
    history: 'Sedentário há 4 anos. Iniciou o planejamento focado em recondicionamento e redução de gordura.',
    plan: 'Trimestral',
    status: 'Ativo',
    joinedAt: '15/03/2026',
    nextPayment: '15/06/2026',
    value: 140.00
  },
  {
    id: 's3',
    name: 'Igor Santos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    age: 29,
    weight: 78.0,
    height: 1.81,
    objective: 'Definição',
    restrictions: 'Hernia de disco L4-L5 (evitar cargas axiais extremas na coluna, reforçar core).',
    history: 'Intermediário, treina há 3 anos. Foco em ganho denso de massa com qualidade e condicionamento.',
    plan: 'Mensal',
    status: 'Ativo',
    joinedAt: '01/05/2026',
    nextPayment: '01/06/2026',
    value: 150.00
  },
  {
    id: 's4',
    name: 'Beatriz Costa',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    age: 32,
    weight: 54.8,
    height: 1.60,
    objective: 'Condicionamento',
    restrictions: 'Nenhuma. Deseja melhorar a saúde cardiovascular, flexibilidade e resistência geral.',
    history: 'Praticante de corrida de rua de 5km, quer musculação para fortalecer a estabilidade muscular.',
    plan: 'Semestral',
    status: 'Inativo',
    joinedAt: '10/11/2025',
    nextPayment: '10/05/2026',
    value: 110.00
  }
];

// Initial Training Sheets for Students
export const INITIAL_SHEETS: Record<string, TrainingSheet> = {
  's1': { // Ana Silva (Hipertrofia)
    A: [
      { id: 'wi1_1', exerciseId: 'e1', name: 'Supino Reto com Barra', sets: 4, reps: '8-10', restSec: 90, weightCc: 30, notes: 'Focar na cadência de descida (3 segundos excêntricos).' },
      { id: 'wi1_2', exerciseId: 'e2', name: 'Crucifixo Halteres no Banco Plano', sets: 3, reps: '12', restSec: 60, weightCc: 10, notes: 'Alongar bem o peitoral ao descer, manter cotovelos fixos.' },
      { id: 'wi1_3', exerciseId: 'e5', name: 'Desenvolvimento com Halteres', sets: 4, reps: '10', restSec: 75, weightCc: 12, notes: 'Manter a lombar bem apoiada e estabilizada.' },
      { id: 'wi1_4', exerciseId: 'e6', name: 'Elevação Lateral com Halter', sets: 4, reps: '12-15', restSec: 60, weightCc: 6, notes: 'Fazer dropset na última série se aguentar.' },
      { id: 'wi1_5', exerciseId: 'e8', name: 'Tríceps Corda no Pulley', sets: 4, reps: '12', restSec: 60, weightCc: 20, notes: 'Estender totalmente e abrir as pontas da corda embaixo.' }
    ],
    B: [
      { id: 'wi1_6', exerciseId: 'e3', name: 'Puxada alta (Pulldown) na Pulley', sets: 4, reps: '10-12', restSec: 90, weightCc: 35, notes: 'Inicie o movimento deprimindo as escápulas.' },
      { id: 'wi1_7', exerciseId: 'e4', name: 'Remada Curvada com Barra', sets: 4, reps: '10', restSec: 90, weightCc: 25, notes: 'Manter abdômen bem contraído para proteção lombar.' },
      { id: 'wi1_8', exerciseId: 'e7', name: 'Rosca Direta com Barra W', sets: 4, reps: '10-12', restSec: 75, weightCc: 14, notes: 'Evitar roubar balançando as costas.' },
      { id: 'wi1_9', exerciseId: 'e14', name: 'Abdominal Supra na Polia', sets: 4, reps: '15-20', restSec: 60, weightCc: 25, notes: 'Concentrar a força inteiramente no reto abdominal.' }
    ],
    C: [
      { id: 'wi1_10', exerciseId: 'e9', name: 'Agachamento Livre com Barra', sets: 4, reps: '8-10', restSec: 120, weightCc: 40, notes: 'Joelhos alinhados com a ponta dos pés.' },
      { id: 'wi1_11', exerciseId: 'e10', name: 'Leg Press 45º', sets: 4, reps: '12', restSec: 90, weightCc: 120, notes: 'Não estender totalmente o joelho na subida (evitar hiperextensão).' },
      { id: 'wi1_12', exerciseId: 'e11', name: 'Cadeira Extensora', sets: 3, reps: '10 (Isometria 2")', restSec: 60, weightCc: 35, notes: 'Pausa de 2 segundos no pico de contração.' },
      { id: 'wi1_13', exerciseId: 'e12', name: 'Mesa Flexora', sets: 4, reps: '12', restSec: 60, weightCc: 20, notes: 'Controlar o retorno da carga (não desabar).' },
      { id: 'wi1_14', exerciseId: 'e13', name: 'Elevação Pélvica', sets: 4, reps: '10', restSec: 90, weightCc: 50, notes: 'Contração forte de glúteos em cima.' }
    ],
    D: [],
    E: []
  },
  's2': { // Carlos Souza (Emagrecimento / Condicional)
    A: [
      { id: 'wi2_1', exerciseId: 'e10', name: 'Leg Press 45º', sets: 4, reps: '15', restSec: 60, weightCc: 80, notes: 'Amplitude confortável para proteger o joelho direito. Empurrar com calcanhar.' },
      { id: 'wi2_2', exerciseId: 'e11', name: 'Cadeira Extensora', sets: 4, reps: '15', restSec: 45, weightCc: 20, notes: 'Treino de alta densidade (descanso curto).' },
      { id: 'wi2_3', exerciseId: 'e1', name: 'Supino Reto com Barra', sets: 3, reps: '15', restSec: 60, weightCc: 20, notes: 'Manter ritmo constante de execução.' },
      { id: 'wi2_4', exerciseId: 'e15', name: 'Corrida na Esteira (HIIT)', sets: 1, reps: '20 min', restSec: 0, weightCc: 0, notes: '1 min moderado / 1 min rápido intercalados.' }
    ],
    B: [
      { id: 'wi2_5', exerciseId: 'e3', name: 'Puxada alta (Pulldown) na Pulley', sets: 4, reps: '12-15', restSec: 60, weightCc: 25, notes: 'Caprichar na postura e coordenação.' },
      { id: 'wi2_6', exerciseId: 'e12', name: 'Mesa Flexora', sets: 4, reps: '15', restSec: 60, weightCc: 15, notes: 'Isquiotibiais fortes estabilizam o joelho.' },
      { id: 'wi2_7', exerciseId: 'e6', name: 'Elevação Lateral com Halter', sets: 3, reps: '15', restSec: 45, weightCc: 4, notes: 'Cargas moderadas, sem pressa.' },
      { id: 'wi2_8', exerciseId: 'e14', name: 'Abdominal Supra na Polia', sets: 4, reps: '20', restSec: 45, weightCc: 15, notes: 'Manter ritmo metabólico alto.' }
    ],
    C: [],
    D: [],
    E: []
  },
  's3': { // Igor Santos (Definição)
    A: [
      { id: 'wi3_1', exerciseId: 'e1', name: 'Supino Reto com Barra', sets: 4, reps: '10', restSec: 90, weightCc: 55, notes: 'Carga progressiva. Estabilize bem as escápulas no banco.' },
      { id: 'wi3_2', exerciseId: 'e5', name: 'Desenvolvimento com Halteres', sets: 4, reps: '10', restSec: 75, weightCc: 20, notes: 'Manter coluna apoiada. Sem empurrar de forma desalinhada.' },
      { id: 'wi3_3', exerciseId: 'e8', name: 'Tríceps Corda no Pulley', sets: 4, reps: '12', restSec: 60, weightCc: 25, notes: 'Estenda os braços ao máximo.' }
    ],
    B: [
      { id: 'wi3_4', exerciseId: 'e3', name: 'Puxada alta (Pulldown) na Pulley', sets: 4, reps: '10', restSec: 90, weightCc: 50, notes: 'Estenda o peito para cima na puxada.' },
      { id: 'wi3_5', exerciseId: 'e4', name: 'Remada Curvada com Barra', sets: 4, reps: '10', restSec: 90, weightCc: 35, notes: 'Tronco firme e abdômen ativado.' },
      { id: 'wi3_6', exerciseId: 'e7', name: 'Rosca Direta com Barra W', sets: 4, reps: '10-12', restSec: 75, weightCc: 22, notes: 'Bíceps bem estendidos no final de cada repetição.' }
    ],
    C: [
      { id: 'wi3_7', exerciseId: 'e10', name: 'Leg Press 45º', sets: 5, reps: '10', restSec: 90, weightCc: 160, notes: 'Carga pesada. Descer o máximo mantendo quadril colado.' },
      { id: 'wi3_8', exerciseId: 'e11', name: 'Cadeira Extensora', sets: 4, reps: '12', restSec: 60, weightCc: 45, notes: 'Isometria de 1 segundo em cima.' }
    ],
    D: [],
    E: []
  },
  's4': { // Beatriz Costa
    A: [],
    B: [],
    C: [],
    D: [],
    E: []
  }
};

// Initial History of Measurements and Evolution for Students
export const INITIAL_EVOLUTION_RECORDS: Record<string, EvolutionRecord[]> = {
  's1': [
    {
      id: 'ev1_1',
      studentId: 's1',
      date: '2026-03-01',
      weight: 65.0,
      bmi: 23.0,
      bodyFat: 24.5,
      armRight: 28,
      armLeft: 27.5,
      waist: 72,
      chest: 88,
      legRight: 56,
      legLeft: 55.5,
      notes: 'Avaliação inicial. Objetivos delineados para ganho de massa magra geral.',
      photoUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=300&auto=format&fit=crop&q=80'
    },
    {
      id: 'ev1_2',
      studentId: 's1',
      date: '2026-04-15',
      weight: 63.8,
      bmi: 22.6,
      bodyFat: 22.8,
      armRight: 28.5,
      armLeft: 28.2,
      waist: 70,
      chest: 88.5,
      legRight: 57,
      legLeft: 56.5,
      notes: 'Diminuição notável de gordura na cintura e ganho de volume limpo nas coxas e braços.',
      photoUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=300&auto=format&fit=crop&q=80'
    },
    {
      id: 'ev1_3',
      studentId: 's1',
      date: '2026-05-20',
      weight: 62.5,
      bmi: 22.1,
      bodyFat: 20.5,
      armRight: 29.0,
      armLeft: 29.0,
      waist: 67,
      chest: 89,
      legRight: 58,
      legLeft: 57.5,
      notes: 'Excelente desempenho! Definição abdominal aparecendo. Massa magra preservada e ampliada.',
      photoUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=300&auto=format&fit=crop&q=80'
    }
  ],
  's2': [
    {
      id: 'ev2_1',
      studentId: 's2',
      date: '2026-03-20',
      weight: 98.2,
      bmi: 31.7,
      bodyFat: 29.8,
      armRight: 39,
      armLeft: 39,
      waist: 104,
      chest: 110,
      legRight: 62,
      legLeft: 61,
      notes: 'Avaliação inicial em jejum. Foco em déficit calórico progressivo e recondicionamento.',
      photoUrl: ''
    },
    {
      id: 'ev2_2',
      studentId: 's2',
      date: '2026-04-20',
      weight: 96.0,
      bmi: 31.0,
      bodyFat: 28.2,
      armRight: 38.5,
      armLeft: 38.5,
      waist: 100,
      chest: 108,
      legRight: 61.5,
      legLeft: 60.5,
      notes: 'Ótima resposta de emagrecimento inicial. Redução de 4cm de abdômen em 1 mês.',
      photoUrl: ''
    },
    {
      id: 'ev2_3',
      studentId: 's2',
      date: '2026-05-25',
      weight: 94.2,
      bmi: 30.4,
      bodyFat: 26.5,
      armRight: 38.2,
      armLeft: 38.0,
      waist: 96,
      chest: 107,
      legRight: 61,
      legLeft: 60,
      notes: 'Evolução muito consistente. Dores no joelho sumiram devido ao fortalecimento focado.',
      photoUrl: ''
    }
  ],
  's3': [
    {
      id: 'ev3_1',
      studentId: 's3',
      date: '2026-05-02',
      weight: 79.5,
      bmi: 24.3,
      bodyFat: 15.5,
      armRight: 36,
      armLeft: 35.8,
      waist: 82,
      chest: 101,
      legRight: 56,
      legLeft: 56,
      notes: 'Primeira avaliação na consultoria. Deseja atingir 10% de gordura corporal.',
      photoUrl: ''
    },
    {
      id: 'ev3_2',
      studentId: 's3',
      date: '2026-05-26',
      weight: 78.0,
      bmi: 23.8,
      bodyFat: 13.8,
      armRight: 36.5,
      armLeft: 36.4,
      waist: 80,
      chest: 101.5,
      legRight: 56.5,
      legLeft: 56.2,
      notes: 'Músculos mais cheios e vascularizados. Excelente resposta do core fortalecido sem dores lombares.',
      photoUrl: ''
    }
  ],
  's4': []
};

// Scheduled Appointments (Calendar Event Database)
export const INITIAL_AGENDA: AgendaEvent[] = [
  {
    id: 'ag1',
    studentId: 's1',
    studentName: 'Ana Silva',
    title: 'Ana Silva - Hipertrofia Pernas',
    date: '2026-05-28', // Tomorrow based on system metadata date of 2026-05-27
    time: '07:00',
    type: 'Presencial',
    durationMin: 60,
    notes: 'Priorizar elevação pélvica e correção de agachamento.'
  },
  {
    id: 'ag2',
    studentId: 's2',
    studentName: 'Carlos Souza',
    title: 'Carlos Souza - Condicionamento Geral',
    date: '2026-05-28',
    time: '08:30',
    type: 'Presencial',
    durationMin: 60,
    notes: 'Aquecimento na esteira, foco em leg-press no limite articular do joelho.'
  },
  {
    id: 'ag3',
    studentId: 's3',
    studentName: 'Igor Santos',
    title: 'Consultoria Online Igor (Feedback Mensal)',
    date: '2026-05-29',
    time: '19:00',
    type: 'Online',
    durationMin: 30,
    notes: 'Ajuste fino de planilha alimentar sincronizada de treinos.'
  },
  {
    id: 'ag4',
    studentId: 's1',
    studentName: 'Ana Silva',
    title: 'Ana Silva - Treino Superior',
    date: '2026-05-30',
    time: '07:00',
    type: 'Presencial',
    durationMin: 60
  }
];

// Initial Chat messages databases
export const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  's1': [
    { id: 'm1_1', sender: 'trainer', text: 'Bom dia Ana! Preparei sua nova ficha de pernas com foco em glúteos adicionando a elevação pélvica pesada. Pronta pros treinos?', timestamp: '09:12' },
    { id: 'm1_2', sender: 'student', text: 'Bom dia Professor! Estou super animada. Já andei dando uma olhada nos exercícios pelo aplicativo, os vídeos explicativos facilitam demais.', timestamp: '09:43' },
    { id: 'm1_3', sender: 'trainer', text: 'Perfeito! Amanhã às 07:00 faremos ela presencialmente pra ajustar a técnica. Lembre-se de tomar bastante água hoje.', timestamp: '10:00' },
    { id: 'm1_4', sender: 'student', text: 'Pode deixar!', timestamp: '10:15' }
  ],
  's2': [
    { id: 'm2_1', sender: 'trainer', text: 'Fala Carlos! Como está sentindo o joelho depois do penúltimo treino de pernas?', timestamp: '18:00' },
    { id: 'm2_2', sender: 'student', text: 'Olá professor! Cara, incrível, nenhuma pontada no joelho direito. Senti que a isometria na extensora ajudou a aquecer bem e estabilizar.', timestamp: '18:32' },
    { id: 'm2_3', sender: 'trainer', text: 'Excelente feedback! Esse é o segredo, fortalecer de forma segura para aumentar o gasto calórico sem lesões. Continue firme!', timestamp: '18:45' }
  ],
  's3': [
    { id: 'm3_1', sender: 'student', text: 'Professor, aumentei a carga do supino para 55kg hoje e fiz 10 repetições perfeitas!', timestamp: '11:10' },
    { id: 'm3_2', sender: 'trainer', text: 'Monstro! Grande progresso de força, com técnica apurada. Carga anotada. Na próxima semana talvez busquemos 58kg!', timestamp: '11:40' }
  ],
  's4': []
};

// Automated Notification logs database representation
export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    studentId: 's1',
    studentName: 'Ana Silva',
    title: 'Nova Ficha Atualizada! 🏋️',
    message: 'Seu personal montou o Treino A novo. Acesse sua aba de treinos para conferir.',
    channel: 'push',
    type: 'workout',
    sentAt: '25/05/2026 09:15'
  },
  {
    id: 'n2',
    studentId: 's1',
    studentName: 'Ana Silva',
    title: 'Horário do Treino Amanhã! ⏰',
    message: 'Olá Ana, lembramos que seu treino presencial está agendado para amanhã às 07:00.',
    channel: 'whatsapp',
    type: 'reminder',
    sentAt: '27/05/2026 12:00'
  },
  {
    id: 'n3',
    studentId: 's2',
    studentName: 'Carlos Souza',
    title: 'Hidratação constante! 💧',
    message: 'Lembrete do Personal: Calcule uns 3.5 litros de água para seu dia hoje, foco no emagrecimento.',
    channel: 'whatsapp',
    type: 'reminder',
    sentAt: '27/05/2026 10:30'
  },
  {
    id: 'n4',
    studentId: 's3',
    studentName: 'Igor Santos',
    title: 'Mensagem Motivacional 💪',
    message: 'A constância supera o talento em qualquer dia da semana. Mantenha o plano!',
    channel: 'email',
    type: 'motivation',
    sentAt: '26/05/2026 08:00'
  }
];

// Financial metrics database representation
export const REVENUE_LOGS: RevenueLog[] = [
  { month: 'Jan', total: 1050, payments: 8 },
  { month: 'Fev', total: 1350, payments: 10 },
  { month: 'Mar', total: 1650, payments: 12 },
  { month: 'Abr', total: 1800, payments: 13 },
  { month: 'Mai', total: 2150, payments: 15 } // Mai/2026 current
];

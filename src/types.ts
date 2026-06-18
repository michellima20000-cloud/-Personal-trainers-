/**
 * GymPulse TypeScript Definitions
 */

export type Objective = 'Hipertrofia' | 'Emagrecimento' | 'Condicionamento' | 'Definição' | 'Reabilitação';

export type PlanType = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

export interface Student {
  id: string;
  name: string;
  avatar: string;
  age: number;
  weight: number;
  height: number;
  objective: Objective;
  restrictions: string;
  history: string;
  plan: PlanType;
  status: 'Ativo' | 'Inativo';
  joinedAt: string;
  nextPayment: string;
  value: number;
  trainerId?: string;
  email?: string;
  password?: string;
  phoneWhatsApp?: string;
  isProfileComplete?: boolean;
  accessMethod?: 'google' | 'password';
  paymentDetailsConfirmed?: boolean;
  gender?: string;
  observations?: string;
  activeSheetId?: string;
  lastActiveAt?: string;
  createdAt?: string;
  uid?: string;
  trainerName?: string;
  nomePersonal?: string;
  // Portuguese mappings for absolute compatibility
  nome?: string;
  telefone?: string;
  statusAguardando?: string;
  plano?: string;
  onboarding?: string | boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'Peito' | 'Costas' | 'Ombro' | 'Bíceps' | 'Tríceps' | 'Pernas' | 'Glúteos' | 'Abdômen' | 'Cardio';
  videoUrl: string;
  description: string;
  gifUrl?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string; // e.g. "12", "10-12", "FALHA"
  restSec: number;
  weightCc: number; // weight target in kg
  notes: string;
  // Student interaction properties
  completed?: boolean;
  userLoggedWeight?: number;
  userFeedback?: string;
  videoCompleted?: boolean;
}

export interface TrainingSheet {
  A: WorkoutExercise[];
  B: WorkoutExercise[];
  C: WorkoutExercise[];
  D: WorkoutExercise[];
  E: WorkoutExercise[];
}

export interface EvolutionRecord {
  id: string;
  studentId: string;
  date: string;
  weight: number;
  bmi: number;
  bodyFat?: number;
  armRight?: number;
  armLeft?: number;
  waist?: number;
  chest?: number;
  legRight?: number;
  legLeft?: number;
  notes: string;
  photoUrl?: string;
}

export interface AgendaEvent {
  id: string;
  studentId?: string;
  studentName?: string;
  title: string;
  date: string;
  time: string;
  type: 'Presencial' | 'Online';
  durationMin: number;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'trainer' | 'student';
  text: string;
  timestamp: string;
  fileType?: 'image' | 'audio' | 'video';
  fileUrl?: string;
  audioDuration?: string;
}

export interface AppNotification {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  message: string;
  channel: 'push' | 'whatsapp' | 'email';
  type: 'reminder' | 'motivation' | 'plan' | 'workout';
  sentAt: string;
}

export interface RevenueLog {
  month: string;
  total: number;
  payments: number;
}

export interface AccessLog {
  id: string;
  role: 'trainer' | 'student';
  userId?: string;
  userName: string;
  timestamp: string;
  action: string;
  device: string;
}

export interface MarketingPlan {
  id: string; // 'Mensal' | 'Trimestral' | 'Semestral'
  title: string;
  price: number;
  period: string; // e.g. "/m"
  features: string[];
  recommended?: boolean;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  password?: string;
  selectedPlan: PlanType;
  trialStartDate: string;
  trialExpiresAt: string;
  subscriptionStatus: 'trial' | 'paid' | 'expired';
  customIdLink: string; // personalized link key, like 'daniel-personal'
  pixKeyType?: 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Chave Aleatória';
  pixKey?: string;
  pixQrCode?: string;
  phoneWhatsApp?: string;
  stripeEnabled?: boolean;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  themeColor?: string;
}


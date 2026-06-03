import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, TrainingSheet, EvolutionRecord, AgendaEvent, ChatMessage, AppNotification, RevenueLog, AccessLog, MarketingPlan, Trainer } from '../types';

// Initialize App and SDK exports with environment variables fallback
const metaEnv = (import.meta as any).env || {};

const config = {
  apiKey: (metaEnv.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey,
  authDomain: (metaEnv.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig.authDomain,
  projectId: (metaEnv.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig.projectId,
  storageBucket: (metaEnv.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig.storageBucket,
  messagingSenderId: (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig.messagingSenderId,
  appId: (metaEnv.VITE_FIREBASE_APP_ID as string) || firebaseConfig.appId,
  measurementId: (metaEnv.VITE_FIREBASE_MEASUREMENT_ID as string) || (firebaseConfig as any).measurementId,
  databaseURL: (metaEnv.VITE_FIREBASE_DATABASE_URL as string) || (firebaseConfig as any).databaseURL,
};

const app = initializeApp(config);

const envDbId = metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string;
let databaseId = '';

const isInvalidId = (id: any): boolean => {
  if (!id) return true;
  const s = String(id).trim();
  return (
    s === '' ||
    s === 'undefined' ||
    s === 'null' ||
    s === '(default)' ||
    s === '(padrão)' ||
    s === 'default'
  );
};

if (!isInvalidId(envDbId)) {
  databaseId = String(envDbId).trim();
} else if (!isInvalidId(firebaseConfig.firestoreDatabaseId)) {
  databaseId = String(firebaseConfig.firestoreDatabaseId).trim();
}

console.log("[Firebase Initialization] Project ID:", config.projectId, "Database ID:", databaseId || "(default)");

export const db = databaseId
  ? getFirestore(app, databaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Sign-in Anonymously on bootstrap
export async function initializeAnonymousAuth(): Promise<void> {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Logged in anonymously to Firebase as ID:", userCredential.user.uid);
  } catch (error: any) {
    if (error && error.code === 'auth/admin-restricted-operation') {
      console.log("Anonymous Auth provider is disabled in Firebase Console. Operating in browser sandbox connection mode.");
    } else {
      console.log("Anonymous authentication skipped/unconfigured:", error instanceof Error ? error.message : error);
    }
  }
}

// Connection test guard
export async function testConnection(): Promise<{ success: boolean; error: string | null; config: any }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return {
      success: true,
      error: null,
      config: {
        projectId: config.projectId,
        databaseId: databaseId || '(default)',
        authDomain: config.authDomain,
        apiKeyObfuscated: config.apiKey ? `${config.apiKey.substring(0, 6)}...${config.apiKey.substring(config.apiKey.length - 4)}` : 'N/A'
      }
    };
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    // Log diagnostic error too
    const dbgErr: FirestoreErrorInfo = {
      error: errorMsg,
      operationType: OperationType.GET,
      path: 'test/connection',
      authInfo: {
        userId: auth.currentUser?.uid || null,
        email: auth.currentUser?.email || null,
        emailVerified: auth.currentUser?.emailVerified || null,
        isAnonymous: auth.currentUser?.isAnonymous || null,
      }
    };
    addFirestoreErrorLog(dbgErr);
    return {
      success: false,
      error: errorMsg,
      config: {
        projectId: config.projectId,
        databaseId: databaseId || '(default)',
        authDomain: config.authDomain,
        apiKeyObfuscated: config.apiKey ? `${config.apiKey.substring(0, 6)}...${config.apiKey.substring(config.apiKey.length - 4)}` : 'N/A'
      }
    };
  }
}

// Operation types matching instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface DiagnosticErrorLog extends FirestoreErrorInfo {
  timestamp: string;
}

export const firestoreErrorLogs: DiagnosticErrorLog[] = (() => {
  try {
    const raw = localStorage.getItem('gympulse_firestore_errors');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

export function clearFirestoreErrorLogs(): void {
  firestoreErrorLogs.length = 0;
  try {
    localStorage.removeItem('gympulse_firestore_errors');
  } catch (e) {
    console.error(e);
  }
}

export function addFirestoreErrorLog(errInfo: FirestoreErrorInfo): void {
  const log: DiagnosticErrorLog = {
    ...errInfo,
    timestamp: new Date().toISOString()
  };
  
  // Check duplicates in the last 5 seconds to avoid flooding
  const duplicate = firestoreErrorLogs.find(
    existing => 
      existing.error === log.error && 
      existing.path === log.path && 
      existing.operationType === log.operationType &&
      (new Date(log.timestamp).getTime() - new Date(existing.timestamp).getTime() < 5000)
  );
  if (duplicate) return;

  firestoreErrorLogs.unshift(log);
  if (firestoreErrorLogs.length > 50) {
    firestoreErrorLogs.pop();
  }
  try {
    localStorage.setItem('gympulse_firestore_errors', JSON.stringify(firestoreErrorLogs));
  } catch (e) {
    console.error(e);
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  addFirestoreErrorLog(errInfo);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper utility to recursively remove undefined properties before saving to Firestore.
// This guarantees Firestore never receives an 'undefined' value for optional properties.
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        newObj[key] = cleanUndefined(val);
      }
    }
    return newObj;
  }
  return obj;
}

// 1. Students CRUD
export async function fetchStudents(): Promise<Student[]> {
  const p = 'students';
  try {
    const snap = await getDocs(collection(db, p));
    const list: Student[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Student);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveStudent(student: Student): Promise<void> {
  const p = `students/${student.id}`;
  try {
    await setDoc(doc(db, 'students', student.id), cleanUndefined(student));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 2. Training Sheets index
export async function fetchSheets(): Promise<Record<string, TrainingSheet>> {
  const p = 'sheets';
  try {
    const snap = await getDocs(collection(db, p));
    const sheetsMap: Record<string, TrainingSheet> = {};
    snap.forEach((d) => {
      sheetsMap[d.id] = d.data() as TrainingSheet;
    });
    return sheetsMap;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveSheet(studentId: string, sheet: TrainingSheet): Promise<void> {
  const p = `sheets/${studentId}`;
  try {
    await setDoc(doc(db, 'sheets', studentId), cleanUndefined(sheet));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 3. Biometrics / evolution subcollection
export async function fetchAllEvolutionRecords(studentId: string): Promise<EvolutionRecord[]> {
  const p = `students/${studentId}/evolution`;
  try {
    const snap = await getDocs(collection(db, 'students', studentId, 'evolution'));
    const list: EvolutionRecord[] = [];
    snap.forEach((d) => {
      list.push(d.data() as EvolutionRecord);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveEvolutionRecord(studentId: string, record: EvolutionRecord): Promise<void> {
  const p = `students/${studentId}/evolution/${record.id}`;
  try {
    await setDoc(doc(db, 'students', studentId, 'evolution', record.id), cleanUndefined(record));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 4. Student interactive messages subcollection
export async function fetchAllChatMessages(studentId: string): Promise<ChatMessage[]> {
  const p = `students/${studentId}/chats`;
  try {
    const snap = await getDocs(collection(db, 'students', studentId, 'chats'));
    const list: ChatMessage[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ChatMessage);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveChatMessage(studentId: string, message: ChatMessage): Promise<void> {
  const p = `students/${studentId}/chats/${message.id}`;
  try {
    await setDoc(doc(db, 'students', studentId, 'chats', message.id), cleanUndefined(message));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 5. Schedules: agenda collection
export async function fetchAgendaEvents(): Promise<AgendaEvent[]> {
  const p = 'agenda';
  try {
    const snap = await getDocs(collection(db, p));
    const list: AgendaEvent[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AgendaEvent);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveAgendaEvent(event: AgendaEvent): Promise<void> {
  const p = `agenda/${event.id}`;
  try {
    await setDoc(doc(db, 'agenda', event.id), cleanUndefined(event));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

export async function deleteAgendaEventDoc(eventId: string): Promise<void> {
  const p = `agenda/${eventId}`;
  try {
    await deleteDoc(doc(db, 'agenda', eventId));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 6. Push communications notifications
export async function fetchNotifications(): Promise<AppNotification[]> {
  const p = 'notifications';
  try {
    const snap = await getDocs(collection(db, p));
    const list: AppNotification[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AppNotification);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveNotification(notif: AppNotification): Promise<void> {
  const p = `notifications/${notif.id}`;
  try {
    await setDoc(doc(db, 'notifications', notif.id), cleanUndefined(notif));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 7. Ledgers
export async function fetchRevenueLogs(): Promise<RevenueLog[]> {
  const p = 'revenueLogs';
  try {
    const snap = await getDocs(collection(db, p));
    const list: RevenueLog[] = [];
    snap.forEach((d) => {
      list.push(d.data() as RevenueLog);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveRevenueLog(log: RevenueLog): Promise<void> {
  const p = `revenueLogs/${log.month}`;
  try {
    await setDoc(doc(db, 'revenueLogs', log.month), cleanUndefined(log));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 8. Audits
export async function fetchAccessLogs(): Promise<AccessLog[]> {
  const p = 'accessLogs';
  try {
    const snap = await getDocs(collection(db, p));
    const list: AccessLog[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AccessLog);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveAccessLog(log: AccessLog): Promise<void> {
  const p = `accessLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'accessLogs', log.id), cleanUndefined(log));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 9. Marketing Plans
export async function fetchMarketingPlans(): Promise<MarketingPlan[]> {
  const p = 'plans';
  try {
    const snap = await getDocs(collection(db, p));
    const list: MarketingPlan[] = [];
    snap.forEach((d) => {
      list.push(d.data() as MarketingPlan);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
  }
}

export async function saveMarketingPlan(plan: MarketingPlan): Promise<void> {
  const p = `plans/${plan.id}`;
  try {
    await setDoc(doc(db, 'plans', plan.id), cleanUndefined(plan));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

export async function deleteMarketingPlan(planId: string): Promise<void> {
  const p = `plans/${planId}`;
  try {
    await deleteDoc(doc(db, 'plans', planId));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

// 10. Trainers collection
export async function fetchTrainers(): Promise<Trainer[]> {
  const p = 'trainers';
  try {
    const snap = await getDocs(collection(db, p));
    const list: Trainer[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Trainer);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
    return [];
  }
}

export async function saveTrainer(trainer: Trainer): Promise<void> {
  const p = `trainers/${trainer.id}`;
  try {
    await setDoc(doc(db, 'trainers', trainer.id), cleanUndefined(trainer));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
}

export async function deleteTrainerDoc(trainerId: string): Promise<void> {
  const p = `trainers/${trainerId}`;
  try {
    await deleteDoc(doc(db, 'trainers', trainerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, p);
  }
}

export async function deleteStudentDoc(studentId: string): Promise<void> {
  const p = `students/${studentId}`;
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, p);
  }
}

export async function deleteSheetDoc(studentId: string): Promise<void> {
  const p = `sheets/${studentId}`;
  try {
    await deleteDoc(doc(db, 'sheets', studentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, p);
  }
}

export async function deleteNotificationDoc(notifId: string): Promise<void> {
  const p = `notifications/${notifId}`;
  try {
    await deleteDoc(doc(db, 'notifications', notifId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, p);
  }
}

export async function deleteRevenueLogDoc(logId: string): Promise<void> {
  const p = `revenueLogs/${logId}`;
  try {
    await deleteDoc(doc(db, 'revenueLogs', logId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, p);
  }
}

export async function deleteAccessLogDoc(logId: string): Promise<void> {
  const p = `accessLogs/${logId}`;
  try {
    await deleteDoc(doc(db, 'accessLogs', logId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, p);
  }
}

// Global batch/sequential delete operations to clear data
export async function purgeTestAccountsFirestore(): Promise<void> {
  const testStudentIds = ['s1', 's2', 's3', 's4', 's5'];
  const testTrainerIds = ['t_default'];

  // Delete students & subcollections, sheets
  for (const sid of testStudentIds) {
    try {
      // Clear Chats subcollection docs
      const chatsSnap = await getDocs(collection(db, 'students', sid, 'chats'));
      for (const d of chatsSnap.docs) {
        await deleteDoc(doc(db, 'students', sid, 'chats', d.id));
      }
      // Clear Evolution subcollection docs
      const evolSnap = await getDocs(collection(db, 'students', sid, 'evolution'));
      for (const d of evolSnap.docs) {
        await deleteDoc(doc(db, 'students', sid, 'evolution', d.id));
      }
      // Delete main student profile
      await deleteDoc(doc(db, 'students', sid));
      // Delete their training plan sheet
      await deleteDoc(doc(db, 'sheets', sid));
    } catch (e) {
      console.warn(`Error deleting test student ${sid}:`, e);
    }
  }

  // Delete t_default trainer
  for (const tid of testTrainerIds) {
    try {
      await deleteDoc(doc(db, 'trainers', tid));
    } catch (e) {
      console.warn(`Error deleting test trainer ${tid}:`, e);
    }
  }

  // Also clear seed agenda events
  try {
    const agendaSnap = await getDocs(collection(db, 'agenda'));
    for (const d of agendaSnap.docs) {
      // Clear sample schedules matching seeded event names
      const title = d.data().title;
      if (title && (title.includes('Avaliação') || title.includes('Treino Intermediário') || title.includes('Reunião de Metas') || title.includes('Personal Trainer'))) {
        await deleteDoc(doc(db, 'agenda', d.id));
      }
    }
  } catch (e) {
    console.warn("Error cleaning seed agenda:", e);
  }

  // Also clear seed notification logs
  try {
    const notifsSnap = await getDocs(collection(db, 'notifications'));
    for (const d of notifsSnap.docs) {
      const id = d.id;
      if (id.startsWith('not_') || id.startsWith('sh_') || id.startsWith('ev_') || id.startsWith('log_')) {
        await deleteDoc(doc(db, 'notifications', d.id));
      }
    }
  } catch (e) {
    console.warn("Error cleaning seed notifications:", e);
  }
}

export async function purgeEntireDatabaseFirestore(): Promise<void> {
  const collections = ['students', 'sheets', 'agenda', 'notifications', 'revenueLogs', 'accessLogs', 'trainers'];

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const docItem of snap.docs) {
        // If student, clear subcollections first
        if (colName === 'students') {
          const chatsSnap = await getDocs(collection(db, 'students', docItem.id, 'chats'));
          for (const d of chatsSnap.docs) {
            await deleteDoc(doc(db, 'students', docItem.id, 'chats', d.id));
          }
          const evolSnap = await getDocs(collection(db, 'students', docItem.id, 'evolution'));
          for (const d of evolSnap.docs) {
            await deleteDoc(doc(db, 'students', docItem.id, 'evolution', d.id));
          }
        }
        await deleteDoc(doc(db, colName, docItem.id));
      }
    } catch (e) {
      console.warn(`Error clearing collection ${colName}:`, e);
    }
  }
}

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function run() {
  console.log("Starting database purge of test accounts...");

  try {
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    const configFile = await readFile(configPath, 'utf-8');
    const firebaseConfig = JSON.parse(configFile);

    const config = {
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      measurementId: firebaseConfig.measurementId,
      databaseURL: firebaseConfig.databaseURL,
    };

    const app = initializeApp(config);
    const dbId = firebaseConfig.firestoreDatabaseId;
    const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

    const testStudentIds = ['s1', 's2', 's3', 's4', 's5'];
    const testTrainerIds = ['t_default'];

    console.log("Cleaning up test students s1-s5 and t_default trainer...");

    for (const sid of testStudentIds) {
      try {
        // Clear Chats
        const chatsSnap = await getDocs(collection(db, 'students', sid, 'chats'));
        for (const d of chatsSnap.docs) {
          await deleteDoc(doc(db, 'students', sid, 'chats', d.id));
        }
        // Clear Evolution
        const evolSnap = await getDocs(collection(db, 'students', sid, 'evolution'));
        for (const d of evolSnap.docs) {
          await deleteDoc(doc(db, 'students', sid, 'evolution', d.id));
        }
        // Delete student profile and sheets
        await deleteDoc(doc(db, 'students', sid));
        await deleteDoc(doc(db, 'sheets', sid));
        console.log(`Successfully purged student: ${sid}`);
      } catch (e) {
        console.warn(`Error purging student ${sid}:`, e);
      }
    }

    // Delete t_default trainer
    for (const tid of testTrainerIds) {
      try {
        await deleteDoc(doc(db, 'trainers', tid));
        console.log(`Successfully purged trainer: ${tid}`);
      } catch (e) {
        console.warn(`Error purging trainer ${tid}:`, e);
      }
    }

    // Also clear seed agenda events matches
    try {
      const agendaSnap = await getDocs(collection(db, 'agenda'));
      for (const d of agendaSnap.docs) {
        const title = d.data().title;
        if (title && (title.includes('Avaliação') || title.includes('Treino Intermediário') || title.includes('Reunião de Metas') || title.includes('Personal Trainer'))) {
          await deleteDoc(doc(db, 'agenda', d.id));
        }
      }
      console.log("Successfully purged seed agenda events.");
    } catch (e) {
      console.warn("Error cleaning agenda events:", e);
    }

    // Clear seed notification logs
    try {
      const notifsSnap = await getDocs(collection(db, 'notifications'));
      for (const d of notifsSnap.docs) {
        const id = d.id;
        if (id.startsWith('not_') || id.startsWith('sh_') || id.startsWith('ev_') || id.startsWith('log_')) {
          await deleteDoc(doc(db, 'notifications', d.id));
        }
      }
      console.log("Successfully purged seed notifications.");
    } catch (e) {
      console.warn("Error cleaning notifications:", e);
    }

    console.log("Database clean up of test accounts completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Purge script failed:", err);
    process.exit(1);
  }
}

run();

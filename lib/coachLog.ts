import type { StopBangResult, FitnessContext } from "./riskTrajectory";
import type { CoachDecision } from "./geminiCoach";

export interface CoachLogEntry {
  date: string; // YYYY-MM-DD
  fitness: FitnessContext;
  stopBang: StopBangResult;
  decision: CoachDecision;
}

/**
 * Logs are keyed by a stable-but-anonymous per-user key (see lib/session.ts's getUserKey) —
 * previously this was a single fixed document, which meant every user's coaching history
 * collided in the same place. Found and fixed once the app had more than one real test user.
 */
const LOG_COLLECTION = "aerocoach_logs";

let firestoreLib: typeof import("firebase-admin/firestore") | null = null;

function isConfigured(): boolean {
  return Boolean(process.env.FIRESTORE_PROJECT_ID && process.env.FIRESTORE_SERVICE_ACCOUNT_KEY);
}

/**
 * Lazily initializes firebase-admin only when Firestore env vars are present, so the app
 * (and the rest of the coaching flow) still runs before GCP is wired up — logging just
 * silently no-ops until then. Requires `npm install firebase-admin`.
 */
async function getDb() {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  if (!firestoreLib) {
    firestoreLib = await import("firebase-admin/firestore");
  }

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(process.env.FIRESTORE_SERVICE_ACCOUNT_KEY as string);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIRESTORE_PROJECT_ID,
    });
  }

  return firestoreLib.getFirestore();
}

export async function getRecentLogs(userKey: string, limit = 7): Promise<CoachLogEntry[]> {
  if (!isConfigured()) return [];

  const db = await getDb();
  const snapshot = await db
    .collection(LOG_COLLECTION)
    .doc(userKey)
    .collection("entries")
    .orderBy("date", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((d) => d.data() as CoachLogEntry).reverse();
}

export async function appendLogEntry(userKey: string, entry: CoachLogEntry): Promise<void> {
  if (!isConfigured()) return;

  const db = await getDb();
  await db
    .collection(LOG_COLLECTION)
    .doc(userKey)
    .collection("entries")
    .doc(entry.date)
    .set(entry, { merge: true });
}

export function isLoggingEnabled(): boolean {
  return isConfigured();
}

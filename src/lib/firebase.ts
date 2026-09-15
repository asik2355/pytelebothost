import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
  onSnapshot,
  collection,
  query,
  where,
} from "firebase/firestore";
import { AuthUser, ActiveServer } from "../types";

// Firebase Client Configuration
// Supports either a single FIREBASE_JSON_KEY / FIREBASE_WEB_CONFIG (entire JSON) or individual keys
const parseJsonConfig = (): Record<string, string> => {
  const possibleJson =
    (typeof process !== "undefined" && (process as any).env?.FIREBASE_JSON_KEY) ||
    (typeof process !== "undefined" && (process as any).env?.FIREBASE_WEB_CONFIG) ||
    (typeof process !== "undefined" && (process as any).env?.FIREBASE_CONFIG) ||
    (import.meta as any).env?.FIREBASE_JSON_KEY ||
    (import.meta as any).env?.FIREBASE_WEB_CONFIG ||
    (import.meta as any).env?.VITE_FIREBASE_JSON_KEY ||
    "";

  if (possibleJson && typeof possibleJson === "string") {
    try {
      const parsed = JSON.parse(possibleJson.trim());
      if (parsed && typeof parsed === "object") {
        return {
          apiKey: parsed.apiKey || parsed.api_key || parsed.private_key_id || "",
          authDomain: parsed.authDomain || parsed.auth_domain || (parsed.project_id ? `${parsed.project_id}.firebaseapp.com` : ""),
          projectId: parsed.projectId || parsed.project_id || "",
          storageBucket: parsed.storageBucket || parsed.storage_bucket || (parsed.project_id ? `${parsed.project_id}.appspot.com` : ""),
          messagingSenderId: parsed.messagingSenderId || parsed.messaging_sender_id || "",
          appId: parsed.appId || parsed.app_id || "",
        };
      }
    } catch {
      // Not valid JSON or raw string
    }
  }
  return {};
};

const jsonConfig = parseJsonConfig();

const getEnvVal = (viteKey: string, standardKey: string, jsonKey: string, fallback: string = "") => {
  if (jsonConfig[jsonKey]) return jsonConfig[jsonKey];
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[viteKey]) return metaEnv[viteKey];
  if (metaEnv && metaEnv[standardKey]) return metaEnv[standardKey];
  if (typeof process !== "undefined" && (process as any).env && (process as any).env[standardKey]) {
    return (process as any).env[standardKey];
  }
  if (typeof process !== "undefined" && (process as any).env && (process as any).env[viteKey]) {
    return (process as any).env[viteKey];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVal("VITE_FIREBASE_API_KEY", "FIREBASE_API_KEY", "apiKey", "AIzaSyDkEYObHhZndnBl0zMoFPAIr-2cotr1V_8"),
  authDomain: getEnvVal("VITE_FIREBASE_AUTH_DOMAIN", "FIREBASE_AUTH_DOMAIN", "authDomain", "bot-hostbd.firebaseapp.com"),
  projectId: getEnvVal("VITE_FIREBASE_PROJECT_ID", "FIREBASE_PROJECT_ID", "projectId", "bot-hostbd"),
  storageBucket: getEnvVal("VITE_FIREBASE_STORAGE_BUCKET", "FIREBASE_STORAGE_BUCKET", "storageBucket", "bot-hostbd.firebasestorage.app"),
  messagingSenderId: getEnvVal("VITE_FIREBASE_MESSAGING_SENDER_ID", "FIREBASE_MESSAGING_SENDER_ID", "messagingSenderId", "432830986430"),
  appId: getEnvVal("VITE_FIREBASE_APP_ID", "FIREBASE_APP_ID", "appId", "1:432830986430:web:37a3fea8cdc43e56d6c6ef"),
};

// Initialize Firebase
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Helper: Format Firebase User + Firestore Data into AuthUser
 */
function mapToAuthUser(
  firebaseUser: FirebaseUser,
  firestoreData?: Record<string, any>
): AuthUser {
  return {
    id: firebaseUser.uid,
    name: firestoreData?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
    email: firebaseUser.email || firestoreData?.email || "",
    photoURL: firestoreData?.photoURL || firebaseUser.photoURL || undefined,
    avatarUrl: firestoreData?.photoURL || firebaseUser.photoURL || undefined,
    telegramUsername: firestoreData?.telegramUsername || undefined,
    role: firestoreData?.role || "user",
    balance: typeof firestoreData?.balance === "number" ? firestoreData.balance : (firestoreData?.walletBalance ?? 0),
    createdAt: firestoreData?.createdAt || new Date().toISOString(),
    lastLoginAt: firestoreData?.lastLoginAt || new Date().toISOString(),
  };
}

/**
 * 1. Google Authentication (Sign In / Sign Up)
 * Requirement:
 * - If user does NOT exist in Firestore -> Create document in users/{uid} with:
 *   name, email, photoURL, balance: 0, createdAt, lastLoginAt
 * - If user ALREADY exists -> Do NOT overwrite balance or profile, only update lastLoginAt.
 */
export async function signInWithGoogleAuth(): Promise<{ user: AuthUser; isNewUser: boolean }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const uid = fbUser.uid;
    const userDocRef = doc(db, "users", uid);

    let isNewUser = false;
    let finalData: Record<string, any> = {};

    try {
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        // New User Profile Creation
        isNewUser = true;
        const nowIso = new Date().toISOString();
        finalData = {
          id: uid,
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "Google User",
          email: fbUser.email || "",
          photoURL: fbUser.photoURL || null,
          balance: 0,
          walletBalance: 0,
          role: "user",
          createdAt: nowIso,
          lastLoginAt: nowIso,
        };

        await setDoc(userDocRef, finalData);
      } else {
        // Existing User: Preserve all previous data & balance! Only update lastLoginAt.
        const existing = snap.data();
        const nowIso = new Date().toISOString();
        
        finalData = {
          ...existing,
          lastLoginAt: nowIso,
          // Update photo or name only if previously blank
          photoURL: existing.photoURL || fbUser.photoURL || null,
          name: existing.name || fbUser.displayName || fbUser.email?.split("@")[0] || "User",
        };

        await updateDoc(userDocRef, {
          lastLoginAt: nowIso,
          photoURL: finalData.photoURL,
          name: finalData.name,
        });
      }
    } catch (firestoreErr: any) {
      console.warn("Firestore user sync warning:", firestoreErr.message);
      finalData = {
        id: uid,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
        email: fbUser.email || "",
        photoURL: fbUser.photoURL || null,
        balance: 0,
        role: "user",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }

    const authUser = mapToAuthUser(fbUser, finalData);
    return { user: authUser, isNewUser };
  } catch (error: any) {
    console.error("Firebase Google Auth error:", error);
    throw error;
  }
}

/**
 * 2. Email & Password Registration
 */
export async function registerWithEmailAuth(
  name: string,
  email: string,
  pass: string,
  telegramUsername?: string
): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = credential.user;

  // Update display name
  try {
    await updateProfile(fbUser, { displayName: name.trim() });
  } catch (e) {
    // ignore
  }

  const uid = fbUser.uid;
  const userDocRef = doc(db, "users", uid);
  const nowIso = new Date().toISOString();

  const initialProfile = {
    id: uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    photoURL: null,
    telegramUsername: telegramUsername?.trim() || null,
    balance: 0,
    walletBalance: 0,
    role: "user",
    createdAt: nowIso,
    lastLoginAt: nowIso,
  };

  try {
    await setDoc(userDocRef, initialProfile);
  } catch (err: any) {
    console.warn("Firestore profile creation notice:", err.message);
  }

  return mapToAuthUser(fbUser, initialProfile);
}

/**
 * 3. Email & Password Login
 */
export async function loginWithEmailAuth(email: string, pass: string): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = credential.user;
  const uid = fbUser.uid;
  const userDocRef = doc(db, "users", uid);

  let docData: Record<string, any> = {};

  try {
    const snap = await getDoc(userDocRef);
    const nowIso = new Date().toISOString();

    if (snap.exists()) {
      docData = snap.data();
      await updateDoc(userDocRef, { lastLoginAt: nowIso });
      docData.lastLoginAt = nowIso;
    } else {
      // Legacy user doc auto-init
      docData = {
        id: uid,
        name: fbUser.displayName || email.split("@")[0],
        email: email.trim().toLowerCase(),
        photoURL: fbUser.photoURL || null,
        balance: 0,
        walletBalance: 0,
        role: "user",
        createdAt: nowIso,
        lastLoginAt: nowIso,
      };
      await setDoc(userDocRef, docData);
    }
  } catch (err: any) {
    console.warn("Firestore login sync notice:", err.message);
  }

  return mapToAuthUser(fbUser, docData);
}

/**
 * 4. Forgot Password / Password Reset Email
 */
export async function sendFirebasePasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * 5. Sign Out
 */
export async function logoutFirebaseAuth(): Promise<void> {
  await signOut(auth);
}

/**
 * 6. Auth State Observer (Keeps user logged in across page refreshes)
 */
export function subscribeToFirebaseAuthState(
  callback: (user: AuthUser | null, loading: boolean) => void
): () => void {
  let userDocUnsub: (() => void) | null = null;

  const authUnsub = onAuthStateChanged(auth, async (fbUser) => {
    if (userDocUnsub) {
      userDocUnsub();
      userDocUnsub = null;
    }

    if (!fbUser) {
      callback(null, false);
      return;
    }

    // Immediately return initial auth user
    callback(mapToAuthUser(fbUser), true);

    try {
      const userDocRef = doc(db, "users", fbUser.uid);
      // Real-time listener: Any change to balance from ANY device or admin will instantly update in all phones!
      userDocUnsub = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            callback(mapToAuthUser(fbUser, data), false);
          } else {
            callback(mapToAuthUser(fbUser), false);
          }
        },
        (error) => {
          console.warn("User doc listener warning:", error.message);
          callback(mapToAuthUser(fbUser), false);
        }
      );
    } catch (e) {
      callback(mapToAuthUser(fbUser), false);
    }
  });

  return () => {
    if (userDocUnsub) userDocUnsub();
    authUnsub();
  };
}

/**
 * 7. Real-Time Cloud Server Sync across all devices
 */
export function subscribeToUserServers(
  userId: string,
  callback: (servers: ActiveServer[]) => void
): () => void {
  if (!userId) {
    callback([]);
    return () => {};
  }

  try {
    const serversCol = collection(db, "servers");
    const q = query(serversCol, where("userId", "==", userId));

    return onSnapshot(
      q,
      (snapshot) => {
        const cloudServers: ActiveServer[] = [];
        snapshot.forEach((d) => {
          const sData = d.data();
          cloudServers.push({
            id: sData.id || d.id,
            name: sData.name || "Server",
            category: sData.category || "python3",
            region: sData.region || "EU • Cloud",
            status: sData.status || "STOPPED",
            ramUsage: sData.ramUsage || "0.00 MB",
            cpuUsage: sData.cpuUsage || "0.00%",
            diskUsage: sData.diskUsage || "0.00 MB",
            daysLeft: sData.daysLeft || "30d left",
            planName: sData.planName || "Mini-v1",
            planPrice: sData.planPrice || 100,
            createdAt: sData.createdAt || new Date().toISOString(),
            port: sData.port,
            ip: sData.ip || "194.163.148.91",
            startupCommand: sData.startupCommand,
            envVars: sData.envVars,
          });
        });
        callback(cloudServers);
      },
      (err) => {
        console.warn("Servers sync listener notice:", err.message);
      }
    );
  } catch (err: any) {
    console.warn("subscribeToUserServers err:", err.message);
    return () => {};
  }
}

/**
 * Save / Update server in Firestore so all devices see the same server
 */
export async function syncServerToCloud(server: ActiveServer, userId: string): Promise<void> {
  if (!userId || !server.id) return;
  try {
    const sDocRef = doc(db, "servers", server.id);
    await setDoc(
      sDocRef,
      {
        ...server,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e: any) {
    console.warn("syncServerToCloud notice:", e.message);
  }
}

/**
 * Delete server from Firestore so it disappears on all devices
 */
export async function deleteServerFromCloud(serverId: string): Promise<void> {
  if (!serverId) return;
  try {
    const sDocRef = doc(db, "servers", serverId);
    // Soft delete or set deleted flag if security rules restrict delete
    await setDoc(sDocRef, { deleted: true }, { merge: true });
  } catch (e: any) {
    console.warn("deleteServerFromCloud notice:", e.message);
  }
}


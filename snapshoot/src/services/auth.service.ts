import { Preferences } from "@capacitor/preferences";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// Clés locales
const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";

// Type User
export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  fullName?: string;
  bio?: string;
  following?: string[];
  followers?: string[];
  createdAt: number;
}

// 🔧 Nettoie un objet en supprimant les champs `undefined`
const removeUndefinedFields = (obj: any) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

/**
 * Enregistrement d'un nouvel utilisateur
 */
export const register = async (
  email: string,
  username: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCredential.user, { displayName: username });

    const timestamp = Date.now();

    const newUser: User = {
      id: userCredential.user.uid,
      email,
      username,
      createdAt: timestamp,
      following: [],
      followers: [],
    };

    // ✅ Sauvegarde dans Firestore
    const db = getFirestore();
    await setDoc(doc(db, "users", newUser.id), removeUndefinedFields(newUser));

    await saveCurrentUser(newUser);
    await saveAuthToken(await userCredential.user.getIdToken());

    return newUser;
  } catch (error) {
    console.error("Firebase register error:", error);
    throw error;
  }
};

/**
 * Connexion utilisateur
 */
export const login = async (emailOrUsername: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailOrUsername, password);
    const firebaseUser = userCredential.user;

    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      username: firebaseUser.displayName || "",
      createdAt: Date.now(),
      following: [],
      followers: [],
    };

    await saveCurrentUser(user);
    await saveAuthToken(await firebaseUser.getIdToken());

    return user;
  } catch (error) {
    console.error("Firebase login error:", error);
    throw error;
  }
};

/**
 * Déconnexion
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  await Preferences.remove({ key: AUTH_TOKEN_KEY });
  await Preferences.remove({ key: USER_DATA_KEY });
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const result = await Preferences.get({ key: AUTH_TOKEN_KEY });
  return !!result.value;
};

/**
 * Récupère l'utilisateur actuel
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const result = await Preferences.get({ key: USER_DATA_KEY });
  return result.value ? JSON.parse(result.value) : null;
};

/**
 * Met à jour le profil de l'utilisateur
 */
export const updateUserProfile = async (
  userData: Partial<User>
): Promise<User> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Not authenticated");

  const updatedUser: User = {
    ...currentUser,
    ...userData,
  };

  await updateUser(updatedUser);
  await saveCurrentUser(updatedUser);

  return updatedUser;
};

/**
 * Suivre un utilisateur
 */
export const followUser = async (userId: string): Promise<User> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Not authenticated");
  if (currentUser.following?.includes(userId)) return currentUser;

  const following = [...(currentUser.following || []), userId];
  const updatedUser = { ...currentUser, following };

  await updateUser(updatedUser);
  await saveCurrentUser(updatedUser);

  const followedUser = await getUserById(userId);
  if (followedUser) {
    const followers = [...(followedUser.followers || []), currentUser.id];
    await updateUser({ ...followedUser, followers });
  }

  return updatedUser;
};

/**
 * Ne plus suivre un utilisateur
 */
export const unfollowUser = async (userId: string): Promise<User> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Not authenticated");
  if (!currentUser.following?.includes(userId)) return currentUser;

  const following = currentUser.following.filter((id) => id !== userId);
  const updatedUser = { ...currentUser, following };

  await updateUser(updatedUser);
  await saveCurrentUser(updatedUser);

  const unfollowedUser = await getUserById(userId);
  if (unfollowedUser) {
    const followers = (unfollowedUser.followers || []).filter((id) => id !== currentUser.id);
    await updateUser({ ...unfollowedUser, followers });
  }

  return updatedUser;
};

/**
 * Recherche d’utilisateurs
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  if (!query) return [];

  const users = await getAllUsersFromFirestore();
  return users.filter(
    (user) =>
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(query.toLowerCase())
  );
};

/**
 * 🔄 Sauvegarde le token auth localement
 */
const saveAuthToken = async (token: string): Promise<void> => {
  await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
};

/**
 * 💾 Sauvegarde utilisateur localement
 */
const saveCurrentUser = async (user: User): Promise<void> => {
  await Preferences.set({
    key: USER_DATA_KEY,
    value: JSON.stringify(user),
  });
};

/**
 * 🔄 Met à jour un utilisateur dans Firestore
 */
const updateUser = async (user: User): Promise<void> => {
  const db = getFirestore();
  const userRef = doc(db, "users", user.id);
  await setDoc(userRef, removeUndefinedFields(user));
};

/**
 * Récupère un utilisateur via son ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  if (!userId) {
    console.warn("getUserById: userId is undefined");
    return null;
  }

  const db = getFirestore();
  const docSnap = await getDoc(doc(db, "users", userId));
  return docSnap.exists() ? (docSnap.data() as User) : null;
};


/**
 * Récupère plusieurs utilisateurs par ID
 */
export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  const all = await getAllUsersFromFirestore();
  return all.filter((user) => userIds.includes(user.id));
};

/**
 * Récupère tous les utilisateurs de Firestore
 */
const getAllUsersFromFirestore = async (): Promise<User[]> => {
  const db = getFirestore();
  const snapshot = await (await import("firebase/firestore")).getDocs(
    (await import("firebase/firestore")).collection(db, "users")
  );
  return snapshot.docs.map((doc) => doc.data() as User);
};

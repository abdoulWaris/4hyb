import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
    writeBatch,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { getCurrentUser, getUserById, getUsersByIds } from "./auth.service";
import { getFirestore } from "firebase/firestore";

// --- Types ---
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: number;
  updatedAt: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export interface ConversationWithUsers extends Conversation {
  users: Array<{
    id: string;
    username: string;
    profilePicture?: string;
  }>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: number;
  isRead: boolean;
}

export interface MessageWithUser extends Message {
  sender: {
    id: string;
    username: string;
    profilePicture?: string;
  };
}

// --- Helpers ---
const db = getFirestore();

// --- Conversations ---

export const getConversations = async (): Promise<ConversationWithUsers[]> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  // On récupère toutes les conversations où participe l'utilisateur
  const conversationsCol = collection(db, "conversations");
  const q = query(
    conversationsCol,
    where("participants", "array-contains", currentUser.id),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);

  const conversations = snapshot.docs.map((doc) => doc.data() as Conversation);

  // Pour chaque conversation, récupérer les users (autres participants)
  return await Promise.all(
    conversations.map(async (conv) => {
      if (conv.isGroup) {
        const otherUserIds = conv.participants.filter((id) => id !== currentUser.id);
        const otherUsers = await getUsersByIds(otherUserIds);
        return {
          ...conv,
          users: otherUsers.map((u) => ({
            id: u.id,
            username: u.username,
            profilePicture: u.profilePicture,
          })),
        };
      } else {
        // 1-to-1 conversation
        const otherUserId = conv.participants.find((id) => id !== currentUser.id);
        if (!otherUserId) {
          // Conversation solo (to self)
          const user = await getUserById(currentUser.id);
          return {
            ...conv,
            users: user
              ? [{ id: user.id, username: user.username, profilePicture: user.profilePicture }]
              : [],
          };
        }
        const user = await getUserById(otherUserId);
        return {
          ...conv,
          users: user
            ? [{ id: user.id, username: user.username, profilePicture: user.profilePicture }]
            : [],
        };
      }
    })
  );
};

export const getConversationById = async (
  conversationId: string
): Promise<ConversationWithUsers | null> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const convRef = doc(db, "conversations", conversationId);
  const snapshot = await getDoc(convRef);
  if (!snapshot.exists()) return null;

  const conv = snapshot.data() as Conversation;
  if (!conv.participants.includes(currentUser.id)) throw new Error("Unauthorized");

  if (conv.isGroup) {
    const otherUserIds = conv.participants.filter((id) => id !== currentUser.id);
    const otherUsers = await getUsersByIds(otherUserIds);
    return {
      ...conv,
      users: otherUsers.map((u) => ({
        id: u.id,
        username: u.username,
        profilePicture: u.profilePicture,
      })),
    };
  } else {
    const otherUserId = conv.participants.find((id) => id !== currentUser.id);
    if (!otherUserId) {
      // self conversation
      const user = await getUserById(currentUser.id);
      return {
        ...conv,
        users: user ? [{ id: user.id, username: user.username, profilePicture: user.profilePicture }] : [],
      };
    }
    const user = await getUserById(otherUserId);
    return {
      ...conv,
      users: user ? [{ id: user.id, username: user.username, profilePicture: user.profilePicture }] : [],
    };
  }
};

export const getOrCreateConversation = async (
  userId: string
): Promise<ConversationWithUsers> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const conversationsCol = collection(db, "conversations");
  const q = query(
    conversationsCol,
    where("isGroup", "==", false),
    where("participants", "array-contains", currentUser.id)
  );
  const snapshot = await getDocs(q);
  const allConvs = snapshot.docs.map((doc) => doc.data() as Conversation);

  // Recherche conversation existante avec userId
  const existing = allConvs.find(
    (c) => c.participants.includes(userId) && c.participants.length === 2
  );

  if (existing) return getConversationById(existing.id) as Promise<ConversationWithUsers>;

  const timestamp = Date.now();
  const newConv: Conversation = {
    id: `conv_${timestamp}`,
    participants: [currentUser.id, userId],
    createdAt: timestamp,
    updatedAt: timestamp,
    isGroup: false,
  };

  const convRef = doc(db, "conversations", newConv.id);
  await setDoc(convRef, newConv);

  return getConversationById(newConv.id) as Promise<ConversationWithUsers>;
};

export const createGroupConversation = async (
  userIds: string[],
  groupName: string,
  groupAvatar?: string
): Promise<ConversationWithUsers> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const timestamp = Date.now();
  const allIds = Array.from(new Set([...userIds, currentUser.id]));

  const newConv: Conversation = {
    id: `conv_${timestamp}`,
    participants: allIds,
    createdAt: timestamp,
    updatedAt: timestamp,
    isGroup: true,
    groupName,
    groupAvatar,
  };

  const convRef = doc(db, "conversations", newConv.id);
  await setDoc(convRef, newConv);

  return getConversationById(newConv.id) as Promise<ConversationWithUsers>;
};

// --- Messages ---

export const sendMessage = async (
  conversationId: string,
  content: string,
  imageUrl?: string
): Promise<MessageWithUser> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const timestamp = Date.now();
  const messageId = `msg_${timestamp}`;

  const message: any = {
    id: messageId,
    conversationId,
    senderId: currentUser.id,
    content,
    createdAt: timestamp,
    isRead: false,
  };

  if (imageUrl !== undefined) {
    message.imageUrl = imageUrl;
  }

  const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
  await setDoc(messageRef, message);

  const convRef = doc(db, "conversations", conversationId);
  await updateDoc(convRef, {
    lastMessage: message,
    updatedAt: serverTimestamp(),
  });

  return {
    ...message,
    sender: {
      id: currentUser.id,
      username: currentUser.username,
      profilePicture: currentUser.profilePicture,
    },
  };
};


export const getMessages = async (conversationId: string): Promise<MessageWithUser[]> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const messagesRef = collection(db, "conversations", conversationId, "messages");

  const q = query(messagesRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);

  // Récupérer les données + id de chaque document
  const rawMessages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Message[];

  // Récupérer les ids des utilisateurs
  const userIds = [...new Set(rawMessages.map((m) => m.senderId))];
  const users = await getUsersByIds(userIds);

  await markMessagesAsRead(conversationId);

  // Retourner les messages enrichis avec l'objet sender
  return rawMessages.map((msg) => {
    const sender = users.find((u) => u.id === msg.senderId);
    return {
      ...msg,
      sender: sender || { id: msg.senderId, username: "Unknown" },
    };
  });
};


export const markMessagesAsRead = async (conversationId: string) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const messagesRef = collection(db, "conversations", conversationId, "messages");
  
  // Récupérer tous les messages non lus
  const q = query(messagesRef, where("isRead", "==", false));
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);  // <-- ici la bonne façon de créer un batch

  snapshot.docs.forEach((docSnap) => {
    const msg = docSnap.data();
    if (msg.senderId !== currentUser.id && !msg.isRead) {
      batch.update(doc(db, "conversations", conversationId, "messages", docSnap.id), {
        isRead: true,
      });
    }
  });

  await batch.commit();
};

export const getUnreadMessagesCount = async (): Promise<number> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return 0;

  const conversationsCol = collection(db, "conversations");
  const q = query(conversationsCol, where("participants", "array-contains", currentUser.id));
  const snapshot = await getDocs(q);

  let count = 0;
  for (const convDoc of snapshot.docs) {
    const convId = convDoc.id;
    const messagesCol = collection(db, "conversations", convId, "messages");
    const messagesSnapshot = await getDocs(messagesCol);

    messagesSnapshot.docs.forEach((msgDoc) => {
      const msg = msgDoc.data() as Message;
      if (!msg.isRead && msg.senderId !== currentUser.id) count++;
    });
  }

  return count;
};

export const listenForNewMessages = (
  conversationId: string,
  callback: (message: MessageWithUser) => void
): Unsubscribe => {
  const messagesCol = collection(db, "conversations", conversationId, "messages");
  const q = query(messagesCol, orderBy("createdAt", "asc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const msg = change.doc.data() as Message;
        callback({
          ...msg,
          sender: {
            id: msg.senderId,
            username: "Unknown", // tu peux améliorer en récupérant le user ici
          },
        });
      }
    });
  });

  return unsubscribe;
};

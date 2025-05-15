import { db } from "../config/firebase";
import { ref, set, get, update, onValue, off } from "firebase/database";
import { getCurrentUser, getUserById, getUsersByIds } from "./auth.service";

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

// --- Conversations ---

export const getConversations = async (): Promise<ConversationWithUsers[]> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const snapshot = await get(ref(db, "conversations"));
  const data = snapshot.val();
  if (!data) return [];

  const conversations: Conversation[] = Object.values(data);
  const userConversations = conversations.filter((c) =>
    c.participants.includes(currentUser.id)
  );
  userConversations.sort((a, b) => b.updatedAt - a.updatedAt);

  return await Promise.all(
  userConversations.map(async (conv) => {
    const otherUserIds = conv.participants.filter(id => id !== currentUser.id);

    // Self-conversation
    if (otherUserIds.length === 0) {
      const user = await getUserById(currentUser.id);
      if (!user) {
        return { ...conv, users: [] };
      }
      return {
        ...conv,
        users: [{
          id: user.id,
          username: user.username,
          profilePicture: user.profilePicture,
        }],
      };
    }

    // Regular 1-to-1 conversation
    const user = await getUserById(otherUserIds[0]);
    if (!user) {
      return { ...conv, users: [] };
    }
    return {
      ...conv,
      users: [{
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
      }],
    };
  })
);
};

export const getConversationById = async (
  conversationId: string
): Promise<ConversationWithUsers | null> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const snapshot = await get(ref(db, `conversations/${conversationId}`));
  if (!snapshot.exists()) return null;

  const conv: Conversation = snapshot.val();
  if (!conv.participants.includes(currentUser.id))
    throw new Error("Unauthorized");

  if (conv.isGroup) {
    const otherUserIds = conv.participants.filter(
      (id) => id !== currentUser.id
    );
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
    const otherUserId = conv.participants.find((id) => id !== currentUser.id)!;
    const user = await getUserById(otherUserId);
    return {
      ...conv,
      users: user
        ? [
            {
              id: user.id,
              username: user.username,
              profilePicture: user.profilePicture,
            },
          ]
        : [],
    };
  }
};

export const getOrCreateConversation = async (
  userId: string
): Promise<ConversationWithUsers> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const snapshot = await get(ref(db, "conversations"));
  const all: Record<string, Conversation> = snapshot.val() || {};
  const existing = Object.values(all).find(
    (c) =>
      !c.isGroup &&
      c.participants.includes(userId) &&
      c.participants.includes(currentUser.id)
  );

  if (existing)
    return getConversationById(existing.id) as Promise<ConversationWithUsers>;

  const timestamp = Date.now();
  const newConversation: Conversation = {
    id: `conv_${timestamp}`,
    participants: [currentUser.id, userId],
    createdAt: timestamp,
    updatedAt: timestamp,
    isGroup: false,
  };

  await set(ref(db, `conversations/${newConversation.id}`), newConversation);
  return getConversationById(
    newConversation.id
  ) as Promise<ConversationWithUsers>;
};

export const createGroupConversation = async (
  userIds: string[],
  groupName: string,
  groupAvatar?: string
): Promise<ConversationWithUsers> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const timestamp = Date.now();
  const allIds = [...new Set([...userIds, currentUser.id])];
  const newConv: Conversation = {
    id: `conv_${timestamp}`,
    participants: allIds,
    createdAt: timestamp,
    updatedAt: timestamp,
    isGroup: true,
    groupName,
    groupAvatar,
  };

  await set(ref(db, `conversations/${newConv.id}`), newConv);
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

  const message: Message = {
    id: messageId,
    conversationId,
    senderId: currentUser.id,
    content,
    imageUrl,
    createdAt: timestamp,
    isRead: false,
  };

  await set(ref(db, `messages/${conversationId}/${messageId}`), message);
  await update(ref(db, `conversations/${conversationId}`), {
    lastMessage: message,
    updatedAt: timestamp,
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

export const getMessages = async (
  conversationId: string
): Promise<MessageWithUser[]> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const snapshot = await get(ref(db, `messages/${conversationId}`));
  const rawMessages: Message[] = snapshot.exists()
    ? Object.values(snapshot.val())
    : [];

  rawMessages.sort((a, b) => a.createdAt - b.createdAt);

  const userIds = [...new Set(rawMessages.map((m) => m.senderId))];
  const users = await getUsersByIds(userIds);

  await markMessagesAsRead(conversationId);

  return rawMessages.map((msg) => {
    const sender = users.find((u) => u.id === msg.senderId);
    return {
      ...msg,
      sender: sender || {
        id: msg.senderId,
        username: "Unknown",
      },
    };
  });
};

export const markMessagesAsRead = async (
  conversationId: string
): Promise<void> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not authenticated");

  const snapshot = await get(ref(db, `messages/${conversationId}`));
  const data = snapshot.val();
  if (!data) return;

  const updates: Record<string, any> = {};
  Object.entries(data).forEach(([msgId, msg]: any) => {
    if (!msg.isRead && msg.senderId !== currentUser.id) {
      updates[`${msgId}/isRead`] = true;
    }
  });

  if (Object.keys(updates).length) {
    await update(ref(db, `messages/${conversationId}`), updates);
  }
};

export const getUnreadMessagesCount = async (): Promise<number> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return 0;

  const snapshot = await get(ref(db, "messages"));
  const data = snapshot.val();
  if (!data) return 0;

  let count = 0;
  Object.values(data).forEach((convMessages: any) => {
    (Object.values(convMessages) as Message[]).forEach((msg: Message) => {
      if (!msg.isRead && msg.senderId !== currentUser.id) count++;
    });
  });

  return count;
};

export const listenForNewMessages = (
  conversationId: string,
  callback: (message: MessageWithUser) => void
): (() => void) => {
  const messagesRef = ref(db, `messages/${conversationId}`);
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const message: Message = data[Object.keys(data).pop()!];
    if (message) {
      callback({
        ...message,
        sender: {
          id: message.senderId,
          username: "Unknown",
        },
      });
    }
  });

  return () => off(messagesRef, "value", unsubscribe);
};

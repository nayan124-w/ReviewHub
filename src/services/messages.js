import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const messagesRef = collection(db, 'messages');

/* ──────────────────────────────────────────────
   SEND MESSAGE
   ────────────────────────────────────────────── */
export const sendMessage = async ({ senderId, receiverId, message }) => {
  if (!senderId || !receiverId || !message?.trim()) {
    throw new Error('Invalid message data');
  }

  // Create a consistent conversationId so both users share the same thread
  const conversationId = [senderId, receiverId].sort().join('_');

  const docRef = await addDoc(messagesRef, {
    senderId,
    receiverId,
    conversationId,
    message: message.trim(),
    createdAt: serverTimestamp(),
    read: false,
  });

  return docRef.id;
};

/* ──────────────────────────────────────────────
   SUBSCRIBE TO CONVERSATION (real-time)
   Uses conversationId for efficient querying.
   ────────────────────────────────────────────── */
export const subscribeToConversation = (userId1, userId2, callback) => {
  const conversationId = [userId1, userId2].sort().join('_');

  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(messages);
  });
};

/* ──────────────────────────────────────────────
   GET ALL CONVERSATIONS for a user
   Returns a list of unique userIds the user
   has exchanged messages with, plus the latest
   message in each conversation.
   ────────────────────────────────────────────── */
export const subscribeToUserConversations = (userId, callback) => {
  // Listen for all messages where the user is a participant
  const q = query(
    messagesRef,
    where('conversationId', '>=', ''),
    orderBy('conversationId'),
    orderBy('createdAt', 'desc')
  );

  // We'll do client-side filtering since Firestore can't do
  // OR queries on different fields with ordering easily.
  // For production at scale, you'd use a separate `conversations` collection.
  return onSnapshot(q, (snapshot) => {
    const allMessages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Filter to only messages involving this user
    const userMessages = allMessages.filter(
      (m) => m.senderId === userId || m.receiverId === userId
    );

    // Group by conversationId and get latest message per conversation
    const conversationMap = {};
    userMessages.forEach((msg) => {
      if (!conversationMap[msg.conversationId]) {
        conversationMap[msg.conversationId] = msg;
      }
      // Latest is first because we ordered desc
    });

    // Build conversation list
    const conversations = Object.values(conversationMap).map((latestMsg) => {
      const otherUserId =
        latestMsg.senderId === userId ? latestMsg.receiverId : latestMsg.senderId;
      const unreadCount = userMessages.filter(
        (m) =>
          m.conversationId === latestMsg.conversationId &&
          m.receiverId === userId &&
          !m.read
      ).length;

      return {
        otherUserId,
        conversationId: latestMsg.conversationId,
        lastMessage: latestMsg.message,
        lastMessageAt: latestMsg.createdAt,
        unreadCount,
      };
    });

    // Sort by latest message
    conversations.sort((a, b) => {
      const aTime = a.lastMessageAt?.seconds || 0;
      const bTime = b.lastMessageAt?.seconds || 0;
      return bTime - aTime;
    });

    callback(conversations);
  });
};

/* ──────────────────────────────────────────────
   MARK MESSAGES AS READ
   Marks all unread messages in a conversation
   where the current user is the receiver.
   ────────────────────────────────────────────── */
export const markConversationAsRead = async (currentUserId, otherUserId) => {
  const conversationId = [currentUserId, otherUserId].sort().join('_');

  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    where('receiverId', '==', currentUserId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((d) =>
    updateDoc(doc(db, 'messages', d.id), { read: true })
  );
  await Promise.all(updates);
};

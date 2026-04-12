import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/auth';
import {
  sendMessage,
  subscribeToConversation,
  markConversationAsRead,
} from '../services/messages';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Chat = () => {
  const { userId: otherUserId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Prevent chatting with yourself
  useEffect(() => {
    if (user && otherUserId === user.uid) {
      toast.error("You can't message yourself");
      navigate('/reviews');
    }
  }, [user, otherUserId, navigate]);

  // Load other user's profile
  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await getUserProfile(otherUserId);
        if (!profile) {
          toast.error('User not found');
          navigate('/reviews');
          return;
        }
        setOtherUser(profile);
      } catch {
        toast.error('Failed to load user');
        navigate('/reviews');
      }
    };
    if (otherUserId) loadUser();
  }, [otherUserId, navigate]);

  // Subscribe to conversation messages
  useEffect(() => {
    if (!user || !otherUserId) return;

    const unsubscribe = subscribeToConversation(
      user.uid,
      otherUserId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, otherUserId]);

  // Mark as read when messages update
  useEffect(() => {
    if (user && otherUserId && messages.length > 0) {
      markConversationAsRead(user.uid, otherUserId).catch(() => {});
    }
  }, [user, otherUserId, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage({
        senderId: user.uid,
        receiverId: otherUserId,
        message: newMessage.trim(),
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateSeparator = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Group messages by date
  const getDateKey = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toDateString();
  };

  if (!isAuthenticated) return null;
  if (loading && !otherUser) return <LoadingSpinner text="Loading chat..." />;

  return (
    <div className="page-container py-4 sm:py-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* ── Chat Header ── */}
      <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-4 flex-shrink-0 slide-up">
        <Link
          to={`/profile/${otherUserId}`}
          className="flex items-center gap-3 flex-1 min-w-0 group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 group-hover:shadow-lg group-hover:shadow-primary-500/25 transition-shadow duration-200">
            {otherUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate group-hover:text-primary-300 transition-colors duration-200">
              {otherUser?.displayName || 'User'}
            </h2>
            {otherUser?.college && (
              <p className="text-xs text-slate-500 truncate">🎓 {otherUser.college}</p>
            )}
          </div>
        </Link>

        <Link
          to={`/profile/${otherUserId}`}
          className="btn-secondary !py-1.5 !px-3 text-xs flex-shrink-0"
        >
          View Profile
        </Link>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto rounded-2xl glass p-4 sm:p-6 mb-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner text="Loading messages..." />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-1">Start the conversation</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Say hello to {otherUser?.displayName || 'this user'}! Your messages are private between you two.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isMine = msg.senderId === user.uid;
              const prevMsg = messages[index - 1];
              const showDateSep =
                !prevMsg || getDateKey(msg.createdAt) !== getDateKey(prevMsg?.createdAt);
              const showAvatar =
                !prevMsg || prevMsg.senderId !== msg.senderId || showDateSep;

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
                    <div className={`flex items-end gap-2 max-w-[80%] sm:max-w-[70%] ${isMine ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      {showAvatar && !isMine ? (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-300 flex-shrink-0 mb-0.5">
                          {otherUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      ) : !isMine ? (
                        <div className="w-7 flex-shrink-0" />
                      ) : null}

                      {/* Bubble */}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md'
                            : 'glass-light text-slate-200 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/50' : 'text-slate-500'} text-right`}>
                          {formatTime(msg.createdAt)}
                          {isMine && msg.read && (
                            <span className="ml-1.5">✓✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Input Area ── */}
      <form onSubmit={handleSend} className="glass rounded-2xl p-3 flex items-center gap-3 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none px-2"
          autoFocus
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="btn-primary !py-2 !px-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default Chat;

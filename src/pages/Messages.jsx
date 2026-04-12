import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserConversations } from '../services/messages';
import { getUserProfile } from '../services/auth';
import LoadingSpinner from '../components/LoadingSpinner';

const Messages = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserConversations(user.uid, async (convos) => {
      // Fetch profiles for all other users
      const profileCache = { ...userProfiles };
      await Promise.all(
        convos.map(async (convo) => {
          if (!profileCache[convo.otherUserId]) {
            try {
              const profile = await getUserProfile(convo.otherUserId);
              profileCache[convo.otherUserId] = profile || { displayName: 'Unknown User' };
            } catch {
              profileCache[convo.otherUserId] = { displayName: 'Unknown User' };
            }
          }
        })
      );
      setUserProfiles(profileCache);
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="page-container py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 slide-up">
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-sm text-slate-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversations List */}
        {loading ? (
          <LoadingSpinner text="Loading conversations..." />
        ) : conversations.length === 0 ? (
          <div className="glass rounded-2xl p-10 sm:p-14 text-center fade-in">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No messages yet</h3>
            <p className="text-slate-500 mb-6 text-sm max-w-xs mx-auto">
              Start a conversation by visiting someone's profile and clicking "Send Message".
            </p>
            <Link to="/reviews" className="btn-primary">Browse Reviews</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo, index) => {
              const profile = userProfiles[convo.otherUserId];
              return (
                <Link
                  key={convo.conversationId}
                  to={`/chat/${convo.otherUserId}`}
                  className="block glass-light rounded-2xl p-4 transition-all duration-200 hover:border-white/10 hover:shadow-lg hover:shadow-black/10 fade-in group"
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-300 group-hover:border-primary-500/40 transition-colors">
                        {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      {convo.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{convo.unreadCount}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className={`text-sm font-semibold truncate ${convo.unreadCount > 0 ? 'text-white' : 'text-slate-300'}`}>
                          {profile?.displayName || 'User'}
                        </h3>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {formatTime(convo.lastMessageAt)}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                        {convo.lastMessage}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg className="w-4 h-4 text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;

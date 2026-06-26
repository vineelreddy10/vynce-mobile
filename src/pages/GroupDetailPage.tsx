import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, MapPin, Loader2, AlertCircle, UserPlus, UserMinus,
  CalendarDays, Clock, Lock, Globe, Send, Image, X, Check, Shield,
  UserCog, Flag, MessageCircle
} from "lucide-react";
import {
  useGroupDetails, useJoinGroup, useLeaveGroup,
  useGroupPosts, useCreateGroupPost, useJoinRequests,
  useApproveJoinRequest, useRejectJoinRequest,
  useRemoveMember, useTransferAdmin, useSendMatchRequest,
} from "../hooks/useGroup";
import type { GroupPost, JoinRequest } from "../api/group";
import { useAuth } from "../hooks/useAuth";

const TABS = ["Feed", "Members", "About"] as const;
type Tab = typeof TABS[number];

function MemberAvatar({ photo, name }: { photo: string; name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-white shadow-sm"
      />
    );
  }

  const colors = [
    "from-coral/30 to-rose-300/30",
    "from-teal/30 to-emerald-300/30",
    "from-navy/20 to-indigo-300/30",
    "from-amber-300/30 to-orange-300/30",
  ];
  const color = colors[name.length % colors.length];

  return (
    <div
      className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-sm bg-gradient-to-br ${color} flex items-center justify-center`}
    >
      <span className="text-[10px] lg:text-xs font-headline text-navy">{initials}</span>
    </div>
  );
}

function JoinRequestsModal({
  requests,
  onApprove,
  onReject,
  onClose,
  approving,
  rejecting,
}: {
  requests: JoinRequest[];
  onApprove: (name: string) => void;
  onReject: (name: string) => void;
  onClose: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-headline text-sm text-navy uppercase tracking-wider">Join Requests</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted/50">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No pending requests</p>
          ) : (
            requests.map((req) => (
              <div key={req.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <MemberAvatar photo={req.profile_image} name={req.display_name} />
                <div className="flex-1 min-w-0">
                  <p className="font-headline text-xs text-navy">{req.display_name}</p>
                  {req.bio && (
                    <p className="text-[10px] text-muted-foreground truncate">{req.bio}</p>
                  )}
                  <p className="text-[9px] text-muted-foreground/60">
                    Requested {new Date(req.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onApprove(req.name)}
                    disabled={approving}
                    className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onReject(req.name)}
                    disabled={rejecting}
                    className="w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RelativeTime({ time }: { time: string }) {
  const date = new Date(time);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return <span className="text-[10px] text-muted-foreground">Just now</span>;
  if (diffMin < 60) return <span className="text-[10px] text-muted-foreground">{diffMin}m ago</span>;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return <span className="text-[10px] text-muted-foreground">{diffHr}h ago</span>;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return <span className="text-[10px] text-muted-foreground">{diffDay}d ago</span>;
  return <span className="text-[10px] text-muted-foreground">{date.toLocaleDateString()}</span>;
}

function PostCard({ post }: { post: GroupPost }) {
  return (
    <div className="bg-white rounded-xl border border-border p-3.5 space-y-2.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {post.user_photo ? (
            <img src={post.user_photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-headline text-navy">
              {post.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-headline text-navy">{post.display_name}</p>
          <RelativeTime time={post.created_at} />
        </div>
      </div>
      {post.content && (
        <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
      )}
      {post.media && (
        <img src={post.media} alt="" className="w-full rounded-lg max-h-64 object-cover" />
      )}
    </div>
  );
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data: group, isLoading, isError, error } = useGroupDetails(groupId ?? "");
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();

  const [activeTab, setActiveTab] = useState<Tab>("Feed");

  // Post state
  const { data: postsData, isLoading: postsLoading } = useGroupPosts(groupId ?? "");
  const createPostMutation = useCreateGroupPost();
  const [postContent, setPostContent] = useState("");
  const [postMedia, setPostMedia] = useState("");

  // Join requests state
  const { data: requestsData } = useJoinRequests(
    group?.is_admin ? (groupId ?? "") : ""
  );
  const approveMutation = useApproveJoinRequest();
  const rejectMutation = useRejectJoinRequest();
  const [showRequests, setShowRequests] = useState(false);

  // Admin actions
  const removeMemberMutation = useRemoveMember();
  const transferAdminMutation = useTransferAdmin();
  const sendMatchMutation = useSendMatchRequest();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-coral animate-spin" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-5 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center shadow-card hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-4 h-4 text-navy" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center px-5">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <h3 className="font-headline text-navy text-lg mb-1">Group not found</h3>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "This group may no longer exist."}
          </p>
        </div>
      </div>
    );
  }

  const busy = joinMutation.isPending || leaveMutation.isPending;
  const isPending = group.join_request_status === "Pending";
  const memberList = group.members ?? [];
  const events = group.upcoming_events ?? [];
  const posts = (postsData?.posts ?? []) as GroupPost[];
  const requests = (requestsData?.requests ?? []) as JoinRequest[];
  const pendingCount = group.pending_requests_count ?? 0;

  const handleCreatePost = () => {
    if (!postContent.trim() && !postMedia.trim()) return;
    createPostMutation.mutate(
      { groupName: groupId!, content: postContent, media: postMedia, mediaType: postMedia ? "Image" : "" },
      { onSuccess: () => { setPostContent(""); setPostMedia(""); } }
    );
  };

  const handleSendMatch = (targetUser: string) => {
    sendMatchMutation.mutate({ groupName: groupId!, targetUser });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Cover Photo */}
      <div className="relative">
        {group.cover_image ? (
          <img src={group.cover_image} alt="" className="w-full h-48 lg:h-64 object-cover" />
        ) : (
          <div className="w-full h-48 lg:h-64 gradient-sunset" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/20 to-transparent" />

        <button
          onClick={() => navigate("/groups")}
          className="absolute top-4 left-4 lg:top-5 lg:left-5 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>

        {!isPending && (
          <button
            onClick={() =>
              group.is_member ? leaveMutation.mutate(group.group_name) : joinMutation.mutate(group.group_name)
            }
            disabled={busy}
            className={`absolute top-4 right-4 lg:top-5 lg:right-5 px-4 py-2 rounded-full font-headline text-xs font-semibold uppercase tracking-wider transition-all ${
              group.is_member
                ? "bg-white/90 text-navy hover:bg-white shadow-card"
                : "gradient-sunset text-white shadow-glow hover:scale-105"
            } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : group.is_member ? (
              <><UserMinus className="w-3 h-3 inline mr-1" /> Leave</>
            ) : (
              <><UserPlus className="w-3 h-3 inline mr-1" /> Join</>
            )}
          </button>
        )}

        {isPending && (
          <div className="absolute top-4 right-4 lg:top-5 lg:right-5 px-4 py-2 rounded-full bg-amber-400/90 text-white font-headline text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-card">
            <Clock className="w-3 h-3" /> Requested
          </div>
        )}
      </div>

      {/* Group Info Header */}
      <div className="px-5 lg:px-8 -mt-12 lg:-mt-16 relative z-10 lg:max-w-5xl lg:mx-auto">
        <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-headline text-xl lg:text-2xl text-navy leading-tight">{group.title}</h1>
              <div className="flex flex-wrap items-center gap-2 lg:gap-3 mt-2">
                <span className="text-[10px] lg:text-xs bg-muted text-navy px-2 py-0.5 rounded-full font-headline uppercase tracking-wider">
                  {group.category}
                </span>
                <span className="text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  {group.member_count} {group.member_count === 1 ? "member" : "members"}
                </span>
                {group.location && (
                  <span className="text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    {group.location}
                  </span>
                )}
                <span className="text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                  {group.privacy === "Private" ? (
                    <><Lock className="w-3 h-3" /> Private</>
                  ) : (
                    <><Globe className="w-3 h-3" /> Public</>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="px-5 lg:px-8 mt-4 lg:max-w-5xl lg:mx-auto">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs font-headline font-semibold uppercase tracking-wider py-2.5 rounded-full transition-all ${
                tab === activeTab
                  ? "gradient-sunset text-white shadow-glow"
                  : "bg-white border border-border text-muted-foreground hover:text-navy"
              }`}
            >
              {tab}
              {tab === "About" && pendingCount > 0 && group.is_admin && (
                <span className="ml-1.5 bg-amber-400 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5 lg:px-8 mt-4 lg:max-w-5xl lg:mx-auto">
        {activeTab === "Feed" && (
          <div className="space-y-3">
            {group.is_member ? (
              <>
                {/* Create Post */}
                <div className="bg-white rounded-2xl border border-border p-4 shadow-card space-y-3">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share something with the group..."
                    rows={2}
                    className="w-full px-0 text-sm text-navy placeholder:text-muted-foreground/50 border-0 focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        value={postMedia}
                        onChange={(e) => setPostMedia(e.target.value)}
                        placeholder="Image URL (optional)"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs text-navy placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-coral/30"
                      />
                      <Image className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={createPostMutation.isPending || (!postContent.trim() && !postMedia.trim())}
                      className="px-4 py-1.5 rounded-full gradient-sunset text-white text-xs font-headline font-semibold flex items-center gap-1.5 shadow-glow hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {createPostMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <><Send className="w-3 h-3" /> Post</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Posts */}
                {postsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 text-coral animate-spin" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-border p-8 shadow-card text-center">
                    <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No posts yet. Be the first to share!</p>
                  </div>
                ) : (
                  posts.map((post: GroupPost) => (
                    <PostCard key={post.name} post={post} />
                  ))
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-border p-8 shadow-card text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isPending
                    ? "Your join request is pending approval"
                    : "Join this group to see posts and connect with members"}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "Members" && (
          <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
            <h2 className="font-headline text-sm lg:text-base text-navy uppercase tracking-wider mb-4">
              Members ({memberList.length})
            </h2>
            {memberList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet. Be the first to join!</p>
            ) : (
              <div className="space-y-2">
                {memberList.map((member) => {
                  const isAdmin = member.role === "Admin";
                  const isSelf = member.user === currentUser;
                  return (
                    <div
                      key={member.user}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <MemberAvatar photo={member.profile_image} name={member.display_name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-headline text-xs lg:text-sm text-navy">{member.display_name}</p>
                          {isAdmin && <Shield className="w-3 h-3 text-coral" />}
                        </div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">
                          {isAdmin ? "Admin" : "Member"}
                          {member.joined_at && ` · Joined ${new Date(member.joined_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      {group.is_admin && !isSelf && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSendMatch(member.user)}
                            disabled={sendMatchMutation.isPending}
                            className="w-7 h-7 rounded-full bg-gradient-to-r from-coral to-orange text-white flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                            title="Send match request"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                          {!isAdmin && (
                            <>
                              <button
                                onClick={() => transferAdminMutation.mutate({ groupName: groupId!, targetUser: member.user })}
                                disabled={transferAdminMutation.isPending}
                                className="w-7 h-7 rounded-full bg-navy/10 text-navy flex items-center justify-center hover:bg-navy/20 transition-colors"
                                title="Transfer admin"
                              >
                                <UserCog className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeMemberMutation.mutate({ groupName: groupId!, targetUser: member.user })}
                                disabled={removeMemberMutation.isPending}
                                className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                                title="Remove member"
                              >
                                <UserMinus className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "About" && (
          <div className="space-y-3">
            {group.description && (
              <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
                <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{group.description}</p>
              </div>
            )}

            {group.rules && (
              <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
                <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-2">Group Rules</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{group.rules}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
              <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Details</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Privacy</span>
                  <span className="text-navy font-medium flex items-center gap-1">
                    {group.privacy === "Private" ? (
                      <><Lock className="w-3 h-3" /> Private</>
                    ) : (
                      <><Globe className="w-3 h-3" /> Public</>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="text-navy font-medium">{group.category}</span>
                </div>
                {group.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-navy font-medium">{group.location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="text-navy font-medium">{memberList.length}</span>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            {events.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
                <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-coral" /> Upcoming Events
                </h3>
                <div className="space-y-3">
                  {events.map((ev, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-border hover:border-coral/30 hover:shadow-md transition-all"
                    >
                      <h4 className="font-headline text-xs text-navy mb-1">{ev.title}</h4>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> {ev.date}
                        </p>
                        {ev.location && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin: Join Requests Button */}
            {group.is_admin && (
              <button
                onClick={() => setShowRequests(true)}
                className="w-full bg-white rounded-2xl border border-border p-4 shadow-card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <span className="font-headline text-xs text-navy uppercase tracking-wider">
                  Join Requests
                </span>
                <span className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <span className="bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                  <span className="text-muted-foreground text-sm">→</span>
                </span>
              </button>
            )}

            {/* Admin: Leave as Admin Warning */}
            {group.is_admin && !isPending && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <p className="text-xs text-amber-800">
                  You are an admin of this group. Transfer admin to another member before leaving.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Join Requests Modal */}
      {showRequests && (
        <JoinRequestsModal
          requests={requests}
          onApprove={(name) => approveMutation.mutate(name)}
          onReject={(name) => rejectMutation.mutate(name)}
          onClose={() => setShowRequests(false)}
          approving={approveMutation.isPending}
          rejecting={rejectMutation.isPending}
        />
      )}
    </div>
  );
}

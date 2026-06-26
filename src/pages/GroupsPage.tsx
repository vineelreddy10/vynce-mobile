import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MapPin, Loader2, AlertCircle, UserPlus, UserMinus, Plus, Lock, Globe, Clock, Search } from "lucide-react";
import { useListGroups, useJoinGroup, useLeaveGroup } from "../hooks/useGroup";
import type { Group } from "../api/group";

const categories = ["All", "Food & Drink", "Outdoors", "Arts", "Tech", "Books", "Wellness"];

function GroupCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-3.5 lg:p-4 space-y-2.5 lg:space-y-3 animate-pulse">
      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3.5 lg:h-4 bg-muted rounded w-3/4" />
        <div className="h-2.5 bg-muted rounded w-1/2" />
      </div>
      <div className="h-2 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded-full w-16" />
    </div>
  );
}

function GroupCard({ group, onJoin, onLeave, joining, leaving }: {
  group: Group;
  onJoin: (name: string) => void;
  onLeave: (name: string) => void;
  joining: boolean;
  leaving: boolean;
}) {
  const navigate = useNavigate();
  const busy = joining || leaving;
  const isPending = group.join_request_status === "Pending";

  return (
    <div
      onClick={() => navigate(`/groups/${group.group_name}`)}
      className="bg-white rounded-2xl border border-border p-3.5 lg:p-4 space-y-2.5 lg:space-y-3 shadow-card hover:shadow-md transition-shadow cursor-pointer relative group"
    >
      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-muted flex items-center justify-center text-xl lg:text-2xl overflow-hidden">
        {group.cover_image ? (
          <img src={group.cover_image} alt="" className="w-full h-full object-cover" />
        ) : (
          group.title.charAt(0).toUpperCase()
        )}
      </div>
      <div>
        <h3 className="font-headline text-xs lg:text-sm text-navy leading-snug">{group.title}</h3>
        <p className="text-[10px] lg:text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Users className="w-3 h-3" /> {group.member_count}
        </p>
        <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" /> {group.location}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {group.privacy === "Private" ? (
          <Lock className="w-2.5 h-2.5 text-muted-foreground/60" />
        ) : (
          <Globe className="w-2.5 h-2.5 text-muted-foreground/60" />
        )}
        <span className="text-[8px] text-muted-foreground/60">{group.privacy}</span>
      </div>
      <div className="text-[9px] lg:text-[11px] text-muted-foreground/60 line-clamp-2">{group.description}</div>
      <span className="text-[8px] lg:text-[10px] bg-muted text-navy px-2 py-0.5 rounded-full inline-block">
        {group.category}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isPending) return;
          if (group.is_member) {
            onLeave(group.group_name);
          } else {
            onJoin(group.group_name);
          }
        }}
        disabled={busy || isPending}
        className={`absolute bottom-3.5 right-3.5 lg:bottom-4 lg:right-4 w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 ${
          isPending
            ? "bg-amber-400"
            : group.is_member
              ? "bg-muted-foreground hover:bg-destructive"
              : "gradient-sunset shadow-glow hover:scale-105"
        } ${busy || isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {busy ? (
          <Loader2 className="w-3 h-3 lg:w-3.5 lg:h-3.5 animate-spin" />
        ) : isPending ? (
          <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
        ) : group.is_member ? (
          <UserMinus className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
        ) : (
          <UserPlus className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
        )}
      </button>
    </div>
  );
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input 300ms
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  };
  useEffect(() => () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); }, []);

  const { data: groups = [], isLoading, isError, error } = useListGroups(
    activeCategory === "All" ? undefined : activeCategory,
    1, 20, debouncedSearch || undefined
  );
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();

  const handleJoin = (groupName: string) => joinMutation.mutate(groupName);
  const handleLeave = (groupName: string) => leaveMutation.mutate(groupName);

  return (
    <div className="min-h-screen bg-background pb-6 px-5 pt-6 lg:px-8 lg:pt-8 lg:max-w-5xl lg:mx-auto">
      <div className="lg:flex lg:items-end lg:justify-between lg:mb-1">
        <div className="flex items-center justify-between w-full lg:w-auto">
           <div>
             <h1 className="font-headline text-2xl lg:text-3xl text-navy mb-1">Browse Groups</h1>
             <p className="text-muted-foreground text-sm lg:text-base">Find your community</p>
           </div>
           <button
             onClick={() => navigate("/groups/create")}
             className="w-10 h-10 lg:hidden rounded-full gradient-sunset text-white shadow-glow flex items-center justify-center flex-shrink-0"
           >
             <Plus className="w-5 h-5" />
           </button>
         </div>
         <div className="hidden lg:flex lg:items-center lg:gap-2">
           <button
             onClick={() => navigate("/groups/create")}
             className="flex items-center gap-1.5 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full gradient-sunset text-white shadow-glow whitespace-nowrap"
           >
             <Plus className="w-3.5 h-3.5" /> Create
           </button>
           {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                cat === activeCategory
                  ? "gradient-sunset text-white shadow-glow"
                  : "bg-white border border-border text-muted-foreground hover:text-navy"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mt-4 lg:mt-3 mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search groups..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm text-navy placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-navy"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mx-1 px-1 lg:hidden">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              cat === activeCategory
                ? "gradient-sunset text-white shadow-glow"
                : "bg-white border border-border text-muted-foreground hover:text-navy"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="lg:mt-5">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <GroupCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <h3 className="font-headline text-navy text-lg mb-1">Failed to load groups</h3>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          </div>
        ) : groups.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <Users className="w-10 h-10 text-muted-foreground mb-3" />
             <h3 className="font-headline text-navy text-lg mb-1">No groups found</h3>
             <p className="text-muted-foreground text-sm mb-4">
               {activeCategory === "All"
                 ? "There are no groups yet. Be the first to create one!"
                 : `No groups in "${activeCategory}". Try a different category.`}
             </p>
             <button
               onClick={() => navigate("/groups/create")}
               className="inline-flex items-center gap-2 gradient-sunset text-white px-6 py-3 rounded-full text-sm font-headline font-semibold shadow-glow"
             >
               <Plus className="w-4 h-4" /> Create Group
             </button>
           </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.group_name}
                group={group}
                onJoin={handleJoin}
                onLeave={handleLeave}
                joining={joinMutation.isPending && joinMutation.variables === group.group_name}
                leaving={leaveMutation.isPending && leaveMutation.variables === group.group_name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

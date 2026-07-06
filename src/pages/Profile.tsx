import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/profileContext";
import { Edit2, LogOut, ChevronDown } from "lucide-react";
import SwipeLayout from "@/components/SwipeLayout";
import ActionRow from "@/components/ActionRow";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

type ProjectStatus = "active" | "completed" | "paused";

type RawPost = {
  id:             string;
  post_type:      "project" | "media" | "offer";
  caption:        string | null;
  likes_count:    number;
  comments_count: number;
  created_at:     string;
  profiles: { username: string | null; avatar: string | null } | null;
  project_posts: {
    title:       string;
    description: string | null;
    started_at:  string | null;
    ended_at:    string | null;
    status:      ProjectStatus;
  } | null;
  offer_posts: {
    company:      string | null;
    role:         string | null;
    salary_range: string | null;
    location:     string | null;
    offer_type:   string | null;
  } | null;
  post_images: { url: string; sort_order: number }[] | null;
};

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const PAGE_SIZE = 10;
const EMBER     = "#fffd01";

const FEED_QUERY = `
  id,
  post_type,
  caption,
  likes_count,
  comments_count,
  created_at,
  profiles:profiles!posts_user_id_profiles_fkey (
    username,
    avatar
  ),
  project_posts:project_posts!project_posts_post_id_fkey (
    title,
    description,
    started_at,
    ended_at,
    status
  ),
  offer_posts:offer_posts!offer_posts_post_id_fkey (
    company,
    role,
    salary_range,
    location,
    offer_type
  ),
  post_images:post_images!post_images_post_id_fkey (
    url,
    sort_order
  )
`;

const STATUS_CFG: Record<ProjectStatus, { label: string; color: string; dot: string }> = {
  active:    { label: "Active",    color: "text-green-400",  dot: "bg-green-400"  },
  completed: { label: "Completed", color: "text-indigo-400", dot: "bg-indigo-400" },
  paused:    { label: "Paused",    color: "text-amber-400",  dot: "bg-amber-400"  },
};

const OFFER_LABELS: Record<string, string> = {
  full_time:  "Full-time",
  part_time:  "Part-time",
  internship: "Internship",
  contract:   "Contract",
};

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function calcDuration(s: string | null, e: string | null): string | null {
  if (!s) return null;
  const ms = (e ? new Date(e) : new Date()).getTime() - new Date(s).getTime();
  const mo = Math.round(ms / (1000 * 60 * 60 * 24 * 30));
  if (mo < 1)  return "< 1 mo";
  if (mo < 12) return `${mo} mo`;
  const y = Math.floor(mo / 12), r = mo % 12;
  return r ? `${y} yr ${r} mo` : `${y} yr`;
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

// ─────────────────────────────────────────
// MINI COMPONENTS
// ─────────────────────────────────────────

function StatItem({ value, label, divider }: { value: number | string; label: string; divider?: boolean }) {
  return (
    <div className={`flex-1 flex flex-col items-center gap-0.5 ${divider ? "border-r border-white/[0.07]" : ""}`}>
      <span className="text-lg font-black text-zinc-100 leading-none" style={{ color: EMBER }}>{value}</span>
      <span className="text-[11px] text-zinc-500 font-medium">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────
// POST CARDS (self-contained, no nav needed)
// ─────────────────────────────────────────

function ProjectPostCard({ post }: { post: RawPost }) {
  const pp  = post.project_posts!;
  const cfg = STATUS_CFG[pp.status];
  const img = [...(post.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const dur = calcDuration(pp.started_at, pp.ended_at);
  const navigate = useNavigate();

  return (
    <article className="py-6 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#fffd01] bg-[#fffd01]/8 px-2 py-0.5 rounded-full">
          Project
        </span>
        <span className="text-[11px] text-zinc-600">{timeAgo(post.created_at)}</span>
      </div>

      <h3 className="text-[16px] font-black text-zinc-100 tracking-tight leading-snug mb-2">
        {pp.title}
      </h3>

      <div className="flex items-center gap-2 text-[11.5px] text-zinc-500 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
        {pp.started_at && (
          <>
            <span className="text-zinc-700">·</span>
            <span>{fmtDate(pp.started_at)} → {pp.ended_at ? fmtDate(pp.ended_at) : "Present"}</span>
            {dur && <><span className="text-zinc-700">·</span><span>{dur}</span></>}
          </>
        )}
      </div>

      {img && (
        <div className="w-full rounded-xl overflow-hidden bg-zinc-900 mb-3">
          <img src={img} alt={pp.title} className="w-full h-full object-fit" loading="lazy" />
        </div>
      )}

      {pp.description && (
        <p className="text-[13px] text-zinc-400 leading-relaxed line-clamp-3 mb-2">{pp.description}</p>
      )}
      {post.caption && (
        <p className="text-[12.5px] text-zinc-600 italic">"{post.caption}"</p>
      )}

      <ActionRow
        postId={post.id}
        likes={post.likes_count}
        comments={post.comments_count}
        onCommentPress={() => navigate(`/post/${post.id}`)}
      />
    </article>
  );
}

function OfferPostCard({ post }: { post: RawPost }) {
  const op = post.offer_posts!;
  const typeLabel = op.offer_type ? (OFFER_LABELS[op.offer_type] ?? op.offer_type) : null;

  return (
    <article className="py-6 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
          Offer
        </span>
        <span className="text-[11px] text-zinc-600">{timeAgo(post.created_at)}</span>
      </div>

      <div className="relative rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 mb-3 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-green-400 rounded-l-xl" />
        <div className="pl-1">
          {op.company && (
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-green-400 mb-1.5">{op.company}</p>
          )}
          <p className="text-[16px] font-black text-zinc-100 tracking-tight leading-tight mb-2">
            {op.role ?? "Role TBD"}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {op.salary_range && <span className="text-[12px] text-zinc-400">{op.salary_range}</span>}
            {op.salary_range && op.location && <span className="text-zinc-700">·</span>}
            {op.location && <span className="text-[12px] text-zinc-400">{op.location}</span>}
            {typeLabel && (
              <span className="ml-auto text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                {typeLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {post.caption && (
        <p className="text-[12.5px] text-zinc-500 italic mb-2">"{post.caption}"</p>
      )}

      <div className="flex items-center gap-3 text-[12px] text-zinc-600">
        <span>♡ {post.likes_count > 0 ? post.likes_count : "Like"}</span>
        <span>◯ {post.comments_count > 0 ? post.comments_count : "Comment"}</span>
      </div>
    </article>
  );
}

function PostCard({ post }: { post: RawPost }) {
  if (post.post_type === "project") return <ProjectPostCard post={post} />;
  if (post.post_type === "offer")   return <OfferPostCard   post={post} />;
  return null;
}

// ─────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const { profile, updateField } = useProfile();

  const [allyCount,    setAllyCount]    = useState(0);
  const [posts,        setPosts]        = useState<RawPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [hasMore,      setHasMore]      = useState(true);
  const [cursor,       setCursor]       = useState<string | null>(null);
  const [signingOut,   setSigningOut]   = useState(false);
  const [uploadingAv,  setUploadingAv]  = useState(false);
  const [uploadingBn,  setUploadingBn]  = useState(false);

  const isFetchingMore = useRef(false);
  const avInputRef     = useRef<HTMLInputElement>(null);
  const bnInputRef     = useRef<HTMLInputElement>(null);

  // ── ally count ──
  useEffect(() => {
    if (!profile?.id) return;
    void supabase
      .from("allies")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .eq("status", "accepted")
      .then(({ count }) => setAllyCount(count ?? 0));
  }, [profile?.id]);

  // ── fetch posts ──
  const fetchUserPosts = useCallback(async (isRefresh = false) => {
    const uid = profile?.id;
    if (!uid) return;
    if (!isRefresh) setLoadingPosts(true);

    const { data, error } = await supabase
      .from("posts")
      .select(FEED_QUERY)
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .returns<RawPost[]>();

    if (!error && data) {
      setPosts(data);
      setHasMore(data.length === PAGE_SIZE);
      setCursor(data.length > 0 ? data[data.length - 1].created_at : null);
    }
    setLoadingPosts(false);
  }, [profile?.id]);

  const fetchMore = useCallback(async () => {
    const uid = profile?.id;
    if (!uid || isFetchingMore.current || !hasMore || !cursor) return;
    isFetchingMore.current = true;

    const { data } = await supabase
      .from("posts")
      .select(FEED_QUERY)
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .lt("created_at", cursor)
      .limit(PAGE_SIZE)
      .returns<RawPost[]>();

    if (data) {
      setPosts(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setCursor(data.length > 0 ? data[data.length - 1].created_at : cursor);
    }
    isFetchingMore.current = false;
  }, [profile?.id, cursor, hasMore]);

  useEffect(() => {
    if (profile?.id) void fetchUserPosts();
  }, [profile?.id, fetchUserPosts]);

  // ── image upload ──
  async function uploadImage(file: File, type: "avatar" | "banner") {
    const uid = profile?.id;
    if (!uid) return;

    type === "avatar" ? setUploadingAv(true) : setUploadingBn(true);

    try {
      const ext  = file.name.split(".").pop() ?? "jpg";
      const path = `${uid}/${type}-${Date.now()}.${ext}`;

      const { data, error: uploadErr } = await supabase.storage
        .from("profile-images")
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(data.path);

      await updateField(type === "avatar" ? "avatar" : "banner", urlData.publicUrl);
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      type === "avatar" ? setUploadingAv(false) : setUploadingBn(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") {
    const file = e.target.files?.[0];
    if (file) void uploadImage(file, type);
    e.target.value = "";
  }

  // ── sign out ──
  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/login");
  }

  const displayName = profile?.displayname ?? "—";
  const username    = profile?.username    ?? null;
  const bio         = profile?.bio         ?? "No bio yet.";
  const initials    = getInitials(displayName);

  return (
    <SwipeLayout>
    <div className="min-h-screen bg-[#0c0c0e] pb-24">

      {/* hidden file inputs */}
      <input
        ref={bnInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFileChange(e, "banner")}
      />
      <input
        ref={avInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFileChange(e, "avatar")}
      />

      {/* ── BANNER ── */}
      <div
        className="relative h-44 w-full cursor-pointer overflow-hidden bg-zinc-900 group z-1"
        onClick={() => bnInputRef.current?.click()}
      >
        {profile?.banner ? (
          <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-[#fffd01]/5 to-zinc-900" />
        )}
        {/* overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
        {/* edit badge */}
        <div className="absolute top-3 right-3 px-2.5 py-2 rounded bg-[#fffd01]/10 border border-[#fffd01]/20 flex items-center gap-1.5">
          {uploadingBn ? (
            <div className="w-3 h-3 border border-[#fffd01]/40 border-t-[#fffd01] rounded-full animate-spin" />
          ) : (
            <Edit2 size={10} className="text-[#fffd01]" />
          )}
        </div>
      </div>

      {/* ── CARD ── */}
      <div className="max-w-2xl mx-auto px-6 z-2 relative">
        <div className="bg-[#111113] border border-white/[0.07] rounded-t-3xl -mt-6 px-6 pt-0 pb-6">

          {/* avatar row */}
          <div className="flex items-end justify-between mb-5">
            <div
              className="relative cursor-pointer group/av -mt-10"
              onClick={() => avInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full border-[3px] border-[#0c0c0e] overflow-hidden bg-zinc-800 flex items-center justify-center">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-[#fffd01]">{initials}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAv ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Edit2 size={14} className="text-white" />
                )}
              </div>
            </div>

            <button
              onClick={() => navigate("/settings/profile")}
              className="flex items-center mt-5 gap-1.5 px-4 py-2 border border-[#fffd01]/30 bg-[#fffd01]/5 text-[#fffd01] text-[11px] font-bold tracking-widest hover:bg-[#fffd01]/10 transition-colors"
            >
              <Edit2 size={10} />
              Edit Profile
            </button>
          </div>

          {/* name + username */}
          <div className="flex items-baseline flex-wrap gap-2 mb-2">
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight leading-none">
              {displayName}
            </h1>
            {username && (
              <span className="text-[13px] text-zinc-500 font-mono">[{username}]</span>
            )}
          </div>

          {/* bio */}
          <p className="text-[13px] text-zinc-500 leading-relaxed mb-5">{bio}</p>

          {/* stats bar */}
          <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl py-4 mb-6">
            <StatItem value={allyCount} label="Allied With" divider />
            <StatItem value={posts.length} label="Posts" divider />
          </div>

          {/* ── POSTS ── */}
          <div className="mb-6">
            <h2 className="text-[13px] font-bold tracking-widest uppercase mb-1" style={{ color: EMBER }}>
              Posts
            </h2>

            {loadingPosts ? (
              <div className="flex justify-center py-10">
                <div className="w-4 h-4 border-2 border-white/10 border-t-[#fffd01] rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-zinc-700 text-sm text-center py-10">No posts yet.</p>
            ) : (
              <>
                <div>
                  {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>

                {hasMore && (
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex-1 h-px bg-white/[0.05]" />
                    <button
                      onClick={() => void fetchMore()}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <ChevronDown size={13} />
                      load more
                    </button>
                    <div className="flex-1 h-px bg-white/[0.05]" />
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex-1 h-px bg-white/[0.05]" />
                    <span className="text-[11px] text-zinc-700">all caught up</span>
                    <div className="flex-1 h-px bg-white/[0.05]" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── PREFERENCES ── */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-[13px] font-bold tracking-widest uppercase" style={{ color: EMBER }}>
              Preferences
            </h2>

            {/* theme toggle */}
            {/* <div className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-400">Theme</span>
              <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1">
                {([
                  { value: "light", Icon: Sun   },
                  { value: "dark",  Icon: Moon  },
                  { value: "system",Icon: Monitor},
                ] as const).map(({ value, Icon }) => (
                  <button
                    key={value}
                    className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] transition-all"
                    title={value}
                  >
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            </div> */}

            {/* <div className="h-px bg-white/[0.06]" /> */}

            {/* help */}
            {/* <button className="flex items-center gap-3 text-[13px] text-zinc-400 hover:text-zinc-200 transition-colors text-left">
              <HelpCircle size={15} className="text-zinc-600" />
              Help & Support
            </button> */}

            <div className="h-px bg-white/[0.06]" />

            {/* sign out */}
            <button
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="flex items-center gap-3 text-[13px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 text-left"
            >
              <LogOut size={15} className="text-red-500" />
              {signingOut ? "Signing out…" : "Sign Out"}
            </button>
          </div>

          {/* footer */}
          <p className="text-center text-[9px] tracking-[3px] uppercase text-zinc-800 mt-6">
            © SkillHiive
          </p>
        </div>
      </div>
    </div>
    </SwipeLayout>
  );
}
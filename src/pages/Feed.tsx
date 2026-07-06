import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/profileContext";
import { Heart, MessageCircle, Share2, Briefcase, FileText, Camera, Plus, X, ChevronDown } from "lucide-react";
import SwipeLayout from "@/components/SwipeLayout";
import ActionRow from "@/components/ActionRow";

// ─────────────────────────────────────────
// TYPES  (identical to mobile RawPost)
// ─────────────────────────────────────────

type PostType      = "project" | "offer" | "media";
type ProjectStatus = "active" | "completed" | "paused";

interface RawPost {
  id:             string;
  user_id:        string;
  post_type:      PostType;
  caption:        string | null;
  likes_count:    number;
  comments_count: number;
  created_at:     string;
  profiles: {
    id:       string;
    username: string | null;
    avatar:   string | null;
  };
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
  post_images: {
    url:        string;
    sort_order: number;
  }[] | null;
}

// ─────────────────────────────────────────
// CONSTANTS  (matched to mobile)
// ─────────────────────────────────────────

const PAGE_SIZE        = 10;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min, same as mobile
const POLL_INTERVAL    = 30 * 1000;     // 30s, same as mobile

const FEED_QUERY = `
  id,
  post_type,
  caption,
  likes_count,
  comments_count,
  created_at,
  profiles:profiles!posts_user_id_profiles_fkey (
    id,
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

const POST_TYPES: { value: PostType; label: string; Icon: React.FC<{ size: number; className?: string }> }[] = [
  { value: "project", label: "Project", Icon: Briefcase },
  { value: "media",   label: "Media",   Icon: Camera    },
  { value: "offer",   label: "Offer",   Icon: FileText  },
];

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

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

// ─────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────

function Avatar({
  name,
  src,
  size = "w-8 h-8",
  textSize = "text-xs",
  ring = false,
}: {
  name: string;
  src: string | null;
  size?: string;
  textSize?: string;
  ring?: boolean;
}) {
  const initials = getInitials(name);
  const base = `${size} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${ring ? "ring-2 ring-[#fffd01]/40" : ""}`;

  if (src) {
    return <img src={src} alt={name} className={`${base} object-cover`} />;
  }

  return (
    <div className={`${base} bg-[#fffd01]/10 text-[#fffd01] ${textSize}`}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────
// PROJECT CARD
// ─────────────────────────────────────────

function ProjectCard({ post, myId }: { post: RawPost; myId: string | null }) {
  const navigate = useNavigate();
  const pp  = post.project_posts!;
  const cfg = STATUS_CFG[pp.status];
  const img = [...(post.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const dur = calcDuration(pp.started_at, pp.ended_at);

  return (
    <article className="group relative py-7 border-b border-white/[0.06] p-5">
      <div className="absolute left-0 top-7 bottom-7 w-0.5 bg-[#fffd01] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex items-center gap-2.5 mb-4">
        <button
          onClick={() => post.profiles.id !== myId && navigate(`/profile/${post.profiles.id}`)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <Avatar name={post.profiles.username ?? "?"} src={post.profiles.avatar} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-200 truncate leading-none mb-0.5">
              {post.profiles.username ?? "unknown"}
            </p>
            <p className="text-[11px] text-zinc-600">{timeAgo(post.created_at)}</p>
          </div>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#fffd01]/8 text-[#fffd01]">
          Project
        </span>
      </div>

      <h2 className="text-[18px] font-black text-zinc-100 leading-snug tracking-tight mb-2">
        {pp.title}
      </h2>

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
        <div className="w-full rounded-xl overflow-hidden bg-zinc-900 mb-4">
          <img src={img} alt={pp.title} className="w-full object-fit" loading="lazy" />
        </div>
      )}

      {pp.description && (
        <p className="text-[13.5px] text-zinc-400 leading-relaxed mb-2 line-clamp-3">
          {pp.description}
        </p>
      )}

      {post.caption && (
        <p className="text-[13px] text-zinc-600 italic mb-1">"{post.caption}"</p>
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

// ─────────────────────────────────────────
// OFFER CARD
// ─────────────────────────────────────────

function OfferCard({ post, myId }: { post: RawPost; myId: string | null }) {
  const navigate = useNavigate();
  const op = post.offer_posts!;
  const typeLabel = op.offer_type ? (OFFER_LABELS[op.offer_type] ?? op.offer_type) : null;

  return (
    <article className="group relative py-7 border-b border-white/[0.06] last:border-b-0">
      <div className="absolute left-0 top-7 bottom-7 w-0.5 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex items-center gap-2.5 mb-4">
        <button
          onClick={() => post.profiles.id !== myId && navigate(`/profile/${post.profiles.id}`)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <Avatar name={post.profiles.username ?? "?"} src={post.profiles.avatar} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-200 truncate leading-none mb-0.5">
              {post.profiles.username ?? "unknown"}
            </p>
            <p className="text-[11px] text-zinc-600">{timeAgo(post.created_at)}</p>
          </div>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-green-400/10 text-green-400">
          Offer
        </span>
      </div>

      <div className="relative rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 mb-3 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-green-400 rounded-l-xl" />
        <div className="pl-1">
          {op.company && (
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-green-400 mb-1.5">
              {op.company}
            </p>
          )}
          <p className="text-[17px] font-black text-zinc-100 tracking-tight leading-tight mb-2">
            {op.role ?? "Role TBD"}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {op.salary_range && <span className="text-[12.5px] text-zinc-400">{op.salary_range}</span>}
            {op.salary_range && op.location && <span className="text-zinc-700">·</span>}
            {op.location && <span className="text-[12.5px] text-zinc-400">{op.location}</span>}
            {typeLabel && (
              <span className="ml-auto text-[10.5px] font-bold text-green-400 bg-green-400/10 px-2.5 py-0.5 rounded-full">
                {typeLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {post.caption && (
        <p className="text-[13px] text-zinc-500 leading-relaxed italic mb-1">"{post.caption}"</p>
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

// ─────────────────────────────────────────
// MEDIA CARD  (was missing on web — mobile has MediaCard.tsx,
// web's renderPost silently dropped "media" posts before)
// ─────────────────────────────────────────

function MediaCard({ post, myId }: { post: RawPost; myId: string | null }) {
  const navigate = useNavigate();
  const img = [...(post.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;

  return (
    <article className="group relative py-7 border-b border-white/[0.06] last:border-b-0">
      <div className="absolute left-0 top-7 bottom-7 w-0.5 bg-sky-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex items-center gap-2.5 mb-4">
        <button
          onClick={() => post.profiles.id !== myId && navigate(`/profile/${post.profiles.id}`)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <Avatar name={post.profiles.username ?? "?"} src={post.profiles.avatar} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-200 truncate leading-none mb-0.5">
              {post.profiles.username ?? "unknown"}
            </p>
            <p className="text-[11px] text-zinc-600">{timeAgo(post.created_at)}</p>
          </div>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-sky-400/10 text-sky-400">
          Media
        </span>
      </div>

      {img && (
        <div className="w-full rounded-xl overflow-hidden bg-zinc-900 mb-4">
          <img src={img} alt="" className="w-full h-full object-fit max-h-[420px]" loading="lazy" />
        </div>
      )}

      {post.caption && (
        <p className="text-[13.5px] text-zinc-400 leading-relaxed mb-1">
          {post.caption}
        </p>
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

// ─────────────────────────────────────────
// COMPOSE BAR  (mirrors ShareBar.tsx exactly — same fields, same insert logic)
// ─────────────────────────────────────────

type OfferType = "full_time" | "part_time" | "internship" | "contract";

const OFFER_TYPE_OPTIONS: { value: OfferType; label: string }[] = [
  { value: "full_time",  label: "Full-Time"  },
  { value: "part_time",  label: "Part-Time"  },
  { value: "internship", label: "Internship" },
  { value: "contract",   label: "Contract"   },
];

async function uploadPostImage(file: File): Promise<string> {
  const fileName = `${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(fileName, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("post-images").getPublicUrl(fileName);
  return data.publicUrl;
}

function ComposeBar({ onPosted }: { onPosted: () => void }) {
  const { profile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open,    setOpen]    = useState(false);
  const [type,    setType]    = useState<PostType>("project");
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // project fields
  const [title,            setTitle]            = useState("");
  const [description,      setDescription]      = useState("");
  const [currentlyWorking, setCurrentlyWorking] = useState(true);
  const [startedAt,        setStartedAt]        = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endedAt,          setEndedAt]          = useState<string>("");

  // offer fields
  const [company,     setCompany]     = useState("");
  const [role,        setRole]        = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [location,    setLocation]    = useState("");
  const [offerType,   setOfferType]   = useState<OfferType>("full_time");

  // image
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const canPost =
    caption.trim().length > 0 &&
    (type !== "project" || title.trim().length > 0) &&
    (type !== "offer"   || (company.trim().length > 0 && role.trim().length > 0));

  function reset() {
    setCaption("");
    setTitle("");
    setDescription("");
    setCurrentlyWorking(true);
    setStartedAt(new Date().toISOString().split("T")[0]);
    setEndedAt("");
    setCompany("");
    setRole("");
    setSalaryRange("");
    setLocation("");
    setOfferType("full_time");
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setType("project");
    setOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handlePost() {
    if (!canPost || posting) return;
    setError(null);
    try {
      setPosting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: created, error: postErr } = await supabase
        .from("posts")
        .insert({ user_id: user.id, post_type: type, caption: caption.trim() || null })
        .select("id")
        .single();
      if (postErr) throw postErr;
      const postId = created.id;

      if (type === "project") {
        const { error: e } = await supabase.from("project_posts").insert({
          post_id:     postId,
          title:       title.trim(),
          description: description.trim() || null,
          started_at:  startedAt || null,
          ended_at:    currentlyWorking || !endedAt ? null : endedAt,
          status:      currentlyWorking ? "active" : "completed",
        });
        if (e) throw e;
      }

      if (type === "offer") {
        const { error: e } = await supabase.from("offer_posts").insert({
          post_id:      postId,
          company:      company.trim()     || null,
          role:         role.trim()        || null,
          salary_range: salaryRange.trim() || null,
          location:     location.trim()    || null,
          offer_type:   offerType,
        });
        if (e) throw e;
      }

      if (imageFile) {
        const publicUrl = await uploadPostImage(imageFile);
        const { error: e } = await supabase
          .from("post_images")
          .insert({ post_id: postId, url: publicUrl, sort_order: 0 });
        if (e) throw e;
      }

      reset();
      onPosted();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setPosting(false);
    }
  }

  const displayName = profile?.username ?? profile?.displayname ?? "ME";

  const fieldClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-white/[0.15] transition-colors";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/[0.1] hover:border-[#fffd01]/30 hover:bg-[#fffd01]/[0.03] transition-all duration-200 text-left mb-8"
      >
        <Avatar name={displayName} src={profile?.avatar ?? null} size="w-8 h-8" textSize="text-xs" />
        <span className="flex-1 text-[13.5px] text-zinc-600">Share your progress...</span>
        <span className="w-7 h-7 rounded-full bg-[#fffd01]/10 flex items-center justify-center text-[#fffd01] flex-shrink-0">
          <Plus size={15} strokeWidth={2.5} />
        </span>
      </button>
    );
  }

  return (
    <div className="border border-white/[0.1] rounded-2xl p-5 mb-8 bg-white/[0.02] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-zinc-300">New Post</span>
        <button
          onClick={reset}
          className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] transition-all"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Type selector */}
      <div className="flex gap-2">
        {POST_TYPES.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setType(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150
              ${type === value
                ? "border-[#fffd01]/40 bg-[#fffd01]/10 text-[#fffd01]"
                : "border-white/[0.08] text-zinc-500 hover:text-zinc-300"
              }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Caption */}
      <div>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder={
            type === "project" ? "What are you building? Share an update..."
            : type === "media"  ? "What's the story behind this?"
            :                     "Tell us about this opportunity..."
          }
          maxLength={500}
          rows={3}
          className={`${fieldClass} resize-none leading-relaxed`}
        />
        <p className={`text-right text-[11px] mt-1 ${caption.length > 400 ? "text-amber-400" : "text-zinc-700"}`}>
          {caption.length}/500
        </p>
      </div>

      {/* ── PROJECT FIELDS ── */}
      {type === "project" && (
        <div className="flex flex-col gap-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Project title *"
            maxLength={80}
            className={`${fieldClass} font-semibold`}
          />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tech stack, what you built, key learnings..."
            maxLength={300}
            rows={3}
            className={`${fieldClass} resize-none leading-relaxed`}
          />

          <div className="flex gap-3">
            <label className="flex-1 flex flex-col gap-1">
              <span className="text-[11px] text-zinc-600">Started</span>
              <input
                type="date"
                value={startedAt}
                onChange={e => setStartedAt(e.target.value)}
                max={endedAt || undefined}
                className={fieldClass}
              />
            </label>
            <label className={`flex-1 flex flex-col gap-1 ${currentlyWorking ? "opacity-45" : ""}`}>
              <span className="text-[11px] text-zinc-600">Ended</span>
              <input
                type="date"
                value={endedAt}
                disabled={currentlyWorking}
                onChange={e => setEndedAt(e.target.value)}
                min={startedAt || undefined}
                max={new Date().toISOString().split("T")[0]}
                className={fieldClass}
              />
            </label>
          </div>

          <label className="flex items-center gap-2.5 py-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={currentlyWorking}
              onChange={e => {
                setCurrentlyWorking(e.target.checked);
                if (e.target.checked) setEndedAt("");
              }}
              className="w-4 h-4 accent-[#fffd01]"
            />
            <span className="text-[13.5px] text-zinc-400">I'm currently working on this</span>
          </label>
        </div>
      )}

      {/* ── OFFER FIELDS ── */}
      {type === "offer" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {OFFER_TYPE_OPTIONS.map(ot => (
              <button
                key={ot.value}
                onClick={() => setOfferType(ot.value)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150
                  ${offerType === ot.value
                    ? "border-[#fffd01]/40 bg-[#fffd01]/10 text-[#fffd01]"
                    : "border-white/[0.08] text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                {ot.label}
              </button>
            ))}
          </div>

          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Company *"
            maxLength={80}
            className={fieldClass}
          />
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Role / Position *"
            maxLength={80}
            className={fieldClass}
          />
          <div className="flex gap-2">
            <input
              value={salaryRange}
              onChange={e => setSalaryRange(e.target.value)}
              placeholder="Salary range"
              maxLength={40}
              className={`flex-1 ${fieldClass}`}
            />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location"
              maxLength={60}
              className={`flex-1 ${fieldClass}`}
            />
          </div>
        </div>
      )}

      {/* Cover image */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden">
            <img src={imagePreview} alt="" className="w-full h-[200px] object-fit" />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-1.5 py-6 rounded-xl border border-dashed border-white/[0.1] hover:border-white/[0.2] transition-colors"
          >
            <Camera size={18} className="text-zinc-600" />
            <span className="text-[13px] text-zinc-600">Add cover image</span>
            <span className="text-[11px] text-zinc-700">Optional · 16:9</span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Validation hints — matches mobile */}
      {type === "project" && !title.trim() && caption.trim().length > 0 && (
        <p className="text-[11px] text-zinc-600 text-center -mt-2">
          Project title is required to publish
        </p>
      )}
      {type === "offer" && caption.trim().length > 0 && (!company.trim() || !role.trim()) && (
        <p className="text-[11px] text-zinc-600 text-center -mt-2">
          Company and role are required to publish
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl border border-white/[0.08] text-zinc-400 text-sm font-semibold hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePost}
          disabled={!canPost || posting}
          className="px-5 py-2 rounded-xl text-sm font-black transition-all duration-150
            disabled:opacity-30 disabled:cursor-not-allowed
            bg-[#fffd01] text-zinc-900 hover:bg-[#fffd01]/90 enabled:shadow-[0_0_20px_rgba(255,253,1,0.2)]"
        >
          {posting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// FEED PAGE
// ─────────────────────────────────────────

export default function Feed() {
  const { profile } = useProfile();

  const [posts,       setPosts]       = useState<RawPost[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [hasMore,     setHasMore]     = useState(true);
  const [cursor,      setCursor]      = useState<string | null>(null);
  const [filter,      setFilter]      = useState<"all" | "projects" | "offers">("all");

  const isFetchingMore = useRef(false);
  const lastFetchedRef  = useRef<number>(0);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── initial fetch ──
  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    let query = supabase
      .from("posts")
      .select(FEED_QUERY)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (filter === "projects") query = query.eq("post_type", "project");
    if (filter === "offers")   query = query.eq("post_type", "offer");

    const { data, error: fetchErr } = await query.returns<RawPost[]>();

    if (fetchErr) {
      setError("Couldn't load posts. Try refreshing.");
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    lastFetchedRef.current = Date.now();
    setPosts(rows);
    setHasMore(rows.length === PAGE_SIZE);
    setCursor(rows.length > 0 ? rows[rows.length - 1].created_at : null);
    setLoading(false);
  }, [filter]);

  // ── keep a ref to the latest fetchFeed so interval/poll callbacks never go stale ──
  const fetchFeedRef = useRef(fetchFeed);
  useEffect(() => {
    fetchFeedRef.current = fetchFeed;
  }, [fetchFeed]);

  // ── load more (cursor pagination — same as mobile) ──
  const fetchMore = useCallback(async () => {
    if (isFetchingMore.current || !hasMore || !cursor) return;
    isFetchingMore.current = true;
    setLoadingMore(true);

    let query = supabase
      .from("posts")
      .select(FEED_QUERY)
      .order("created_at", { ascending: false })
      .lt("created_at", cursor)
      .limit(PAGE_SIZE);

    if (filter === "projects") query = query.eq("post_type", "project");
    if (filter === "offers")   query = query.eq("post_type", "offer");

    const { data, error: fetchErr } = await query.returns<RawPost[]>();

    if (!fetchErr && data) {
      const rows = data ?? [];
      setPosts(prev => [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
      setCursor(rows.length > 0 ? rows[rows.length - 1].created_at : cursor);
    }

    setLoadingMore(false);
    isFetchingMore.current = false;
  }, [cursor, hasMore, filter]);

  // ── initial load whenever filter changes ──
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // ── polling every 30s, same cadence as mobile ──
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchFeedRef.current(true);
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── 5 min auto-refresh + refresh-on-tab-focus, mirrors mobile's AppState logic ──
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchFeedRef.current(true);
    }, REFRESH_INTERVAL);

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastFetchedRef.current;
        if (elapsed >= REFRESH_INTERVAL) fetchFeedRef.current(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  function renderPost(post: RawPost) {
    const myId = profile?.id ?? null;
    if (post.post_type === "project") return <ProjectCard key={post.id} post={post} myId={myId} />;
    if (post.post_type === "offer")   return <OfferCard   key={post.id} post={post} myId={myId} />;
    if (post.post_type === "media")   return <MediaCard   key={post.id} post={post} myId={myId} />;
    return null;
  }

  return (
    <SwipeLayout>
    <div className="flex min-h-screen bg-[#0c0c0e] pt-20">

      <div className="flex flex-col flex-1 min-w-0">

        <main className="flex-1 px-8 pb-20 max-w-[680px] w-full mx-auto">

          <div className="flex items-baseline justify-between pt-7 mb-5">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-zinc-600">
              {todayLabel()}
            </p>
            {!loading && (
              <p className="text-[11px] text-zinc-700">
                {posts.length} dispatches
              </p>
            )}
          </div>

          <div className="flex gap-2 mb-8">
            {(["all", "projects", "offers"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150
                  ${filter === f
                    ? "border-[#fffd01]/40 bg-[#fffd01]/10 text-[#fffd01]"
                    : "border-white/[0.08] text-zinc-600 hover:text-zinc-400"
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <ComposeBar onPosted={() => fetchFeed(true)} />

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-5 h-5 border-2 border-white/10 border-t-[#fffd01] rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-center text-zinc-600 py-16 text-sm">{error}</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-zinc-700 py-16 text-sm">
              No posts yet. Be the first to share something.
            </p>
          ) : (
            <div>
              <div className="pl-5">
                {posts.map(renderPost)}
              </div>

              {loadingMore && (
                <div className="flex justify-center py-8">
                  <div className="w-4 h-4 border-2 border-white/10 border-t-zinc-500 rounded-full animate-spin" />
                </div>
              )}

              {!loadingMore && hasMore && (
                <div className="flex items-center gap-4 py-8">
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <button
                    onClick={fetchMore}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <ChevronDown size={13} />
                    load more posts
                  </button>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div className="flex items-center gap-4 py-8">
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-[11px] text-zinc-700 font-medium">you're all caught up</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
    </SwipeLayout>
  );
}
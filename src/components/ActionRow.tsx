import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function ActionRow({
  postId,
  likes,
  comments,
  onCommentPress,
}: {
  postId: string;
  likes: number;
  comments: number;
  onCommentPress?: (id: string) => void;
}) {
  const [liked,     setLiked]     = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setLiked(!!data);
    }
    check();
    return () => { cancelled = true; };
  }, [postId]);

  const handleLike = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    if (liked) {
      setLiked(false);
      setLikeCount(c => Math.max(c - 1, 0));
      const { error } = await supabase.from("likes").delete()
        .eq("post_id", postId).eq("user_id", user.id);
      if (error) { setLiked(true); setLikeCount(c => c + 1); }
    } else {
      setLiked(true);
      setLikeCount(c => c + 1);
      const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
      if (error) { setLiked(false); setLikeCount(c => Math.max(c - 1, 0)); }
    }
    setLoading(false);
  }, [liked, loading, postId]);

  return (
    <div className="flex items-center gap-1 px-5 py-3 border-t border-white/[0.06]">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
          ${liked
            ? "bg-red-500/10 text-red-400"
            : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
          } disabled:opacity-50`}
      >
        <Heart
          size={14}
          fill={liked ? "currentColor" : "none"}
          className={liked ? "scale-110" : ""}
        />
        <span>{likeCount > 0 ? likeCount : "Like"}</span>
      </button>

      <button
        onClick={() => onCommentPress?.(postId)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300 transition-all duration-150"
      >
        <MessageCircle size={14} />
        <span>{comments > 0 ? comments : "Comment"}</span>
      </button>

      <div className="flex-1" />

      <button className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.05] transition-all duration-150">
        <Share2 size={13} />
      </button>
    </div>
  );
}
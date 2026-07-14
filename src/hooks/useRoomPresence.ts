import { supabase } from "@/lib/supabase";
import { useEffect, useRef } from "react";

/**
 * Registers the current user as a participant of `roomName` in Supabase
 * (`room_participants`) and starts the room's focus/break session via RPC.
 *
 * This is what populates the `active_rooms` view that the Home screen reads —
 * without it, a room a user joins never appears for anyone else. Direct port of
 * the mobile `useRoomPresence` hook.
 */
export function useRoomPresence(
  roomName: string | undefined,
  onJoinFailed?: () => void,
) {
  const participantId = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const joinedRef = useRef(false);
  const sessionTriggeredRef = useRef(false);

  useEffect(() => {
    if (!roomName) return;

    async function join() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          onJoinFailed?.();
          return;
        }

        userIdRef.current = user.id;

        // Clear any stale row for this user in this room first.
        await supabase
          .from("room_participants")
          .delete()
          .eq("user_id", user.id)
          .eq("room_name", roomName);

        const { data, error: insertError } = await supabase
          .from("room_participants")
          .insert({
            room_name: roomName,
            user_id: user.id,
            joined_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError || !data) {
          onJoinFailed?.();
          return;
        }

        // Verify the write landed before considering ourselves joined.
        const { data: verify, error: verifyError } = await supabase
          .from("room_participants")
          .select("id")
          .eq("id", data.id)
          .single();
        if (verifyError || !verify) {
          onJoinFailed?.();
          return;
        }

        participantId.current = data.id;
        joinedRef.current = true;

        // Kick off the room session (sets session_started_at) exactly once.
        if (!sessionTriggeredRef.current) {
          sessionTriggeredRef.current = true;
          const { error } = await supabase.rpc(
            "start_room_session_if_not_started",
            { p_room_name: roomName },
          );
          if (error) console.error("start_room_session error:", error);
        }
      } catch (err) {
        console.error("Room join failed:", err);
        onJoinFailed?.();
      }
    }

    async function leave() {
      if (!joinedRef.current || !userIdRef.current) return;
      if (participantId.current) {
        const { error } = await supabase
          .from("room_participants")
          .delete()
          .eq("id", participantId.current);
        if (error) {
          await supabase
            .from("room_participants")
            .delete()
            .eq("user_id", userIdRef.current)
            .eq("room_name", roomName);
        }
      } else {
        await supabase
          .from("room_participants")
          .delete()
          .eq("user_id", userIdRef.current)
          .eq("room_name", roomName);
      }
      participantId.current = null;
      userIdRef.current = null;
      joinedRef.current = false;
    }

    let heartbeat: ReturnType<typeof setInterval> | null = null;

    join().then(() => {
      if (joinedRef.current) {
        heartbeat = setInterval(async () => {
          if (!participantId.current || !joinedRef.current) return;
          await supabase
            .from("room_participants")
            .update({ last_seen: new Date().toISOString() })
            .eq("id", participantId.current);
        }, 30000);
      }
    });

    // Best-effort cleanup if the tab is closed/refreshed mid-session.
    const onUnload = () => {
      if (participantId.current) {
        void supabase
          .from("room_participants")
          .delete()
          .eq("id", participantId.current);
      }
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      window.removeEventListener("beforeunload", onUnload);
      void leave();
    };
  }, [roomName]);
}

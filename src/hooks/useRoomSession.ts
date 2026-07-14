import { computePhase, type PhaseState } from "@/hooks/sessionPhase";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks a room's focus/break session. Reads `session_started_at` from the
 * `active_rooms` view and ticks the phase every second. Polls (rather than
 * using realtime) so it works even when the realtime WS is unavailable —
 * matching the rest of the app.
 */
export function useRoomSession(roomName: string) {
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [phaseState, setPhaseState] = useState<PhaseState>(computePhase(null));

  const startedAtRef = useRef<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTicking = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = setInterval(() => {
      setPhaseState(computePhase(startedAtRef.current));
    }, 1000);
  }, []);

  useEffect(() => {
    if (!roomName) return;
    let cancelled = false;

    async function poll() {
      const { data } = await supabase
        .from("active_rooms")
        .select("session_started_at")
        .eq("room_name", roomName)
        .maybeSingle();
      if (cancelled) return;
      const ts: string | null = data?.session_started_at ?? null;
      if (ts && !startedAtRef.current) {
        startedAtRef.current = ts;
        setSessionStartedAt(ts);
        setPhaseState(computePhase(ts));
        startTicking();
      }
    }

    poll();
    // Poll until the session has started, then we can rely on the local tick.
    const sessionPoll = setInterval(() => {
      if (!startedAtRef.current) poll();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(sessionPoll);
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [roomName, startTicking]);

  return { phaseState, sessionStartedAt };
}

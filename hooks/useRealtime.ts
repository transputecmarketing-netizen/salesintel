'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

import type { Signal } from '@/types/signal';
import { useSignalStore } from '@/stores/signals';

type RealtimeEvent =
  | { type: 'signal:new'; payload: Signal }
  | { type: 'signal:updated'; payload: { id: string; changes: Partial<Signal> } }
  | { type: 'research:progress'; payload: { jobId: string; step: string; status: string } }
  | { type: 'research:completed'; payload: { jobId: string } }
  | { type: 'score:updated'; payload: { companyId: string; healthScore: number } };

type EventHandler = (event: RealtimeEvent) => void;

interface UseRealtimeOptions {
  /** Supabase table/channel to subscribe to */
  channel?: string;
  /** Whether the subscription is active */
  enabled?: boolean;
  /** Custom event handler */
  onEvent?: EventHandler;
  /** Auto-add new signals to the store */
  autoAddSignals?: boolean;
}

interface UseRealtimeReturn {
  connected: boolean;
  lastEvent: RealtimeEvent | null;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  subscribedChannels: string[];
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    channel = 'signals',
    enabled = true,
    onEvent,
    autoAddSignals = true,
  } = options;

  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([]);
  const signalStore = useSignalStore();
  const subscriptionRef = useRef<unknown>(null);
  const handlersRef = useRef<Map<string, EventHandler>>(new Map());

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      setLastEvent(event);

      // Auto-handle signal events
      if (autoAddSignals && event.type === 'signal:new') {
        signalStore.addSignal(event.payload);
      }

      // Call custom handler
      onEvent?.(event);

      // Call channel-specific handlers
      for (const handler of handlersRef.current.values()) {
        handler(event);
      }
    },
    [autoAddSignals, signalStore, onEvent]
  );

  const subscribe = useCallback(
    (channelName: string) => {
      if (subscribedChannels.includes(channelName)) return;

      // Placeholder: In production, use Supabase Realtime
      //
      // const supabase = createClient(
      //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
      //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      // );
      //
      // const subscription = supabase
      //   .channel(channelName)
      //   .on('postgres_changes', {
      //     event: 'INSERT',
      //     schema: 'public',
      //     table: channelName,
      //   }, (payload) => {
      //     handleEvent({
      //       type: `${channelName}:new` as RealtimeEvent['type'],
      //       payload: payload.new,
      //     });
      //   })
      //   .on('postgres_changes', {
      //     event: 'UPDATE',
      //     schema: 'public',
      //     table: channelName,
      //   }, (payload) => {
      //     handleEvent({
      //       type: `${channelName}:updated` as RealtimeEvent['type'],
      //       payload: { id: payload.new.id, changes: payload.new },
      //     });
      //   })
      //   .subscribe((status) => {
      //     setConnected(status === 'SUBSCRIBED');
      //   });
      //
      // subscriptionRef.current = subscription;

      setSubscribedChannels((prev) => [...prev, channelName]);
      console.log(`[Realtime] Subscribed to channel: ${channelName} (placeholder - configure Supabase for production)`);
    },
    [subscribedChannels]
  );

  const unsubscribe = useCallback(
    (channelName: string) => {
      // In production:
      // if (subscriptionRef.current) {
      //   supabase.removeChannel(subscriptionRef.current);
      // }

      setSubscribedChannels((prev) => prev.filter((c) => c !== channelName));
      console.log(`[Realtime] Unsubscribed from channel: ${channelName}`);
    },
    []
  );

  // Auto-subscribe to default channel
  useEffect(() => {
    if (enabled && channel) {
      subscribe(channel);
      setConnected(true); // Placeholder - in production, set by Supabase callback
    }

    return () => {
      if (channel) {
        unsubscribe(channel);
      }
      setConnected(false);
    };
  }, [enabled, channel]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connected,
    lastEvent,
    subscribe,
    unsubscribe,
    subscribedChannels,
  };
}

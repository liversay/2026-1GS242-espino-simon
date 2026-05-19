import { useEffect, useRef, useState } from 'react'

type WsMsg<T> = { type: string; data: T }

function wsOrigin() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}

/**
 * Subscribe to live server pushes for a room/battle code.
 *
 * On mount: fires an HTTP fetch immediately so the UI has data before the WS
 * handshake completes. Then opens a WebSocket at /ws/<code> and updates state
 * whenever the server pushes a message with the matching `type`.
 *
 * Auto-reconnects after 2 s if the socket closes unexpectedly.
 */
export function useWS<T>(
  code: string,
  type: 'battle' | 'room',
  fetchFn: () => Promise<T>,
): { data: T | null; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const fetchRef = useRef(fetchFn)
  fetchRef.current = fetchFn

  // Initial HTTP fetch — fills the UI while WS handshake is in progress.
  useEffect(() => {
    fetchRef.current()
      .then(setData)
      .catch((e: Error) => setError(e))
  }, [code])

  // WebSocket subscription with automatic reconnect.
  useEffect(() => {
    let ws: WebSocket | null = null
    let unmounted = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      if (unmounted) return
      ws = new WebSocket(`${wsOrigin()}/ws/${code}`)

      ws.onmessage = (e: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(e.data) as WsMsg<T>
          if (msg.type === type) setData(msg.data)
        } catch { /* ignore malformed frames */ }
      }

      ws.onerror = () => {
        setError(new Error('WebSocket error — retrying…'))
      }

      ws.onclose = () => {
        if (!unmounted) retryTimer = setTimeout(connect, 2000)
      }
    }

    connect()
    return () => {
      unmounted = true
      if (retryTimer) clearTimeout(retryTimer)
      ws?.close()
    }
  }, [code, type])

  const refetch = () => {
    fetchRef.current()
      .then(setData)
      .catch((e: Error) => setError(e))
  }

  return { data, error, refetch }
}

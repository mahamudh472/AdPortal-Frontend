// src/RootWraper.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import api from "./lib/axios";
import { Suspense, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  addNotification, 
  fetchNotifications,
  setUnreadCount,
 
} from "./features/auth/Context/notificationsSlice";

const mapServerToNotif = (payload: any) => {
  return {
    id: String(payload.id),
    type: payload.type || "notification",
    title: payload.title || "New Notification",
    message: payload.message || payload.body || "",
    data: payload,
    read: payload.read || false,
    created_at: payload.created_at,
  };
};

export const RootWraper = () => {
  const ws = useRef<WebSocket | null>(null);
  const dispatch = useDispatch();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isAuthenticated = useSelector((state: any) => state?.auth?.isAuthenticated);

  const getToken = useCallback(() => {
    return localStorage.getItem("accessToken") || "";
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onerror = null;
      ws.current.onclose = null;
      
      if (ws.current.readyState === WebSocket.OPEN || 
          ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close();
      }
      ws.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("User not authenticated, skipping WebSocket connection");
      return;
    }

    disconnect();

    const token = getToken();
    if (!token) {
      console.log("No token available for WebSocket connection");
      return;
    }

    // Use a short-lived single-use ticket instead of putting the JWT in the URL
    // (URLs end up in server/proxy logs and browser history).
    let ticket: string;
    try {
      const res = await api.post("/accounts/ws-ticket/");
      ticket = res.data.ticket;
    } catch (err) {
      console.warn("Could not obtain WebSocket ticket", err);
      return;
    }
    const wsUrl = `${import.meta.env.VITE_API_BASE_WS_URL}/ws/notifications/?ticket=${encodeURIComponent(ticket)}`;
    console.log("Attempting WS connect");

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected successfully");
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          console.log("WS payload received:", payload);

         
          if (payload.type === "notification" && payload.data) {
            const notificationData = payload.data;
            const newNotification = mapServerToNotif(notificationData);
            
           
            dispatch(addNotification(newNotification));
            
            
            console.log(`New notification received, unread count will increase by 1 if unread`);
          }
          
  
          else if (payload.unread_count !== undefined) {
            dispatch(setUnreadCount(payload.unread_count));
          }
          
        
          else if (Array.isArray(payload)) {
            console.log(`Received ${payload.length} notifications via WS`);
            payload.forEach((p) => {
              if (p.id) {
                const newNotification = mapServerToNotif(p);
                dispatch(addNotification(newNotification));
              
              }
            });
          }
          
        
          else if (payload.id && payload.message) {
            const newNotification = mapServerToNotif(payload);
            dispatch(addNotification(newNotification));
           
          }
          

          else if (payload.type === "unread_count_update") {
            dispatch(setUnreadCount(payload.count || 0));
          }
        } catch (err) {
          console.warn("Failed to parse WS message:", event.data, err);
        }
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.current.onclose = (ev) => {
        console.warn("WebSocket closed:", ev.code, ev.reason);
        
        if (ev.code !== 1000 && ev.code !== 1001) {
          if (isAuthenticated && reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            
            const timeout = Math.min(
              30000,
              1000 * Math.pow(2, Math.min(reconnectAttempts.current, 5))
            );
            
            console.log(`Reconnecting in ${timeout/1000}s... (Attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
            setTimeout(connect, timeout);
          }
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }, [dispatch, getToken, isAuthenticated, disconnect]);

  useEffect(() => {
    if (isAuthenticated && getToken()) {
      connect();
      

      dispatch(fetchNotifications({ page: 1, pageSize: 10 }) as any);
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, getToken, connect, disconnect, dispatch]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        if (!e.newValue && isAuthenticated) {
          disconnect();
        } else if (e.newValue && isAuthenticated) {
          disconnect();
          connect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, disconnect, connect]);

  return <Suspense fallback={null}><RouterProvider router={router} /></Suspense>;
};
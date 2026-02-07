// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!socketRef.current) {
            const token = localStorage.getItem("token");

            // Create socket once
            socketRef.current = io("http://localhost:5000", {
                auth: { token },
                transports: ["websocket"],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });

            // Connection events
            socketRef.current.on("connect", () => {
                console.log("✅ Socket connected:", socketRef.current.id);
                setConnected(true);
            });

            socketRef.current.on("disconnect", (reason) => {
                console.log("❌ Socket disconnected:", reason);
                setConnected(false);
            });

            socketRef.current.on("connect_error", (err) => {
                console.error("Socket connection error:", err.message);
            });
        }

        // Keep socket alive on unmount
        return () => { };
    }, []);

    // Function to emit messages
    const sendMessage = (message) => {
        if (socketRef.current && connected) {
            socketRef.current.emit("send_message", message);
        }
    };

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected, sendMessage }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);

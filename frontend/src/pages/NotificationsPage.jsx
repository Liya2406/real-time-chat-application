import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const NotificationsPage = () => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        // Ask permission on first load
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        // Listen for all incoming messages
        socket.on("receive_message", (msg) => {
            if (Notification.permission === "granted") {
                new Notification("New Message", { body: msg.text });
            }
        });

        return () => socket.off("receive_message");
    }, [socket]);

    return null; // doesn’t render anything
};

export default NotificationsPage;

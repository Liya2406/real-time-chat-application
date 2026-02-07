import { useEffect } from "react";
import { useSocket } from "../context/SocketContext"; // if you have a socket context

const Notifications = () => {
    const socket = useSocket(); // get the socket instance

    useEffect(() => {
        // Ask permission on mount
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        // Listen for incoming messages
        socket.on("receive_message", (msg) => {
            if (Notification.permission === "granted") {
                new Notification("New Message", { body: msg.text });
            }
        });

        // Cleanup
        return () => socket.off("receive_message");
    }, [socket]);

    return null; // this component doesn’t need to render anything
};

export default Notifications;

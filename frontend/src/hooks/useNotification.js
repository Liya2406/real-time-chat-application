// src/hooks/useNotification.js
import { useEffect } from "react";

export const useNotification = () => {
    // Request permission on first load
    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    const showNotification = (title, body) => {
        if (Notification.permission === "granted") {
            new Notification(title, { body });
        }
    };

    return { showNotification };
};

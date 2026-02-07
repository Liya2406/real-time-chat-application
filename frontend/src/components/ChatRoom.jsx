// src/components/ChatRoom.jsx
import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import defaultAvatar from "../assets/60111.jpg";
import EmojiPicker from "emoji-picker-react";
import GroupInfo from "./GroupInfo";

import "../ChatRoom.css";

function ChatRoom({ currentUser, selectedUser, selectedGroup, allUsers }) {
    const { socket, connected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [file, setFile] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [searchText, setSearchText] = useState("");

    const imageInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const groupId = selectedGroup ? selectedGroup.id : null;
    const BACKEND_URL = "http://localhost:5000";
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [previewURL, setPreviewURL] = useState(null);
    const [allUsersState, setAllUsersState] = useState(allUsers || []);
    useEffect(() => {
        setAllUsersState(allUsers || []);
    }, [allUsers]);

    // Scroll to bottom
    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    };

    // Fetch messages only once per chat
    useEffect(() => {
        if (!currentUser) return;

        const fetchMessages = async () => {
            try {
                let url;
                if (groupId) {
                    url = `${BACKEND_URL}/api/messages/group/${groupId}?limit=50`;
                } else if (selectedUser) {
                    url = `${BACKEND_URL}/api/messages/${currentUser.id}/${selectedUser.id}?limit=50`;
                } else return;

                const res = await fetch(url);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMessages(data.reverse()); // Replace all messages
                    setTimeout(() => scrollToBottom(false), 0);
                } else {
                    setMessages([]);
                }
            } catch (err) {
                console.error("Error fetching messages:", err);
            }
        };

        fetchMessages();
    }, [currentUser?.id, selectedUser?.id, groupId]);


    // Ensure current user emits online status
    // Ensure current user emits online status
    useEffect(() => {
        if (socket && connected && currentUser?.id) {
            socket.emit("user_connected", currentUser.id);
        }
    }, [socket, connected, currentUser]);


    // Listen for new messages via socket
    // Listen for new messages and status updates via socket

    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleMessage = (msg) => {
            const isGroupChat =
                selectedGroup && msg.groupId === selectedGroup.id;

            const isPrivateChat =
                selectedUser &&
                msg.senderId === selectedUser.id &&
                msg.receiverId === currentUser.id;

            if (isGroupChat || isPrivateChat) {
                setMessages(prev => {
                    if ((prev || []).some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        const handleStatusUpdate = ({ messageId, status }) => {
            setMessages(prev =>
                (prev || []).map(m =>
                    m.id === messageId ? { ...m, status } : m
                )
            );
        };

        socket.on("receive_message", handleMessage);
        socket.on("message_status_update", handleStatusUpdate);

        return () => {
            socket.off("receive_message", handleMessage);
            socket.off("message_status_update", handleStatusUpdate);
        };
    }, [socket, currentUser, selectedUser, selectedGroup]);

    useEffect(() => {
        if (!socket) return;

        const handleUserOnline = ({ userId }) => {
            setAllUsersState(prev =>
                prev.map(u => u.id === userId ? { ...u, online: true } : u)
            );
        };

        const handleUserOffline = ({ userId, lastSeen }) => {
            setAllUsersState(prev =>
                prev.map(u => u.id === userId ? { ...u, online: false, lastSeen } : u)
            );
        };

        socket.on("user_online", handleUserOnline);
        socket.on("user_offline", handleUserOffline);

        return () => {
            socket.off("user_online", handleUserOnline);
            socket.off("user_offline", handleUserOffline);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleOnlineUsers = (onlineUserIds) => {
            setAllUsersState(prev =>
                prev.map(u => ({
                    ...u,
                    online: onlineUserIds.includes(String(u.id))
                }))
            );
        };

        socket.on("online_users", handleOnlineUsers);

        return () => {
            socket.off("online_users", handleOnlineUsers);
        };
    }, [socket]);



    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Emit "seen" for messages received from others
    useEffect(() => {
        if (!socket || !currentUser) return;

        messages.forEach(msg => {
            if (
                msg.senderId !== currentUser.id &&
                msg.status !== "seen" &&
                msg.id
            ) {
                socket.emit("message_seen", {
                    messageId: msg.id,
                    senderId: msg.senderId
                });
            }
        });
    }, [messages, socket, currentUser]);



    // Send message
    const sendMessage = async () => {
        if (!newMessage.trim() && !file) return;

        const formData = new FormData();
        formData.append("senderId", currentUser.id);
        if (selectedGroup) formData.append("groupId", selectedGroup.id);
        else if (selectedUser) formData.append("receiverId", selectedUser.id);
        formData.append("text", newMessage);
        if (file) formData.append("file", file);

        setNewMessage("");
        setFile(null);
        setPreviewURL(null);

        try {
            const res = await fetch(`${BACKEND_URL}/api/messages`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());
            const savedMessage = await res.json();

            // Emit only once after saving
            socket.emit("send_message", savedMessage);

            // Update UI
            setMessages(prev => [...prev, savedMessage]);
            scrollToBottom();
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const handleEmojiClick = (emojiData) => setNewMessage(prev => prev + emojiData.emoji);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        setFile(selected);

        if (selected.type.startsWith("image/") || selected.type.startsWith("audio/")) {
            setPreviewURL(URL.createObjectURL(selected));
        } else {
            setPreviewURL(null);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString();
        const timeOptions = { hour: "numeric", minute: "numeric", hour12: true };
        const formattedTime = date.toLocaleTimeString([], timeOptions);
        if (isToday) return `Today ${formattedTime}`;
        if (isYesterday) return `Yesterday ${formattedTime}`;
        return date.toLocaleDateString() + " " + formattedTime;
    };

    const filteredMessages = messages.filter((msg) => {
        if (!searchText) return true;
        const lowerSearch = searchText.toLowerCase();
        const textMatch = msg.text?.toLowerCase().includes(lowerSearch);
        const timeMatch = formatTimestamp(msg.timestamp).toLowerCase().includes(lowerSearch);
        return textMatch || timeMatch;
    });

    const getSenderName = (msg) => {
        if (msg.senderId === currentUser.id) return currentUser.username;

        // Try msg.senderName first
        if (msg.senderName) return msg.senderName;

        // Then check in allUsers array
        const user = allUsersState?.find(u => u.id === msg.senderId);
        return user?.username || "Unknown";
    };
    // Get updated selected user from allUsers
    const currentSelectedUser = allUsersState?.find(u => u.id === selectedUser?.id) || selectedUser;



    return (
        <div className="chatroom">
            {/* Header */}
            <div className="chat-header">
                <img
                    src={selectedGroup?.avatar || selectedUser?.avatar || defaultAvatar}
                    className="avatar-small"
                    alt="avatar"
                />
                <h3
                    style={{ cursor: selectedGroup ? "pointer" : "default" }}
                    onClick={() => selectedGroup && setShowGroupInfo(true)}
                >
                    {selectedGroup ? selectedGroup.name : selectedUser?.username}
                </h3>
                {/* Add online / last seen indicator */}
                {currentSelectedUser && (
                    <span className={`status-indicator ${currentSelectedUser.online ? "online" : "offline"}`}>
                        {currentSelectedUser.online
                            ? "Online"
                            : currentSelectedUser.lastSeen
                                ? `Last seen: ${new Date(currentSelectedUser.lastSeen).toLocaleString()}`
                                : "Offline"
                        }
                    </span>
                )}

                <div className="header-right">
                    <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>⋮</button>
                    {showMenu && (
                        <div className="menu-dropdown">
                            <div className="search-row">
                                <span className="search-icon">🔍</span>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search messages"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                    {searchText && (
                                        <button
                                            className="clear-btn"
                                            onClick={() => setSearchText("")}
                                        >
                                            ✖
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {showGroupInfo && selectedGroup && (
                    <GroupInfo
                        group={selectedGroup}
                        onClose={() => setShowGroupInfo(false)}
                        currentUser={currentUser}
                        allUsers={allUsersState}
                    />

                )}
            </div>

            {!connected && <p className="status">Connecting...</p>}

            {/* Messages */}
            <div className="messages">
                {filteredMessages.map(msg => (
                    <div
                        key={msg.id || msg.timestamp}
                        className={`message ${msg.senderId === currentUser.id ? "own" : ""}`}
                    >
                        <span className="sender">{getSenderName(msg)}</span>

                        {msg.text && <p>{msg.text}</p>}
                        {msg.mediaUrl && msg.mediaType === "image" && (
                            <img src={`${BACKEND_URL}${msg.mediaUrl}`} alt="media" className="media" />
                        )}
                        {msg.mediaUrl && msg.mediaType === "audio" && (
                            <audio controls src={`${BACKEND_URL}${msg.mediaUrl}`} />
                        )}
                        {msg.mediaUrl && msg.mediaType === "document" && (
                            <a href={`${BACKEND_URL}${msg.mediaUrl}`} target="_blank" rel="noreferrer">
                                View Document
                            </a>
                        )}
                        <span className="timestamp">
                            {formatTimestamp(msg.timestamp)}
                            {msg.senderId === currentUser.id && (
                                <span className={`status ${msg.status === "seen" ? "seen" :
                                    msg.status === "delivered" ? "delivered" : ""
                                    }`}>
                                    {msg.status === "seen" ? "✔✔✔" :
                                        msg.status === "delivered" ? "✔✔" :
                                            "✔"}
                                </span>

                            )}
                        </span>

                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Media Preview */}
            {file && (
                <div className="preview-container">
                    {previewURL && file.type.startsWith("image/") && (
                        <img src={previewURL} alt="preview" className="preview-image" />
                    )}
                    {previewURL && file.type.startsWith("audio/") && (
                        <audio controls src={previewURL} />
                    )}
                    {!previewURL && !file.type.startsWith("image/") && !file.type.startsWith("audio/") && (
                        <p className="preview-file-name">{file.name}</p>
                    )}
                    <button
                        className="remove-preview"
                        onClick={() => {
                            setFile(null);
                            setPreviewURL(null);
                        }}
                    >
                        ✖
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="chat-input">
                <button className="icon-btn" onClick={() => setShowEmoji(!showEmoji)}>😀</button>
                <button className="icon-btn" title="Send image" onClick={() => imageInputRef.current.click()}>🖼️</button>
                <input type="file" ref={imageInputRef} accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                <button className="icon-btn" title="Send audio" onClick={() => audioInputRef.current.click()}>🎵</button>
                <input type="file" ref={audioInputRef} accept="audio/*" style={{ display: "none" }} onChange={handleFileChange} />
                <button className="icon-btn" title="Attach file" onClick={() => fileInputRef.current.click()}>📎</button>
                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
                <button type="button" className="send-btn" onClick={sendMessage} disabled={!connected}>Send</button>
            </div>

            {showEmoji && <div className="emoji-picker"><EmojiPicker onEmojiClick={handleEmojiClick} /></div>}
        </div>
    );
}

export default ChatRoom;

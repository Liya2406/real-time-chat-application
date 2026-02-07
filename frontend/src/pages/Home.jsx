// src/pages/Home.jsx
import { useState, useEffect } from "react";
import "../Home.css";
import defaultAvatar from "../assets/60111.jpg";
import { useNavigate } from "react-router-dom";
import ChatRoom from "../components/ChatRoom";
import GroupList from "../components/GroupList";
import CreateGroup from "../components/CreateGroup";
import axios from "axios";
import { useSocket } from "../context/SocketContext";

// ✅ Import avatars properly
import avatar1 from "../assets/60111.jpg";
import avatar2 from "../assets/10491830.jpg";
import avatar3 from "../assets/img.jpg";

// ✅ Single avatars array (NO duplication)
const avatars = [avatar1, avatar2, avatar3];

function Home() {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Edit profile state
    const [editing, setEditing] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const navigate = useNavigate();
    const { socket } = useSocket();


    // ========================
    // Fetch profile, users & groups
    // ========================
    useEffect(() => {
        const fetchProfileAndUsers = async () => {
            const token = localStorage.getItem("token");
            if (!token) return navigate("/login");

            try {
                const profileRes = await fetch("http://localhost:5000/api/profile/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const profileData = await profileRes.json();
                setUser(profileData);

                const usersRes = await fetch("http://localhost:5000/api/profile/all", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const usersData = await usersRes.json();
                const otherUsers = Array.isArray(usersData)
                    ? usersData.filter((u) => u.id !== profileData.id)
                    : [];
                setUsers(otherUsers);

                const groupsRes = await fetch(
                    `http://localhost:5000/api/groups/my/${profileData.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const groupsData = await groupsRes.json();
                setGroups(groupsData);
            } catch (err) {
                console.error("Error fetching data", err);
            }
        };

        fetchProfileAndUsers();
    }, [navigate]);

    // ========================
    // Update profile
    // ========================
    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/profile/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                username: newUsername || user.username,
                password: newPassword || undefined,
            }),
        });

        const data = await res.json();
        setUser(data.user);
        setEditing(false);
        setNewPassword("");
    };

    // ========================
    // Logout
    // ========================
    const handleLogout = () => {
        if (socket && user?.id) {
            socket.emit("user_logout", user.id); // no callback needed
            localStorage.removeItem("token");
            navigate("/login"); // redirect immediately
            socket.disconnect();
        } else {
            localStorage.removeItem("token");
            navigate("/login");
        }
    };




    // ========================
    // Update avatar
    // ========================
    const handleAvatarSelect = async (avatar) => {
        try {
            const token = localStorage.getItem("token");

            await axios.put(
                "http://localhost:5000/api/users/update-avatar",
                { avatar },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUser((prev) => ({ ...prev, avatar }));
            setShowAvatarPicker(false);
        } catch (err) {
            console.error("Avatar update failed", err);
        }
    };
    // ===== Add this socket cleanup effect here =====
    useEffect(() => {
        if (!socket || !user?.id) return;
    }, [socket, user?.id]);


    if (!user) return <p className="loading">Loading...</p>;

    // ========================
    // Socket setup & cleanup for online/offline
    // ========================

    return (
        <div className="home-container">
            <button
                className="hamburger-btn"
                onClick={() => setIsSidebarOpen(prev => !prev)}
            >
                ☰
            </button>



            {/* ===== Sidebar ===== */}
            <div className={`sidebar ${isSidebarOpen ? "active" : ""}`}>

                <div className="profile-section">
                    <div className="avatar-wrapper">
                        <img src={user.avatar || defaultAvatar} className="avatar" />
                        <button
                            className="edit-avatar-btn"
                            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        >
                            ✏️
                        </button>
                    </div>

                    {showAvatarPicker && (
                        <div className="avatar-subsection">
                            {avatars.map((a, i) => (
                                <img
                                    key={i}
                                    src={a}
                                    className={`avatar-option ${user.avatar === a ? "selected" : ""
                                        }`}
                                    onClick={() => handleAvatarSelect(a)}
                                />
                            ))}
                        </div>
                    )}

                    <h3>{user.username}</h3>

                    <button onClick={() => setEditing(!editing)}>
                        {editing ? "Cancel" : "Edit Profile"}
                    </button>

                    {editing && (
                        <form className="edit-form" onSubmit={handleUpdate}>
                            <input
                                placeholder="New Username"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button type="submit">Update</button>
                        </form>
                    )}

                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                {/* ===== Users + Groups ===== */}
                <div className="users-list">
                    <button
                        className="create-group-btn"
                        onClick={() => setShowCreateGroup(true)}
                    >
                        + Create Group
                    </button>

                    <h4>Private Chats</h4>
                    {users.map((u) => (
                        <div
                            key={u.id}
                            className={`user-item ${selectedUser?.id === u.id ? "selected" : ""
                                }`}
                            onClick={() => {
                                setSelectedUser(u);
                                setSelectedGroup(null);
                            }}
                        >
                            <img
                                src={u.avatar || defaultAvatar}
                                className="avatar-small"
                            />
                            <span>{u.username}</span>
                        </div>
                    ))}

                    <GroupList
                        groups={groups}
                        selectedGroup={selectedGroup}
                        onSelectGroup={(g) => {
                            setSelectedGroup(g);
                            setSelectedUser(null);
                            setIsSidebarOpen(false);
                        }}
                    />
                </div>
            </div>

            {/* ===== Chat Area ===== */}
            <div className="main-content">
                {selectedUser || selectedGroup ? (
                    <>
                        {/* ✅ Leave Group button only if a group is selected */}
                        {selectedGroup && (
                            <button
                                className="leave-group-btn"
                                onClick={async () => {
                                    try {
                                        const token = localStorage.getItem("token");
                                        const res = await fetch(
                                            `http://localhost:5000/api/groups/${selectedGroup.id}/leave`,
                                            {
                                                method: "DELETE",
                                                headers: { Authorization: `Bearer ${token}` },
                                            }
                                        );

                                        if (!res.ok) throw new Error("Failed to leave group");
                                        const data = await res.json();
                                        alert(data.message);

                                        setGroups((prev) =>
                                            prev.filter((g) => g.id !== selectedGroup.id)
                                        );
                                        setSelectedGroup(null);
                                    } catch (err) {
                                        console.error(err);
                                        alert(err.message);
                                    }
                                }}
                            >
                                Leave Group
                            </button>
                        )}


                        {/* ChatRoom component */}
                        <ChatRoom
                            currentUser={user}
                            selectedUser={selectedUser}
                            selectedGroup={selectedGroup}
                            allUsers={users}
                        />
                    </>
                ) : (
                    <div className="empty-chat">
                        <h2>Welcome, {user.username} 👋</h2>
                        <p>Select a user or group to start chatting</p>
                    </div>
                )}
            </div>



            {/* ===== Create Group Modal ===== */}
            {showCreateGroup && (
                <CreateGroup
                    currentUser={user}
                    users={users}
                    onGroupCreated={(newGroup) => {
                        setGroups((prev) => [...prev, newGroup]);
                        setSelectedGroup(newGroup);
                        setSelectedUser(null);
                    }}
                    onClose={() => setShowCreateGroup(false)}
                />
            )}

        </div>

    );
}

export default Home;

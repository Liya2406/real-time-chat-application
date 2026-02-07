// src/components/CreateGroup.jsx
import { useState } from "react";
import axios from "axios";

function CreateGroup({ currentUser, users, onGroupCreated, onClose }) {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    const handleUserToggle = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleSubmit = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            return alert("Enter group name and select members");
        }

        try {
            const res = await axios.post("http://localhost:5000/api/groups/create", {
                name: groupName,
                createdBy: currentUser.id,
                members: [currentUser.id, ...selectedUsers], // include creator
            });

            onGroupCreated(res.data.group); // update parent
            setGroupName("");
            setSelectedUsers([]);
            onClose(); // close modal
        } catch (err) {
            console.error("Failed to create group:", err);
        }
    };

    return (
        <div className="modal">
            <h3>Create Group</h3>
            <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
            />
            <div>
                <h5>Select Members:</h5>
                {users
                    .filter((u) => u.id !== currentUser.id)
                    .map((user) => (
                        <label key={user.id} style={{ display: "block", marginBottom: "3px" }}>
                            <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleUserToggle(user.id)}
                            />
                            {user.username}
                        </label>
                    ))}
            </div>
            <div style={{ marginTop: "10px" }}>
                <button onClick={handleSubmit}>Create</button>
                <button onClick={onClose} style={{ marginLeft: "5px" }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default CreateGroup;

import { useEffect, useState } from "react";
import axios from "axios";
import defaultAvatar from "../assets/60111.jpg";
import "../GroupInfo.css";

function GroupInfo({ group, onClose, currentUser, allUsers }) {
    const [members, setMembers] = useState([]);
    const [selectedUserToAdd, setSelectedUserToAdd] = useState(null);



    useEffect(() => {
        if (!group) return;

        axios
            .get(`http://localhost:5000/api/groups/${group.id}/members`)
            .then(res => setMembers(res.data))
            .catch(err => console.error("Failed to fetch group members", err));
    }, [group]);

    const admin = members.find(m => m.role === "admin");
    const others = members.filter(m => m.role !== "admin");
    // Add member
    const handleAddMember = async () => {
        if (!selectedUserToAdd) return;
        try {
            const res = await axios.post(`http://localhost:5000/api/groups/${group.id}/add`, {
                userId: selectedUserToAdd.id
            });
            setMembers(res.data);
            setSelectedUserToAdd(null);
        } catch (err) {
            console.error("Failed to add member", err);
        }
    };

    // Remove member
    const handleRemoveMember = async (userId) => {
        try {
            const res = await axios.delete(`http://localhost:5000/api/groups/${group.id}/remove/${userId}`);
            setMembers(res.data);
        } catch (err) {
            console.error("Failed to remove member", err);
        }
    };

    return (
        <div className="group-info-panel">
            <div className="group-info-header">
                <h3>Group Info</h3>
                <button onClick={onClose}>✖</button>
            </div>

            <div className="group-info-body">
                <h4>{group.name}</h4>

                {admin && (
                    <>
                        <h5>Admin</h5>
                        <div className="member">
                            <img src={admin.User?.avatar || defaultAvatar} alt="" />
                            <span>👑 {admin.User?.username}</span>
                        </div>
                    </>
                )}

                <h5>Members</h5>
                {others.map(m => (
                    <div key={m.userId} className="member">
                        <img src={m.User?.avatar || defaultAvatar} alt="" />
                        <span>{m.User?.username}</span>
                        {/* Remove button visible only to admin */}
                        {admin && currentUser.id === admin.userId && (
                            <button className="remove-btn" onClick={() => handleRemoveMember(m.userId)}>Remove</button>
                        )}

                    </div>
                ))}

                {/* Add Member Section */}
                {admin && currentUser.id === admin.userId && (
                    <div style={{ marginTop: "10px" }}>
                        <h5>Add Member</h5>
                        <select
                            value={selectedUserToAdd?.id || ""}
                            onChange={e =>
                                setSelectedUserToAdd(allUsers.find(u => u.id === parseInt(e.target.value)))
                            }
                        >
                            <option value="">Select user</option>
                            {allUsers
                                .filter(u => !members.some(m => m.userId === u.id))
                                .map(u => (
                                    <option key={u.id} value={u.id}>{u.username}</option>
                                ))}
                        </select>
                        <button onClick={handleAddMember} style={{ marginLeft: "5px" }}>Add</button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default GroupInfo;

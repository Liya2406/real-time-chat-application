// src/components/GroupList.jsx
import React from "react";

function GroupList({ groups, selectedGroup, onSelectGroup }) {
    return (
        <div>
            <h4>Groups</h4>
            {groups.length === 0 && <p>No groups yet</p>}
            {groups.map((group) => (
                <div
                    key={group.id}
                    className={`group-item ${selectedGroup?.id === group.id ? "selected" : ""}`}
                    onClick={() => onSelectGroup(group)}
                    style={{
                        cursor: "pointer",
                        border: "1px solid #ccc",
                        padding: "5px",
                        marginBottom: "5px",
                        borderRadius: "5px",
                    }}
                >
                    {group.name}
                </div>
            ))}
        </div>
    );
}

export default GroupList;

import { useEffect, useState } from "react";
import { auth, db } from "./Firebase"; // Assuming db is your Firestore instance
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { encryptMessage, getEncryptionKey } from "./cryptoUtils.js";

const Message = ({ message }) => {
    const [user] = useAuthState(auth);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(message.text || "");
    const [canEdit, setCanEdit] = useState(false);
    const [editTimestamp, setEditTimestamp] = useState(null);
    const [readByUsers, setReadByUsers] = useState([]);

    useEffect(() => {
        // Calculate if the message can still be edited
        if (message.createdAt) {
            const editTimeLimit = 5 * 60 * 1000; // 5 minutes in milliseconds
            const messageTime = message.createdAt.toMillis();
            const currentTime = new Date().getTime();
            const elapsedTime = currentTime - messageTime;
            setCanEdit(elapsedTime <= editTimeLimit);
        }

        // Set edit timestamp if the message has been edited
        if (message.editedAt) {
            setEditTimestamp(message.editedAt.toDate()); // Assuming editedAt is a Firestore Timestamp
        } else {
            setEditTimestamp(null);
        }

        // Subscribe to read receipts updates
        const messageRef = doc(db, "messages", message.id);
        const unsubscribe = onSnapshot(messageRef, (doc) => {
            const data = doc.data();
            setReadByUsers(data.readBy || []);
        });

        return () => unsubscribe();
    }, [message.createdAt, message.editedAt, message.id]);

    useEffect(() => {
        // Update read receipts
        if (!readByUsers.includes(user.uid)) {
            const messageRef = doc(db, "messages", message.id);
            updateDoc(messageRef, {
                readBy: [...readByUsers, user.uid],
            });
        }
    }, [user.uid, readByUsers, message.id]);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = async () => {
        try {
            const keyString = import.meta.env.VITE_ENCRYPTION_KEY;
            const key = await getEncryptionKey(keyString);

            const { cipherText, iv } = await encryptMessage(editedText, key);

            const messageRef = doc(db, "messages", message.id);
            const now = new Date();
            await updateDoc(messageRef, {
                text: cipherText,
                iv: iv,
                editedAt: now, // Update editedAt timestamp
            });

            setIsEditing(false);
        } catch (error) {
            console.error("Error updating message:", error);
        }
    };

    const handleDeleteClick = async () => {
        try {
            const messageRef = doc(db, "messages", message.id);
            await deleteDoc(messageRef);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const handleCancelClick = () => {
        // Revert changes to original message content
        setEditedText(message.text || "");
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSaveClick();
        }
    };

    const isCurrentUserMessage = message.uid === user.uid;

    // Function to format timestamp to HH:MM format
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Determine which timestamp to show: editedAt if available, otherwise createdAt
    const displayTimestamp = editTimestamp ? formatTimestamp(editTimestamp) : formatTimestamp(message.createdAt);

    return (
        <div className={`chat-container ${isCurrentUserMessage ? "right" : ""}`}>
            {!isCurrentUserMessage && (
                <img className="profile-pic-left" src={message.avatar} alt="user avatar" />
            )}
            <div className={`chat-bubble ${isCurrentUserMessage ? "right" : ""}`}>
                <div className={`chat-header ${isCurrentUserMessage ? "right" : ""}`}>
                    <p className="user-name">{message.name}</p>
                    <p className="message-timestamp">{displayTimestamp}</p>
                </div>
                <div className="chat-bubble__right">
                    {isEditing && isCurrentUserMessage && canEdit ? (
                        <>
                            <textarea
                                className="edit-textarea"
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <div className="edit-buttons">
                                <button className="edit-buttons" onClick={handleSaveClick}>Save</button>
                                <button className="edit-buttons" onClick={handleCancelClick}>Cancel</button>
                            </div>
                        </>
                    ) : (
                        <>
                            {message.text && (
                                <pre
                                    className={`received-message ${editTimestamp ? "edited" : ""}`}>{message.text}</pre>
                            )}
                            {editTimestamp && (
                                <p className="edited-indicator">Edited</p>
                            )}
                            {isCurrentUserMessage && canEdit && (
                                <>
                                    <button className="edit-button" onClick={handleEditClick}>
                                        <FontAwesomeIcon icon={faEdit}/>
                                    </button>

                                </>
                            )}
                            <button className="delete-button" onClick={handleDeleteClick}>
                                <FontAwesomeIcon icon={faTrash}/>
                            </button>
                        </>
                    )}
                </div>
            </div>
            {isCurrentUserMessage && (
                <img className="profile-pic-right" src={message.avatar} alt="user avatar" />
            )}
        </div>
    );
};

export default Message;

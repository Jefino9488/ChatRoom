import { useState } from "react";
import { auth, db } from "./Firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const SendMessage = ({ scroll, currentRoom }) => {
    const [message, setMessage] = useState("");
    const { uid, displayName, photoURL } = auth.currentUser;

    const handleSendMessage = async (text) => {
        if (text.trim() === "") {
            alert("Enter a valid message");
            return;
        }

        try {
            await addDoc(collection(db, "messages"), {
                text: text,
                name: displayName,
                avatar: photoURL,
                createdAt: serverTimestamp(),
                uid,
                roomId: currentRoom.id,
            });

            setMessage("");
            scroll.current.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(message);
        }
    };

    return (
        <div>
            <form onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(message);
            }} className="send-message">
                <div className="img_user">
                    <img src={photoURL} alt="user avatar" className="avatar"/>
                </div>
                <textarea
                    id="messageInput"
                    name="messageInput"
                    type="text"
                    className="form-input__input"
                    placeholder="Type message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                />
                <button type="submit" className="send">Send</button>
            </form>
        </div>
    );
};

export default SendMessage;

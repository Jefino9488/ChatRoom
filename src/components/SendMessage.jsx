import { useState } from "react";
import { auth, db } from "./Firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getEncryptionKey, encryptMessage } from './cryptoUtils';

const SendMessage = ({ scroll, currentRoom }) => {
    const [message, setMessage] = useState("");
    const { uid, displayName, photoURL } = auth.currentUser;

    const handleSendMessage = async (text) => {
        if (text.trim() === "") {
            alert("Enter a valid message");
            return;
        }

        try {
            const keyString = import.meta.env.VITE_ENCRYPTION_KEY;
            const key = await getEncryptionKey(keyString);

            const { cipherText, iv } = await encryptMessage(text, key);

            await addDoc(collection(db, "messages"), {
                text: cipherText,
                iv: iv,
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
                    className="form-input__input"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    rows="1" // Start with a single row
                    style={{resize: 'none', overflow: 'hidden'}} // Disable resizing
                    onInput={(e) => {
                        e.target.style.height = 'auto'; // Reset the height
                        e.target.style.height = `${e.target.scrollHeight}px`; // Set height to scrollHeight
                    }}
                />
                <button type="submit" className="send">Send</button>
            </form>
        </div>
    );
};

export default SendMessage;

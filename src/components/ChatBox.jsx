import { useEffect, useRef, useState } from "react";
import { query, collection, orderBy, onSnapshot, where, limit } from "firebase/firestore";
import { getEncryptionKey, decryptMessage } from './cryptoUtils';
import { db } from "./Firebase";
import Message from "./Message";
import SendMessage from "./SendMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ChatBox = ({ currentRoom, preferences }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const scroll = useRef();

    useEffect(() => {
        if (!currentRoom) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "messages"),
            where("roomId", "==", currentRoom.id),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, async (QuerySnapshot) => {
            const keyString = import.meta.env.VITE_ENCRYPTION_KEY;
            const key = await getEncryptionKey(keyString);

            const fetchedMessages = [];
            for (const doc of QuerySnapshot.docs) {
                const data = doc.data();
                const decryptedText = await decryptMessage(data.text, key, data.iv);
                fetchedMessages.push({ ...data, id: doc.id, text: decryptedText });
            }

            const sortedMessages = fetchedMessages.sort(
                (a, b) => a.createdAt - b.createdAt
            );
            setMessages(sortedMessages);
            setLoading(false);
        });

        return () => unsubscribe;
    }, [currentRoom]);

    const groupMessagesByDate = (messages) => {
        return messages.reduce((groups, message) => {
            if (message.createdAt) {
                const date = message.createdAt.toDate().toDateString();
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(message);
            }
            return groups;
        }, {});
    };

    useEffect(() => {
        if (scroll.current) {
            scroll.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const groupedMessages = groupMessagesByDate(messages);

    if (!currentRoom) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-muted/50 rounded-lg m-4">
                <p className="text-lg text-muted-foreground">Please join a room to start chatting.</p>
            </div>
        );
    }

    return (
        <Card className="flex-1 flex flex-col h-full border-0 rounded-none shadow-none bg-background">
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-10rem)] pb-4">
                    <div className="max-w-3xl mx-auto px-4">
                        {loading ? (
                            <div className="space-y-4 mt-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : (
                            Object.keys(groupedMessages).map((date) => (
                                <div key={date} className="space-y-4">
                                    <div className="sticky top-0 z-10 flex items-center justify-center my-4">
                                        <div className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium">
                                            {date}
                                        </div>
                                    </div>
                                    {groupedMessages[date].map((message, idx) => (
                                        <Message
                                            key={message.id}
                                            message={message}
                                            previousMessage={idx > 0 ? groupedMessages[date][idx - 1] : null}
                                            preferences={preferences}
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                        <div ref={scroll} />
                    </div>
                </ScrollArea>
            </CardContent>
            <SendMessage scroll={scroll} currentRoom={currentRoom} preferences={preferences} />
        </Card>
    );
};

export default ChatBox;


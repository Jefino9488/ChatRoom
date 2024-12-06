import { useEffect, useState } from "react"
import { auth, db } from "@/components/Firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore"
import { encryptMessage, getEncryptionKey } from "@/components/cryptoUtils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2 } from 'lucide-react'

const Message = ({ message, previousMessage }) => {
    const [user] = useAuthState(auth)
    const [isEditing, setIsEditing] = useState(false)
    const [editedText, setEditedText] = useState(message.text || "")
    const [canEdit, setCanEdit] = useState(false)
    const [editTimestamp, setEditTimestamp] = useState(null)
    const [readByUsers, setReadByUsers] = useState([])

    useEffect(() => {
        if (message.createdAt) {
            const editTimeLimit = 5 * 60 * 1000
            const messageTime = message.createdAt.toMillis()
            const currentTime = new Date().getTime()
            const elapsedTime = currentTime - messageTime
            setCanEdit(elapsedTime <= editTimeLimit)
        }

        if (message.editedAt) {
            setEditTimestamp(message.editedAt.toDate())
        } else {
            setEditTimestamp(null)
        }

        const messageRef = doc(db, "messages", message.id)
        const unsubscribe = onSnapshot(messageRef, (doc) => {
            const data = doc.data()
            setReadByUsers(data.readBy || [])
        })

        return () => unsubscribe()
    }, [message.createdAt, message.editedAt, message.id])

    useEffect(() => {
        if (!readByUsers.includes(user.uid)) {
            const messageRef = doc(db, "messages", message.id)
            updateDoc(messageRef, {
                readBy: [...readByUsers, user.uid],
            })
        }
    }, [user.uid, readByUsers, message.id])

    const handleEditClick = () => setIsEditing(true)

    const handleSaveClick = async () => {
        try {
            const keyString = import.meta.env.VITE_ENCRYPTION_KEY
            const key = await getEncryptionKey(keyString)
            const { cipherText, iv } = await encryptMessage(editedText, key)
            const messageRef = doc(db, "messages", message.id)
            const now = new Date()
            await updateDoc(messageRef, {
                text: cipherText,
                iv: iv,
                editedAt: now,
            })
            setIsEditing(false)
        } catch (error) {
            console.error("Error updating message:", error)
        }
    }

    const handleDeleteClick = async () => {
        try {
            const messageRef = doc(db, "messages", message.id)
            await deleteDoc(messageRef)
        } catch (error) {
            console.error("Error deleting message:", error)
        }
    }

    const handleCancelClick = () => {
        setEditedText(message.text || "")
        setIsEditing(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSaveClick()
        }
    }

    const isCurrentUserMessage = message.uid === user.uid

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return ""
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const displayTimestamp = editTimestamp ? formatTimestamp(editTimestamp) : formatTimestamp(message.createdAt)

    const showSender = !previousMessage || previousMessage.uid !== message.uid ||
        (message.createdAt.toDate().getTime() - previousMessage.createdAt.toDate().getTime() > 5 * 60 * 1000)

    return (
        <div className={`flex items-end mb-4 ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}>
            {!isCurrentUserMessage && (
                <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
                    <AvatarImage src={message.avatar} alt={message.name} />
                    <AvatarFallback>{message.name[0]}</AvatarFallback>
                </Avatar>
            )}
            <div className={`max-w-[70%] ${isCurrentUserMessage ? 'order-1 flex items-end' : 'order-2'}`}>
                {isCurrentUserMessage && (
                    <Avatar className="w-8 h-8 ml-2 flex-shrink-0 order-2">
                        <AvatarImage src={message.avatar} alt={message.name} />
                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                )}
                <div className={`group relative p-3 rounded-lg ${isCurrentUserMessage ? 'bg-primary text-primary-foreground order-1' : 'bg-muted'}`}>
                    {showSender && (
                        <div className={`text-xs font-semibold mb-1 ${isCurrentUserMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {message.name}
                        </div>
                    )}
                    {isEditing && isCurrentUserMessage && canEdit ? (
                        <Textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="min-h-[60px] text-sm bg-background text-foreground"
                        />
                    ) : (
                        <p className={`text-sm break-words ${editTimestamp ? "italic" : ""}`}>
                            {message.text}
                        </p>
                    )}
                    <div className={`text-xs mt-1 ${isCurrentUserMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {displayTimestamp}
                        {editTimestamp && <span className="ml-1">(edited)</span>}
                    </div>
                    <div className={`absolute ${isCurrentUserMessage ? '-left-8' : '-right-8'} bottom-0 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {isCurrentUserMessage && canEdit && !isEditing && (
                            <Button variant="ghost" size="icon" onClick={handleEditClick} className="h-6 w-6 bg-background/80 backdrop-blur-sm">
                                <Edit className="h-3 w-3" />
                                <span className="sr-only">Edit</span>
                            </Button>
                        )}
                        {isCurrentUserMessage && (
                            <Button variant="ghost" size="icon" onClick={handleDeleteClick} className="h-6 w-6 bg-background/80 backdrop-blur-sm">
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        )}
                    </div>
                </div>
                {isEditing && (
                    <div className="flex justify-end mt-2 space-x-2">
                        <Button variant="secondary" size="sm" onClick={handleCancelClick}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={handleSaveClick}>Save</Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Message


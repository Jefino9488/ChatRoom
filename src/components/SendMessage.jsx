import { useState } from "react"
import { auth, db } from "./Firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { getEncryptionKey, encryptMessage } from './cryptoUtils'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Code, Paperclip, Smile, Mic } from 'lucide-react'
import { Toggle } from "@/components/ui/toggle"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const SendMessage = ({ scroll, currentRoom }) => {
    const [message, setMessage] = useState("")
    const [isCode, setIsCode] = useState(false)
    const { uid, displayName, photoURL } = auth.currentUser

    const handleSendMessage = async (text) => {
        if (text.trim() === "") {
            alert("Enter a valid message")
            return
        }

        try {
            const keyString = import.meta.env.VITE_ENCRYPTION_KEY
            const key = await getEncryptionKey(keyString)
            const { cipherText, iv } = await encryptMessage(text, key)

            await addDoc(collection(db, "messages"), {
                text: cipherText,
                iv: iv,
                name: displayName,
                avatar: photoURL,
                createdAt: serverTimestamp(),
                uid,
                roomId: currentRoom.id,
                isCode,
            })

            setMessage("")
            scroll.current.scrollIntoView({ behavior: "smooth" })
        } catch (error) {
            console.error("Error sending message:", error)
        }
    }

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage(message)
        }
    }

    return (
        <TooltipProvider>
            <div className="sticky bottom-0 left-0 right-0 bg-background border-t">
                <div className="max-w-3xl mx-auto p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSendMessage(message)
                        }}
                        className="flex items-end gap-2"
                    >
                        <div className="flex items-center gap-2">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={photoURL} alt={displayName} />
                                <AvatarFallback>{displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" type="button" className="h-9 w-9">
                                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Attach file</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Toggle
                                        aria-label="Toggle code mode"
                                        pressed={isCode}
                                        onPressedChange={setIsCode}
                                        className="h-9 w-9"
                                    >
                                        <Code className="h-5 w-5" />
                                    </Toggle>
                                </TooltipTrigger>
                                <TooltipContent>Toggle code mode</TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="flex-1 relative">
                            <Textarea
                                id="messageInput"
                                name="messageInput"
                                className={`resize-none pr-12 min-h-[44px] max-h-[200px] ${isCode ? 'font-mono' : ''}`}
                                placeholder={isCode ? "Enter your code..." : "Write a message..."}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                rows={1}
                                onInput={(e) => {
                                    e.target.style.height = '44px'
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
                                }}
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 bottom-2 h-8 w-8"
                                    >
                                        <Smile className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add emoji</TooltipContent>
                            </Tooltip>
                        </div>

                        {message.trim() ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="submit" size="icon" className="h-9 w-9 rounded-full">
                                        <Send className="h-5 w-5" />
                                        <span className="sr-only">Send</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send message</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
                                        <Mic className="h-5 w-5 text-muted-foreground" />
                                        <span className="sr-only">Voice message</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Record voice message</TooltipContent>
                            </Tooltip>
                        )}
                    </form>
                </div>
            </div>
        </TooltipProvider>
    )
}

export default SendMessage
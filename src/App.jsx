import { useState, useEffect } from "react"
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "./components/Firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MoreVertical, Search, Lock, Users, Hash } from 'lucide-react'
import NavBar from "./components/NavBar"
import Welcome from "./components/Welcome"
import ChatBox from "./components/ChatBox"

function App() {
    return (
        <Router>
            <Routes>
                <Route path="*" element={<MainApp />} />
            </Routes>
        </Router>
    )
}

function MainApp() {
    const [user] = useAuthState(auth)
    const [currentRoom, setCurrentRoom] = useState(null)
    const [rooms, setRooms] = useState([])
    const [passKey, setPassKey] = useState("")
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [createRoomVisible, setCreateRoomVisible] = useState(false)
    const [roomName, setRoomName] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [filteredRooms, setFilteredRooms] = useState([])
    const navigate = useNavigate()
    const [requiresPassword, setRequiresPassword] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const roomsData = []
            querySnapshot.forEach((doc) => {
                roomsData.push({ id: doc.id, ...doc.data() })
            })
            setRooms(roomsData)
        })

        return () => unsubscribe()
    }, [])

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredRooms(rooms)
        } else {
            const filtered = rooms.filter((room) =>
                room.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredRooms(filtered)
        }
    }, [searchTerm, rooms])

    useEffect(() => {
        if (user) {
            if (currentRoom) {
                navigate(`/room/${currentRoom.id}`)
            } else {
                navigate("/rooms")
            }
        } else {
            navigate("/welcome")
        }
    }, [user, currentRoom, navigate])

    const createRoom = async () => {
        if (!user) return;

        try {
            const newRoomData = {
                name: roomName,
                createdBy: user.displayName || user.email,
                createdAt: serverTimestamp(),
            };

            if (requiresPassword) {
                newRoomData.passKey = passKey;
            }

            const newRoomRef = await addDoc(collection(db, "rooms"), newRoomData);

            setRoomName("");
            setPassKey("");
            setRequiresPassword(false);
            setCreateRoomVisible(false);

            setCurrentRoom({
                id: newRoomRef.id,
                name: roomName,
                createdBy: user.displayName || user.email,
                createdAt: new Date(),
                passKey: requiresPassword ? passKey : null,
            });
        } catch (error) {
            console.error("Error creating room: ", error);
        }
    };

    const handlePassKeySubmit = () => {
        if (passKey === selectedRoom.passKey) {
            localStorage.setItem(`room_${selectedRoom.id}_passKey`, passKey);
            setCurrentRoom(selectedRoom)
            setSelectedRoom(null)
            setPassKey("")
        } else {
            alert("Invalid pass key. Please try again.")
        }
    }

    const handleRoomClick = (room) => {
        const savedPassKey = localStorage.getItem(`room_${room.id}_passKey`);
        if (savedPassKey && savedPassKey === room.passKey) {
            setCurrentRoom(room);
        } else {
            setSelectedRoom(room);
        }
    };

    const deleteRoom = async (roomId) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            try {
                await deleteDoc(doc(db, "rooms", roomId))
            } catch (error) {
                console.error("Error deleting room: ", error)
            }
        }
    }

    const signOut = () => {
        localStorage.clear();
        auth.signOut()
    }

    const RoomList = () => (
        <div className="w-80 border-r border-border h-screen bg-card flex flex-col">
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-primary">Code Communities</h2>
                    <Button size="icon" variant="ghost" onClick={() => setCreateRoomVisible(true)}>
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chats"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-background"
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {filteredRooms.map((room) => (
                    <div
                        key={room.id}
                        onClick={() => handleRoomClick(room)}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50 transition-colors
                            ${currentRoom?.id === room.id ? 'bg-accent text-accent-foreground' : ''}`}
                    >
                        <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                <Hash className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold truncate">{room.name}</h4>
                                {room.passKey && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Users className="mr-1 h-3 w-3" />
                                <span className="truncate">{room.createdBy}</span>
                            </div>
                        </div>
                        {user && (user.displayName === room.createdBy || user.email === room.createdBy) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => deleteRoom(room.id)}>
                                        Delete group
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                ))}
            </ScrollArea>
        </div>
    )

    return (
        <div className="h-screen flex bg-background text-foreground">
            {user && <RoomList />}
            <div className="flex-1 flex flex-col h-screen">
                <NavBar
                    setCurrentRoom={setCurrentRoom}
                    currentRoom={currentRoom}
                    signOut={signOut}
                />
                <Routes>
                    <Route path="/" element={<Navigate to={user ? (currentRoom ? `/room/${currentRoom.id}` : "/rooms") : "/welcome"} />} />
                    <Route path="/welcome" element={<Welcome />} />
                    <Route path="/rooms" element={
                        user ? (
                            <div className="flex-1 flex items-center justify-center bg-muted/10">
                                <div className="text-center space-y-4 p-8 bg-card rounded-lg shadow-lg">
                                </div>
                            </div>
                        ) : <Navigate to="/welcome" />
                    } />
                    <Route path="/room/:roomId" element={
                        user ? <ChatBox currentRoom={currentRoom} /> : <Navigate to="/welcome" />
                    } />
                </Routes>
            </div>

            <Dialog open={selectedRoom !== null} onOpenChange={() => setSelectedRoom(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Enter Pass Key</DialogTitle>
                        <DialogDescription>
                            Please enter the pass key to join {selectedRoom?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Lock className="h-4 w-4 justify-self-end" />
                            <Input
                                type="password"
                                value={passKey}
                                onChange={(e) => setPassKey(e.target.value)}
                                placeholder="Enter pass key"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRoom(null)}>Cancel</Button>
                        <Button onClick={handlePassKeySubmit}>Join Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={createRoomVisible} onOpenChange={setCreateRoomVisible}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Room</DialogTitle>
                        <DialogDescription>
                            Create a new room. You can make it open or password-protected.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room-name" className="text-right">
                                Room Name
                            </Label>
                            <Input
                                id="room-name"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="requires-password"
                                checked={requiresPassword}
                                onCheckedChange={(checked) => setRequiresPassword(checked)}
                            />
                            <Label htmlFor="requires-password">Requires Password</Label>
                        </div>
                        {requiresPassword && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="pass-key" className="text-right">
                                    Pass Key
                                </Label>
                                <Input
                                    id="pass-key"
                                    type="password"
                                    value={passKey}
                                    onChange={(e) => setPassKey(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateRoomVisible(false)}>
                            Cancel
                        </Button>
                        <Button onClick={createRoom}>Create Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default App
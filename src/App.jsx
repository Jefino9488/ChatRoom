import{ useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import Welcome from "./components/Welcome";
import ChatBox from "./components/ChatBox";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./components/Firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="*" element={<MainApp />} />
            </Routes>
        </Router>
    );
}

function MainApp() {
    const [user] = useAuthState(auth);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [passKey, setPassKey] = useState("");
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [createRoomVisible, setCreateRoomVisible] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredRooms, setFilteredRooms] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const roomsData = [];
            querySnapshot.forEach((doc) => {
                roomsData.push({ id: doc.id, ...doc.data() });
            });
            setRooms(roomsData);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredRooms(rooms);
        } else {
            const filtered = rooms.filter((room) =>
                room.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredRooms(filtered);
        }
    }, [searchTerm, rooms]);

    useEffect(() => {
        if (user) {
            if (currentRoom) {
                navigate(`/room/${currentRoom.id}`);
            } else {
                navigate("/rooms");
            }
        } else {
            navigate("/welcome");
        }
    }, [user, currentRoom, navigate]);

    const createRoom = async () => {
        if (!user) return;

        try {
            const newRoomRef = await addDoc(collection(db, "rooms"), {
                name: roomName,
                createdBy: user.displayName || user.email,
                createdAt: serverTimestamp(),
                passKey: passKey,
            });
            setRoomName("");
            setPassKey("");
            setCreateRoomVisible(false);
            setCurrentRoom({ id: newRoomRef.id, name: roomName, createdBy: user.displayName || user.email, createdAt: new Date(), passKey: passKey });
        } catch (error) {
            console.error("Error creating room: ", error);
        }
    };

    const handlePassKeySubmit = () => {
        if (passKey === selectedRoom.passKey) {
            setCurrentRoom(selectedRoom);
            setSelectedRoom(null);
            setPassKey("");
        } else {
            alert("Invalid pass key. Please try again.");
        }
    };

    const handleCreateRoomClick = () => {
        setCreateRoomVisible(true);
    };

    const signOut = () => {
        auth.signOut();
    };

    return (
        <div className="App">
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
                        <>
                                <>
                                    <div className="search-bar">
                                        <input
                                            className="search-input"
                                            type="text"
                                            placeholder="Search rooms"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="room-container">
                                        <button className="crea" onClick={handleCreateRoomClick}>
                                            <span>+</span>
                                            <p>Create Room</p>
                                        </button>
                                        {filteredRooms.map((room) => (
                                            <div key={room.id} className="room" onClick={() => setSelectedRoom(room)}>
                                                <h4>{room.name}</h4><br />
                                                <h5>Created by: {room.createdBy}</h5>
                                                <h6>{room.createdAt && room.createdAt.toDate().toLocaleString()}</h6>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            {selectedRoom && (
                                <div className="modal-overlay">
                                    <div className="modal">
                                        <h2>Enter Pass Key</h2>
                                        <input
                                            type="password"
                                            value={passKey}
                                            onChange={(e) => setPassKey(e.target.value)}
                                            placeholder="Enter pass key"
                                        />
                                        <button onClick={handlePassKeySubmit}>Submit</button>
                                        <button onClick={() => setSelectedRoom(null)}>Cancel</button>
                                    </div>
                                </div>
                            )}
                            {createRoomVisible && (
                                <div className="modal-overlay">
                                    <div className="create-room">
                                        <h2>Create Room</h2>
                                        <input
                                            type="text"
                                            placeholder="Enter room name"
                                            value={roomName}
                                            onChange={(e) => setRoomName(e.target.value)}
                                        />
                                        <input
                                            type="password"
                                            placeholder="Enter pass key"
                                            value={passKey}
                                            onChange={(e) => setPassKey(e.target.value)}
                                        />
                                        <button onClick={createRoom}>Create</button>
                                        <button onClick={() => setCreateRoomVisible(false)}>Cancel</button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : <Navigate to="/welcome" />
                } />
                <Route path="/room/:roomId" element={user ? <ChatBox currentRoom={currentRoom} /> : <Navigate to="/welcome" />} />
            </Routes>
        </div>
    );
}

export default App;

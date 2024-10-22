import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import Welcome from "./components/Welcome";
import ChatBox from "./components/ChatBox";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./components/Firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';


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
    const [dropdownVisible, setDropdownVisible] = useState(null); // To manage the dropdown for each room
    const dropdownRef = useRef(null); // Reference to the dropdown container
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

    const deleteRoom = async (roomId) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            try {
                await deleteDoc(doc(db, "rooms", roomId));
            } catch (error) {
                console.error("Error deleting room: ", error);
            }
        }
    };

    const signOut = () => {
        auth.signOut();
    };

    const toggleDropdown = (roomId) => {
        setDropdownVisible(dropdownVisible === roomId ? null : roomId);
    };

    // Close dropdown when clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownVisible(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

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
                                    <FontAwesomeIcon icon={faPlus} size="3x"/>
                                </button>
                                <div className="vertical-separator"></div>
                                {filteredRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="room"
                                        onClick={() => setSelectedRoom(room)}
                                    >
                                        <h4>{room.name}</h4>
                                        <h5>Host: {room.createdBy}</h5>
                                        {/*<h6>{room.createdAt && room.createdAt.toDate().toLocaleString()}</h6>*/}
                                        {user && (user.displayName === room.createdBy || user.email === room.createdBy) && (
                                            <div className="menu-container">
                                                <button
                                                    className="menu-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDropdown(room.id);
                                                    }}
                                                >
                                                    &#x22EE; {/* Vertical Ellipsis */}
                                                </button>
                                                {dropdownVisible === room.id && (
                                                    <div className="dropdown" ref={dropdownRef}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteRoom(room.id);
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                        {/*/!* Add other options here *!/*/}
                                                        {/*<button*/}
                                                        {/*    onClick={(e) => {*/}
                                                        {/*        e.stopPropagation();*/}
                                                        {/*        // Implement other actions*/}
                                                        {/*    }}*/}
                                                        {/*>*/}
                                                        {/*    Other Option*/}
                                                        {/*</button>*/}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                                            placeholder="Room name"
                                            value={roomName}
                                            onChange={(e) => setRoomName(e.target.value)}
                                        />
                                        <input
                                            type="password"
                                            placeholder="Create pass key"
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

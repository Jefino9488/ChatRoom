import { useState, useEffect } from "react";
import { auth, db } from "./Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// eslint-disable-next-line react/prop-types
const NavBar = ({ currentRoom, setCurrentRoom }) => {
    const [user] = useAuthState(auth);
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        const fetchRooms = async () => {
            const q = query(collection(db, "rooms"), orderBy("createdAt", "desc")); // Order by createdAt in descending order
            const querySnapshot = await getDocs(q);
            const roomsData = [];
            querySnapshot.forEach((doc) => {
                roomsData.push({ id: doc.id, ...doc.data() });
            });
            setRooms(roomsData);
        };

        fetchRooms();
    }, []);

    const googleSignIn = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                const user = result.user;
                console.log("User signed in:", user);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.customData?.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
                console.error("Error during sign-in:", errorCode, errorMessage, email, credential);
            });
    };

    const signOut = () => {
        auth.signOut();
        setCurrentRoom(null); // Clear the current room on sign out
    };

    const handleExit = () => {
        setCurrentRoom(null);
    };

    return (
        <nav className="nav-bar">
            <h1>{currentRoom ? `Room: ${currentRoom.name}` : "Chat Room"}</h1>
            {user ? (
                <>
                    {currentRoom ? (
                        <button onClick={handleExit} className="menu-toggle">
                            Exit
                        </button>
                    ) : (
                        <button onClick={signOut} className="menu-toggle">
                            Sign Out
                        </button>
                    )}
                </>
            ) : (
                <button onClick={googleSignIn} className="sign-in">Sign In</button>
            )}
        </nav>
    );
};

export default NavBar;

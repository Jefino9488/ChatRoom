import { useState, useEffect } from "react";
import { auth, db } from "./Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, LogOut, ArrowLeft } from 'lucide-react';

const NavBar = ({ currentRoom, setCurrentRoom }) => {
    const [user] = useAuthState(auth);
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        const fetchRooms = async () => {
            const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
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
        setCurrentRoom(null);
    };

    const handleExit = () => {
        setCurrentRoom(null);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <MessageSquare className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="ml-3 text-xl font-semibold text-foreground">
                            {currentRoom ? currentRoom.name : "Community Dashboard"}
                        </h1>
                    </div>

                    <div className="flex items-center">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-9 w-9 ring-primary ring-offset-2 ring-offset-background">
                                        <AvatarImage src={user.photoURL} alt={user.displayName || user.email} />
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {user.displayName?.charAt(0) || user.email?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                                        {user.displayName || user.email}
                                    </span>
                                </div>
                                {currentRoom ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExit}
                                        className="space-x-2 hover:bg-secondary"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        <span className="hidden sm:inline">Exit Room</span>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={signOut}
                                        className="space-x-2 hover:bg-secondary"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="hidden sm:inline">Sign Out</span>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Button
                                onClick={googleSignIn}
                                className="space-x-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <span>Sign in with Google</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default NavBar;


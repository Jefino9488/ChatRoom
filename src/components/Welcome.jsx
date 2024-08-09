import { useState } from "react";
import { auth } from "./Firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Welcome = () => {
    const [loading, setLoading] = useState(false);

    const googleSignIn = () => {
        setLoading(true);
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
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <main className="welcome">
            <header>
                <h1>Welcome to ChatRoom</h1>
                <p>Your go-to chat application for seamless communication.</p>
            </header>
            <div className="content">
                <center>
                    <button onClick={googleSignIn} className="sign-in">
                        {loading ? "Signing In..." : "Sign In / Login"}
                    </button>
                </center>
            </div>
            <footer>
                <p>&copy; 2024 ChatRoom Inc. All rights reserved.</p>
            </footer>
        </main>
    );
};

export default Welcome;

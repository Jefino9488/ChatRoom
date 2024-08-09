import { auth } from "./Firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Welcome = () => {
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

    return (
        <main className="welcome">
            <header>
                <h1>Welcome to Chat Room.</h1>
            </header>
            <br/>
            <center>
                <button onClick={googleSignIn} className="sign-in">Sign In / Login</button>
            </center>
        </main>
    );
};

export default Welcome;

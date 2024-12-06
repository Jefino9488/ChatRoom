import { useState } from "react"
import { auth } from "@/components/Firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Chrome, Code, Users, MessageSquare, Lightbulb } from 'lucide-react'

const Welcome = () => {
    const [loading, setLoading] = useState(false)

    const googleSignIn = () => {
        setLoading(true)
        const provider = new GoogleAuthProvider()
        signInWithPopup(auth, provider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result)
                const token = credential?.accessToken
                const user = result.user
                console.log("User signed in:", user)
            })
            .catch((error) => {
                const errorCode = error.code
                const errorMessage = error.message
                const email = error.customData?.email
                const credential = GoogleAuthProvider.credentialFromError(error)
                console.error("Error during sign-in:", errorCode, errorMessage, email, credential)
            })
            .finally(() => {
                setLoading(false)
            })
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col justify-center items-center p-4">
            <main className="container max-w-4xl">
                <Card className="w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="text-4xl font-bold text-primary mb-2">Welcome to Code Community</CardTitle>
                        <CardDescription className="text-xl">
                            Your go-to platform for seamless coding collaboration and knowledge sharing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureCard
                                icon={<Code className="h-8 w-8 text-primary" />}
                                title="Collaborative Coding"
                                description="Work on projects together in real-time, share code snippets, and get instant feedback from peers."
                            />
                            <FeatureCard
                                icon={<Users className="h-8 w-8 text-primary" />}
                                title="Vibrant Community"
                                description="Connect with developers from around the world, build your network, and grow your skills together."
                            />
                            <FeatureCard
                                icon={<MessageSquare className="h-8 w-8 text-primary" />}
                                title="Expert Discussions"
                                description="Engage in in-depth conversations about the latest technologies, best practices, and industry trends."
                            />
                            <FeatureCard
                                icon={<Lightbulb className="h-8 w-8 text-primary" />}
                                title="Learning Opportunities"
                                description="Access tutorials, code challenges, and mentorship programs to accelerate your coding journey."
                            />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold">Join Code Community Today</h3>
                            <p className="text-muted-foreground">
                                Start collaborating, learning, and growing with fellow developers. Sign in to get started!
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button onClick={googleSignIn} disabled={loading} size="lg" className="w-full max-w-sm">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    <Chrome className="mr-2 h-5 w-5" />
                                    Sign In with Google
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
            <footer className="mt-8 text-center text-sm text-muted-foreground">
                <p>&copy; 2024 Code Community Inc. All rights reserved.</p>
            </footer>
        </div>
    )
}

const FeatureCard = ({ icon, title, description }) => (
    <div className="flex items-start space-x-4 p-4 rounded-lg bg-white shadow-sm">
        {icon}
        <div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
)

export default Welcome


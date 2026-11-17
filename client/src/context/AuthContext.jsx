
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    getRedirectResult,
    onAuthStateChanged,
    signInWithRedirect,
    signOut
} from "firebase/auth";

import { auth, googleProvider } from "../firebase/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [redirectError, setRedirectError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setFirebaseUser(currentUser);
            setLoading(false);
        });

        let active = true;

        getRedirectResult(auth)
            .then((result) => {
                if (active && result) {
                    setFirebaseUser(result.user);
                }
            })
            .catch((error) => {
                if (active) {
                    setRedirectError(
                        error.message || "Unable to complete Google sign-in."
                    );
                }
            });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    const loginWithGoogle = async () => {
        return await signInWithRedirect(auth, googleProvider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const getIdToken = async () => {
        if (!auth.currentUser) {
            throw new Error("No authenticated user found.");
        }

        return await auth.currentUser.getIdToken();
    };

    return (
        <AuthContext.Provider
            value={{
                firebaseUser,
                loading,
                redirectError,
                loginWithGoogle,
                logout,
                getIdToken
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
};

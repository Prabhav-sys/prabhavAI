
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    onAuthStateChanged,
    signInWithPopup,
    signOut
} from "firebase/auth";

import { auth, googleProvider } from "../firebase/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setFirebaseUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        return await signInWithPopup(auth, googleProvider);
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

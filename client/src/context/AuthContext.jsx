import { createContext, useContext, useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

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
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setRedirectError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(result.user);
      return result.user;
    } catch (error) {
      setRedirectError(error.message || "Unable to complete Google sign-in.");
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        loading,
        redirectError,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Make sure useAuth is defined and exported here!
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
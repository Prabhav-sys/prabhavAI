// Change signInWithRedirect back to signInWithPopup
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider 
} from "firebase/auth";

// Inside AuthProvider:
const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    setFirebaseUser(result.user);
    // Optional: Sync token with your backend here
  } catch (error) {
    setRedirectError(error.message || "Unable to complete Google sign-in.");
  }
};
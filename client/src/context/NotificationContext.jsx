
import {
    createContext,
    useCallback,
    useContext,
    useState
} from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState(null);

    const notify = useCallback((message, type = "success") => {
        setNotification({
            id: Date.now(),
            message,
            type
        });
    }, []);

    const dismiss = useCallback(() => {
        setNotification(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ notify, dismiss }}>
            {children}

            {notification && (
                <div
                    className={`app-toast app-toast--${notification.type}`}
                    role="status"
                    aria-live="polite"
                >
                    <span>{notification.message}</span>

                    <button onClick={dismiss} aria-label="Dismiss notification">
                        ×
                    </button>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error(
            "useNotification must be used inside NotificationProvider"
        );
    }

    return context;
}

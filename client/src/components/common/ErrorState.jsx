
import Button from "../ui/Button";

function ErrorState({
    title = "Something went wrong",
    message = "We couldn't complete your request.",
    onRetry
}) {
    return (
        <div className="error-state">
            <div className="error-state-icon">!</div>

            <h3>{title}</h3>

            <p>{message}</p>

            {onRetry && (
                <Button variant="secondary" onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}

export default ErrorState;

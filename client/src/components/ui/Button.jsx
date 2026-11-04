
function Button({
    children,
    variant = "primary",
    size = "medium",
    type = "button",
    disabled = false,
    onClick,
    className = ""
}) {
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`ui-button ui-button--${variant} ui-button--${size} ${className}`}
        >
            {children}
        </button>
    );
}

export default Button;


function Input({
    label,
    type = "text",
    placeholder = "",
    value,
    onChange,
    name,
    error,
    disabled = false
}) {
    return (
        <div className="ui-input-group">
            {label && (
                <label htmlFor={name}>
                    {label}
                </label>
            )}

            <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange?.(event.target.value)}
                disabled={disabled}
                className={error ? "ui-input ui-input--error" : "ui-input"}
            />

            {error && (
                <span className="ui-input-error">
                    {error}
                </span>
            )}
        </div>
    );
}

export default Input;

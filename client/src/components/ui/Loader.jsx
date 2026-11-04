
function Loader({ message = "Loading...", fullScreen = false }) {
    return (
        <div className={`app-loader ${fullScreen ? "app-loader--fullscreen" : ""}`}>
            <div className="app-loader-spinner" />

            <p>{message}</p>
        </div>
    );
}

export default Loader;

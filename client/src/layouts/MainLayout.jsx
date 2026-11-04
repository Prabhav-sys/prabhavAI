
import { Outlet, Link } from "react-router-dom";

function MainLayout() {
    return (
        <div className="main-layout">
            <header className="main-header">
                <Link to="/" className="brand">
                    InterviewAI
                </Link>

                <nav>
                    <Link to="/login">Sign In</Link>
                </nav>
            </header>

            <main className="main-content">
                <Outlet />
            </main>

            <footer className="main-footer">
                <p>© {new Date().getFullYear()} InterviewAI</p>
            </footer>
        </div>
    );
}

export default MainLayout;

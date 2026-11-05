
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

const navigation = [
    {
        label: "Overview",
        path: "/dashboard"
    },
    {
        label: "Resume Analysis",
        path: "/resume-analysis"
    },
    {
        label: "Job Matching",
        path: "/job-matching"
    },
    {
        label: "Mock Interview",
        path: "/mock-interview"
    },
    {
        label: "Interview History",
        path: "/interview-history"
    },
    {
        label: "Profile",
        path: "/profile"
    }
];

function Sidebar() {
    const user = useSelector((state) => state.auth.user);

    return (
        <aside className="sidebar">

            {/* Branding */}
            <div className="sidebar-brand">
                prabhavAI
            </div>

            {/* Navigation */}
            <nav className="sidebar-navigation">

                {navigation.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}

                {/* Admin Navigation */}
                {user?.role === "ADMIN" && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        Admin Dashboard
                    </NavLink>
                )}

            </nav>

        </aside>
    );
}

export default Sidebar;

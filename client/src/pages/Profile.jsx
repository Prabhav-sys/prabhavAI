
import { useSelector } from "react-redux";
import "../features/dashboard/profile.css";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";

function Profile() {
    const user = useSelector((state) => state.auth.user);

    return (
        <div className="profile-page">
            <PageHeader
                title="My Profile"
                description="View your account information and profile details."
            />

            <Card className="profile-card">
                <div className="profile-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="profile-information">
                    <h2>{user?.name || "User"}</h2>
                    <p>{user?.email || "Email unavailable"}</p>
                </div>

                <div className="profile-details">
                    <div>
                        <span>Full Name</span>
                        <strong>{user?.name || "Not available"}</strong>
                    </div>

                    <div>
                        <span>Email Address</span>
                        <strong>{user?.email || "Not available"}</strong>
                    </div>

                    <div>
                        <span>Account Role</span>
                        <strong>{user?.role || "USER"}</strong>
                    </div>

                    <div>
                        <span>Available Credits</span>
                        <strong>{user?.credits ?? 0}</strong>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default Profile;

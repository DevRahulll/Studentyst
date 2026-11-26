import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
            <div>
                <p className="font-display text-8xl font-extrabold text-primary font-stretch-78%">
                    404
                </p>
                <h1 className="mt-4 text-2xl font-semibold">
                    This page doesn't exist
                </h1>
                <p className="mt-2 text-muted">
                    The link may be broken, or the page may have been removed.
                </p>
                <Link to="/courses" className="btn-primary btn-lg mt-8">
                    Browse courses
                </Link>
            </div>
        </div>
    );
}

export default NotFound;

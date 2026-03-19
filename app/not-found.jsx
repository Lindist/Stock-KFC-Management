import Link from "next/link"
const NotFound = () => {
    return (
        <div>
            <h1>404 - Not Found</h1>
            <p>Page not found</p>
            <Link href="/">Go to Home</Link>
        </div>
    );
};

export default NotFound;
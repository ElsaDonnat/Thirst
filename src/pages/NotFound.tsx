import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <p className="mb-4 text-xl text-muted-foreground">This page doesn't exist.</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Go back to the game
        </a>
      </div>
    </div>
  );
};

export default NotFound;

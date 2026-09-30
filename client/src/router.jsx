import { lazy } from "react";
import { createHashRouter, Navigate, useLocation, useParams } from "react-router-dom";
import App from "./App.jsx";
import RouteError from "./components/RouteError.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Auth = lazy(() => import("./pages/Auth.jsx"));
const Watch = lazy(() => import("./pages/Watch.jsx"));
const Channel = lazy(() => import("./pages/Channel.jsx"));
const Library = lazy(() => import("./pages/Library.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function Protected({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <div className="status" role="status">Checking your session…</div>;
  return user ? children : <Navigate to="/auth" state={{ from: location.pathname }} replace />;
}

// Remount page-local forms and mutations when the selected resource changes.
function WatchRoute() { const { id } = useParams(); return <Watch key={id} />; }
function ChannelRoute() { const { id } = useParams(); return <Channel key={id} />; }

export const router = createHashRouter([{
  element: <App />,
  errorElement: <RouteError />,
  children: [
    { index: true, element: <Home /> },
    { path: "shorts", element: <Home shorts /> },
    { path: "subscriptions", element: <Protected><Library section="subscriptions" /></Protected> },
    { path: "library/:section", element: <Protected><Library /></Protected> },
    { path: "auth", element: <Auth /> },
    { path: "watch/:id", element: <WatchRoute /> },
    { path: "channel/:id", element: <ChannelRoute /> },
    { path: "studio", element: <Protected><Channel key="studio" studio /></Protected> },
    { path: "*", element: <NotFound /> }
  ]
}]);

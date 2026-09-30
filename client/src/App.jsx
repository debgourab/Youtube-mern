import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { closeDrawer, toggleDesktop, toggleDrawer } from "./store/uiSlice.js";

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { desktopExpanded, drawerOpen } = useSelector((state) => state.ui);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 860px)").matches);
  const overlay = mobile;
  const showSidebar = overlay ? drawerOpen : desktopExpanded;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const update = () => { setMobile(media.matches); dispatch(closeDrawer()); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [dispatch]);

  useEffect(() => { dispatch(closeDrawer()); }, [location.key, dispatch]);

  return (
    <>
      <button
        type="button"
        className="skip-link"
        onClick={() => document.getElementById("page-content")?.focus()}
      >
        Skip to content
      </button>
      <Header expanded={overlay ? drawerOpen : desktopExpanded}
        onToggle={() => dispatch(overlay ? toggleDrawer() : toggleDesktop())} />
      <div className={!overlay && showSidebar ? "app-layout docked-layout" : "app-layout"}>
        {showSidebar && <Sidebar overlay={overlay} onClose={() => dispatch(closeDrawer())} />}
        <div id="page-content" className="page-content" tabIndex={-1}>
          <Suspense fallback={<div className="status" role="status">Loading page…</div>}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </>
  );
}

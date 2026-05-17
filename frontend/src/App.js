import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewEvent from "./pages/NewEvent";
import EventDetail from "./pages/EventDetail";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

function Protected({ children }) {
    const { user } = useAuth();
    const location = useLocation();
    if (user === null) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><Loader2 style={{animation:"spin 1s linear infinite",width:24,height:24,color:"#C85A2E"}}/></div>;
    if (user === false) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return <>{children}<BottomNav /></>;
}

function PublicOnly({ children }) {
    const { user } = useAuth();
    if (user === null) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><Loader2 style={{animation:"spin 1s linear infinite",width:24,height:24,color:"#C85A2E"}}/></div>;
    if (user) return <Navigate to="/" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
                    <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
                    <Route path="/" element={<Protected><Dashboard /></Protected>} />
                    <Route path="/new" element={<Protected><NewEvent /></Protected>} />
                    <Route path="/events/:id" element={<Protected><EventDetail /></Protected>} />
                    <Route path="/me" element={<Protected><Profile /></Protected>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster position="top-center" />
            </BrowserRouter>
        </AuthProvider>
    );
}

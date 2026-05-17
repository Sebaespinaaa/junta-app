import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const SLOT_LABEL = { AM:"Mañana", MID:"Mediodía", PM:"Tarde" };

function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("es-ES", { weekday:"short", day:"numeric", month:"short" });
}

export default function Dashboard() {
    const { user } = useAuth();
    const [events, setEvents] = useState(null);

    useEffect(() => {
        api.get("/events").then(r => setEvents(r.data)).catch(() => setEvents([]));
    }, []);

    return (
        <div style={{maxWidth:480,margin:"0 auto",padding:"1.5rem 1.25rem 6rem",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,letterSpacing:-1,marginBottom:4}}>Tus juntas.</div>
            <div style={{color:"#8A8580",fontSize:13,marginBottom:24}}>Hola, {user?.nickname || user?.name} 👋</div>
            {events === null ? (

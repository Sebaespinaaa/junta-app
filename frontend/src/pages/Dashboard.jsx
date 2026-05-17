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
                [1,2,3].map(i => <div key={i} style={{height:90,borderRadius:18,background:"#F0EDE8",marginBottom:12}}/>)
            ) : events.length === 0 ? (
                <div style={{textAlign:"center",padding:"3rem 1rem"}}>
                    <div style={{fontSize:48,marginBottom:12}}>📅</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,marginBottom:8}}>Sin juntas aún.</div>
                    <div style={{color:"#8A8580",fontSize:14,marginBottom:20}}>Crea una junta y coordina con tus amigos.</div>
                    <Link to="/new" style={{display:"inline-block",padding:"12px 28px",borderRadius:30,background:"#1A1816",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none"}}>Crear una junta</Link>
                </div>
            ) : events.map(ev => (
                <Link key={ev.id} to={`/events/${ev.id}`} style={{display:"block",background:"#fff",border:"1px solid #E5E0D8",borderRadius:18,padding:"1rem 1.25rem",marginBottom:12,textDecoration:"none",color:"#1A1816"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:600,flex:1}}>{ev.title}</div>
                        {ev.confirmed
                            ? <span style={{background:"#EAF3DE",color:"#3B6D11",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>✓ Confirmado</span>
                            : <span style={{background:"#F0EDE8",color:"#8A8580",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>Votando…</span>
                        }
                    </div>
                    <div style={{display:"flex",gap:16,fontSize:13,color:"#8A8580"}}>
                        <span>📆 {ev.confirmed ? `${fmtDate(ev.confirmed.date)} · ${SLOT_LABEL[ev.confirmed.slot]}` : `${ev.candidate_dates.length} fechas`}</span>
                        <span>👥 {ev.participant_ids.length}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
}

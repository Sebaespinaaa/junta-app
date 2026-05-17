import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "../lib/api";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function toISO(d) { return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }

export default function NewEvent() {
    const navigate = useNavigate();
    const today = useMemo(() => { const d=new Date(); d.setHours(0,0,0,0); return d; }, []);
    const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selected, setSelected] = useState([]);
    const [friends, setFriends] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const grid = useMemo(() => {
        const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const dow = (first.getDay()+6)%7;
        const start = new Date(first); start.setDate(1-dow);
        return Array.from({length:42}, (_,i) => { const d=new Date(start); d.setDate(start.getDate()+i); return d; });
    }, [cursor]);

    const toggle = (d) => {
        if (d < today) return;
        const iso = toISO(d);
        setSelected(prev => prev.includes(iso) ? prev.filter(x=>x!==iso) : [...prev,iso].sort());
    };

    const onSubmit = async (e) => {
        e.preventDefault(); setErr("");
        if (!title.trim() || selected.length===0) { setErr("Añade un título y al menos una fecha."); return; }
        setLoading(true);
        try {
            const participants = friends.split(/[,\s]+/).map(x=>x.trim()).filter(Boolean);
            const { data } = await api.post("/events", { title, description, candidate_dates: selected, participants });
            navigate(`/events/${data.id}`);
        } catch(e2) { setErr(formatApiError(e2.response?.data?.detail)||e2.message); }
        finally { setLoading(false); }
    };

    const s = { fontFamily:"'DM Sans',sans-serif" };
    const inputStyle = { width:"100%", padding:"12px 16px", border:"1.5px solid #E5E0D8", borderRadius:10, fontSize:15, fontFamily:"'DM Sans',sans-serif", background:"#fff", color:"#1A1816", outline:"none", boxSizing:"border-box" };
    const labelStyle = { display:"block", fontSize:12, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em", color:"#8A8580", marginBottom:6 };

    return (
        <div style={{maxWidth:480,margin:"0 auto",padding:"1.5rem 1.25rem 6rem",...s}}>
            <button onClick={()=>navigate(-1)} style={{border:"none",background:"none",color:"#8A8580",fontSize:14,cursor:"pointer",marginBottom:16,padding:0}}>← Volver</button>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,letterSpacing:-1,marginBottom:4}}>Nueva junta.</div>
            <div style={{color:"#8A8580",fontSize:13,marginBottom:24}}>¿Qué coordinamos?</div>
            <form onSubmit={onSubmit}>
                <div style={{marginBottom:14}}><label style={labelStyle}>Título</label><input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Cena en casa de Pablo" required style={inputStyle}/></div>
                <div style={{marginBottom:14}}><label style={labelStyle}>Descripción <span style={{fontWeight:300,textTransform:"none"}}>(opcional)</span></label><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Traigan algo de picar..." rows={2} style={{...inputStyle,resize:"none",lineHeight:1.5}}/></div>
                <div style={{marginBottom:8}}><label style={labelStyle}>Fechas propuestas</label></div>
                <div style={{background:"#fff",border:"1px solid #E5E0D8",borderRadius:18,overflow:"hidden",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"1px solid #E5E0D8"}}>
                        <button type="button" onClick={()=>setCursor(c=>new Date(c.getFullYear(),c.getMonth()-1,1))} style={{width:32,height:32,border:"none",background:"#F0EDE8",borderRadius:"50%",cursor:"pointer",fontSize:16}}>‹</button>
                        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:600}}>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</span>
                        <button type="button" onClick={()=>setCursor(c=>new Date(c.getFullYear(),c.getMonth()+1,1))} style={{width:32,height:32,border:"none",background:"#F0EDE8",borderRadius:"50%",cursor:"pointer",fontSize:16}}>›</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"8px"}}>
                        {["L","M","X","J","V","S","D"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#8A8580",padding:"4px 0"}}>{d}</div>)}
                        {grid.map((d,i)=>{
                            const iso=toISO(d); const past=d<today; const inM=d.getMonth()===cursor.getMonth(); const sel=selected.includes(iso);
                            return <button key={i} type="button" onClick={()=>toggle(d)} disabled={past}
                                style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,border:"none",borderRadius:"50%",cursor:past?"default":"pointer",
                                    background:sel?"#C85A2E":"transparent",color:sel?"#fff":past||!inM?"#E5E0D8":"#1A1816",fontWeight:sel?600:400}}>
                                {d.getDate()}
                            </button>;
                        })}
                    </div>
                </div>
                {selected.length>0 && (
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                        {selected.map(iso=>(
                            <span key={iso} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#FDF0EB",color:"#C85A2E",fontSize:12,fontWeight:500,padding:"4px 10px",borderRadius:20}}>
                                {new Date(iso+"T12:00:00").toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"})}
                                <button type="button" onClick={()=>setSelected(p=>p.filter(x=>x!==iso))} style={{border:"none",background:"none",cursor:"pointer",color:"#C85A2E",fontSize:14,padding:0,lineHeight:1}}>×</button>
                            </span>
                        ))}
                    </div>
                )}
                <div style={{marginBottom:20}}><label style={labelStyle}>Amigos <span style={{fontWeight:300,textTransform:"none"}}>(separados por coma)</span></label><input type="text" value={friends} onChange={e=>setFriends(e.target.value)} placeholder="pablo, jorge, ana" autoCapitalize="none" style={inputStyle}/></div>
                {err && <div style={{background:"#FDF0EB",border:"1px solid #F5C4B3",color:"#993C1D",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>{err}</div>}
                <button type="submit" disabled={loading} style={{width:"100%",padding:14,border:"none",borderRadius:30,fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:600,cursor:"pointer",background:"#1A1816",color:"#fff"}}>
                    {loading ? "Creando…" : "+ Crear junta"}
                </button>
            </form>
        </div>
    );
}

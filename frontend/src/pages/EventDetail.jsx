import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const SLOTS = [{id:"AM",label:"Mañana",icon:"☀️"},{id:"MID",label:"Mediodía",icon:"🌤"},{id:"PM",label:"Tarde",icon:"🌙"}];

function fmtLong(iso) {
    return new Date(iso+"T12:00:00").toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
}

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [state, setState] = useState(null);
    const [comments, setComments] = useState([]);
    const [text, setText] = useState("");
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteVal, setInviteVal] = useState("");

    const fetchEvent = useCallback(async () => {
        try { const {data} = await api.get(`/events/${id}`); setState(data); }
        catch(e) { setErr(formatApiError(e.response?.data?.detail)||e.message); }
    }, [id]);

    const fetchComments = useCallback(async () => {
        try { const {data} = await api.get(`/events/${id}/comments`); setComments(data); } catch {}
    }, [id]);

    useEffect(() => {
        fetchEvent(); fetchComments();
        const iv = setInterval(fetchComments, 5000);
        return () => clearInterval(iv);
    }, [fetchEvent, fetchComments]);

    const mySlots = useMemo(() => {
        const m = {};
        (state?.my_availability||[]).forEach(s => { m[s.date]=new Set(s.slots); });
        return m;
    }, [state]);

    const toggleSlot = async (date, slot) => {
        if (!state) return;
        const cur = {...mySlots};
        cur[date] = new Set(cur[date]||[]);
        if (cur[date].has(slot)) cur[date].delete(slot); else cur[date].add(slot);
        const selections = Object.entries(cur).map(([d,s])=>({date:d,slots:Array.from(s)})).filter(x=>x.slots.length>0);
        setState(prev=>({...prev,my_availability:selections}));
        setSaving(true);
        try { const {data}=await api.post(`/events/${id}/availability`,{selections}); setState(data); }
        catch(e) { setErr(formatApiError(e.response?.data?.detail)||e.message); }
        finally { setSaving(false); }
    };

    const sendComment = async (e) => {
        e.preventDefault(); if (!text.trim()) return;
        const t=text.trim(); setText("");
        try { const {data}=await api.post(`/events/${id}/comments`,{text:t}); setComments(c=>[...c,data]); }
        catch(e2) { setErr(formatApiError(e2.response?.data?.detail)||e2.message); }
    };

    const doInvite = async () => {
        const usernames=inviteVal.split(/[,\s]+/).map(x=>x.trim()).filter(Boolean);
        if (!usernames.length) return;
        try { await api.post(`/events/${id}/invite`,{usernames}); setInviteVal(""); setInviteOpen(false); fetchEvent(); }
        catch(e) { setErr(formatApiError(e.response?.data?.detail)||e.message); }
    };

    if (!state) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>{err||"Cargando…"}</div>;

    const ev=state.event; const participants=state.participants; const confirmed=ev.confirmed;

    return (
        <div style={{maxWidth:480,margin:"0 auto",padding:"1.5rem 1.25rem 6rem",fontFamily:"'DM Sans',sans-serif"}}>
            <button onClick={()=>navigate("/")} style={{border:"none",background:"none",color:"#8A8580",fontSize:14,cursor:"pointer",marginBottom:16,padding:0}}>← Inicio</button>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:700,letterSpacing:-1,marginBottom:4}}>{ev.title}</div>
            {ev.description && <div style={{color:"#8A8580",fontSize:14,marginBottom:16}}>{ev.description}</div>}

            {confirmed && (
                <div style={{background:"#2E7D55",color:"#fff",borderRadius:18,padding:"1rem 1.25rem",display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                    <div style={{width:44,height:44,background:"rgba(255,255,255,0.18)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>✅</div>
                    <div>
                        <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",opacity:.75,fontWeight:600,marginBottom:2}}>¡Se cuadra!</div>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,textTransform:"capitalize"}}>{fmtLong(confirmed.date)}</div>
                        <div style={{fontSize:13,opacity:.85}}>{SLOTS.find(s=>s.id===confirmed.slot)?.label}</div>
                    </div>
                </div>
            )}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15}}>Participantes ({participants.length})</div>
                {ev.owner_id===user?.id && <button onClick={()=>setInviteOpen(v=>!v)} style={{border:"none",background:"none",color:"#C85A2E",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Invitar</button>}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                {participants.map(p=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1px solid #E5E0D8",borderRadius:20,padding:"4px 12px 4px 4px"}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:"#1A4A8A",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{(p.nickname||p.name)[0].toUpperCase()}</div>
                        <span style={{fontSize:13}}>{p.nickname||p.name}</span>
                    </div>
                ))}
            </div>
            {inviteOpen && (
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                    <input value={inviteVal} onChange={e=>setInviteVal(e.target.value)} placeholder="usuario1, usuario2" autoCapitalize="none"
                        style={{flex:1,padding:"10px 14px",border:"1.5px solid #E5E0D8",borderRadius:10,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
                    <button onClick={doInvite} style={{padding:"10px 16px",border:"none",borderRadius:10,background:"#1A1816",color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:14,cursor:"pointer"}}>Añadir</button>
                </div>
            )}

            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,marginBottom:8}}>¿Cuándo puedes?</div>
            <div style={{fontSize:13,color:"#8A8580",marginBottom:16}}>Marca todas las opciones que te vengan bien. Cuando todos coincidan se confirmará solo.</div>
            {ev.candidate_dates.map(d=>(
                <div key={d} style={{background:"#fff",border:`1px solid ${confirmed?.date===d?"#2E7D55":"#E5E0D8"}`,borderRadius:18,padding:"1rem",marginBottom:12,background:confirmed?.date===d?"#F2FAF5":"#fff"}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:14,textTransform:"capitalize",marginBottom:12}}>{fmtLong(d)}</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                        {SLOTS.map(sl=>{
                            const count=(state.availability_summary[d]?.[sl.id]||[]).length;
                            const total=participants.length;
                            const mine=(mySlots[d]||new Set()).has(sl.id);
                            const allIn=count===total&&total>0;
                            const pct=total>0?Math.round(count/total*100):0;
                            return (
                                <button key={sl.id} onClick={()=>toggleSlot(d,sl.id)} type="button"
                                    style={{position:"relative",overflow:"hidden",border:`1.5px solid ${mine?"#C85A2E":allIn?"#2E7D55":"#E5E0D8"}`,borderRadius:12,padding:"10px 6px",textAlign:"center",cursor:"pointer",background:mine?"#FDF0EB":allIn?"#EAF3DE":"#F7F5F2"}}>
                                    <div style={{position:"absolute",bottom:0,left:0,width:`${pct}%`,height:"100%",background:"rgba(46,125,85,0.1)",pointerEvents:"none"}}/>
                                    <div style={{fontSize:18,marginBottom:2}}>{sl.icon}</div>
                                    <div style={{fontSize:11,fontWeight:600,color:mine?"#C85A2E":"#1A1816"}}>{sl.label}</div>
                                    <div style={{fontSize:10,color:allIn?"#2E7D55":"#8A8580",fontWeight:allIn?600:400}}>{count}/{total}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            {saving && <div style={{fontSize:12,color:"#8A8580",marginBottom:8}}>Guardando…</div>}
            {err && <div style={{background:"#FDF0EB",border:"1px solid #F5C4B3",color:"#993C1D",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>{err}</div>}

            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,marginTop:24,marginBottom:12}}>Conversación</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {comments.length===0
                    ? <div style={{fontSize:13,color:"#8A8580"}}>Sin mensajes aún. ¡Inicia la conversación! 👋</div>
                    : comments.map(c=>{
                        const mine=c.user_id===user?.id;
                        return (
                            <div key={c.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start"}}>
                                <div style={{maxWidth:"75%",padding:"8px 14px",borderRadius:18,fontSize:13,lineHeight:1.5,background:mine?"#C85A2E":"#fff",color:mine?"#fff":"#1A1816",border:mine?"none":"1px solid #E5E0D8",borderBottomRightRadius:mine?4:18,borderBottomLeftRadius:mine?18:4}}>
                                    {!mine && <div style={{fontSize:10,fontWeight:600,opacity:.6,marginBottom:2}}>{c.nickname||c.username}</div>}
                                    {c.text}
                                </div>
                            </div>
                        );
                    })
                }
            </div>
            <form onSubmit={sendComment} style={{display:"flex",gap:8}}>
                <input value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe un mensaje…"
                    style={{flex:1,padding:"10px 16px",border:"1.5px solid #E5E0D8",borderRadius:30,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",background:"#fff",color:"#1A1816"}}/>
                <button type="submit" style={{width:42,height:42,borderRadius:"50%",background:"#C85A2E",border:"none",cursor:"pointer",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>→</button>
            </form>
        </div>
    );
}

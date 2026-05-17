import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(""); setLoading(true);
        const r = await login(username, password);
        setLoading(false);
        if (r.ok) navigate(location.state?.from || "/", { replace: true });
        else setErr(r.error);
    };

    return (
        <div style={{minHeight:"100vh",background:"#F7F5F2",display:"flex",flexDirection:"column",justifyContent:"center",padding:"2rem 1.5rem",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:700,marginBottom:4}}>jun<span style={{color:"#C85A2E"}}>ta</span></div>
            <div style={{color:"#8A8580",fontSize:14,marginBottom:32}}>Coordina sin vueltas con tus amigos.</div>
            {err && <div style={{background:"#FDF0EB",border:"1px solid #F5C4B3",color:"#993C1D",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>{err}</div>}
            <form onSubmit={onSubmit}>
                <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:12,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.06em",color:"#8A8580",marginBottom:6}}>Usuario</label>
                    <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="tu_usuario" autoCapitalize="none" required
                        style={{width:"100%",padding:"12px 16px",border:"1.5px solid #E5E0D8",borderRadius:10,fontSize:15,fontFamily:"'DM Sans',sans-serif",background:"#fff",color:"#1A1816",outline:"none",boxSizing:"bo

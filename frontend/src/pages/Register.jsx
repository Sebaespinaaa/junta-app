import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username:"", password:"", name:"", nickname:"", birthdate:"" });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault(); setErr(""); setLoading(true);
        const r = await register(form); setLoading(false);
        if (r.ok) navigate("/", { replace: true }); else setErr(r.error);
    };

    const fields = [
        { k:"name", label:"Nombre", placeholder:"María García", type:"text" },
        { k:"nickname", label:"Sobrenombre", placeholder:"Mari", type:"text" },
        { k:"username", label:"Usuario", placeholder:"mari_g", type:"text" },
        { k:"birthdate", label:"Fecha de cumpleaños", type:"date" },
        { k:"password", label:"Contraseña", placeholder:"••••••", type:"password" },
    ];

    return (
        <div style={{minHeight:"100vh",background:"#F7F5F2",padding:"2rem 1.5rem",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:700,marginBottom:4}}>jun<span style={{color:"#C85A2E"}}>ta</span></div>
            <div style={{color:"#8A8580",fontSize:14,marginBottom:24}}>Cuéntanos quién eres.</div>
            {err && <div style={{background:"#FDF0EB",border:"1px solid #F5C4B3",color:"#993C1D",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>{err}</div>}
            <form onSubmit={onSubmit}>
                {fields.map(f => (
                    <div key={f.k} style={{marginBottom:14}}>
                        <label style={{display:"block",fontSize:12,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.06em",color:"#8A8580",marginBottom:6}}>{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder} value={form[f.k]} onChange={set(f.k)}
                            autoCapitalize={f.k==="username"?"none":undefined} required
                            style={{width:"100%",padding:"12px 16px",border:"1.5px solid #E5E0D8",borderRadius:10,fontSize:15,fontFamily:"'DM Sans',sans-serif",background:"#fff",color:"#1A1816",outline:"none",boxSizing:"border-box"}}/>
                    </div>
                ))}
                <button type="submit" disabled={loading}
                    style={{width:"100%",padding:"14px",border:"none",borderRadius:30,fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:600,cursor:"pointer",background:"#1A1816",color:"#fff",marginTop:8}}>
                    {loading ? "Creando cuenta…" : "Crear cuenta"}
                </button>
            </form>
            <div style={{textAlign:"center",fontSize:13,color:"#8A8580",marginTop:16}}>
                ¿Ya tienes cuenta? <Link to="/login" style={{color:"#C85A2E",fontWeight:500,textDecoration:"none"}}>Entra aquí</Link>
            </div>
        </div>
    );
}

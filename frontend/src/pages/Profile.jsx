import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
    const { user, logout } = useAuth();
    if (!user) return null;
    return (
        <div style={{maxWidth:480,margin:"0 auto",padding:"1.5rem 1.25rem 6rem",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,letterSpacing:-1,marginBottom:20}}>Perfil.</div>
            <div style={{background:"#fff",border:"1px solid #E5E0D8",borderRadius:18,padding:"2rem 1.5rem",textAlign:"center"}}>
                <div style={{width:72,height:72,borderRadius:20,background:"#1A1816",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,margin:"0 auto 12px"}}>{(user.nickname||user.name)[0].toUpperCase()}</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:700,marginBottom:4}}>{user.name}</div>
                <div style={{color:"#8A8580",fontSize:14,marginBottom:24}}>«{user.nickname}»</div>
                {[{label:"Usuario",value:`@${user.username}`},{label:"Cumpleaños",value:`🎂 ${user.birthdate}`}].map(r=>(
                    <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#F7F5F2",borderRadius:10,marginBottom:8,fontSize:14}}>
                        <span style={{fontSize:12,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",color:"#8A8580"}}>{r.label}</span>
                        <span>{r.value}</span>
                    </div>
                ))}
                <div style={{height:1,background:"#E5E0D8",margin:"20px 0"}}/>
                <button onClick={logout} style={{width:"100%",padding:14,border:"none",borderRadius:30,fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:600,cursor:"pointer",background:"#F0EDE8",color:"#1A1816"}}>Cerrar sesión</button>
            </div>
        </div>
    );
}

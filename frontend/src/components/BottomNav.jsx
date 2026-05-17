import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Plus, User } from "lucide-react";

const items = [
    { to: "/", icon: Home, label: "Inicio", end: true },
    { to: "/new", icon: Plus, label: "Crear", primary: true },
    { to: "/me", icon: User, label: "Perfil" },
];

export default function BottomNav() {
    return (
        <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:40,background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderTop:"1px solid #E5E0D8",display:"flex",justifyContent:"space-around",padding:"8px 0 20px"}}>
            {items.map(({ to, icon: Icon, label, primary, end }) => (
                <NavLink key={to} to={to} end={end}
                    style={({ isActive }) => ({
                        display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                        color: primary ? "#fff" : isActive ? "#C85A2E" : "#8A8580",
                        fontSize:11,fontWeight:600,textDecoration:"none",padding:"4px 16px"
                    })}>
                    {primary ? (
                        <span style={{width:46,height:46,borderRadius:"50%",background:"#C85A2E",display:"flex",alignItems:"center",justifyContent:"center",marginTop:-20,boxShadow:"0 4px 16px rgba(200,90,46,0.35)"}}>
                            <Icon size={20} />
                        </span>
                    ) : <Icon size={22} />}
                    <span style={{color: primary ? "#8A8580" : "inherit"}}>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

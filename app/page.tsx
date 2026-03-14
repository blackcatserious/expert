"use client";
import { useAuth } from "@clerk/nextjs";
import Landing from "./landing";
import ChatApp from "./chat_app";

export default function Page() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050508" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: "#050508", animation: "pulse 2s infinite" }}>TR</div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .7; transform: scale(.95); } }`}</style>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Landing onEnter={() => window.location.href = "/sign-in"} />;
  }

  return <ChatApp />;
}

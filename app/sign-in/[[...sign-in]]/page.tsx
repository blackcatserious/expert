import { SignIn } from "@clerk/nextjs";
export default function SignInPage() {
  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060609" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 16, fontWeight: 800, color: "#060609" }}>TR</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e4e4ed", fontFamily: "system-ui" }}>TraceRemove AI</div>
        </div>
        <SignIn afterSignOutUrl="/" />
      </div>
    </div>
  );
}

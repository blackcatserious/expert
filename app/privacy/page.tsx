export default function Privacy() {
  return (
    <div style={{ background: "#050508", color: "#e4e4ed", fontFamily: "Outfit, system-ui, sans-serif", minHeight: "100vh", padding: "80px 24px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <a href="/" style={{ color: "#00f5d4", fontSize: 13, textDecoration: "none", marginBottom: 24, display: "block" }}>&larr; Back to TraceRemove AI</a>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "#8888a0", marginBottom: 32 }}>Last updated: March 2026</p>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "#b0b0c0" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e4e4ed", margin: "28px 0 12px" }}>1. Information We Collect</h2>
          <p>We collect information you provide when creating an account (email, name via Google OAuth) and conversation data you create while using TraceRemove AI. We also collect usage data such as pages visited and features used.</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e4e4ed", margin: "28px 0 12px" }}>2. How We Use Your Information</h2>
          <p>Your data is used to provide and improve TraceRemove AI services, save your conversation history, personalize your experience, and communicate important updates.</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e4e4ed", margin: "28px 0 12px" }}>3. AI Model Providers</h2>
          <p>Your prompts are sent to third-party AI providers (Anthropic for Claude, OpenAI for GPT-4o) to generate responses. These providers have their own privacy policies. We do not store your prompts on their servers beyond what is needed to generate a response.</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e4e4ed", margin: "28px 0 12px" }}>4. Data Storage</h2>
          <p>Your data is stored securely using Supabase (PostgreSQL) with row-level security. Authentication is handled by Clerk. All data is encrypted in transit via TLS.</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e4e4ed", margin: "28px 0 12px" }}>5. Your Rights</h2>
          <p>You can delete your conversations at any time. You can request a full data export or account deletion by contacting us. For EU users: you have rights under GDPR including access, rectification, erasure, and portability.</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e4e4ed", margin: "28px 0 12px" }}>6. Contact</h2>
          <p>For privacy questions, contact us at privacy@traceremove.expert</p>
        </div>
      </div>
    </div>
  );
}

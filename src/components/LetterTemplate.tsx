import logo from "@/assets/dutch-trails-logo.jpg";

export type LetterData = {
  letter_type: "final_service" | "recommendation";
  letter_date: string;
  recipient?: string | null;
  recipient_address?: string | null;
  subject?: string | null;
  body: string;
  positions?: Array<{ title: string; date: string }> | null;
  joined_date?: string | null;
  last_day?: string | null;
  notice_until?: string | null;
  hr_manager_name?: string | null;
  hr_manager_title?: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const day = dt.getDate();
  const suffix = ["th", "st", "nd", "rd"][((day % 100) - 20) % 10] || ["th", "st", "nd", "rd"][day] || "th";
  return `${day}${suffix} ${dt.toLocaleString("en-US", { month: "long" })} ${dt.getFullYear()}`;
}

/** A4-like printable letter using Dutch Trails letterhead (matches uploaded templates). */
export default function LetterTemplate({ data }: { data: LetterData }) {
  const positions = data.positions ?? [];
  return (
    <div
      className="bg-white text-black mx-auto"
      style={{ width: "794px", minHeight: "1123px", fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif", position: "relative" }}
    >
      {/* Letterhead */}
      <div style={{ position: "relative", height: "210px", overflow: "hidden" }}>
        <svg viewBox="0 0 800 210" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M0,0 L800,0 L800,120 Q500,200 250,90 Q120,30 0,80 Z" fill="#1f6b3a" />
          <path d="M0,80 Q120,30 250,90 Q500,200 800,120 L800,140 Q500,220 250,110 Q120,50 0,100 Z" fill="#3aa55c" />
        </svg>
        <img
          src={logo}
          alt="Dutch Trails"
          crossOrigin="anonymous"
          style={{ position: "absolute", top: "18px", right: "30px", width: "150px", height: "150px", objectFit: "contain" }}
        />
        <div
          style={{
            position: "absolute",
            top: "160px",
            left: "40px",
            color: "#0e0e0e",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "0.2px",
          }}
        >
          Ceylon Dutch Trails Corp(PVT) Ltd
        </div>
      </div>

      {/* Watermark */}
      <img
        src={logo}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%)",
          width: "420px", height: "420px", opacity: 0.06, pointerEvents: "none", objectFit: "contain",
        }}
      />

      {/* Body */}
      <div style={{ padding: "30px 60px 40px 60px", fontSize: "14.5px", lineHeight: 1.55, position: "relative" }}>
        {data.letter_type === "recommendation" ? (
          <>
            <div>{fmtDate(data.letter_date)}</div>
            {data.recipient && <div style={{ marginTop: 6 }}>{data.recipient},</div>}
            {data.recipient_address?.split("\n").map((l, i) => (
              <div key={i}>{l}{i === (data.recipient_address!.split("\n").length - 1) ? "." : ","}</div>
            ))}
            <div style={{ marginTop: 18 }}>Dear Sir/Madam,</div>
            {data.subject && (
              <div style={{ marginTop: 14, fontWeight: 700, textDecoration: "underline" }}>{data.subject}</div>
            )}
          </>
        ) : (
          <>
            <div>{fmtDate(data.letter_date)}</div>
            <div style={{ marginTop: 24, fontWeight: 700, textDecoration: "underline" }}>
              {data.subject || "TO WHOM IT MAY CONCERN"}
            </div>
          </>
        )}

        <div style={{ marginTop: 14, textAlign: "justify", whiteSpace: "pre-wrap" }}>{data.body}</div>

        {positions.length > 0 && (
          <ul style={{ marginTop: 10, marginLeft: 24, listStyleType: "disc" }}>
            {positions.map((p, i) => (
              <li key={i} style={{ marginTop: 4 }}>
                {p.title} – {fmtDate(p.date)}
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 38 }}>Thank You,</div>
        <div style={{ marginTop: 8 }}>Yours Truly,</div>
        <div style={{ marginTop: 6, fontWeight: 700 }}>CEYLON DUTCH TRAILS CORP (PVT) LTD</div>

        <div style={{ marginTop: 60 }}>……………………………………</div>
        <div style={{ marginTop: 6 }}>{data.hr_manager_name || "D.K.N.Jayamanne"}</div>
        <div>{data.hr_manager_title || "Manager Human Resources"}</div>
        <div>Dutch Trails Corp (Pvt.) Ltd.</div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "1px solid #444", padding: "12px 60px", fontSize: "12.5px", display: "flex", justifyContent: "space-around", color: "#222" }}>
        <span>☎ +94 77 144 2443</span>
        <span>✉ info@dutchtrails.com</span>
        <span>🌐 www.dutchtrails.com</span>
      </div>
      <div style={{ position: "absolute", bottom: -22, left: 0, right: 0, textAlign: "center", fontSize: "11.5px", color: "#444" }}>
        No. 243 Ellen-Egoda, Pamunugama, Ja-Ela 11370
      </div>
    </div>
  );
}
const page = {
  minHeight: "100vh",
  background: "#04110b",
  color: "#fff",
  padding: 10,
  fontFamily: "Arial, sans-serif",
  overflowX: "hidden"
};

const topBar = {
  background: "linear-gradient(180deg,#07160f,#081018)",
  border: "1px solid #00ff87",
  borderRadius: 12,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
  boxShadow: "0 0 25px rgba(0,255,135,.08)"
};

const title = {
  color: "#00ff87",
  fontSize: "clamp(32px,4vw,68px)",
  margin: 0,
  fontWeight: 900,
  lineHeight: 1
};

const subTitle = {
  color: "#b6c2cf",
  marginTop: 6,
  fontSize: 14
};

const statusWrap = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center"
};

const pill = {
  border: "1px solid #00ff87",
  background: "#06150d",
  padding: "8px 14px",
  borderRadius: 10,
  fontWeight: 900,
  fontSize: 14
};

const notice = {
  background: "linear-gradient(90deg,#4a1700,#612100)",
  border: "1px solid #ff8a00",
  padding: 14,
  borderRadius: 10,
  marginBottom: 10,
  fontWeight: 900,
  fontSize: 15
};

const filters = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 10
};

const btnStyle = {
  background: "#08140d",
  color: "#fff",
  border: "1px solid #00ff87",
  padding: "11px 16px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 15,
  transition: ".2s"
};

const activeBtn = {
  ...btnStyle,
  background: "#00ff87",
  color: "#001b0b",
  boxShadow: "0 0 18px rgba(0,255,135,.45)"
};

const search = {
  width: "100%",
  boxSizing: "border-box",
  background: "#07131a",
  border: "1px solid #00ff87",
  color: "#fff",
  padding: 15,
  borderRadius: 10,
  marginBottom: 10,
  fontSize: 16,
  outline: "none"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(410px,1fr))",
  gap: 12,
  alignItems: "start"
};

const card = {
  background: "linear-gradient(180deg,#07140d,#081018)",
  border: "1px solid rgba(0,255,135,.35)",
  borderRadius: 14,
  padding: 12,
  minHeight: 280,
  boxShadow: "0 0 18px rgba(0,255,135,.08)",
  overflow: "hidden",
  transition: ".25s"
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
  marginBottom: 10
};

const teams = {
  display: "flex",
  gap: 8,
  alignItems: "center"
};

const match = {
  color: "#00ff87",
  fontSize: "clamp(16px,1.4vw,22px)",
  margin: 0,
  lineHeight: 1.05,
  fontWeight: 900
};

const league = {
  color: "#d4dbe3",
  margin: "5px 0 0",
  fontSize: 13
};

const rightBadges = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  justifyContent: "flex-end"
};

const baseBadge = {
  background: "#334155",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900
};

const vipBadge = {
  background: "#facc15",
  color: "#000",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900
};

const marketBadge = {
  background: "#0ea5e9",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  boxShadow: "0 0 14px rgba(14,165,233,.5)"
};

const bodyGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 180px",
  gap: 10,
  alignItems: "start"
};

const mainInfo = {
  display: "grid",
  gap: 8
};

const scoreBox = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 10,
  display: "grid",
  gap: 3,
  fontSize: 15
};

const signalBox = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 10,
  display: "grid",
  gap: 4,
  fontSize: 15
};

const miniMap = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 8
};

const field = {
  height: 96,
  background:
    "repeating-linear-gradient(90deg,#1f5c2e 0px,#1f5c2e 38px,#216c34 38px,#216c34 76px)",
  border: "2px solid rgba(255,255,255,.18)",
  borderRadius: 10,
  position: "relative",
  overflow: "hidden",
  boxShadow: "inset 0 0 25px rgba(255,255,255,.08)"
};

const statsGrid = {
  marginTop: 8,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 5,
  fontSize: 12,
  color: "#f1f5f9"
};

const bars = {
  display: "grid",
  gap: 5,
  fontSize: 13,
  fontWeight: 900,
  marginTop: 8
};

const barBg = {
  height: 9,
  background: "#1e293b",
  borderRadius: 999,
  overflow: "hidden"
};

const bar = {
  height: "100%",
  background: "#00ff87"
};

const barGold = {
  height: "100%",
  background: "#facc15"
};

const momentumBox = {
  marginTop: 8,
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 8
};

const momentumTitle = {
  fontWeight: 900,
  marginBottom: 5,
  color: "#00ff87",
  fontSize: 14
};

const momentumBar = {
  height: 10,
  background: "#1e293b",
  borderRadius: 999,
  overflow: "hidden"
};

const momentumFill = {
  height: "100%",
  background: "linear-gradient(90deg,#22c55e,#facc15,#ef4444)",
  borderRadius: 999,
  transition: ".4s",
  animation: "pulse 1s infinite"
};

const momentumInfo = {
  marginTop: 5,
  fontSize: 12,
  color: "#e5e7eb"
};

const dangerBox = {
  marginTop: 8,
  background: "#09150d",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 8
};

const dangerHeader = {
  color: "#ff5252",
  fontWeight: 900,
  marginBottom: 5,
  fontSize: 13
};

const dangerContent = {
  color: "#d1d5db",
  fontSize: 12,
  marginBottom: 5
};

const dangerBar = {
  height: 10,
  background: "#1e293b",
  borderRadius: 999,
  overflow: "hidden"
};

const dangerFill = {
  height: "100%",
  background: "linear-gradient(90deg,#22c55e,#facc15,#ef4444)",
  borderRadius: 999,
  animation: "pulse 1s infinite"
};

const footer = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 10,
  justifyContent: "space-between"
};

const betano = {
  background: "#22c55e",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: "9px 16px",
  fontWeight: 900,
  fontSize: 13
};

const novibet = {
  ...betano,
  background: "#2563eb"
};

const bet365 = {
  ...betano,
  background: "#f59e0b"
};

const vipBtn = {
  ...betano,
  background: "#facc15",
  color: "#000"
};

const oddBlink = {
  color: "#facc15",
  fontWeight: 900,
  animation: "pulse 0.8s infinite"
};

const popup = {
  position: "fixed",
  top: 18,
  right: 18,
  zIndex: 9999,
  background: "#7f1d1d",
  border: "2px solid #ef4444",
  padding: 16,
  borderRadius: 10,
  boxShadow: "0 0 25px rgba(239,68,68,.7)"
};

const empty = {
  background: "#101820",
  border: "1px solid #00ff87",
  borderRadius: 10,
  padding: 18,
  fontWeight: 800
};

const bottomBar = {
  marginTop: 12,
  background: "#07131a",
  border: "1px solid rgba(0,255,135,.35)",
  borderRadius: 10,
  padding: 12,
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  justifyContent: "space-around",
  color: "#e5e7eb",
  fontSize: 14
};

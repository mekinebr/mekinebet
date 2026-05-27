const title = {
  color: "#00ff87",
  fontSize: "clamp(26px,3vw,48px)",
  margin: 0,
  fontWeight: 900,
  lineHeight: 1
};

const topBar = {
  background: "linear-gradient(180deg,#07160f,#081018)",
  border: "1px solid #00ff87",
  borderRadius: 10,
  padding: 8,
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 6,
  boxShadow: "0 0 18px rgba(0,255,135,.08)"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  alignItems: "start"
};

const card = {
  background: "linear-gradient(180deg,#07140d,#081018)",
  border: "1px solid rgba(0,255,135,.35)",
  borderRadius: 10,
  padding: 8,
  minHeight: 220,
  boxShadow: "0 0 14px rgba(0,255,135,.07)",
  overflow: "hidden",
  transition: ".25s"
};

const bodyGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 170px",
  gap: 7,
  alignItems: "start"
};

const field = {
  height: 74,
  background:
    "repeating-linear-gradient(90deg,#1f5c2e 0px,#1f5c2e 34px,#216c34 34px,#216c34 68px)",
  border: "2px solid rgba(255,255,255,.18)",
  borderRadius: 8,
  position: "relative",
  overflow: "hidden",
  boxShadow: "inset 0 0 20px rgba(255,255,255,.08)"
};

const scoreBox = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 8,
  padding: 7,
  display: "grid",
  gap: 1,
  fontSize: 13
};

const signalBox = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 8,
  padding: 7,
  display: "grid",
  gap: 2,
  fontSize: 13
};

const bars = {
  display: "grid",
  gap: 2,
  fontSize: 11,
  fontWeight: 900,
  marginTop: 5
};

const momentumBox = {
  marginTop: 5,
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 8,
  padding: 6
};

const dangerBox = {
  display: "none"
};

const footer = {
  display: "flex",
  gap: 5,
  flexWrap: "wrap",
  marginTop: 6,
  justifyContent: "space-between"
};

const betano = {
  background: "#22c55e",
  color: "#fff",
  border: 0,
  borderRadius: 7,
  padding: "7px 12px",
  fontWeight: 900,
  fontSize: 12
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

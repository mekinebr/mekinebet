const filters = {
  display: "grid",
  gridTemplateColumns: "repeat(13, minmax(0, 1fr))",
  gap: 5,
  marginBottom: 6,
  overflow: "hidden"
};

const btnStyle = {
  background: "#08140d",
  color: "#fff",
  border: "1px solid #00ff87",
  padding: "9px 5px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 11,
  whiteSpace: "nowrap",
  textAlign: "center"
};

const activeBtn = {
  ...btnStyle,
  background: "#00ff87",
  color: "#001b0b",
  boxShadow: "0 0 12px rgba(0,255,135,.35)"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: 8,
  alignItems: "start"
};

const card = {
  background: "linear-gradient(180deg,#07140d,#081018)",
  border: "1px solid rgba(0,255,135,.30)",
  borderRadius: 10,
  padding: 7,
  minHeight: 185,
  boxShadow: "0 0 10px rgba(0,255,135,.06)",
  overflow: "hidden",
  transition: ".25s"
};

const topBar = {
  background: "linear-gradient(180deg,#07160f,#081018)",
  border: "1px solid #00ff87",
  borderRadius: 10,
  padding: 6,
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 5,
  boxShadow: "0 0 15px rgba(0,255,135,.06)"
};

const title = {
  color: "#00ff87",
  fontSize: "clamp(22px,2.5vw,42px)",
  margin: 0,
  fontWeight: 900,
  lineHeight: 1
};

const bodyGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 155px",
  gap: 6,
  alignItems: "start"
};

const field = {
  height: 64,
  background:
    "repeating-linear-gradient(90deg,#1f5c2e 0px,#1f5c2e 30px,#216c34 30px,#216c34 60px)",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 7,
  position: "relative",
  overflow: "hidden",
  boxShadow: "inset 0 0 14px rgba(255,255,255,.06)"
};

const scoreBox = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 7,
  padding: 6,
  display: "grid",
  gap: 1,
  fontSize: 12
};

const signalBox = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 7,
  padding: 6,
  display: "grid",
  gap: 1,
  fontSize: 12
};

const statsGrid = {
  marginTop: 4,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 2,
  fontSize: 10,
  color: "#f1f5f9"
};

const bars = {
  display: "grid",
  gap: 1,
  fontSize: 10,
  fontWeight: 900,
  marginTop: 4
};

const momentumBox = {
  marginTop: 4,
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 7,
  padding: 5
};

const footer = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  marginTop: 5,
  justifyContent: "space-between"
};

const betano = {
  background: "#22c55e",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  padding: "6px 10px",
  fontWeight: 900,
  fontSize: 11
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

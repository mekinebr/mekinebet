const title = {
  color: "#00ff87",
  fontSize: "clamp(28px,3.5vw,58px)",
  margin: 0,
  fontWeight: 900,
  lineHeight: 1
};

const topBar = {
  background: "linear-gradient(180deg,#07160f,#081018)",
  border: "1px solid #00ff87",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 8,
  boxShadow: "0 0 25px rgba(0,255,135,.08)"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(400px,1fr))",
  gap: 10,
  alignItems: "start"
};

const card = {
  background: "linear-gradient(180deg,#07140d,#081018)",
  border: "1px solid rgba(0,255,135,.35)",
  borderRadius: 14,
  padding: 10,
  minHeight: 250,
  boxShadow: "0 0 18px rgba(0,255,135,.08)",
  overflow: "hidden",
  transition: ".25s"
};

const bodyGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 190px",
  gap: 8,
  alignItems: "start"
};

const field = {
  height: 82,
  background:
    "repeating-linear-gradient(90deg,#1f5c2e 0px,#1f5c2e 38px,#216c34 38px,#216c34 76px)",
  border: "2px solid rgba(255,255,255,.18)",
  borderRadius: 10,
  position: "relative",
  overflow: "hidden",
  boxShadow: "inset 0 0 25px rgba(255,255,255,.08)"
};

const scoreBox = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 8,
  display: "grid",
  gap: 2,
  fontSize: 14
};

const signalBox = {
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 8,
  display: "grid",
  gap: 3,
  fontSize: 14
};

const bars = {
  display: "grid",
  gap: 3,
  fontSize: 12,
  fontWeight: 900,
  marginTop: 6
};

const momentumBox = {
  marginTop: 6,
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 7
};

const dangerBox = {
  marginTop: 6,
  background: "#09150d",
  border: "1px solid #174f32",
  borderRadius: 10,
  padding: 7
};

const footer = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginTop: 7,
  justifyContent: "space-between"
};

const betano = {
  background: "#22c55e",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: "8px 14px",
  fontWeight: 900,
  fontSize: 13
};

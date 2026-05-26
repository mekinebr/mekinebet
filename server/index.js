async function buscarApiSportsLive() {
  if (!process.env.APISPORTS_KEY) return [];

  try {
    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      {
        headers: {
          "x-apisports-key": process.env.APISPORTS_KEY
        }
      }
    );

    const data = await response.json();

    if (!Array.isArray(data.response)) return [];

    return data.response.map((jogo, index) => {
      const home =
        jogo.teams?.home?.name || "Mandante";

      const away =
        jogo.teams?.away?.name || "Visitante";

      const homeGoals =
        jogo.goals?.home ?? 0;

      const awayGoals =
        jogo.goals?.away ?? 0;

      const minuto =
        jogo.fixture?.status?.elapsed || "LIVE";

      return criarSinalBase({
        id: `apisports-${jogo.fixture?.id || index}`,
        source: "api-sports-live",
        league: jogo.league?.name || "API-SPORTS",
        home,
        away,
        homeGoals,
        awayGoals,
        status: "AO VIVO",
        minute: minuto,
        type: "live"
      });
    });
  } catch (error) {
    console.log("ERRO API-SPORTS:", error.message);
    return [];
  }
}

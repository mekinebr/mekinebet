app.get("/api/signals", async (req, res) => {
  try {

    let sinais = [];

    // =========================
    // API FOOTBALL
    // =========================

    if (process.env.APIFOOTBALL_TOKEN) {

      const hoje = new Date().toISOString().split("T")[0];

      const url =
        `https://apiv3.apifootball.com/?action=get_events` +
        `&from=${hoje}` +
        `&to=${hoje}` +
        `&APIkey=${process.env.APIFOOTBALL_TOKEN}`;

      const response = await fetch(url);
      const jogos = await response.json();

      if (Array.isArray(jogos)) {

        jogos.forEach((jogo, index) => {

          const home = jogo.match_hometeam;
          const away = jogo.match_awayteam;

          const score =
            `${jogo.match_hometeam_score || 0} - ${jogo.match_awayteam_score || 0}`;

          sinais.push({
            id: `real-${index}`,
            league: jogo.league_name,
            match: `${home} vs ${away}`,
            home,
            away,
            score,
            market: "Over 2.5 FT",
            odd: 1.70,
            minute: parseInt(jogo.match_time || 0),
            type: "live",
            category: "over25",
            favorito: home,
            status: "AO VIVO",
            confidence: 82,
            fallback: false,
            ...gerarLinksCasas(home, away)
          });

        });

      }

    }

    // =========================
    // FALLBACK
    // =========================

    if (sinais.length === 0) {
      sinais = criarFallback();
    }

    res.json({
      success: true,
      mode: sinais[0]?.fallback
        ? "fallback-monitoring"
        : "real-live",
      totalGames: sinais.length,
      totalOddsGames: sinais.length,
      liveGames: sinais.length,
      activeSignals: sinais,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
});

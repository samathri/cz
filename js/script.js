document.addEventListener("DOMContentLoaded", () => {
    console.log("Cricket Zone Loaded ✅");

    // === Mobile Menu Toggle ===
    const menuToggle = document.getElementById("cz-menu-toggle");
    const navLinks = document.getElementById("cz-nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

    // === Load Live Matches ===
    async function loadLiveMatches() {
        try {
            const res = await fetch("php/api.php");
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();

            // Adjust depending on your PHP output structure
            const matches = data.rawResponse?.data;

            if (!matches || !Array.isArray(matches) || matches.length === 0) {
                document.getElementById("cz-live-matches").innerHTML = `<p>No live matches at the moment.</p>`;
                return;
            }

            let matchesHTML = "";

            matches.forEach(match => {
                const team1 = match.teams?.[0] || "Team A";
                const team2 = match.teams?.[1] || "Team B";
                const status = match.status || "Unknown";
                const matchName = match.name || `${team1} vs ${team2}`;
                const venue = match.venue || "TBD";
                const matchType = match.matchType || "N/A";
                const dateGMT = match.dateTimeGMT ? new Date(match.dateTimeGMT).toLocaleString() : "TBD";

                // Score display
                let team1Score = "N/A";
                let team2Score = "N/A";

                if (Array.isArray(match.score) && match.score.length >= 2) {
                    const s1 = match.score[0];
                    const s2 = match.score[1];
                    team1Score = `${s1.r}/${s1.w} in ${s1.o} ov`;
                    team2Score = `${s2.r}/${s2.w} in ${s2.o} ov`;
                }

                matchesHTML += `
                    <div class="cz-match-card">
                        <div class="cz-match-header">
                            <span class="cz-tournament">${matchName}</span>
                            <span class="cz-time">${dateGMT}</span>
                            ${status.toLowerCase() === "live" ? `<span class="cz-live-badge">Live</span>` : ""}
                        </div>
                        <div class="cz-team-row">
                            <div class="cz-team-name">${team1}</div>
                            <div class="cz-score">${team1Score}</div>
                        </div>
                        <div class="cz-team-row">
                            <div class="cz-team-name">${team2}</div>
                            <div class="cz-score">${team2Score}</div>
                        </div>
                    </div>
                `;
            });

            document.getElementById("cz-live-matches").innerHTML = matchesHTML;

        } catch (err) {
            console.error("Error fetching matches:", err);
            document.getElementById("cz-live-matches").innerHTML = `<p>Failed to load live matches: ${err.message}</p>`;
        }
    }

    // Load immediately and refresh every 3 seconds
    loadLiveMatches();
    setInterval(loadLiveMatches, 30000);
});

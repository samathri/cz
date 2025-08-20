document.addEventListener("DOMContentLoaded", () => {
    console.log("Cricket Zone Loaded ✅");

    // === Mobile Menu Toggle ===
    const menuToggle = document.getElementById("cz-menu-toggle");
    const navLinks = document.getElementById("cz-nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        // Toggle aria-expanded for accessibility
        const expanded = menuToggle.getAttribute("aria-expanded") === "true" || false;
        menuToggle.setAttribute("aria-expanded", !expanded);
    });

    // === Load Live Matches ===
    async function loadLiveMatches() {
        try {
            const res = await fetch("php/api.php");
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();

            const liveMatches = data.data || [];

            if (liveMatches.length === 0) {
                document.getElementById("cz-live-matches").innerHTML = `<p>No live matches at the moment.</p>`;
                return;
            }

            let matchesHTML = "";

            liveMatches.forEach(match => {
                const team1 = match.teams?.[0] || "Team A";
                const team2 = match.teams?.[1] || "Team B";
                const status = match.status || "Unknown";
                const matchName = match.name || `${team1} vs ${team2}`;
                const dateGMT = match.dateTimeGMT ? new Date(match.dateTimeGMT).toLocaleString() : "TBD";

                // Default scores if not available
                let team1Score = "N/A";
                let team2Score = "N/A";

                // Extract scores if available (assuming match.score array has inning info)
                if (Array.isArray(match.score)) {
                    match.score.forEach(score => {
                        const inning = score.inning?.toLowerCase() || "";
                        if (inning.includes(team1.toLowerCase())) {
                            team1Score = `${score.r}/${score.w} in ${score.o} ov`;
                        } else if (inning.includes(team2.toLowerCase())) {
                            team2Score = `${score.r}/${score.w} in ${score.o} ov`;
                        }
                    });
                }

                matchesHTML += `
<div class="cz-match-card">
    <div class="cz-match-header">
        <span class="cz-tournament">${matchName}</span>
        <div class="cz-time-live-row">
            <span class="cz-time">${dateGMT}</span>
            ${/live/i.test(status) ? `<span class="cz-live-badge" aria-label="Live Match">Live</span>` : ""}
        </div>
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

    loadLiveMatches();
    setInterval(loadLiveMatches, 60000); // refresh every 60 seconds
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("Cricket Zone Loaded ✅");

    // === Mobile Menu Toggle ===
    const menuToggle = document.getElementById("cz-menu-toggle");
    const navLinks = document.getElementById("cz-nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            const expanded = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", !expanded);
        });
    }

    // === Load Live & Upcoming Matches ===
    async function loadMatches() {
        const liveContainer = document.getElementById("cz-live-matches");
        const upcomingContainer = document.getElementById("cz-upcoming-matches");
        if (!liveContainer || !upcomingContainer) return;

        try {
            // Fetch main API data
            const res = await fetch("php/api.php");
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

            const data = await res.json();
            const liveMatches = data.liveMatches || [];
            const upcomingMatchesFromTomorrow = data.upcomingMatches || [];

            // --- Render Live Matches ---
            if (liveMatches.length === 0) {
                liveContainer.innerHTML = `<p>No live matches at the moment.</p>`;
            } else {
                let liveHTML = "";
                liveMatches.forEach(match => {
                    const teams = match.competitors || [];
                    const team1 = teams[0]?.name || "Team A";
                    const team2 = teams[1]?.name || "Team B";
                    const tournament = match.tournament?.name || "Unknown Tournament";
                    const date = match.scheduled ? new Date(match.scheduled).toLocaleString() : "TBD";

                    // Extract live score details — adjust keys if your API uses different names!
                    // Common keys: score (runs), wickets, overs
                    const score1 = teams[0]?.score ?? teams[0]?.runs ?? null;
                    const wickets1 = teams[0]?.wickets ?? null;
                    const overs1 = teams[0]?.overs ?? teams[0]?.over ?? null;

                    const score2 = teams[1]?.score ?? teams[1]?.runs ?? null;
                    const wickets2 = teams[1]?.wickets ?? null;
                    const overs2 = teams[1]?.overs ?? teams[1]?.over ?? null;

                    // Format score string if data available, else fallback to "Live"
                    const team1ScoreDisplay = (score1 !== null && wickets1 !== null && overs1 !== null)
                        ? `${score1}/${wickets1} (${overs1})`
                        : "Live";

                    const team2ScoreDisplay = (score2 !== null && wickets2 !== null && overs2 !== null)
                        ? `${score2}/${wickets2} (${overs2})`
                        : "Live";

                    liveHTML += `
<div class="cz-match-card">
    <div class="cz-match-header">
        <span class="cz-tournament">${tournament}</span>
        <div class="cz-time-live-row">
            <span class="cz-time">${date}</span>
            <span class="cz-live-badge" aria-label="Live Match">Live</span>
        </div>
    </div>
    <div class="cz-team-row">
        <div class="cz-team-name">${team1}</div>
        <div class="cz-score">${team1ScoreDisplay}</div>
    </div>
    <div class="cz-team-row">
        <div class="cz-team-name">${team2}</div>
        <div class="cz-score">${team2ScoreDisplay}</div>
    </div>
</div>
                    `;
                });
                liveContainer.innerHTML = liveHTML;
            }

            // After live matches rendered, generate blog posts
            generateBlogPostsFromLiveMatches(liveMatches);

            // --- Fetch Today's schedule separately ---
            const today = new Date().toISOString().slice(0, 10);
            const todayRes = await fetch(`php/api.php?scheduleDate=${today}`);
            let todayMatches = [];
            if (todayRes.ok) {
                const todayData = await todayRes.json();
                todayMatches = todayData.upcomingMatches || [];
            }

            // --- Filter today's matches about to start (within next 1 minute) ---
            const now = new Date();
            const oneMinuteLater = new Date(now.getTime() + 60 * 1000);

            const upcomingTodayMatches = todayMatches.filter(match => {
                if (!match.scheduled) return false;
                const scheduledTime = new Date(match.scheduled);
                return scheduledTime >= now && scheduledTime <= oneMinuteLater;
            });

            // --- Combine upcoming matches from tomorrow + filtered today matches ---
            const combinedUpcomingMatches = [...upcomingTodayMatches, ...upcomingMatchesFromTomorrow];

            // --- Render Upcoming Matches ---
            if (combinedUpcomingMatches.length === 0) {
                upcomingContainer.innerHTML = `<p>No upcoming matches at the moment.</p>`;
            } else {
                let upcomingHTML = "";
                combinedUpcomingMatches.forEach(match => {
                    const teams = match.competitors || [];
                    const team1 = teams[0]?.name || "Team A";
                    const team2 = teams[1]?.name || "Team B";
                    const tournament = match.tournament?.name || "Unknown Tournament";
                    const date = match.scheduled ? new Date(match.scheduled).toLocaleString() : "TBD";

                    upcomingHTML += `
<div class="cz-match-card">
    <div class="cz-match-header">
        <span class="cz-tournament">${tournament}</span>
        <div class="cz-time-live-row">
            <span class="cz-time">${date}</span>
        </div>
    </div>
    <div class="cz-team-row">
        <div class="cz-team-name">${team1}</div>
        <div class="cz-score">-</div>
    </div>
    <div class="cz-team-row">
        <div class="cz-team-name">${team2}</div>
        <div class="cz-score">-</div>
    </div>
</div>
                    `;
                });
                upcomingContainer.innerHTML = upcomingHTML;
            }

        } catch (err) {
            console.error("Error fetching matches:", err);
            liveContainer.innerHTML = `<p>Failed to load live matches: ${err.message}</p>`;
            upcomingContainer.innerHTML = `<p>Failed to load upcoming matches: ${err.message}</p>`;
        }
    }

    loadMatches();
    setInterval(loadMatches, 60000); // refresh every 60 seconds

    // === Load Hero Highlight ===
    async function loadHeroHighlight() {
        const highlightTournament = document.getElementById("cz-highlight-tournament");
        const highlightTime = document.getElementById("cz-highlight-time");
        const team1El = document.getElementById("cz-highlight-team1");
        const team2El = document.getElementById("cz-highlight-team2");
        const highlightStatus = document.getElementById("cz-highlight-status");

        if (!highlightTournament || !highlightTime || !team1El || !team2El || !highlightStatus) return;

        try {
            const res = await fetch("php/api.php");
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

            const data = await res.json();

            const upcomingMatches = data.upcomingMatches || [];
            if (upcomingMatches.length === 0) {
                highlightTournament.textContent = "No upcoming match";
                highlightStatus.textContent = "Stay tuned for match updates.";
                highlightTime.textContent = "";
                team1El.textContent = "";
                team2El.textContent = "";
                return;
            }

            // Get the earliest match
            const earliest = upcomingMatches.sort((a, b) => new Date(a.scheduled) - new Date(b.scheduled))[0];
            const teams = earliest.competitors || [];
            const team1 = teams[0]?.name || "Team A";
            const team2 = teams[1]?.name || "Team B";
            const tournament = earliest.tournament?.name || "Upcoming Tournament";

            const scheduledTime = new Date(earliest.scheduled);
            const now = new Date();
            const timeDiff = Math.max(0, scheduledTime - now);

            // Format time remaining
            const minutes = Math.floor(timeDiff / (1000 * 60)) % 60;
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));

            const timeString = timeDiff > 0
                ? `Starts in: ${hours > 0 ? `${hours}h ` : ""}${minutes}m`
                : "Starting soon!";

            // Update DOM
            highlightTournament.textContent = tournament;
            team1El.textContent = team1;
            team2El.textContent = team2;
            highlightTime.textContent = timeString;
            highlightStatus.textContent = `🏏 Live at ${scheduledTime.toLocaleTimeString()}`;
        } catch (err) {
            console.error("Error loading hero match highlight:", err);
            highlightTournament.textContent = "Error";
            highlightStatus.textContent = "Could not load match highlight.";
            highlightTime.textContent = "";
            team1El.textContent = "";
            team2El.textContent = "";
        }
    }

    loadHeroHighlight();
    setInterval(loadHeroHighlight, 120000); // refresh every 2 minutes
});

// Blog posts function (unchanged)
function generateBlogPostsFromLiveMatches(liveMatches) {
    const blogContainer = document.getElementById("cz-blog-posts");
    if (!blogContainer) return;

    if (liveMatches.length === 0) {
        blogContainer.innerHTML = `<p>No live matches currently, so no posts yet.</p>`;
        return;
    }

    // Sort matches so the latest scheduled match comes first
    liveMatches.sort((a, b) => new Date(b.scheduled) - new Date(a.scheduled));

    // Utilities
    const slugify = str => str.toLowerCase().replace(/\s+/g, '-');

    // Templates
    const introTemplates = [
        (team1, team2, tournament) => `${team1} and ${team2} clash in the thrilling ${tournament}.`,
        (team1, team2, tournament) => `Match underway between ${team1} and ${team2} in the ${tournament}.`,
        (team1, team2, tournament) => `${tournament} sees a live contest between ${team1} and ${team2}.`,
        (team1, team2, tournament) => `${team1} take on ${team2} today in the ongoing ${tournament}.`
    ];

    const tossTemplates = [
        (winner, decision) => `${winner} won the toss and decided to ${decision}.`,
        (winner, decision) => `The toss went to ${winner}, who opted to ${decision}.`,
        (winner, decision) => `${winner} chose to ${decision} after winning the toss.`
    ];

    const oddsTemplates = [
        (team1, team2, odds1, odds2) => `Current odds favor ${team1} with ${odds1}x, while ${team2} stands at ${odds2}x.`,
        (team1, team2, odds1, odds2) => `Betting odds: ${team1} at ${odds1}x and ${team2} at ${odds2}x.`,
        (team1, team2, odds1, odds2) => `With odds of ${odds1}x, ${team1} is slightly ahead of ${team2} at ${odds2}x.`
    ];

    let postsHTML = '';

    liveMatches.forEach(match => {
        const teams = match.competitors || [];
        const team1 = teams[0]?.name || "Team A";
        const team2 = teams[1]?.name || "Team B";
        const tournament = match.tournament?.name || "Cricket Tournament";
        const date = match.scheduled ? new Date(match.scheduled).toLocaleString() : "Today";

        // Simulated toss and odds
        const tossWinner = Math.random() > 0.5 ? team1 : team2;
        const tossDecision = Math.random() > 0.5 ? "bat" : "field";
        const oddsTeam1 = (Math.random() * (2 - 1.5) + 1.5).toFixed(2);
        const oddsTeam2 = (Math.random() * (2.5 - 1.8) + 1.8).toFixed(2);

        // Generated content
        const intro = introTemplates[Math.floor(Math.random() * introTemplates.length)](team1, team2, tournament);
        const toss = tossTemplates[Math.floor(Math.random() * tossTemplates.length)](tossWinner, tossDecision);
        const odds = oddsTemplates[Math.floor(Math.random() * oddsTemplates.length)](team1, team2, oddsTeam1, oddsTeam2);

        // Generate image filename
        const imageFile = `images/matches/${slugify(team1)}-vs-${slugify(team2)}.jpg`;

        // Unique match ID
        const matchId = match.id || `${slugify(team1)}-vs-${slugify(team2)}-${Date.now()}`;

        // Store match blog content
        const blogData = {
            team1,
            team2,
            tournament,
            date,
            intro,
            toss,
            odds,
            imageFile
        };

        localStorage.setItem(`match_${matchId}`, JSON.stringify(blogData));

        // Generate blog preview card
        postsHTML += `
            <a href="blog-detail.html?id=${encodeURIComponent(matchId)}" target="_blank" style="text-decoration: none; color: inherit;">
                <article class="cz-post-card" role="article">
                    <h3>${team1} vs ${team2} - ${tournament}</h3>
                    <time datetime="${match.scheduled}">${date}</time>
                    <p>${intro} ${toss} ${odds}</p>
                </article>
            </a>
        `;
    });

    blogContainer.innerHTML = postsHTML;
}

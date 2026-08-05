import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function run() {
  const token = process.env.VITE_GITHUB_TOKEN;
  const username = process.env.VITE_GITHUB_USERNAME || "saad-ibra";

  if (!token) {
    console.log("No VITE_GITHUB_TOKEN found in .env.local. Fetching only public repos.");
  } else {
    console.log("Found VITE_GITHUB_TOKEN. Fetching public and private repos.");
  }

  try {
    const headers = { Accept: "application/vnd.github.v3+json" };
    let url;
    if (token) {
      url = "https://api.github.com/user/repos?per_page=100&type=owner&sort=updated";
      headers.Authorization = `token ${token}`;
    } else {
      url = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
    const data = await res.json();

    const mapped = data
      .filter(r => r.name.toLowerCase() !== username.toLowerCase())
      .map(r => r.private
        ? { name: r.name, isPrivate: true }
        : { 
            name: r.name, 
            description: r.description || "", 
            language: r.language || null, 
            stars: r.stargazers_count || 0, 
            url: r.html_url, 
            isPrivate: false 
          }
      );

    mapped.sort((a, b) => {
      if (a.isPrivate !== b.isPrivate) return a.isPrivate ? 1 : -1;
      return (b.stars || 0) - (a.stars || 0);
    });
    
    const stats = { 
      public: mapped.filter(r => !r.isPrivate).length, 
      private: mapped.filter(r => r.isPrivate).length 
    };

    let commitStats = null;
    let ekgData = [];
    
    if (token) {
      const currentYear = new Date().getFullYear();
      const yearQueries = Array.from({ length: 5 }).map((_, i) => {
        const year = currentYear - i;
        return `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") { 
          contributionCalendar { 
            totalContributions 
            weeks { contributionDays { contributionCount date } } 
          } 
        }`;
      });

      const q = `{ user(login: "${username}") { ${yearQueries.join("\n")} } }`;
      const gqlRes = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({ query: q })
      });
      
      if (gqlRes.ok) {
        const gqlData = await gqlRes.json();
        
        // EKG Data (last 64 days)
        const collections = gqlData.data.user;
        const yearsDataRaw = Object.keys(collections)
          .sort().reverse()
          .map(k => collections[k].contributionCalendar);
        
        let recentDays = [];
        for (const yd of yearsDataRaw) {
          if (!yd) continue;
          for (let i = yd.weeks.length - 1; i >= 0; i--) {
            for (let j = yd.weeks[i].contributionDays.length - 1; j >= 0; j--) {
              recentDays.push(yd.weeks[i].contributionDays[j].contributionCount);
              if (recentDays.length >= 64) break;
            }
            if (recentDays.length >= 64) break;
          }
          if (recentDays.length >= 64) break;
        }
        ekgData = recentDays.reverse();
        
        // CommitStats Data
        const yearsData = [];
        let maxMonth = { year: null, monthIndex: -1, commits: 0 };

        for (let i = 0; i < 5; i++) {
          const year = currentYear - i;
          const calendar = collections[`y${year}`]?.contributionCalendar;
          if (!calendar) continue;

          const monthlyTotals = new Array(12).fill(0);
          calendar.weeks.forEach(week => {
            week.contributionDays.forEach(day => {
              const monthIndex = parseInt(day.date.split("-")[1], 10) - 1;
              monthlyTotals[monthIndex] += day.contributionCount;
            });
          });

          monthlyTotals.forEach((total, monthIndex) => {
            if (total > maxMonth.commits) {
              maxMonth = { year, monthIndex, commits: total };
            }
          });

          yearsData.push({ year, total: calendar.totalContributions, months: monthlyTotals });
        }
        
        commitStats = { years: yearsData, maxMonth };
      }
    }

    const finalData = {
      repos: mapped,
      stats: stats,
      ekg: ekgData,
      commitStats: commitStats
    };

    fs.writeFileSync('./public/github.json', JSON.stringify(finalData, null, 2));
    console.log("Done fetching to public/github.json");

  } catch (err) {
    console.error("Error fetching GitHub data:", err);
  }
}

run();

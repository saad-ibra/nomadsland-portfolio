export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME || "saad-ibra";

  if (!token) {
    return Response.json({ error: "No GitHub token provided" }, { status: 400 });
  }

  const currentYear = new Date().getFullYear();
  
  // Build a query for the last 5 years using GraphQL aliases
  const yearQueries = Array.from({ length: 5 }).map((_, i) => {
    const year = currentYear - i;
    return `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") { 
      contributionCalendar { 
        totalContributions 
        weeks { contributionDays { contributionCount date } } 
      } 
    }`;
  }).join("\n");

  const query = `
    query {
      user(login: "${username}") {
        ${yearQueries}
      }
    }
  `;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`GitHub GraphQL API returned ${res.status}: ${res.statusText}`);
    }

    const { data, errors } = await res.json();
    if (errors) {
      console.error("[GitHub GraphQL API Errors]", errors);
      throw new Error(errors[0].message);
    }

    const collections = data.user;
    const yearsData = [];
    let maxMonth = { year: null, monthIndex: -1, commits: 0 };

    // Process each year
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const calendar = collections[`y${year}`]?.contributionCalendar;
      if (!calendar) continue;

      const monthlyTotals = new Array(12).fill(0);
      
      // Aggregate days into months
      calendar.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          // date format: YYYY-MM-DD
          const monthIndex = parseInt(day.date.split("-")[1], 10) - 1;
          monthlyTotals[monthIndex] += day.contributionCount;
        });
      });

      // Check max month
      monthlyTotals.forEach((total, monthIndex) => {
        if (total > maxMonth.commits) {
          maxMonth = { year, monthIndex, commits: total };
        }
      });

      yearsData.push({
        year,
        total: calendar.totalContributions,
        months: monthlyTotals,
      });
    }

    return Response.json({
      years: yearsData,
      maxMonth
    });

  } catch (error) {
    console.error("[GitHub API] Error:", error);
    return Response.json({ error: "Failed to fetch GitHub contributions" }, { status: 500 });
  }
}

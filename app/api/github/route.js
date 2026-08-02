export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME || "saad-ibra";

  let url = `https://api.github.com/users/${username}/repos?per_page=100`;
  const headers = {
    Accept: "application/vnd.github.v3+json",
  };

  // If token is provided, fetch authenticated user's repos (allows private repos)
  if (token) {
    url = "https://api.github.com/user/repos?per_page=100&type=owner";
    headers.Authorization = `token ${token}`;
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
    });

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    const repos = data.map((repo) => {
      const isPrivate = repo.private;
      if (isPrivate) {
        return {
          name: repo.name,
          description: null,
          language: null,
          stars: 0,
          url: null,
          isPrivate: true,
        };
      } else {
        return {
          name: repo.name,
          description: repo.description || "",
          language: repo.language || null,
          stars: repo.stargazers_count || 0,
          url: repo.html_url,
          isPrivate: false,
        };
      }
    });

    // Sort: Public repos with stars first, then public without stars, then private repos
    repos.sort((a, b) => {
      if (a.isPrivate !== b.isPrivate) {
        return a.isPrivate ? 1 : -1; // Public first
      }
      return b.stars - a.stars; // Highest stars first
    });

    return Response.json(repos);
  } catch (error) {
    console.error("[GitHub API] Error:", error);
    return Response.json({ error: "Failed to fetch GitHub data" }, { status: 500 });
  }
}

import Parser from 'rss-parser';

// ============================================================================
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL GOODREADS USER ID!
// You can find this in the URL of your Goodreads profile.
// Example: "12345678-saad" or "12345678"
const GOODREADS_USER_ID = "198640001-saad-ibra";
// ============================================================================

const SHELF_CONFIG = [
  { id: "all", label: "All", slug: "all", type: "normal" },
  { id: "want-to-read", label: "Want to Read", slug: "to-read", type: "psychic" },
  { id: "currently-reading", label: "Currently Reading", slug: "currently-reading", type: "fire" },
  { id: "read", label: "Read", slug: "read", type: "grass" },
  { id: "did-not-finish", label: "Did Not Finish", slug: "did-not-finish", type: "poison" },
];

// Configure rss-parser to map Goodreads custom XML fields
const parser = new Parser({
  customFields: {
    item: [
      ['book_large_image_url', 'coverUrl'],
      ['author_name', 'author'],
    ],
  },
});

export async function GET() {
  if (GOODREADS_USER_ID === "YOUR_GOODREADS_USER_ID_HERE") {
    console.warn("Goodreads User ID is missing! Returning empty shelves.");
    return Response.json(
      SHELF_CONFIG.map(shelf => ({
        id: shelf.id,
        label: shelf.label,
        type: shelf.type,
        count: 0,
        books: []
      }))
    );
  }

  try {
    const fetchPromises = SHELF_CONFIG.map(async (shelf) => {
      const url = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=${shelf.slug}`;
      
      try {
        // Use Next.js fetch cache to only hit Goodreads once an hour (3600s)
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) {
          throw new Error(`Failed to fetch ${shelf.slug}: ${res.status} ${res.statusText}`);
        }
        
        const xml = await res.text();
        const feed = await parser.parseString(xml);
        
        const books = feed.items.map(item => ({
          title: item.title || "Unknown Title",
          author: item.author || "Unknown Author",
          // The CDATA wrap can sometimes leave whitespace/newlines, so we trim it
          coverUrl: item.coverUrl ? item.coverUrl.trim() : null,
          link: item.link || "",
        }));

        return {
          id: shelf.id,
          label: shelf.label,
          type: shelf.type,
          count: books.length,
          books,
        };
      } catch (err) {
        console.warn(`[Goodreads API] Error fetching shelf ${shelf.slug}:`, err);
        // Fail gracefully for this specific shelf
        return {
          id: shelf.id,
          label: shelf.label,
          type: shelf.type,
          count: 0,
          books: [],
        };
      }
    });

    const shelvesData = await Promise.all(fetchPromises);
    return Response.json(shelvesData);
  } catch (error) {
    console.error("[Goodreads API] Fatal Error:", error);
    return Response.json({ error: "Failed to fetch Goodreads data" }, { status: 500 });
  }
}

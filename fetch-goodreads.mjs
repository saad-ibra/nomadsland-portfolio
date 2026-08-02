import Parser from 'rss-parser';
import fs from 'fs';

const GOODREADS_USER_ID = "198640001-saad-ibra";
const SHELF_CONFIG = [
  { id: "all", label: "All", slug: "all", type: "normal" },
  { id: "want-to-read", label: "Want to Read", slug: "to-read", type: "psychic" },
  { id: "currently-reading", label: "Currently Reading", slug: "currently-reading", type: "fire" },
  { id: "read", label: "Read", slug: "read", type: "grass" },
  { id: "did-not-finish", label: "Did Not Finish", slug: "did-not-finish", type: "poison" },
];

const parser = new Parser({
  customFields: {
    item: [
      ['book_large_image_url', 'coverUrl'],
      ['author_name', 'author'],
    ],
  },
});

async function run() {
  const fetchPromises = SHELF_CONFIG.map(async (shelf) => {
    const url = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=${shelf.slug}`;
    try {
      const res = await fetch(url);
      const xml = await res.text();
      const feed = await parser.parseString(xml);
      const books = feed.items.map(item => ({
        title: item.title || "Unknown Title",
        author: item.author || "Unknown Author",
        coverUrl: item.coverUrl ? item.coverUrl.trim() : null,
        link: item.link || "",
      }));
      return { id: shelf.id, label: shelf.label, type: shelf.type, count: books.length, books };
    } catch (err) {
      console.error(err);
      return { id: shelf.id, label: shelf.label, type: shelf.type, count: 0, books: [] };
    }
  });

  const shelvesData = await Promise.all(fetchPromises);
  fs.writeFileSync('./public/goodreads.json', JSON.stringify(shelvesData, null, 2));
  console.log("Done fetching to public/goodreads.json");
}

run();

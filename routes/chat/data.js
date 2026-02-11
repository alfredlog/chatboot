const fs = require('fs');
const {PDFParse} = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');
const {pipeline} = require("@xenova/transformers");
const {Chunk, Document} = require('../../source/db');
const {Sequelize} = require('sequelize');


function toVector(arr) {
  if (!Array.isArray(arr)) throw new Error("Invalid embedding");
  return `[${arr.map(Number).join(",")}]`;
}

async function loadPDF(url) {
  const res = new PDFParse({url, method: 'GET', responseType: 'arraybuffer', timeout: 10000});

  const data = await res.getText();
  return data.text;
}


async function loadWebsite(url) {
  const { data } = await axios.get(url, { timeout: 10000 });
  const $ = cheerio.load(data);
  const elements = []
  $("a").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href");
    if (text && href) {
      elements.push({
        type : "link",
        text,
        href,
        context : "page",
        url: url
      });
    }
  });
  $("button").each((_, el) => {
    const textb = $(el).text().trim();
    if (text) {
      elements.push({
        type : "button",
        text : textb,
        context : "page",
        url: url
      });
    }
  });

  const text = $("main, article, p, h1, h2, h3")
    .map((_, el) => $(el).text())
    .get()
    .join("\n");

  return { text, elements };
}


function chunkText(text, maxLength = 800) {
  const paragraphs = text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";

  for (const p of paragraphs) {
    if ((current + p).length > maxLength) {
      chunks.push(current);
      current = p;
    } else {
      current += " " + p;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}


let embedder;

async function initEmbedder() {
  embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );
}

async function embed(text) {
  if (!embedder) throw new Error("Embedder not initialized");

  const output = await embedder(text, {
    pooling: "mean",
    normalize: true
  });

  return Array.from(output.data);
}

async function findBestChunksFromDB(questionEmbedding, topK = 3, firmaId) {
  const results = await Chunk.findAll({
  where: {
    firma_id: firmaId
  },
  attributes: ["content","source_ref"],
  order: [
    Sequelize.literal(
      `embedding <=> '${toVector(questionEmbedding)}'`
    )
  ],
  limit: topK
});
  return results;
}


module.exports = {
  loadPDF,
  loadWebsite,
  chunkText,
  embed,
  findBestChunksFromDB,
  initEmbedder,
};

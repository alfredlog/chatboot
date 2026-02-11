const {Chunk, Document, Actions} = require('../../source/db');
const {embed, chunkText, loadPDF, loadWebsite} = require('../chat/data');
const { OpenAI } = require("openai");

function toVector(arr) {
  if (!Array.isArray(arr)) throw new Error("Invalid embedding");
  return `[${arr.map(Number).join(",")}]`;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function ingestFirmaData(firmaId, pdfs, websites) {
  try {
    // PDFs
    for (pdfUrl of pdfs) {
      const document = await Document.create({
        firma_id: firmaId,
        source_type: "pdf",
        title: pdfUrl[0].split(".pdf")[0],
        source_ref: pdfUrl[1]
      });

      const text = await loadPDF(pdfUrl[1]);
      const chunks = chunkText(text);

      for (const chunk of chunks) {
        const embedding = await embed(chunk);
        await Chunk.create({
          document_id: document.id,
          firma_id: firmaId,
          content: chunk,
          embedding : toVector(embedding),
          source_ref: pdfUrl[1]
        });
      }
    }

    // Websites
    for (const url of websites) {
      const document = await Document.create({
        firma_id: firmaId,
        title: url.split("/").pop().replace(".html", "").replace("www.", "").replace(".de", "").replace(".com", ""),
        source_type: "website",
        source_ref: url
      });

      const { text, elements } = await loadWebsite(url);
      const chunks = chunkText(text);
      for (const chunk of chunks) {
        const embedding = await embed(chunk);
        await Chunk.create({
          document_id: document.id,
          firma_id: firmaId,
          content: chunk,
          embedding : toVector(embedding),
          source_ref: url
        });
      }
      // Extract actions using OpenAI
      const actionsJSON = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      max_output_tokens: 20000,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Du bist ein UX- und Kundenservice-Experte. Deine Aufgabe ist es, aus Website-Elementen konkrete Kunden-Aktionen zu erkennen. Erfinde keine Informationen. Nutze nur die gegebenen Daten."
            }
          ]
        },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Hier ist eine Liste von Website-Elementen im JSON-Format.
                   Erkenne daraus sinnvolle Kunden-Aktionen. Für jede Aktion gib zurück:

                   - intent (snake_case)
                   - title (kurz & klar)
                   - description
                   - url (zielseite der Aktion)
                   - confidence (0–1)

                  Gib NUR valides JSON zurück.
                  Ignoriere irrelevante oder rechtliche Links.

      Website-Elemente:
      ${JSON.stringify(elements)}`
          }
           ]
         }
        ]
      });
      console.log("Extracted actions JSON:", actionsJSON);
      const actionsData = JSON.parse(actionsJSON.output_text);
      for (const action of actionsData) {
        if (action.confidence >= 0.8) {
          await Actions.create({
            firma_id: firmaId,
            intent: action.intent,
            title: action.title,
            description: action.description,
            url: action.url,
            confidence: action.confidence
          });
        }
      }
    }

    console.log("Ingestion finished for firma", firmaId);
  } catch (err) {
    console.error("Ingestion error:", err);
    throw err;
  }
}

module.exports = { ingestFirmaData };

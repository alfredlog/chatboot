const { Firma, Actions } = require("../../source/db");
const { OpenAI } = require("openai");
require("dotenv").config();
const data = require("./data");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const askCustomer = (app) => {
    app.post("/:firmaName/kundenservice", async (req, res) => {
    try {
        const question = req.body.question;
        const chatverlauf = req.body.chatverlauf || [];
        if (!question) {
            return res.status(400).json({ error: "Question is missing" });
        }
        const ver = chatverlauf ?? [];
        ver.push({ role: "user", content: question, timestamp: new Date() });
        const firma = await Firma.findOne({
            where: {
                linkName: req.params.firmaName
            }
        });
        if (!firma) {
            return res.status(404).json({ error: "we couldn't find the company" });
        }
        const questionEmbedding = await data.embed(question);
        let contextChunks = await data.findBestChunksFromDB(questionEmbedding, 3, firma.id)
        let sourceRefs = contextChunks.map((chunk) => chunk.source_ref);
        contextChunks = contextChunks.map((chunk) => chunk.content);
        const actions = await Actions.findAll({ where: { firma_id: firma.id } });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Du bist ein freundlicher Kundenservice-Assistent bei ${firma.name}. Beantworte die Fragen der Kunden basierend auf dem bereitgestellten Kontext und Actions.
                    wenn der Kunde nach Aktionen fragt, nutze die Actions-Datenbank, um passende Aktionen vorzuschlagen.
                    Nutze die folgenden Regeln:
                    - Antworte nur basierend auf dem bereitgestellten Kontext und den Actions.
                    - Füge relevante Aktionen aus der Actions-Datenbank hinzu, wenn der Kunde danach fragt.
                    - Nutze die Actions nur, wenn sie relevant für die Frage des Kunden sind.
                    - Präsentiere Aktionen klar und deutlich.
                    - wenn du mehrere Aktionen vorschlägst, nummeriere sie.
                    - und gebe den Link zur Aktion an.
                    - wenn ein Schritt für die Action klar ist, füge ihn hinzu.
                    - Erfinde keine Informationen.
                    - wenn die Informationen im Kontext nicht ausreichen, um die Frage zu beantworten, sage höflich, dass du nicht helfen kannst.
                     Sei immer höflich, hilfsbereit,professionell und kurz.`,
                },
                ...chatverlauf.slice(-6) || [],
                {
                    role: "system",
                    content: `
          KONTEXT:
          ${contextChunks.join("\n---\n")}, ACTIONS:
          ${JSON.stringify(actions)}
         `,
                },
                {
                    role: "user",
                    content: question,
                },
            ],
            temperature: 0.3,
        });
        const answer = completion.choices[0].message.content;
        consol.log(answer)
        ver.push({ role: "assistant", content: answer, timestamp: new Date() });
        res.json({
            answer: answer, schatverlauf: ver,
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});}

module.exports = askCustomer;
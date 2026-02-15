const { Customer, Firma, Actions } = require("../source/db");
const { OpenAI } = require("openai");
require("dotenv").config();
const data = require("./chat/data");
const { Where } = require("sequelize/lib/utils");
const jwt = require("jsonwebtoken");
const authCu = require("./authCu");



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const createCustomer = (app) => {
  app.post("/:firmaName/customer", async (req, res) => {
    try {
      const { name, email, chatverlauf } = req.body;
      const customer = await Customer.create({
        name,
        email,
        firmaName: req.params.firmaName,
        chatverlauf
      });
      res.status(201).json(customer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: " Internal server error" });
    }
  });
};
const loginCustomer = (app) => {
  app.post("/:firmaName/login-customer", async (req, res) => {
    try {
      const { email } = req.body;
      const customer = await Customer.findOne({ where: { email, firmaName: req.params.firmaName } });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRETC, { expiresIn: '1h' });
      res.status(200).json({ customer, token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: " Internal server error" });
    }
  });
};

const askCustomer = (app) => {
    app.post("/:firmaName/kundenservice/:customerId", authCu, async (req, res) => {
    try {
        const question = req.body.question;
        if (!question) {
            return res.status(400).json({ error: "Question is missing" });
        }
        const customer = await Customer.findByPk(req.params.customerId);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        const ver = customer.chatverlauf ?? [];
        ver.push({ role: "user", content: question, timestamp: new Date() });
        const firma = await Firma.findOne({
            where: {
                linkName: req.params.firmaName
            }
        });
        if (!customer || !firma) {
            return res.status(404).json({ error: "we couldn't find the customer or company" });
        }
        const questionEmbedding = await data.embed(question);
        let contextChunks = await data.findBestChunksFromDB(questionEmbedding, 3, firma.id)
        let sourceRefs = contextChunks.map((chunk) => chunk.source_ref);
        contextChunks = contextChunks.map((chunk) => chunk.content);
        const actions = await Actions.findAll({ where: { firma_id: firma.id } });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "customer_answer",
                schema: {
                  type: "object",
                  properties: {
                  text: { type: "string" },
                  sprach: { type: "string" }
             },
             required: ["text", "sprach"]
                }
              }
            },
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
                    -Sei immer höflich, hilfsbereit,professionell und kurz.
                    - Trenne Schritte mit <b>Schritt X:</b>
                    - Nutze <p>-Tags statt Markdown
                    - Verwende keine [] oder ()
                    -gebe immer die sprach auf der du antwortet in BCP-47 Sprachcode z.B. de-DE, en-US, fr-FR
                   `, 
                },
                ...customer.chatverlauf.slice(-6),
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
        ver.push({ role: "assistant", content: answer, timestamp: new Date() });
        await Customer.update({
            chatverlauf: ver
        }, { where: { id: req.params.customerId } });
        res.json({
            answer: parsed.text, sprach: parsed.sprach, sourceRefs: sourceRefs
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});}

module.exports = { createCustomer, askCustomer, loginCustomer};




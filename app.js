const express = require('express');
const app = express();
const cors = require('cors');
const data = require('./routes/chat/data');
require("dotenv")

const port = process.env.PORT || 2005;


app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());
app.use("/webhook", express.raw({ type: "application/json" }));
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get("/", (req, res)=>{
  res.send("wellcome")
})

require("./source/db").dbSync();

data.initEmbedder();

const chatRoutes = require('./routes/chat/chat');
chatRoutes(app);
app.get("/health", (req, res) => res.send("ok"));
const {createFirma, loginFirma, findAllCustomers, findAllDocuments, deleteDocument, AddDocument, subscribeCancel, firmaSubscription, findOneFirma }= require('./routes/firma');
createFirma(app);
loginFirma(app);
findAllCustomers(app);
findAllDocuments(app);
deleteDocument(app);
findOneFirma(app);
firmaSubscription(app);
subscribeCancel(app);
AddDocument(app);
require('./routes/webhook')(app);
const {createCustomer, askCustomer, loginCustomer} = require('./routes/customer');
createCustomer(app);
askCustomer(app);
loginCustomer(app);


// Start the server


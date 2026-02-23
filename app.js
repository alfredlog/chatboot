const express = require('express');
const app = express();
const cors = require('cors');
const data = require('./routes/chat/data');
require("dotenv")

const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middleware to parse JSON bodies

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
require('./routes/webhook')(app);
app.use(express.json());
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("wellcome")
})

require("./source/db").dbSync();

data.initEmbedder();

const chatRoutes = require('./routes/chat/chat');
chatRoutes(app);
const {createFirma, loginFirma, findAllCustomers, findAllDocuments, deleteDocument, AddDocument, subscribeCancel, firmaSubscription, findOneFirma,refreshToken, logoutFirma  }= require('./routes/firma');
createFirma(app);
loginFirma(app);
findAllCustomers(app);
findAllDocuments(app);
deleteDocument(app);
refreshToken(app);
findOneFirma(app);
firmaSubscription(app);
subscribeCancel(app);
AddDocument(app);
logoutFirma(app);

const {createCustomer, askCustomer, loginCustomer} = require('./routes/customer');
createCustomer(app);
askCustomer(app);
loginCustomer(app);


// Start the server


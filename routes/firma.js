const {Firma, Customer, Document} = require("../source/db");
const bcrypt = require("bcrypt");
const { S3Client, PutObjectCommand, DeleteObjectCommand} = require("@aws-sdk/client-s3");
const multer = require("multer");
const {slugify} = require("./methode")
require("dotenv").config();
const auth = require("./auth");
const jwt = require("jsonwebtoken");
const {ValidationError, UniqueConstraintError} = require("sequelize");
const { ingestFirmaData } = require("../routes/ingestData/ingestFirmaData");
const stripe = require('stripe')(process.env.PRIVATE_KEY);

const upload = multer()

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  },
  
});

const createFirma = (app) => {
  app.post("/create-firma", upload.array("pdfs"), async (req, res) => {
    try {
      const { name, address, password, email,  webseites } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      let key = '';
      let pdfs = new Map();
      let webs = new Array();
      for (let url of JSON.parse(webseites)) {
        webs.push(url);
      }
      for (let datei of req.files) {
        key = `pdfs/${Date.now()}-${datei.originalname}`;
        const uploadParams = {
          Bucket: bucketName,
          Key: key,
          Body: datei.buffer,
          ContentType: datei.mimetype,
          ACL: 'public-read'
        };
        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);
        pdfs.set(datei.originalname, `https://${bucketName}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`);
      }
      console.log("Hochgeladene PDF-URLs:", pdfs);
      let ps = new Array();
      pdfs.forEach((e)=>{
        ps.push(e)
      })
      for(p of pdfs){
        console.log(p[1])
      }
      const firma = await Firma.create({
        name,
        linkName: slugify(name),
        address,
        password: hashedPassword,
        email,
        pdfs : ps,
        webseites : webs
      });
      ingestFirmaData(firma.id, pdfs, webs)
       .catch(err => {
        console.error("Ingestion failed:", err);
      });
      res.status(201).json({firma, status: "INGESTION_STARTED", token});
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
      }
      if (error instanceof UniqueConstraintError) {
        return res.status(409).json({ error: "Firma already exists" });
      }
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
};
const loginFirma = (app) => {
  app.post("/login-firma", async (req, res) => {
    try {
      const { email, password } = req.body;
      const firma = await Firma.findOne({ where: { email } });
      if (!firma) {
        return res.status(404).json({ error: "Firma not found" });
      }
      const isPasswordValid = await bcrypt.compare(password, firma.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
      const token = jwt.sign({ id: firma.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      const refreshToken = jwt.sign({ id: firma.id }, process.env.JWT_SECRETF, { expiresIn: "7d" });
      await firma.update({ refreshToken });
      res.status(200).json({ token, firma, refreshToken });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}
const findAllCustomers = (app) => {
  app.get("/:firmaLinkName/customers", auth, async (req, res) => {
    try {
      const { firmaLinkName } = req.params;
      const firma  = await Firma.findOne({where:{linkName : firmaLinkName}})
      const customers = await Customer.findAll({ where: { firmaName: firmaLinkName }, order: [['UpdatedAt', 'DESC']] });
      res.status(200).json({ customers});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
};
const findOneFirma = (app) => {
  app.get("/:firmaLinkName", async (req, res) => {
    try {
      const { firmaLinkName } = req.params;
      const firma = await Firma.findOne({ where: { linkName: firmaLinkName } });
      if (!firma) {
        return res.status(404).json({ error: "Firma not found" });
      }
      res.status(200).json(firma );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}
const findOneCustomer = (app) => {
  app.get("/:firmaLinkName/customers/:id", auth, async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(200).json({ customer });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}
const findAllDocuments = (app) => {
  app.get("/:firmaLinkName/documents", auth, async (req, res) => {
    try {
      const { firmaLinkName } = req.params;
      const firma = await Firma.findOne({ where: { linkName: firmaLinkName } });
      if (!firma) {
        return res.status(404).json({ error: "Firma not found" });
      }
      const documents = await Document.findAll({ where: { firma_id: firma.id }, order: [['UpdatedAt', 'DESC']] });
      res.status(200).json({ documents});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}
const deleteDocument = (app) => {
  app.delete("/:firmaLinkName/documents/:id", auth, async (req, res) => {
    try {
      const { id, firmaLinkName } = req.params;
      const firma = Firma.findOne({where: {linkName : firmaLinkName}})
      const document = await Document.findByPk(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      await document.destroy();
      let key = document.source_ref.split("/");
      key = key[key.length -1];
      const deleteParams = {
        Bucket: bucketName,
        Key: key
      };
      const command = new DeleteObjectCommand(deleteParams);
      await s3.send(command);
      res.status(200).json({ message: "Document deleted successfully"});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
};

const AddDocument = (app) => {
  app.post("/:firmaLinkName/documents", auth, upload.array("pdfs"), async (req, res) => {
    try {
      const { firmaLinkName } = req.params;
      const firma = await Firma.findOne({ where: { linkName: firmaLinkName } });
      if (!firma) {
        return res.status(404).json({ error: "Firma not found" });
      }
      let key = '';
      let pdfs = new Map();
      let webs = new Array();
      if(req.body.url) webs.push(req.body.url);
      
      if(req.files){
        for (let datei of req.files) {
        key = `pdfs/${Date.now()}-${datei.originalname}`;
        const uploadParams = {
          Bucket: bucketName,
          Key: key,
          Body: datei.buffer,
          ContentType: datei.mimetype,
          ACL: 'public-read'
        };
        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);
        pdfs.set(datei.originalname,`https://${bucketName}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`);
      }
      }
      console.log("Hochgeladene PDF-URLs:", pdfs);
      ingestFirmaData(firma.id, pdfs, webs)
       .catch(err => {
        console.error("Ingestion failed:", err);
      });
      res.status(201).json({ status: "INGESTION_STARTED" });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
      }
      if (error instanceof UniqueConstraintError) {
        return res.status(409).json({ error: "Document already exists" });
      }
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
};

const firmaSubscription = (app) => {
  app.post("/:firmaLinkName/subscribe", auth, async (req, res) => {
    try {
      const { firmaLinkName } = req.params;
      const firma = await Firma.findOne({ where: { linkName: firmaLinkName } });
      if (!firma) {
        return res.status(404).json({ error: "Firma not found" });
      }
      console.log(process.env.STRIPE_PRICE_ID);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        client_reference_id: firma.id,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `https://pdf-libre.de`,
        cancel_url: `https://pdf-libre.de`,
      });
      res.status(200).json({ url: session.url});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}

const subscribeCancel = (app) => {
  app.post("/:firmaLinkName/unsubscribe", auth, async (req, res) => {
    try {
      const { firmaLinkName } = req.params;
      const firma = await Firma.findOne({ where: { linkName: firmaLinkName } });
      if (!firma) {
        return res.status(404).json({ error: "Firma not found" });
      }
      if (!firma.stripeCustomerId) {
        return res.status(400).json({ error: "No active subscription found" });
      }   
      const subscriptions = await stripe.subscriptions.list({ customer: firma.stripeCustomerId });
      if (subscriptions.data.length === 0) {
        return res.status(400).json({ error: "No active subscription found" });
      }
      const subscriptionId = subscriptions.data[0].id;
      await stripe.subscriptions.cancel(subscriptionId);
      res.status(200).json({ message: "Subscription cancelled successfully", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
};
const refreshToken = (app) => {
  app.post("/refresh-token", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token missing' });
      }
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRETF);
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      const firma = await Firma.findByPk(decoded.id);
      if (!firma || firma.refreshToken !== refreshToken) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      const newToken = jwt.sign({ id: firma.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      const newRefreshToken = jwt.sign({ id: firma.id }, process.env.JWT_SECRETF, { expiresIn: "7d" });
      await firma.update({ refreshToken: newRefreshToken });
      res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Invalid refresh token', error: error.message });
    }
  });
}
module.exports = {
  createFirma,
  loginFirma,
  findAllDocuments,
  deleteDocument,
  findAllCustomers,
  findOneCustomer,
  AddDocument,
  firmaSubscription,
  subscribeCancel,
  findOneFirma,
};

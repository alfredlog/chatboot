require("dotenv").config();
const {Sequelize, DataTypes} = require("sequelize");
const firmaModel = require("./models/firma");
const customerModel = require("./models/customers");
const documentsModel = require("./models/dokument");
const chunksModel = require("./models/chunks");



const db = new Sequelize(process.env.POSTGRES_URL, {
    dialectModule: require("pg"),
    dialectOptions:{
        ssl:{
            require :true,
            rejectUnauthorized: false
        }
    },
   
});

const Firma = firmaModel(db, DataTypes);
const Customer = customerModel(db, DataTypes);
const Document = documentsModel(db, DataTypes);
const Chunk = chunksModel(DataTypes, db);
const Actions = require("./models/actions")(db, DataTypes);

Chunk.belongsTo(Document, { foreignKey: "document_id" });
Document.hasMany(Chunk, { foreignKey: "document_id" });

const dbSync = async() => {
    try {
        console.log("hi")
        await db.sync();
        console.log("hi")
        await db.query(`
          CREATE EXTENSION IF NOT EXISTS vector;
          ALTER TABLE "Chunks"
          ALTER COLUMN embedding TYPE vector(384)
          USING embedding::vector;
  `);
        console.log("Database synchronized successfully.");
    } catch (error) {
        console.error("Unexpected error:", error);
    }
};

module.exports = {
    db,
    Firma,
    Customer,
    Document,
    Chunk,
    Actions,
    dbSync
};

module.exports = (sequelize, DataTypes) => {
    return sequelize.define("action", {
        id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  firma_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  intent: {
    type: DataTypes.STRING, 
    // z.B. "password_reset", "invoice_download"
    allowNull: false
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false
  },

  steps: {
    type: DataTypes.JSONB,
    allowNull: true
    // ["Profil öffnen", "Sicherheit klicken", ...]
  },

  url: {
    type: DataTypes.TEXT,
    allowNull: false
  }
    }, {
        tableName: "Actions",
        timestamps: true
    });
}
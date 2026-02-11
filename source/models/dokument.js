module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Document", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
  },
  firma_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Firmas',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  source_type: {
    type: DataTypes.STRING, // pdf | website
    allowNull: false,
  },
  source_ref: {
    type: DataTypes.STRING, // filename / url
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: "CreatedAt",
  updatedAt: "UpdatedAt"
});
};


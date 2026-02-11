module.exports = (DataTypes, sequelize) => {
  return sequelize.define('Chunk', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  embedding: {
    type: DataTypes.STRING, // wichtig: vector wird als STRING gespeichert
    allowNull: false
  },

  firma_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  document_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Documents',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  source_ref: {
    type: DataTypes.STRING, // filename / url
    allowNull: false,
  },
});
}


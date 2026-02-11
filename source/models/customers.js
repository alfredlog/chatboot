const firma = require("./firma");

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    firmaName: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Firmas',
        key: 'linkName',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },   
    chatverlauf: {
      type: DataTypes.JSONB,
      allowNull: false,
        defaultValue: [],
    },  
  }, {
    timestamps: true,
    createdAt: "CreatedAt",
    updatedAt: "UpdatedAt"
  });
};

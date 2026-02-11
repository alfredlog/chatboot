module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Firma', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name : {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    linkName :{
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    }, 
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         notEmpty: { msg: "the password must not be empty" },
          notNull: { msg: "the password is required" },
        isValide(value) {
            if (!/[A-Z]/.test(value)) {
                throw new Error('Password must contain at least one uppercase letter');
            }
            if (!/[a-z]/.test(value)) {
                throw new Error('Password must contain at least one lowercase letter');
            }
            if (!/[0-9]/.test(value)) {
                throw new Error('Password must contain at least one digit');
            }
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                throw new Error('Password must contain at least one special character');
            }
        }
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
    pdfs: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      validate: {
        isUrl: true,
        arePdf(value) {
            for (let url of value) {
                let parts = url.split('.');
                let extension = parts[parts.length - 1].toLowerCase();
                if (extension !== 'pdf') {
                    throw new Error('All URLs must point to PDF files');
                }
            }
        },      
      },
    },
    subscription: {
      type: DataTypes.ENUM('free', 'premium'),
      allowNull: false,
      defaultValue: 'free',
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expireAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    webseites: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      validate: {
        isPageWebsite(value) {
            for (let url of value) {
                if (!/^https?:\/\/.+/.test(url)) {
                    throw new Error('All URLs must be valid web addresses');
                }
            }
        },
      },
    },
  }, {
    timestamps: true,
    createdAt : "createdAt",
    updatedAt : "updatedAt"
  })}
const sequelize = require('sequelize');
require('dotenv').config();
const db = new sequelize(process.env.DATABASE,
     process.env.username,
     process.env.password, {
     host: process.env.host,
     dialect: 'mysql'
});
module.exports = db;

const cls = require('cls-hooked');
const namespace = cls.createNamespace('hotel-tenant');
const { Sequelize } = require('sequelize');
Sequelize.useCLS(namespace);

module.exports = namespace;

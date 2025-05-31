const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  dueDate: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('pending', 'in progress', 'complete'),
    defaultValue: 'pending'
  }
});

// Relationship: One User has many Tasks
User.hasMany(Task, { onDelete: 'CASCADE' });
Task.belongsTo(User);

module.exports = Task;

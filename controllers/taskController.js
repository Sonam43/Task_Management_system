const Task = require('../models/tasks');

exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.findAll({ where: { UserId: userId } });

    res.render('dashboard', {
      tasks,
      userEmail: req.user.email,
    });
  } catch (error) {
    console.error('Get Tasks Error:', error.message);
    res.status(500).send('Failed to fetch tasks');
  }
};

exports.createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, dueDate } = req.body;

    await Task.create({
      title,
      description,
      dueDate,
      UserId: userId,
    });

    res.redirect('/tasks');
  } catch (error) {
    console.error('Create Task Error:', error.message);
    res.status(500).send('Failed to create task');
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, status } = req.body;

    await Task.update(
      { title, description, dueDate, status },
      { where: { id: req.params.id } }
    );

    res.redirect('/tasks');
  } catch (error) {
    console.error('Update Task Error:', error.message);
    res.status(500).send('Failed to update task');
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.destroy({ where: { id: req.params.id } });
    res.redirect('/tasks');
  } catch (error) {
    console.error('Delete Task Error:', error.message);
    res.status(500).send('Failed to delete task');
  }
};

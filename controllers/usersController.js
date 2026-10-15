const db = require("../models/index");

module.exports = {
  findAll: function(req, res) {
    db.User
      .findAll({ where: req.query, order: [["createdAt", "DESC"]] })
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },
  findById: function(req, res) {
    db.User
      .findByPk(req.params.id)
      .then(dbModel => dbModel ? res.json(dbModel) : res.sendStatus(404))
      .catch(err => res.status(422).json(err));
  },
  create: function(req, res) {
    const newUser = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password
    };

    db.User
      .create(newUser)
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },
  update: function(req, res) {
    db.User
      .findByPk(req.params.id)
      .then(dbModel => dbModel ? dbModel.update(req.body).then(updated => res.json(updated)) : res.sendStatus(404))
      .catch(err => res.status(422).json(err));
  },
  remove: function(req, res) {
    db.User
      .findByPk(req.params.id)
      .then(dbModel => dbModel ? dbModel.destroy().then(() => res.json(dbModel)) : res.sendStatus(404))
      .catch(err => res.status(422).json(err));
  }
};

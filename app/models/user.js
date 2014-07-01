var db = require('../config');
var Link = require('./link.js');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

//dont forget to promisify

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  links: function() {
    return this.hasMany(Link);
  },

  initialize: function(){
    this.on('creating', function(model, attrs, options){
      console.log("created");
    });
  }
});

module.exports = User;

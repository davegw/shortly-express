var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

//dont forget to promisify

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  initialize: function(){
    this.on('creating', function(model, attrs, options){
      console.log("created");
    });
  }
});

module.exports = User;

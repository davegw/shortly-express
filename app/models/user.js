var db = require('../config');
var Link = require('./link.js');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  links: function() {
    return this.hasMany(Link);
  },

  initialize: function(){
    this.on('creating', function(model, attrs, options){
      var bcryptHash = Promise.promisify(bcrypt.hash);
      var password = model.get('password');
      return bcryptHash(password, null, null)
        .then(function(result){
          model.set('password', result);
        });
    });
  }
  
});

module.exports = User;

"use strict";
const _ = require('lodash');
const mongoose = require('mongoose');
const lodash = require('lodash');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  dena: {
    name: { type: String, index: true },
    buddy_id: Number,
    id: { type: Number, index: { unique: true } }
  },
  recordMaterias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RecordMateria' }],
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/buddy/${this.dena.id}/${this.dena.id}.png`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.statics.createFromRelationship = (json) => {

  let User = mongoose.model('User');
  Promise.map(json, (data) => {
    return User.findOne({'dena.id': data.user_id})
    .then((user) => {
      user = user || (new User);

      let fieldData = {
        dena: {
          name: data.nickname,
          id: data.user_id,
          profile_message: data.profile_message,
          supporter_buddy_soul_strike_name: data.supporter_buddy_soul_strike_name,
          mnd: data.supporter_buddy_mnd,
          matk: data.supporter_buddy_matk,
          atk: data.supporter_buddy_atk
        }
      };
      user.dena = Object.assign(user.dena, fieldData.dena);

      return user.save();
    })
    .then((user) => {
      return mongoose.model('Buddy').findOne({'dena.id': data.supporter_buddy_id})
      .then((buddy) => {
        user.buddy = buddy;

        return user.save();
      })
    })
  })
  .then((users) => {
    return users;
  })
  
}

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Buddy');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}

schema.statics.checkForNewOnes = (profileJson) => {
  mongoose.model('Buddy').find().distinct('dena.id')
  .then((buddyIds) => {
    var buddiesToCreate = [];
    (profileJson.buddies||[]).forEach( (buddyData) => {
      if(!lodash.find(buddyIds, (b) => { return b.toString() == buddyData.buddy_id.toString(); })) {
        var name = buddyData.name;

        if(buddyData.buddy_id == 10000200) {
          name = 'Tyro';
        } else if(buddyData.buddy_id == 10400100) {
          name = 'Dark Knight Cecil';
        } else if( name == 'Cecil') {
          name = 'Paladin Cecil';
        }

        
        buddiesToCreate.push({
          dena: {
            name: name,
            id: buddyData.buddy_id
          }
        });
      }
    });
    return mongoose.model('Buddy').create(lodash.uniqBy(buddiesToCreate, (b) => { return b.dena.id}));
  })
}


module.exports = mongoose.model('Buddy', schema);
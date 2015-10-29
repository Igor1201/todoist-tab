// https://todoist.com/API/deprecated#/API/getUncompletedItems
Todos = new Ground.Collection('__borges_todos');

if (Meteor.isClient) {
  Template.hello.onCreated(function () {
    var self = this;

    self.autorun(function () {
      self.subscribe('todos');
    });

    Meteor.call('login', function (error) {
      if (!error) {
        Meteor.call('getUncompletedItems');
      }
    });
  });

  Template.hello.helpers({
    uncompletedItems: function () {
      return Todos.find({}, {sort: {item_order: 1}});
    }
  });

  Template.hello.events({
    'keypress #textTodo': function (e, t) {
      if (e.keyCode == 13) {
        var textTodo = $(e.currentTarget).val().trim();
        if (!!textTodo) {
          Meteor.call('addItem', textTodo);
          $(e.currentTarget).val('');
        }
      }
    },
    'change [data-action="completeItem"]': function (e, t) {
      Meteor.call('completeItem', this._id);
    }
  });
}

if (Meteor.isServer) {
  var API = {};

  Meteor.publish('todos', function () {
    return Todos.find({}, {fields: {id: 1, content: 1, date_string: 1, item_order: 1}, sort: {item_order: 1}});
  });

  Meteor.methods({
    login: function () {
      API = new Todoist(Meteor.settings.todoist.email, Meteor.settings.todoist.password);
    },
    getUncompletedItems: function () {
      var items = API.request('getUncompletedItems', {project_id: API.user.inbox_project});

      var local = Todos.find({}).map(function (t) { return t._id; });
      var server = _.map(items, function (t) { return t.id; });
      var diff = _.union(_.difference(local, server), _.difference(server, local));
      if (diff.length > 0) {
        Todos.remove({_id: {$in: diff}});
      }

      _.each(items, function (item) {
        Todos.upsert({_id: item.id}, {$set: item});
      });
    },
    addItem: function (textTodo) {
      var item = API.request('addItem', {content: textTodo});
      Todos.upsert({_id: item.id}, {$set: item});
    },
    completeItem: function (_id) {
      var response = API.request('completeItems', {ids: JSON.stringify([_id])});
      if (response == 'ok') {
        Todos.remove({_id: _id});
      }
    }
  });
}

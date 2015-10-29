// https://todoist.com/API/deprecated#/API/getUncompletedItems

if (Meteor.isClient) {
  var refreshItems = function (template) {
    Meteor.call('getUncompletedItems', function (error, items) {
      if (!error) {
        template.uncompletedItems.set(items);
      }
    });
  }

  Template.hello.onCreated(function () {
    var self = this;
    self.uncompletedItems = new ReactiveVar([]);
    Meteor.call('login', function (error) {
      if (!error) {
        refreshItems(self);
      }
    });
  });

  Template.hello.helpers({
    uncompletedItems: function () {
      return Template.instance().uncompletedItems.get();
    }
  });

  Template.hello.events({
    'keypress #textTodo': function (e, t) {
      if (e.keyCode == 13) {
        var textTodo = $(e.currentTarget).val().trim();
        if (!!textTodo) {
          Meteor.call('addItem', textTodo, function (error) {
            if (!error) {
              refreshItems(t);
            }
          });
          $(e.currentTarget).val('');
        }
      }
    }
  });
}

if (Meteor.isServer) {
  var todo = {};
  Meteor.methods({
    login: function () {
      todo = new Todoist(Meteor.settings.todoist.email, Meteor.settings.todoist.password);
    },
    getUncompletedItems: function () {
      return todo.request('getUncompletedItems', {project_id: todo.user.inbox_project});
    },
    addItem: function (textTodo) {
      return todo.request('addItem', {content: textTodo});
    }
  });
}

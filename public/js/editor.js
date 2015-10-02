$(document).ready(function()
{
  var userModel = Backbone.Model.extend({
    url: '/api/user'
  });

  var assetModel = Backbone.Model.extend({
    url: '/api/assets/1',
    defaults: {
      name:   null,
      status: null
    }
  });

  var assetCollection = Backbone.Collection.extend({
    url: '/api/assets',
    model: assetModel
  });

  var userView = Backbone.View.extend({
    el: '#userView',
    initialize: function() {
      this.model.fetch();
    },
    render: function(user) {
      this.$el.html('<i class="user icon"></i>'+user.username);
    }
  });

  var assetsListView = Backbone.View.extend({
    el: '#assetsListView',
    template: _.template($('#asset-item-tmpl').html()),
    initialize: function() {
      this.listenTo(this.collection, 'sync', this.render);
      this.collection.fetch();
      this.render();
    },
    render: function() {
      this.$el.html(this.template({collection: this.collection.toJSON()}));
    }
  });

  var assets = new assetCollection();
  var assetsList = new assetsListView({collection: assets});

  var user = new userModel();
  var userDisplay = new userView({model: user});

  setInterval(function() {
    assets.fetch();
  }, 3000);

  $('.left.sidebar')
  .sidebar({
      context: $('.bottom.segment'),
      exclusive: false,
      transition: 'overlay',
      dimPage: false
  })
  .sidebar('attach events', '#leftButton');

  $('.right.sidebar')
  .sidebar({
      context: $('.bottom.segment'),
      exclusive: false,
      transition: 'overlay',
      dimPage: false
  })
  .sidebar('attach events', '#rightButton');
});

require.config({
  paths: {
    jquery: '../bower_components/jquery/dist/jquery',
    underscore: '../bower_components/underscore/underscore-min',
    backbone: '../bower_components/backbone/backbone-min',
    dropzone: '../bower_components/dropzone/dist/dropzone-amd-module',
    ckeditor: '../bower_components/ckeditor/ckeditor',
    semantic: '../semantic/dist/semantic.min',
    text: '../bower_components/text/text'
  },
  shim: {
    'semantic': {
      exports: 'semantic',
      deps: ['jquery']
    },
    'ckeditor': {
      exports: 'CKEDITOR',
      init: function() {
        this.CKEDITOR.disableAutoInline = true;
      }
    }
  }

});

require([
  'app',
], function(App){
  App.initialize();
});
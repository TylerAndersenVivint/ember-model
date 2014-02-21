require('ember-model/rest_adapter');

Ember.RESTPlusAdapter = Ember.RESTAdapter.extend({
  /* Custom buildURL function to get rid of the trailing .json on the calls and support
   * the host & namespace options that ember-data uses.
   */
  buildURL: function(obj, id) {
    var baseURL  = '',
        modelURL = Ember.get(obj, 'url'),
        nsURL    = '';

    if(!modelURL) { throw new Error('Ember.RESTAdapter requires a `url` property to be specified'); }

    if(this.host) baseURL = this.host;
    if(this.namespace) {
      if((this.namespace.charAt(0) !== '/') && (baseURL.slice(-1) !== '/')) {
        nsURL = '/' + this.namespace;
      } else if((this.namespace.charAt(0) === '/') && (baseURL.slice(-1) === '/')) {
        nsURL = this.namespace.substring(1);
      } else {
        nsURL = this.namespace;
      }

      baseURL = baseURL + nsURL;
    }

    if(modelURL.charAt(0) !== '/') modelURL = '/' + modelURL;

    if(!Ember.isEmpty(id)) {
      return baseURL + modelURL + '/' + id;
    } else {
      return baseURL + modelURL;
    }
  }
});
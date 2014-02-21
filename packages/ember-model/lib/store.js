var get = Ember.get, set = Ember.set;

function contains(array, element) {
  for (var i = 0, l = array.length; i < l; i++) {
    if (array[i] === element) { return true; }
  }
  return false;
}

function concatUnique(toArray, fromArray) {
  var e;
  for (var i = 0, l = fromArray.length; i < l; i++) {
    e = fromArray[i];
    if (!contains(toArray, e)) { toArray.push(e); }
  }
  return toArray;
}

Ember.Model.Store = Ember.Object.extend({
  container: null,

  modelFor: function(type) {
    return this.container.lookupFactory('model:'+type);
  },

  adapterFor: function(type) {
    var adapter = this.modelFor(type).adapter;
    if (adapter && adapter !== Ember.Model.adapter) {
      return adapter;
    } else {
      return this.container.lookupFactory('adapter:'+ type) ||
        this.container.lookupFactory('adapter:application') ||
        this.container.lookupFactory('adapter:REST');
    }
  },

  find: function(type, id) {
    var klass = this.modelFor(type);
    klass.reopenClass({adapter: this.adapterFor(type)});
    if (!id) {
      return this._findFetchAll(type);
    } else if (Ember.isArray(id)) {
      return this._findFetchMany(type, id);
    }else if (typeof id === 'object') {
      return this._findFetchQuery(type, id);
    } else {
    return this._findFetchById(type, id);
    }
  },

  _findFetchMany: function(type, ids) {
    Ember.assert("findFetchMany requires an array", Ember.isArray(ids));

    var klass = this.modelFor(type);

    var records = Ember.RecordArray.create({_ids: ids, modelClass: this, container: this.container}),
      deferred;

    if (!klass.recordArrays) { klass.recordArrays = []; }
    klass.recordArrays.push(records);

    if (klass._currentBatchIds) {
      concatUnique(klass._currentBatchIds, ids);
      klass._currentBatchRecordArrays.push(records);
    } else {
      klass._currentBatchIds = concatUnique([], ids);
      klass._currentBatchRecordArrays = [records];
    }

    deferred = Ember.Deferred.create();
    Ember.set(deferred, 'resolveWith', records);

    if (!klass._currentBatchDeferreds) { klass._currentBatchDeferreds = []; }
    klass._currentBatchDeferreds.push(deferred);


    Ember.run.scheduleOnce('data', klass, klass._executeBatch, this.container);

    return deferred;
  },

  _findFetchQuery: function(type, params) {
    var klass = this.modelFor(type);
    var records = Ember.RecordArray.create({modelClass: this, _query: params, container: this.container});

    var promise = klass.adapter.findQuery(this, records, params);

    return promise;
  },

  _findFetchAll: function(type) {
    var klass = this.modelFor(type);

    if (klass._findAllRecordArray) {
      return new Ember.RSVP.Promise(function(resolve) {
        resolve(klass._findAllRecordArray);
      });
    }

    var records = klass._findAllRecordArray = Ember.RecordArray.create({modelClass: klass, container: this.container});

    var promise = klass.adapter.findAll(klass, records);

    // Remove the cached record array if the promise is rejected
    if (promise.then) {
      promise.then(null, function() {
        klass._findAllRecordArray = null;
        return Ember.RSVP.reject.apply(null, arguments);
      });
    }

    return  promise;
  },

  _findFetchById: function(type, id) {
    var klass = this.modelFor(type);
    var record = klass.cachedRecordForId(id, this.container),
      isLoaded = get(record, 'isLoaded'),
      deferredOrPromise;

    if (isLoaded) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        resolve(record);
      });
    }

    deferredOrPromise = klass._fetchById(record, id);

    return deferredOrPromise;
  }

});

Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: "store",

    initialize: function(container, application) {
      application.register('store:main', Ember.Model.Store, {singleton: true});

      container.lookup('store:main').set('container', container);
      application.inject('route', 'store', 'store:main');
    }
  });
});

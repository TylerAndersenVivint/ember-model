var TestModel, Store, container, fixtureAdapter;

module("Ember.Model.Store", {
  setup: function() {
    container = new Ember.Container();

    Store = Ember.Model.Store.create({container: container});
    TestModel = Ember.Model.extend({
      token: Ember.attr(),
      name: Ember.attr(),
      type: 'test'
    });
    TestModel.primaryKey = 'token';
    fixtureAdapter = Ember.FixtureAdapter.create();
    TestModel.adapter = fixtureAdapter;
    TestModel.FIXTURES = [
      {token: 'a', name: 'Erik'},
      {token: 'b', name: 'Christina'}
    ];

    container.register('model:test', TestModel);
  },
  teardown: function() {

  }
});

test("Store.find(type, id) returns a promise and loads a container for the record", function() {
  expect(2);

  var promise = Ember.run(Store, Store.find, 'test','a');
  promise.then(function(record) {
    start();
    ok(record.get('isLoaded'));
    ok(record.get('container'));
  });
  stop();
});

test("Store.find(type) returns a promise and loads a container for each record", function() {
  expect(5);

  var promise = Ember.run(Store, Store.find, 'test');
  promise.then(function(records) {
    start();
    equal(records.content.length, 2);
    records.forEach(function(record){
      ok(record.get('isLoaded'));
      ok(record.get('container'));
    });
  });
  stop();
});

test("Store.find(type, Array) returns a promise and loads a container for each record", function() {
  expect(5);

  var promise = Ember.run(Store, Store.find, 'test', ['a','b']);
  promise.then(function(records) {
    start();
    equal(records.content.length, 2);
    records.forEach(function(record){
      ok(record.get('isLoaded'));
      ok(record.get('container'));
    });
  });
  stop();
});

test("Store.adapterFor(type) returns correct adapter", function() {
  var testAdapter = Ember.FixtureAdapter.create();
  var applicationAdapter = Ember.FixtureAdapter.create();

  var adapter = Ember.run(Store, Store.adapterFor, 'test');
  //look for explicitly set adapter first
  equal(adapter, fixtureAdapter);

  TestModel.adapter = undefined;

  container.register('adapter:test', undefined);
  container.register('adapter:application', applicationAdapter);
  adapter = Ember.run(Store, Store.adapterFor, 'test');
  equal(adapter, applicationAdapter);


  container.register('adapter:test', testAdapter);
  adapter = Ember.run(Store, Store.adapterFor, 'test');
  equal(adapter, testAdapter);
});

test("Store.adapterFor(type) defaults to RESTAdapter if no adapter specified", function() {
  var restAdapter = Ember.RESTAdapter.create();
  TestModel.adapter = undefined;

  container.register('adapter:test', undefined);
  container.register('adapter:application', undefined);
  container.register('adapter:REST', restAdapter);
  var adapter = Ember.run(Store, Store.adapterFor, 'test');
  equal(adapter, restAdapter);
});
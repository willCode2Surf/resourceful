var path = require('path')
  , assert = require('assert')
  , fs = require('fs')
  , vows = require('vows')
  , resourceful = require('../lib/resourceful');

var engines = fs.readdirSync(path.join(__dirname, 'engines')).map(function (e) { return require('./engines/' + e.slice(0,-3)); });

var resources = {};

engines.forEach(function (e) {
  resources[e] = {}
  vows.describe('resourceful/engines/' + e.name)
  .addBatch({
    'In database "test"': {
      topic: function () {
        e.load(resourceful, [
          { _id: 'bob', age: 35, hair: 'black', resource: 'Author'},
          { _id: 'tim', age: 16, hair: 'brown', resource: 'Author'},
          { _id: 'mat', age: 29, hair: 'black', resource: 'Author'},
          { _id: 'bob/1', title: 'Nodejs sucks!', year: 2003, fiction: true, resource: 'Book'},
          { _id: 'tim/1', title: 'Nodejitsu rocks!', year: 2008, fiction: false, resource: 'Book'},
          { _id: 'bob/2', title: 'Loling at you', year: 2011, fiction: true, resource: 'Book'},
        ], this.callback);
      },
      'Defining resource "book"': {
        topic: function () {
          return resources[e].Book = resourceful.define('book', function () {
            this.use(e.name, e.options);

            this.string('title');
            this.number('year');
            this.bool('fiction');
          });
        },
        'will be successful': function (book) {
          assert.equal(Object.keys(book.properties).length, 4);
        }
      },
      'Defining resource "author"': {
        topic: function () {
          return resources[e].Author = resourceful.define('author', function () {
            this.use(e.name, e.options);

            this.number('age');
            this.string('hair').sanitize('lower');
          });
        },
        'will be successful': function (author) {
          assert.equal(Object.keys(author.properties).length, 3);
        }
      },
      'a get() request': {
        "when successful": {
          topic: function () {
            resources[e].Author.get("bob", this.callback);
          },
          "should respond with a Resource instance": function (err, obj) {
            assert.isObject(obj);
            assert.instanceOf(obj, resourceful.Resource);
            assert.equal(obj.constructor, resources[e].Author);
          },
          "should respond with the right object": function (err, obj) {
            assert.equal(obj._id, 'bob');
            assert.equal(obj.age, 35);
            assert.equal(obj.hair, 'black');
            assert.equal(obj.resource, 'Author');
          }
        },
        "when unsuccessful": {
          topic: function () {
            resources[e].Author.get("david", this.callback);
          },
          "should respond with an error": function (err, obj) {
            assert.equal(err.status, 404);
            assert.isUndefined(obj);
          }
        }
      }
    }
  }).export(module)
});
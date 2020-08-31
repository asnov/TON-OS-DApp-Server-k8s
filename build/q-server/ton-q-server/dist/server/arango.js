"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _arangochair = _interopRequireDefault(require("arangochair"));

var _arangojs = require("arangojs");

var _arangoCollection = require("./arango-collection");

var _auth = require("./auth");

var _config = require("./config");

var _logs = _interopRequireDefault(require("./logs"));

var _resolversGenerated = require("./resolvers-generated");

var _opentracing = require("opentracing");

var _tracer = require("./tracer");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */
class Arango {
  constructor(config, logs, auth, tracer, stats) {
    this.config = config;
    this.log = logs.create('db');
    this.auth = auth;
    this.serverAddress = config.database.server;
    this.databaseName = config.database.name;
    this.tracer = tracer;
    this.statPostCount = new _tracer.StatsCounter(stats, _config.STATS.post.count, []);
    this.statPostFailed = new _tracer.StatsCounter(stats, _config.STATS.post.failed, []);

    const createDb = config => {
      const db = new _arangojs.Database({
        url: `${(0, _config.ensureProtocol)(config.server, 'http')}`,
        agentOptions: {
          maxSockets: config.maxSockets
        }
      });
      db.useDatabase(config.name);

      if (config.auth) {
        const authParts = config.auth.split(':');
        db.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
      }

      return db;
    };

    this.db = createDb(config.database);
    const slowDb = createDb(config.slowDatabase);
    this.collections = [];
    this.collectionsByName = new Map();

    const addCollection = (name, docType) => {
      const collection = new _arangoCollection.Collection(name, docType, logs, this.auth, this.tracer, stats, this.db, slowDb, config.isTests || false);
      this.collections.push(collection);
      this.collectionsByName.set(name, collection);
      return collection;
    };

    this.transactions = addCollection('transactions', _resolversGenerated.Transaction);
    this.messages = addCollection('messages', _resolversGenerated.Message);
    this.accounts = addCollection('accounts', _resolversGenerated.Account);
    this.blocks = addCollection('blocks', _resolversGenerated.Block);
    this.blocks_signatures = addCollection('blocks_signatures', _resolversGenerated.BlockSignatures);
  }

  start() {
    const listenerUrl = `${(0, _config.ensureProtocol)(this.serverAddress, 'http')}/${this.databaseName}`;
    this.listener = new _arangochair.default(listenerUrl);

    if (this.config.database.auth) {
      const userPassword = Buffer.from(this.config.database.auth).toString('base64');
      this.listener.req.opts.headers['Authorization'] = `Basic ${userPassword}`;
    }

    this.collections.forEach(collection => {
      const name = collection.name;
      this.listener.subscribe({
        collection: name
      });
      this.listener.on(name, (docJson, type) => {
        if (type === 'insert/update' || type === 'insert' || type === 'update') {
          this.onDocumentInsertOrUpdate(name, docJson);
        }
      });
    });
    this.listener.start();
    this.log.debug('LISTEN', listenerUrl);
    this.listener.on('error', (err, status, headers, body) => {
      let error = err;

      try {
        error = JSON.parse(body);
      } catch {}

      this.log.error('FAILED', 'LISTEN', `${err}`, error);
      setTimeout(() => this.listener.start(), this.config.listener.restartTimeout);
    });
  }

  onDocumentInsertOrUpdate(name, doc) {
    const collection = this.collectionsByName.get(name);

    if (collection) {
      collection.onDocumentInsertOrUpdate(doc);
    }
  }

  dropCachedDbInfo() {
    this.collections.forEach(x => x.dropCachedDbInfo());
  }

  async query(query, bindVars) {
    return (0, _utils.wrap)(this.log, 'QUERY', {
      query,
      bindVars
    }, async () => {
      const cursor = await this.db.query({
        query,
        bindVars
      });
      return cursor.all();
    });
  }

  async finishOperations(operationIds) {
    let count = 0;
    this.collections.forEach(x => count += x.finishOperations(operationIds));
    return count;
  }

}

exports.default = Arango;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uc3RydWN0b3IiLCJjb25maWciLCJsb2dzIiwiYXV0aCIsInRyYWNlciIsInN0YXRzIiwibG9nIiwiY3JlYXRlIiwic2VydmVyQWRkcmVzcyIsImRhdGFiYXNlIiwic2VydmVyIiwiZGF0YWJhc2VOYW1lIiwibmFtZSIsInN0YXRQb3N0Q291bnQiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsInBvc3QiLCJjb3VudCIsInN0YXRQb3N0RmFpbGVkIiwiZmFpbGVkIiwiY3JlYXRlRGIiLCJkYiIsIkRhdGFiYXNlIiwidXJsIiwiYWdlbnRPcHRpb25zIiwibWF4U29ja2V0cyIsInVzZURhdGFiYXNlIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJzbGljZSIsImpvaW4iLCJzbG93RGIiLCJzbG93RGF0YWJhc2UiLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb25zQnlOYW1lIiwiTWFwIiwiYWRkQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJjb2xsZWN0aW9uIiwiQ29sbGVjdGlvbiIsImlzVGVzdHMiLCJwdXNoIiwic2V0IiwidHJhbnNhY3Rpb25zIiwiVHJhbnNhY3Rpb24iLCJtZXNzYWdlcyIsIk1lc3NhZ2UiLCJhY2NvdW50cyIsIkFjY291bnQiLCJibG9ja3MiLCJCbG9jayIsImJsb2Nrc19zaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzIiwic3RhcnQiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiZGVidWciLCJlcnIiLCJzdGF0dXMiLCJib2R5IiwiZXJyb3IiLCJKU09OIiwicGFyc2UiLCJzZXRUaW1lb3V0IiwicmVzdGFydFRpbWVvdXQiLCJkb2MiLCJnZXQiLCJkcm9wQ2FjaGVkRGJJbmZvIiwieCIsInF1ZXJ5IiwiYmluZFZhcnMiLCJjdXJzb3IiLCJhbGwiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBL0JBOzs7Ozs7Ozs7Ozs7Ozs7QUFrQ2UsTUFBTUEsTUFBTixDQUFhO0FBdUJ4QkMsRUFBQUEsV0FBVyxDQUNQQyxNQURPLEVBRVBDLElBRk8sRUFHUEMsSUFITyxFQUlQQyxNQUpPLEVBS1BDLEtBTE8sRUFNVDtBQUNFLFNBQUtKLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtLLEdBQUwsR0FBV0osSUFBSSxDQUFDSyxNQUFMLENBQVksSUFBWixDQUFYO0FBQ0EsU0FBS0osSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0ssYUFBTCxHQUFxQlAsTUFBTSxDQUFDUSxRQUFQLENBQWdCQyxNQUFyQztBQUNBLFNBQUtDLFlBQUwsR0FBb0JWLE1BQU0sQ0FBQ1EsUUFBUCxDQUFnQkcsSUFBcEM7QUFDQSxTQUFLUixNQUFMLEdBQWNBLE1BQWQ7QUFFQSxTQUFLUyxhQUFMLEdBQXFCLElBQUlDLG9CQUFKLENBQWlCVCxLQUFqQixFQUF3QlUsY0FBTUMsSUFBTixDQUFXQyxLQUFuQyxFQUEwQyxFQUExQyxDQUFyQjtBQUNBLFNBQUtDLGNBQUwsR0FBc0IsSUFBSUosb0JBQUosQ0FBaUJULEtBQWpCLEVBQXdCVSxjQUFNQyxJQUFOLENBQVdHLE1BQW5DLEVBQTJDLEVBQTNDLENBQXRCOztBQUVBLFVBQU1DLFFBQVEsR0FBSW5CLE1BQUQsSUFBaUM7QUFDOUMsWUFBTW9CLEVBQUUsR0FBRyxJQUFJQyxrQkFBSixDQUFhO0FBQ3BCQyxRQUFBQSxHQUFHLEVBQUcsR0FBRSw0QkFBZXRCLE1BQU0sQ0FBQ1MsTUFBdEIsRUFBOEIsTUFBOUIsQ0FBc0MsRUFEMUI7QUFFcEJjLFFBQUFBLFlBQVksRUFBRTtBQUNWQyxVQUFBQSxVQUFVLEVBQUV4QixNQUFNLENBQUN3QjtBQURUO0FBRk0sT0FBYixDQUFYO0FBTUFKLE1BQUFBLEVBQUUsQ0FBQ0ssV0FBSCxDQUFlekIsTUFBTSxDQUFDVyxJQUF0Qjs7QUFDQSxVQUFJWCxNQUFNLENBQUNFLElBQVgsRUFBaUI7QUFDYixjQUFNd0IsU0FBUyxHQUFHMUIsTUFBTSxDQUFDRSxJQUFQLENBQVl5QixLQUFaLENBQWtCLEdBQWxCLENBQWxCO0FBQ0FQLFFBQUFBLEVBQUUsQ0FBQ1EsWUFBSCxDQUFnQkYsU0FBUyxDQUFDLENBQUQsQ0FBekIsRUFBOEJBLFNBQVMsQ0FBQ0csS0FBVixDQUFnQixDQUFoQixFQUFtQkMsSUFBbkIsQ0FBd0IsR0FBeEIsQ0FBOUI7QUFDSDs7QUFDRCxhQUFPVixFQUFQO0FBQ0gsS0FiRDs7QUFlQSxTQUFLQSxFQUFMLEdBQVVELFFBQVEsQ0FBQ25CLE1BQU0sQ0FBQ1EsUUFBUixDQUFsQjtBQUNBLFVBQU11QixNQUFNLEdBQUdaLFFBQVEsQ0FBQ25CLE1BQU0sQ0FBQ2dDLFlBQVIsQ0FBdkI7QUFFQSxTQUFLQyxXQUFMLEdBQW1CLEVBQW5CO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUIsSUFBSUMsR0FBSixFQUF6Qjs7QUFFQSxVQUFNQyxhQUFhLEdBQUcsQ0FBQ3pCLElBQUQsRUFBZTBCLE9BQWYsS0FBa0M7QUFDcEQsWUFBTUMsVUFBVSxHQUFHLElBQUlDLDRCQUFKLENBQ2Y1QixJQURlLEVBRWYwQixPQUZlLEVBR2ZwQyxJQUhlLEVBSWYsS0FBS0MsSUFKVSxFQUtmLEtBQUtDLE1BTFUsRUFNZkMsS0FOZSxFQU9mLEtBQUtnQixFQVBVLEVBUWZXLE1BUmUsRUFTZi9CLE1BQU0sQ0FBQ3dDLE9BQVAsSUFBa0IsS0FUSCxDQUFuQjtBQVdBLFdBQUtQLFdBQUwsQ0FBaUJRLElBQWpCLENBQXNCSCxVQUF0QjtBQUNBLFdBQUtKLGlCQUFMLENBQXVCUSxHQUF2QixDQUEyQi9CLElBQTNCLEVBQWlDMkIsVUFBakM7QUFDQSxhQUFPQSxVQUFQO0FBQ0gsS0FmRDs7QUFpQkEsU0FBS0ssWUFBTCxHQUFvQlAsYUFBYSxDQUFDLGNBQUQsRUFBaUJRLCtCQUFqQixDQUFqQztBQUNBLFNBQUtDLFFBQUwsR0FBZ0JULGFBQWEsQ0FBQyxVQUFELEVBQWFVLDJCQUFiLENBQTdCO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQlgsYUFBYSxDQUFDLFVBQUQsRUFBYVksMkJBQWIsQ0FBN0I7QUFDQSxTQUFLQyxNQUFMLEdBQWNiLGFBQWEsQ0FBQyxRQUFELEVBQVdjLHlCQUFYLENBQTNCO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUJmLGFBQWEsQ0FBQyxtQkFBRCxFQUFzQmdCLG1DQUF0QixDQUF0QztBQUNIOztBQUVEQyxFQUFBQSxLQUFLLEdBQUc7QUFDSixVQUFNQyxXQUFXLEdBQUksR0FBRSw0QkFBZSxLQUFLL0MsYUFBcEIsRUFBbUMsTUFBbkMsQ0FBMkMsSUFBRyxLQUFLRyxZQUFhLEVBQXZGO0FBQ0EsU0FBSzZDLFFBQUwsR0FBZ0IsSUFBSUMsb0JBQUosQ0FBZ0JGLFdBQWhCLENBQWhCOztBQUVBLFFBQUksS0FBS3RELE1BQUwsQ0FBWVEsUUFBWixDQUFxQk4sSUFBekIsRUFBK0I7QUFDM0IsWUFBTXVELFlBQVksR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVksS0FBSzNELE1BQUwsQ0FBWVEsUUFBWixDQUFxQk4sSUFBakMsRUFBdUMwRCxRQUF2QyxDQUFnRCxRQUFoRCxDQUFyQjtBQUNBLFdBQUtMLFFBQUwsQ0FBY00sR0FBZCxDQUFrQkMsSUFBbEIsQ0FBdUJDLE9BQXZCLENBQStCLGVBQS9CLElBQW1ELFNBQVFOLFlBQWEsRUFBeEU7QUFDSDs7QUFFRCxTQUFLeEIsV0FBTCxDQUFpQitCLE9BQWpCLENBQXlCMUIsVUFBVSxJQUFJO0FBQ25DLFlBQU0zQixJQUFJLEdBQUcyQixVQUFVLENBQUMzQixJQUF4QjtBQUNBLFdBQUs0QyxRQUFMLENBQWNVLFNBQWQsQ0FBd0I7QUFBRTNCLFFBQUFBLFVBQVUsRUFBRTNCO0FBQWQsT0FBeEI7QUFDQSxXQUFLNEMsUUFBTCxDQUFjVyxFQUFkLENBQWlCdkQsSUFBakIsRUFBdUIsQ0FBQ3dELE9BQUQsRUFBVUMsSUFBVixLQUFtQjtBQUN0QyxZQUFJQSxJQUFJLEtBQUssZUFBVCxJQUE0QkEsSUFBSSxLQUFLLFFBQXJDLElBQWlEQSxJQUFJLEtBQUssUUFBOUQsRUFBd0U7QUFDcEUsZUFBS0Msd0JBQUwsQ0FBOEIxRCxJQUE5QixFQUFvQ3dELE9BQXBDO0FBQ0g7QUFDSixPQUpEO0FBS0gsS0FSRDtBQVNBLFNBQUtaLFFBQUwsQ0FBY0YsS0FBZDtBQUNBLFNBQUtoRCxHQUFMLENBQVNpRSxLQUFULENBQWUsUUFBZixFQUF5QmhCLFdBQXpCO0FBQ0EsU0FBS0MsUUFBTCxDQUFjVyxFQUFkLENBQWlCLE9BQWpCLEVBQTBCLENBQUNLLEdBQUQsRUFBTUMsTUFBTixFQUFjVCxPQUFkLEVBQXVCVSxJQUF2QixLQUFnQztBQUN0RCxVQUFJQyxLQUFLLEdBQUdILEdBQVo7O0FBQ0EsVUFBSTtBQUNBRyxRQUFBQSxLQUFLLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXSCxJQUFYLENBQVI7QUFDSCxPQUZELENBRUUsTUFBTSxDQUNQOztBQUNELFdBQUtwRSxHQUFMLENBQVNxRSxLQUFULENBQWUsUUFBZixFQUF5QixRQUF6QixFQUFvQyxHQUFFSCxHQUFJLEVBQTFDLEVBQTZDRyxLQUE3QztBQUNBRyxNQUFBQSxVQUFVLENBQUMsTUFBTSxLQUFLdEIsUUFBTCxDQUFjRixLQUFkLEVBQVAsRUFBOEIsS0FBS3JELE1BQUwsQ0FBWXVELFFBQVosQ0FBcUJ1QixjQUFuRCxDQUFWO0FBQ0gsS0FSRDtBQVNIOztBQUVEVCxFQUFBQSx3QkFBd0IsQ0FBQzFELElBQUQsRUFBZW9FLEdBQWYsRUFBeUI7QUFDN0MsVUFBTXpDLFVBQTJDLEdBQUcsS0FBS0osaUJBQUwsQ0FBdUI4QyxHQUF2QixDQUEyQnJFLElBQTNCLENBQXBEOztBQUNBLFFBQUkyQixVQUFKLEVBQWdCO0FBQ1pBLE1BQUFBLFVBQVUsQ0FBQytCLHdCQUFYLENBQW9DVSxHQUFwQztBQUNIO0FBQ0o7O0FBR0RFLEVBQUFBLGdCQUFnQixHQUFHO0FBQ2YsU0FBS2hELFdBQUwsQ0FBaUIrQixPQUFqQixDQUEwQmtCLENBQUQsSUFBbUJBLENBQUMsQ0FBQ0QsZ0JBQUYsRUFBNUM7QUFDSDs7QUFFRCxRQUFNRSxLQUFOLENBQVlBLEtBQVosRUFBd0JDLFFBQXhCLEVBQXVDO0FBQ25DLFdBQU8saUJBQUssS0FBSy9FLEdBQVYsRUFBZSxPQUFmLEVBQXdCO0FBQUU4RSxNQUFBQSxLQUFGO0FBQVNDLE1BQUFBO0FBQVQsS0FBeEIsRUFBNkMsWUFBWTtBQUM1RCxZQUFNQyxNQUFNLEdBQUcsTUFBTSxLQUFLakUsRUFBTCxDQUFRK0QsS0FBUixDQUFjO0FBQUVBLFFBQUFBLEtBQUY7QUFBU0MsUUFBQUE7QUFBVCxPQUFkLENBQXJCO0FBQ0EsYUFBT0MsTUFBTSxDQUFDQyxHQUFQLEVBQVA7QUFDSCxLQUhNLENBQVA7QUFJSDs7QUFFRCxRQUFNQyxnQkFBTixDQUF1QkMsWUFBdkIsRUFBbUU7QUFDL0QsUUFBSXhFLEtBQUssR0FBRyxDQUFaO0FBQ0EsU0FBS2lCLFdBQUwsQ0FBaUIrQixPQUFqQixDQUF5QmtCLENBQUMsSUFBS2xFLEtBQUssSUFBSWtFLENBQUMsQ0FBQ0ssZ0JBQUYsQ0FBbUJDLFlBQW5CLENBQXhDO0FBQ0EsV0FBT3hFLEtBQVA7QUFDSDs7QUEzSXVCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgeyBDb2xsZWN0aW9uIH0gZnJvbSAnLi9hcmFuZ28tY29sbGVjdGlvbic7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi9hdXRoJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZywgUURiQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCwgU1RBVFMgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncydcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tICcuL2RiLXR5cGVzJztcbmltcG9ydCB7IEFjY291bnQsIEJsb2NrLCBCbG9ja1NpZ25hdHVyZXMsIE1lc3NhZ2UsIFRyYW5zYWN0aW9uIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gJ29wZW50cmFjaW5nJztcbmltcG9ydCB7IFN0YXRzQ291bnRlciB9IGZyb20gJy4vdHJhY2VyJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHsgd3JhcCB9IGZyb20gJy4vdXRpbHMnO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyYW5nbyB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZzogUUxvZztcbiAgICBzZXJ2ZXJBZGRyZXNzOiBzdHJpbmc7XG4gICAgZGF0YWJhc2VOYW1lOiBzdHJpbmc7XG4gICAgZGI6IERhdGFiYXNlO1xuXG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBzdGF0UG9zdENvdW50OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFBvc3RGYWlsZWQ6IFN0YXRzQ291bnRlcjtcblxuICAgIHRyYW5zYWN0aW9uczogQ29sbGVjdGlvbjtcbiAgICBtZXNzYWdlczogQ29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogQ29sbGVjdGlvbjtcbiAgICBibG9ja3M6IENvbGxlY3Rpb247XG4gICAgYmxvY2tzX3NpZ25hdHVyZXM6IENvbGxlY3Rpb247XG5cbiAgICBjb2xsZWN0aW9uczogQ29sbGVjdGlvbltdO1xuICAgIGNvbGxlY3Rpb25zQnlOYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uPjtcblxuICAgIGxpc3RlbmVyOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBRQ29uZmlnLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgYXV0aDogQXV0aCxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdkYicpO1xuICAgICAgICB0aGlzLmF1dGggPSBhdXRoO1xuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBjb25maWcuZGF0YWJhc2Uuc2VydmVyO1xuICAgICAgICB0aGlzLmRhdGFiYXNlTmFtZSA9IGNvbmZpZy5kYXRhYmFzZS5uYW1lO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcblxuICAgICAgICB0aGlzLnN0YXRQb3N0Q291bnQgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5wb3N0LmNvdW50LCBbXSk7XG4gICAgICAgIHRoaXMuc3RhdFBvc3RGYWlsZWQgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5wb3N0LmZhaWxlZCwgW10pO1xuXG4gICAgICAgIGNvbnN0IGNyZWF0ZURiID0gKGNvbmZpZzogUURiQ29uZmlnKTogRGF0YWJhc2UgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGIgPSBuZXcgRGF0YWJhc2Uoe1xuICAgICAgICAgICAgICAgIHVybDogYCR7ZW5zdXJlUHJvdG9jb2woY29uZmlnLnNlcnZlciwgJ2h0dHAnKX1gLFxuICAgICAgICAgICAgICAgIGFnZW50T3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBtYXhTb2NrZXRzOiBjb25maWcubWF4U29ja2V0cyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkYi51c2VEYXRhYmFzZShjb25maWcubmFtZSk7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmF1dGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdXRoUGFydHMgPSBjb25maWcuYXV0aC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIGRiLnVzZUJhc2ljQXV0aChhdXRoUGFydHNbMF0sIGF1dGhQYXJ0cy5zbGljZSgxKS5qb2luKCc6JykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRiO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGIgPSBjcmVhdGVEYihjb25maWcuZGF0YWJhc2UpO1xuICAgICAgICBjb25zdCBzbG93RGIgPSBjcmVhdGVEYihjb25maWcuc2xvd0RhdGFiYXNlKTtcblxuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zID0gW107XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnNCeU5hbWUgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgY29uc3QgYWRkQ29sbGVjdGlvbiA9IChuYW1lOiBzdHJpbmcsIGRvY1R5cGU6IFFUeXBlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb24oXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBkb2NUeXBlLFxuICAgICAgICAgICAgICAgIGxvZ3MsXG4gICAgICAgICAgICAgICAgdGhpcy5hdXRoLFxuICAgICAgICAgICAgICAgIHRoaXMudHJhY2VyLFxuICAgICAgICAgICAgICAgIHN0YXRzLFxuICAgICAgICAgICAgICAgIHRoaXMuZGIsXG4gICAgICAgICAgICAgICAgc2xvd0RiLFxuICAgICAgICAgICAgICAgIGNvbmZpZy5pc1Rlc3RzIHx8IGZhbHNlLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbnMucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbnNCeU5hbWUuc2V0KG5hbWUsIGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMgPSBhZGRDb2xsZWN0aW9uKCd0cmFuc2FjdGlvbnMnLCBUcmFuc2FjdGlvbik7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSBhZGRDb2xsZWN0aW9uKCdtZXNzYWdlcycsIE1lc3NhZ2UpO1xuICAgICAgICB0aGlzLmFjY291bnRzID0gYWRkQ29sbGVjdGlvbignYWNjb3VudHMnLCBBY2NvdW50KTtcbiAgICAgICAgdGhpcy5ibG9ja3MgPSBhZGRDb2xsZWN0aW9uKCdibG9ja3MnLCBCbG9jayk7XG4gICAgICAgIHRoaXMuYmxvY2tzX3NpZ25hdHVyZXMgPSBhZGRDb2xsZWN0aW9uKCdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyVXJsID0gYCR7ZW5zdXJlUHJvdG9jb2wodGhpcy5zZXJ2ZXJBZGRyZXNzLCAnaHR0cCcpfS8ke3RoaXMuZGF0YWJhc2VOYW1lfWA7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBuZXcgYXJhbmdvY2hhaXIobGlzdGVuZXJVcmwpO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoKSB7XG4gICAgICAgICAgICBjb25zdCB1c2VyUGFzc3dvcmQgPSBCdWZmZXIuZnJvbSh0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnJlcS5vcHRzLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IGBCYXNpYyAke3VzZXJQYXNzd29yZH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5mb3JFYWNoKGNvbGxlY3Rpb24gPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGNvbGxlY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIuc3Vic2NyaWJlKHsgY29sbGVjdGlvbjogbmFtZSB9KTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIub24obmFtZSwgKGRvY0pzb24sIHR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2luc2VydC91cGRhdGUnIHx8IHR5cGUgPT09ICdpbnNlcnQnIHx8IHR5cGUgPT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKG5hbWUsIGRvY0pzb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnTElTVEVOJywgbGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKCdlcnJvcicsIChlcnIsIHN0YXR1cywgaGVhZGVycywgYm9keSkgPT4ge1xuICAgICAgICAgICAgbGV0IGVycm9yID0gZXJyO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlcnJvciA9IEpTT04ucGFyc2UoYm9keSk7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdGQUlMRUQnLCAnTElTVEVOJywgYCR7ZXJyfWAsIGVycm9yKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5saXN0ZW5lci5zdGFydCgpLCB0aGlzLmNvbmZpZy5saXN0ZW5lci5yZXN0YXJ0VGltZW91dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShuYW1lOiBzdHJpbmcsIGRvYzogYW55KSB7XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb246IChDb2xsZWN0aW9uIHwgdHlwZW9mIHVuZGVmaW5lZCkgPSB0aGlzLmNvbGxlY3Rpb25zQnlOYW1lLmdldChuYW1lKTtcbiAgICAgICAgaWYgKGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGRyb3BDYWNoZWREYkluZm8oKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMuZm9yRWFjaCgoeDogQ29sbGVjdGlvbikgPT4geC5kcm9wQ2FjaGVkRGJJbmZvKCkpO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5sb2csICdRVUVSWScsIHsgcXVlcnksIGJpbmRWYXJzIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnMgfSk7XG4gICAgICAgICAgICByZXR1cm4gY3Vyc29yLmFsbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goeCA9PiAoY291bnQgKz0geC5maW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkcykpKTtcbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbn1cbiJdfQ==
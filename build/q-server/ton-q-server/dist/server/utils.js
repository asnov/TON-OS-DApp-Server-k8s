"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.packageJson = packageJson;
exports.cleanError = cleanError;
exports.wrap = wrap;
exports.toLog = toLog;
exports.RegistryMap = exports.QError = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function packageJson() {
  let testPath = _path.default.resolve(__dirname);

  const packagePath = () => _path.default.resolve(testPath, 'package.json');

  while (testPath && !_fs.default.existsSync(packagePath())) {
    testPath = _path.default.dirname(testPath);
  }

  return JSON.parse(_fs.default.readFileSync(packagePath(), 'utf8'));
}

function cleanError(error) {
  if ('ArangoError' in error) {
    return error.ArangoError;
  }

  delete error.request;
  delete error.response;
  return error;
}

const QErrorCode = {
  MESSAGE_EXPIRED: 10001,
  MULTIPLE_ACCESS_KEYS: 10002,
  UNAUTHORIZED: 10003,
  AUTH_SERVICE_UNAVAILABLE: 10004,
  AUTH_FAILED: 10005
};

class QError {
  static messageExpired(id, expiredAt) {
    return QError.create(QErrorCode.MESSAGE_EXPIRED, `Message expired`, {
      id,
      expiredAt,
      now: Date.now()
    });
  }

  static create(code, message, data) {
    const error = new Error(message);
    error.source = 'graphql';
    error.code = code;

    if (data !== undefined) {
      error.data = data;
    }

    return error;
  }

  static multipleAccessKeys() {
    return QError.create(QErrorCode.MULTIPLE_ACCESS_KEYS, 'Request must use the same access key for all queries and mutations');
  }

  static unauthorized() {
    return QError.create(QErrorCode.UNAUTHORIZED, 'Unauthorized');
  }

  static authServiceUnavailable() {
    return QError.create(QErrorCode.AUTH_SERVICE_UNAVAILABLE, 'Auth service unavailable');
  }

  static auth(error) {
    return QError.create(QErrorCode.AUTH_FAILED, error.message || error.description, {
      authErrorCode: error.code
    });
  }

}

exports.QError = QError;

function isInternalServerError(error) {
  if ('type' in error && error.type === 'system') {
    return true;
  }

  if ('errno' in error && 'syscall' in error) {
    return true;
  }
}

async function wrap(log, op, args, fetch) {
  try {
    return await fetch();
  } catch (err) {
    let cleaned = cleanError(err);
    log.error('FAILED', op, args, cleaned);

    if (isInternalServerError(cleaned)) {
      cleaned = QError.create(500, 'Service temporary unavailable');
    }

    throw cleaned;
  }
}

class RegistryMap {
  constructor(name) {
    this.name = name;
    this.lastId = 0;
    this.items = new Map();
  }

  add(item) {
    let id = this.lastId;

    do {
      id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
    } while (this.items.has(id));

    this.lastId = id;
    this.items.set(id, item);
    return id;
  }

  remove(id) {
    if (!this.items.delete(id)) {
      console.error(`Failed to remove ${this.name}: item with id [${id}] does not exists`);
    }
  }

  entries() {
    return [...this.items.entries()];
  }

  values() {
    return [...this.items.values()];
  }

}

exports.RegistryMap = RegistryMap;

function toLog(value, objs) {
  const typeOf = typeof value;

  switch (typeOf) {
    case "undefined":
    case "boolean":
    case "number":
    case "bigint":
    case "symbol":
      return value;

    case "string":
      if (value.length > 80) {
        return `${value.substr(0, 50)}… [${value.length}]`;
      }

      return value;

    case "function":
      return undefined;

    default:
      if (value === null) {
        return value;
      }

      if (objs && objs.includes(value)) {
        return undefined;
      }

      const newObjs = objs ? [...objs, value] : [value];

      if (Array.isArray(value)) {
        return value.map(x => toLog(x, newObjs));
      }

      const valueToLog = {};
      Object.entries(value).forEach(([n, v]) => {
        const propertyValueToLog = toLog(v, newObjs);

        if (propertyValueToLog !== undefined) {
          valueToLog[n] = propertyValueToLog;
        }
      });
      return valueToLog;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci91dGlscy5qcyJdLCJuYW1lcyI6WyJwYWNrYWdlSnNvbiIsInRlc3RQYXRoIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJwYWNrYWdlUGF0aCIsImZzIiwiZXhpc3RzU3luYyIsImRpcm5hbWUiLCJKU09OIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJjbGVhbkVycm9yIiwiZXJyb3IiLCJBcmFuZ29FcnJvciIsInJlcXVlc3QiLCJyZXNwb25zZSIsIlFFcnJvckNvZGUiLCJNRVNTQUdFX0VYUElSRUQiLCJNVUxUSVBMRV9BQ0NFU1NfS0VZUyIsIlVOQVVUSE9SSVpFRCIsIkFVVEhfU0VSVklDRV9VTkFWQUlMQUJMRSIsIkFVVEhfRkFJTEVEIiwiUUVycm9yIiwibWVzc2FnZUV4cGlyZWQiLCJpZCIsImV4cGlyZWRBdCIsImNyZWF0ZSIsIm5vdyIsIkRhdGUiLCJjb2RlIiwibWVzc2FnZSIsImRhdGEiLCJFcnJvciIsInNvdXJjZSIsInVuZGVmaW5lZCIsIm11bHRpcGxlQWNjZXNzS2V5cyIsInVuYXV0aG9yaXplZCIsImF1dGhTZXJ2aWNlVW5hdmFpbGFibGUiLCJhdXRoIiwiZGVzY3JpcHRpb24iLCJhdXRoRXJyb3JDb2RlIiwiaXNJbnRlcm5hbFNlcnZlckVycm9yIiwidHlwZSIsIndyYXAiLCJsb2ciLCJvcCIsImFyZ3MiLCJmZXRjaCIsImVyciIsImNsZWFuZWQiLCJSZWdpc3RyeU1hcCIsImNvbnN0cnVjdG9yIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiYWRkIiwiaXRlbSIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJoYXMiLCJzZXQiLCJyZW1vdmUiLCJkZWxldGUiLCJjb25zb2xlIiwiZW50cmllcyIsInZhbHVlcyIsInRvTG9nIiwidmFsdWUiLCJvYmpzIiwidHlwZU9mIiwibGVuZ3RoIiwic3Vic3RyIiwiaW5jbHVkZXMiLCJuZXdPYmpzIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwi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QixNQUFLSixLQUFLLENBQUNHLE1BQU8sR0FBaEQ7QUFDSDs7QUFDRCxhQUFPSCxLQUFQOztBQUNKLFNBQUssVUFBTDtBQUNJLGFBQU9sQyxTQUFQOztBQUNKO0FBQ0ksVUFBSWtDLEtBQUssS0FBSyxJQUFkLEVBQW9CO0FBQ2hCLGVBQU9BLEtBQVA7QUFDSDs7QUFDRCxVQUFJQyxJQUFJLElBQUlBLElBQUksQ0FBQ0ksUUFBTCxDQUFjTCxLQUFkLENBQVosRUFBa0M7QUFDOUIsZUFBT2xDLFNBQVA7QUFDSDs7QUFDRCxZQUFNd0MsT0FBTyxHQUFHTCxJQUFJLEdBQUcsQ0FBQyxHQUFHQSxJQUFKLEVBQVVELEtBQVYsQ0FBSCxHQUFzQixDQUFDQSxLQUFELENBQTFDOztBQUNBLFVBQUlPLEtBQUssQ0FBQ0MsT0FBTixDQUFjUixLQUFkLENBQUosRUFBMEI7QUFDdEIsZUFBT0EsS0FBSyxDQUFDUyxHQUFOLENBQVVDLENBQUMsSUFBSVgsS0FBSyxDQUFDVyxDQUFELEVBQUlKLE9BQUosQ0FBcEIsQ0FBUDtBQUNIOztBQUNELFlBQU1LLFVBQTZCLEdBQUcsRUFBdEM7QUFDQUMsTUFBQUEsTUFBTSxDQUFDZixPQUFQLENBQWVHLEtBQWYsRUFBc0JhLE9BQXRCLENBQThCLENBQUMsQ0FBQ0MsQ0FBRCxFQUFJQyxDQUFKLENBQUQsS0FBWTtBQUN0QyxjQUFNQyxrQkFBa0IsR0FBR2pCLEtBQUssQ0FBQ2dCLENBQUQsRUFBSVQsT0FBSixDQUFoQzs7QUFDQSxZQUFJVSxrQkFBa0IsS0FBS2xELFNBQTNCLEVBQXNDO0FBQ2xDNkMsVUFBQUEsVUFBVSxDQUFDRyxDQUFELENBQVYsR0FBZ0JFLGtCQUFoQjtBQUNIO0FBQ0osT0FMRDtBQU1BLGFBQU9MLFVBQVA7QUFoQ0o7QUFrQ0giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFja2FnZUpzb24oKTogYW55IHtcbiAgICBsZXQgdGVzdFBhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lKTtcbiAgICBjb25zdCBwYWNrYWdlUGF0aCA9ICgpID0+IHBhdGgucmVzb2x2ZSh0ZXN0UGF0aCwgJ3BhY2thZ2UuanNvbicpO1xuICAgIHdoaWxlICh0ZXN0UGF0aCAmJiAhZnMuZXhpc3RzU3luYyhwYWNrYWdlUGF0aCgpKSkge1xuICAgICAgICB0ZXN0UGF0aCA9IHBhdGguZGlybmFtZSh0ZXN0UGF0aCk7XG4gICAgfVxuICAgIHJldHVybiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYWNrYWdlUGF0aCgpLCAndXRmOCcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFuRXJyb3IoZXJyb3I6IGFueSk6IGFueSB7XG4gICAgaWYgKCdBcmFuZ29FcnJvcicgaW4gZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGVycm9yLkFyYW5nb0Vycm9yO1xuICAgIH1cbiAgICBkZWxldGUgZXJyb3IucmVxdWVzdDtcbiAgICBkZWxldGUgZXJyb3IucmVzcG9uc2U7XG4gICAgcmV0dXJuIGVycm9yO1xufVxuXG5jb25zdCBRRXJyb3JDb2RlID0ge1xuICAgIE1FU1NBR0VfRVhQSVJFRDogMTAwMDEsXG4gICAgTVVMVElQTEVfQUNDRVNTX0tFWVM6IDEwMDAyLFxuICAgIFVOQVVUSE9SSVpFRDogMTAwMDMsXG4gICAgQVVUSF9TRVJWSUNFX1VOQVZBSUxBQkxFOiAxMDAwNCxcbiAgICBBVVRIX0ZBSUxFRDogMTAwMDUsXG59O1xuXG5leHBvcnQgY2xhc3MgUUVycm9yIHtcbiAgICBzdGF0aWMgbWVzc2FnZUV4cGlyZWQoaWQ6IHN0cmluZywgZXhwaXJlZEF0OiBudW1iZXIpOiBFcnJvciB7XG4gICAgICAgIHJldHVybiBRRXJyb3IuY3JlYXRlKFFFcnJvckNvZGUuTUVTU0FHRV9FWFBJUkVELCBgTWVzc2FnZSBleHBpcmVkYCwge1xuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICBleHBpcmVkQXQsXG4gICAgICAgICAgICBub3c6IERhdGUubm93KCksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGUoY29kZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiBFcnJvciB7XG4gICAgICAgIGNvbnN0IGVycm9yOiBhbnkgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIGVycm9yLnNvdXJjZSA9ICdncmFwaHFsJztcbiAgICAgICAgZXJyb3IuY29kZSA9IGNvZGU7XG4gICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGVycm9yLmRhdGEgPSBkYXRhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9XG5cbiAgICBzdGF0aWMgbXVsdGlwbGVBY2Nlc3NLZXlzKCkge1xuICAgICAgICByZXR1cm4gUUVycm9yLmNyZWF0ZShcbiAgICAgICAgICAgIFFFcnJvckNvZGUuTVVMVElQTEVfQUNDRVNTX0tFWVMsXG4gICAgICAgICAgICAnUmVxdWVzdCBtdXN0IHVzZSB0aGUgc2FtZSBhY2Nlc3Mga2V5IGZvciBhbGwgcXVlcmllcyBhbmQgbXV0YXRpb25zJyxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgdW5hdXRob3JpemVkKCkge1xuICAgICAgICByZXR1cm4gUUVycm9yLmNyZWF0ZShRRXJyb3JDb2RlLlVOQVVUSE9SSVpFRCwgJ1VuYXV0aG9yaXplZCcpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhdXRoU2VydmljZVVuYXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gUUVycm9yLmNyZWF0ZShRRXJyb3JDb2RlLkFVVEhfU0VSVklDRV9VTkFWQUlMQUJMRSwgJ0F1dGggc2VydmljZSB1bmF2YWlsYWJsZScpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhdXRoKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBRRXJyb3IuY3JlYXRlKFFFcnJvckNvZGUuQVVUSF9GQUlMRUQsXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlIHx8IGVycm9yLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgeyBhdXRoRXJyb3JDb2RlOiBlcnJvci5jb2RlIH0sXG4gICAgICAgIClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzSW50ZXJuYWxTZXJ2ZXJFcnJvcihlcnJvcjogRXJyb3IpOiBib29sZWFuIHtcbiAgICBpZiAoJ3R5cGUnIGluIGVycm9yICYmIGVycm9yLnR5cGUgPT09ICdzeXN0ZW0nKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoJ2Vycm5vJyBpbiBlcnJvciAmJiAnc3lzY2FsbCcgaW4gZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JhcDxSPihsb2c6IFFMb2csIG9wOiBzdHJpbmcsIGFyZ3M6IGFueSwgZmV0Y2g6ICgpID0+IFByb21pc2U8Uj4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbGV0IGNsZWFuZWQgPSBjbGVhbkVycm9yKGVycik7XG4gICAgICAgIGxvZy5lcnJvcignRkFJTEVEJywgb3AsIGFyZ3MsIGNsZWFuZWQpO1xuICAgICAgICBpZiAoaXNJbnRlcm5hbFNlcnZlckVycm9yKGNsZWFuZWQpKSB7XG4gICAgICAgICAgICBjbGVhbmVkID0gUUVycm9yLmNyZWF0ZSg1MDAsICdTZXJ2aWNlIHRlbXBvcmFyeSB1bmF2YWlsYWJsZScpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGNsZWFuZWQ7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVnaXN0cnlNYXA8VD4ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpdGVtczogTWFwPG51bWJlciwgVD47XG4gICAgbGFzdElkOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSAwO1xuICAgICAgICB0aGlzLml0ZW1zID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGFkZChpdGVtOiBUKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGlkID0gdGhpcy5sYXN0SWQ7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGlkID0gaWQgPCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA/IGlkICsgMSA6IDE7XG4gICAgICAgIH0gd2hpbGUgKHRoaXMuaXRlbXMuaGFzKGlkKSk7XG4gICAgICAgIHRoaXMubGFzdElkID0gaWQ7XG4gICAgICAgIHRoaXMuaXRlbXMuc2V0KGlkLCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIHJlbW92ZShpZDogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5pdGVtcy5kZWxldGUoaWQpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVtb3ZlICR7dGhpcy5uYW1lfTogaXRlbSB3aXRoIGlkIFske2lkfV0gZG9lcyBub3QgZXhpc3RzYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRyaWVzKCk6IFtudW1iZXIsIFRdW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMuZW50cmllcygpXTtcbiAgICB9XG5cbiAgICB2YWx1ZXMoKTogVFtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLnZhbHVlcygpXTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0xvZyh2YWx1ZTogYW55LCBvYmpzPzogT2JqZWN0W10pOiBhbnkge1xuICAgIGNvbnN0IHR5cGVPZiA9IHR5cGVvZiB2YWx1ZTtcbiAgICBzd2l0Y2ggKHR5cGVPZikge1xuICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICBjYXNlIFwiYmlnaW50XCI6XG4gICAgY2FzZSBcInN5bWJvbFwiOlxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gODApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHt2YWx1ZS5zdWJzdHIoMCwgNTApfeKApiBbJHt2YWx1ZS5sZW5ndGh9XWBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9ianMgJiYgb2Jqcy5pbmNsdWRlcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV3T2JqcyA9IG9ianMgPyBbLi4ub2JqcywgdmFsdWVdIDogW3ZhbHVlXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUubWFwKHggPT4gdG9Mb2coeCwgbmV3T2JqcykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlVG9Mb2c6IHsgW3N0cmluZ106IGFueSB9ID0ge307XG4gICAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlKS5mb3JFYWNoKChbbiwgdl0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5VmFsdWVUb0xvZyA9IHRvTG9nKHYsIG5ld09ianMpO1xuICAgICAgICAgICAgaWYgKHByb3BlcnR5VmFsdWVUb0xvZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVUb0xvZ1tuXSA9IHByb3BlcnR5VmFsdWVUb0xvZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWx1ZVRvTG9nXG4gICAgfVxufVxuIl19
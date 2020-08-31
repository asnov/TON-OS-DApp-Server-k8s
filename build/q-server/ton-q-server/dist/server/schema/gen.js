"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.leadingSpacesCount = leadingSpacesCount;
exports.multiline = multiline;
exports.makeFieldTypeName = makeFieldTypeName;
exports.Writer = void 0;

function leadingSpacesCount(s) {
  let count = 0;

  while (count < s.length && (s[count] === ' ' || s[count] === '\t')) {
    count += 1;
  }

  return count;
}

function multiline(s) {
  s = s.replace("\r\n", "\n").replace("\n\r", "\n").replace("\r", "\n");

  if (!s.startsWith("\n")) {
    return s;
  }

  const lines = s.split("\n");

  if (lines.length < 2) {
    return s;
  }

  let leadingSpacesToRemove = Math.min(...lines.filter(l => l.trim() !== '').map(leadingSpacesCount));

  for (let i = 1; i < lines.length; i += 1) {
    const leadingSpaces = leadingSpacesCount(lines[i]);

    if (leadingSpaces === lines[i].length) {
      lines[i] = '';
    } else if (leadingSpaces >= leadingSpacesToRemove) {
      lines[i] = lines[i].substr(leadingSpacesToRemove);
    }
  }

  if (lines[lines.length - 1] === '') {
    lines.splice(lines.length - 1, 1);
  }

  lines.splice(0, 1);
  return lines.join('\n');
}

class Writer {
  constructor() {
    this.parts = [];
  }

  clear() {
    this.parts = [];
  }

  generated() {
    return this.parts.join('');
  }

  write(...strings) {
    this.parts.push(...strings);
  }

  writeLn(...strings) {
    this.write(...strings, '\n');
  }

  writeBlock(text) {
    this.write(multiline(text));
  }

  writeBlockLn(text) {
    this.writeLn(multiline(text));
  }

}

exports.Writer = Writer;

function convertFirstLetterToUpperCase(s) {
  return s !== '' ? `${s.substr(0, 1).toUpperCase()}${s.substr(1)}` : s;
}

function convertFirstLetterToLowerCase(s) {
  return s !== '' ? `${s.substr(0, 1).toLowerCase()}${s.substr(1)}` : s;
}

function toPascalStyle(s) {
  return s.split('_').map(convertFirstLetterToUpperCase).join('');
}

function toCamelStyle(s) {
  return convertFirstLetterToLowerCase(toPascalStyle(s));
}

function makeFieldTypeName(typeName, fieldName) {
  return `${typeName}${toPascalStyle(fieldName)}`;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZ2VuLmpzIl0sIm5hbWVzIjpbImxlYWRpbmdTcGFjZXNDb3VudCIsInMiLCJjb3VudCIsImxlbmd0aCIsIm11bHRpbGluZSIsInJlcGxhY2UiLCJzdGFydHNXaXRoIiwibGluZXMiLCJzcGxpdCIsImxlYWRpbmdTcGFjZXNUb1JlbW92ZSIsIk1hdGgiLCJtaW4iLCJmaWx0ZXIiLCJsIiwidHJpbSIsIm1hcCIsImkiLCJsZWFkaW5nU3BhY2VzIiwic3Vic3RyIiwic3BsaWNlIiwiam9pbiIsIldyaXRlciIsImNvbnN0cnVjdG9yIiwicGFydHMiLCJjbGVhciIsImdlbmVyYXRlZCIsIndyaXRlIiwic3RyaW5ncyIsInB1c2giLCJ3cml0ZUxuIiwid3JpdGVCbG9jayIsInRleHQiLCJ3cml0ZUJsb2NrTG4iLCJjb252ZXJ0Rmlyc3RMZXR0ZXJUb1VwcGVyQ2FzZSIsInRvVXBwZXJDYXNlIiwiY29udmVydEZpcnN0TGV0dGVyVG9Mb3dlckNhc2UiLCJ0b0xvd2VyQ2FzZSIsInRvUGFzY2FsU3R5bGUiLCJ0b0NhbWVsU3R5bGUiLCJtYWtlRmllbGRUeXBlTmFtZSIsInR5cGVOYW1lIiwiZmllbGROYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQU8sU0FBU0Esa0JBQVQsQ0FBNEJDLENBQTVCLEVBQStDO0FBQ2xELE1BQUlDLEtBQUssR0FBRyxDQUFaOztBQUNBLFNBQU9BLEtBQUssR0FBR0QsQ0FBQyxDQUFDRSxNQUFWLEtBQXFCRixDQUFDLENBQUNDLEtBQUQsQ0FBRCxLQUFhLEdBQWIsSUFBb0JELENBQUMsQ0FBQ0MsS0FBRCxDQUFELEtBQWEsSUFBdEQsQ0FBUCxFQUFvRTtBQUNoRUEsSUFBQUEsS0FBSyxJQUFJLENBQVQ7QUFDSDs7QUFDRCxTQUFPQSxLQUFQO0FBQ0g7O0FBRU0sU0FBU0UsU0FBVCxDQUFtQkgsQ0FBbkIsRUFBc0M7QUFDekNBLEVBQUFBLENBQUMsR0FBR0EsQ0FBQyxDQUFDSSxPQUFGLENBQVUsTUFBVixFQUFrQixJQUFsQixFQUF3QkEsT0FBeEIsQ0FBZ0MsTUFBaEMsRUFBd0MsSUFBeEMsRUFBOENBLE9BQTlDLENBQXNELElBQXRELEVBQTRELElBQTVELENBQUo7O0FBQ0EsTUFBSSxDQUFDSixDQUFDLENBQUNLLFVBQUYsQ0FBYSxJQUFiLENBQUwsRUFBeUI7QUFDckIsV0FBT0wsQ0FBUDtBQUNIOztBQUNELFFBQU1NLEtBQWUsR0FBR04sQ0FBQyxDQUFDTyxLQUFGLENBQVEsSUFBUixDQUF4Qjs7QUFDQSxNQUFJRCxLQUFLLENBQUNKLE1BQU4sR0FBZSxDQUFuQixFQUFzQjtBQUNsQixXQUFPRixDQUFQO0FBQ0g7O0FBQ0QsTUFBSVEscUJBQXFCLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxDQUFTLEdBQUdKLEtBQUssQ0FBQ0ssTUFBTixDQUFhQyxDQUFDLElBQUlBLENBQUMsQ0FBQ0MsSUFBRixPQUFhLEVBQS9CLEVBQW1DQyxHQUFuQyxDQUF1Q2Ysa0JBQXZDLENBQVosQ0FBNUI7O0FBQ0EsT0FBSyxJQUFJZ0IsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR1QsS0FBSyxDQUFDSixNQUExQixFQUFrQ2EsQ0FBQyxJQUFJLENBQXZDLEVBQTBDO0FBQ3RDLFVBQU1DLGFBQWEsR0FBR2pCLGtCQUFrQixDQUFDTyxLQUFLLENBQUNTLENBQUQsQ0FBTixDQUF4Qzs7QUFDQSxRQUFJQyxhQUFhLEtBQUtWLEtBQUssQ0FBQ1MsQ0FBRCxDQUFMLENBQVNiLE1BQS9CLEVBQXVDO0FBQ25DSSxNQUFBQSxLQUFLLENBQUNTLENBQUQsQ0FBTCxHQUFXLEVBQVg7QUFDSCxLQUZELE1BRU8sSUFBSUMsYUFBYSxJQUFJUixxQkFBckIsRUFBNEM7QUFDL0NGLE1BQUFBLEtBQUssQ0FBQ1MsQ0FBRCxDQUFMLEdBQVdULEtBQUssQ0FBQ1MsQ0FBRCxDQUFMLENBQVNFLE1BQVQsQ0FBZ0JULHFCQUFoQixDQUFYO0FBQ0g7QUFDSjs7QUFDRCxNQUFJRixLQUFLLENBQUNBLEtBQUssQ0FBQ0osTUFBTixHQUFlLENBQWhCLENBQUwsS0FBNEIsRUFBaEMsRUFBb0M7QUFDaENJLElBQUFBLEtBQUssQ0FBQ1ksTUFBTixDQUFhWixLQUFLLENBQUNKLE1BQU4sR0FBZSxDQUE1QixFQUErQixDQUEvQjtBQUNIOztBQUNESSxFQUFBQSxLQUFLLENBQUNZLE1BQU4sQ0FBYSxDQUFiLEVBQWdCLENBQWhCO0FBQ0EsU0FBT1osS0FBSyxDQUFDYSxJQUFOLENBQVcsSUFBWCxDQUFQO0FBRUg7O0FBR00sTUFBTUMsTUFBTixDQUFhO0FBR2hCQyxFQUFBQSxXQUFXLEdBQUc7QUFDVixTQUFLQyxLQUFMLEdBQWEsRUFBYjtBQUNIOztBQUVEQyxFQUFBQSxLQUFLLEdBQUc7QUFDSixTQUFLRCxLQUFMLEdBQWEsRUFBYjtBQUNIOztBQUVERSxFQUFBQSxTQUFTLEdBQVc7QUFDaEIsV0FBTyxLQUFLRixLQUFMLENBQVdILElBQVgsQ0FBZ0IsRUFBaEIsQ0FBUDtBQUNIOztBQUVETSxFQUFBQSxLQUFLLENBQUMsR0FBR0MsT0FBSixFQUF1QjtBQUN4QixTQUFLSixLQUFMLENBQVdLLElBQVgsQ0FBZ0IsR0FBR0QsT0FBbkI7QUFDSDs7QUFFREUsRUFBQUEsT0FBTyxDQUFDLEdBQUdGLE9BQUosRUFBdUI7QUFDMUIsU0FBS0QsS0FBTCxDQUFXLEdBQUdDLE9BQWQsRUFBdUIsSUFBdkI7QUFDSDs7QUFFREcsRUFBQUEsVUFBVSxDQUFDQyxJQUFELEVBQWU7QUFDckIsU0FBS0wsS0FBTCxDQUFXdEIsU0FBUyxDQUFDMkIsSUFBRCxDQUFwQjtBQUNIOztBQUNEQyxFQUFBQSxZQUFZLENBQUNELElBQUQsRUFBZTtBQUN2QixTQUFLRixPQUFMLENBQWF6QixTQUFTLENBQUMyQixJQUFELENBQXRCO0FBQ0g7O0FBNUJlOzs7O0FBK0JwQixTQUFTRSw2QkFBVCxDQUF1Q2hDLENBQXZDLEVBQTBEO0FBQ3RELFNBQU9BLENBQUMsS0FBSyxFQUFOLEdBQ0EsR0FBRUEsQ0FBQyxDQUFDaUIsTUFBRixDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWVnQixXQUFmLEVBQTZCLEdBQUVqQyxDQUFDLENBQUNpQixNQUFGLENBQVMsQ0FBVCxDQUFZLEVBRDdDLEdBRURqQixDQUZOO0FBR0g7O0FBRUQsU0FBU2tDLDZCQUFULENBQXVDbEMsQ0FBdkMsRUFBMEQ7QUFDdEQsU0FBT0EsQ0FBQyxLQUFLLEVBQU4sR0FDQSxHQUFFQSxDQUFDLENBQUNpQixNQUFGLENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZWtCLFdBQWYsRUFBNkIsR0FBRW5DLENBQUMsQ0FBQ2lCLE1BQUYsQ0FBUyxDQUFULENBQVksRUFEN0MsR0FFRGpCLENBRk47QUFHSDs7QUFFRCxTQUFTb0MsYUFBVCxDQUF1QnBDLENBQXZCLEVBQTBDO0FBQ3RDLFNBQU9BLENBQUMsQ0FBQ08sS0FBRixDQUFRLEdBQVIsRUFBYU8sR0FBYixDQUFpQmtCLDZCQUFqQixFQUFnRGIsSUFBaEQsQ0FBcUQsRUFBckQsQ0FBUDtBQUNIOztBQUVELFNBQVNrQixZQUFULENBQXNCckMsQ0FBdEIsRUFBeUM7QUFDckMsU0FBT2tDLDZCQUE2QixDQUFDRSxhQUFhLENBQUNwQyxDQUFELENBQWQsQ0FBcEM7QUFDSDs7QUFFTSxTQUFTc0MsaUJBQVQsQ0FBMkJDLFFBQTNCLEVBQTZDQyxTQUE3QyxFQUF3RTtBQUMzRSxTQUFRLEdBQUVELFFBQVMsR0FBRUgsYUFBYSxDQUFDSSxTQUFELENBQVksRUFBOUM7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBsZWFkaW5nU3BhY2VzQ291bnQoczogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHdoaWxlIChjb3VudCA8IHMubGVuZ3RoICYmIChzW2NvdW50XSA9PT0gJyAnIHx8IHNbY291bnRdID09PSAnXFx0JykpIHtcbiAgICAgICAgY291bnQgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNvdW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbXVsdGlsaW5lKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcyA9IHMucmVwbGFjZShcIlxcclxcblwiLCBcIlxcblwiKS5yZXBsYWNlKFwiXFxuXFxyXCIsIFwiXFxuXCIpLnJlcGxhY2UoXCJcXHJcIiwgXCJcXG5cIik7XG4gICAgaWYgKCFzLnN0YXJ0c1dpdGgoXCJcXG5cIikpIHtcbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfVxuICAgIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IHMuc3BsaXQoXCJcXG5cIik7XG4gICAgaWYgKGxpbmVzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfVxuICAgIGxldCBsZWFkaW5nU3BhY2VzVG9SZW1vdmUgPSBNYXRoLm1pbiguLi5saW5lcy5maWx0ZXIobCA9PiBsLnRyaW0oKSAhPT0gJycpLm1hcChsZWFkaW5nU3BhY2VzQ291bnQpKTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpbmVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IGxlYWRpbmdTcGFjZXMgPSBsZWFkaW5nU3BhY2VzQ291bnQobGluZXNbaV0pO1xuICAgICAgICBpZiAobGVhZGluZ1NwYWNlcyA9PT0gbGluZXNbaV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICBsaW5lc1tpXSA9ICcnO1xuICAgICAgICB9IGVsc2UgaWYgKGxlYWRpbmdTcGFjZXMgPj0gbGVhZGluZ1NwYWNlc1RvUmVtb3ZlKSB7XG4gICAgICAgICAgICBsaW5lc1tpXSA9IGxpbmVzW2ldLnN1YnN0cihsZWFkaW5nU3BhY2VzVG9SZW1vdmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChsaW5lc1tsaW5lcy5sZW5ndGggLSAxXSA9PT0gJycpIHtcbiAgICAgICAgbGluZXMuc3BsaWNlKGxpbmVzLmxlbmd0aCAtIDEsIDEpO1xuICAgIH1cbiAgICBsaW5lcy5zcGxpY2UoMCwgMSk7XG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xuXG59XG5cblxuZXhwb3J0IGNsYXNzIFdyaXRlciB7XG4gICAgcGFydHM6IHN0cmluZ1tdO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFydHMgPSBbXTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5wYXJ0cyA9IFtdO1xuICAgIH1cblxuICAgIGdlbmVyYXRlZCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJ0cy5qb2luKCcnKTtcbiAgICB9XG5cbiAgICB3cml0ZSguLi5zdHJpbmdzOiBzdHJpbmdbXSkge1xuICAgICAgICB0aGlzLnBhcnRzLnB1c2goLi4uc3RyaW5ncyk7XG4gICAgfVxuXG4gICAgd3JpdGVMbiguLi5zdHJpbmdzOiBzdHJpbmdbXSkge1xuICAgICAgICB0aGlzLndyaXRlKC4uLnN0cmluZ3MsICdcXG4nKTtcbiAgICB9XG5cbiAgICB3cml0ZUJsb2NrKHRleHQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLndyaXRlKG11bHRpbGluZSh0ZXh0KSk7XG4gICAgfVxuICAgIHdyaXRlQmxvY2tMbih0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy53cml0ZUxuKG11bHRpbGluZSh0ZXh0KSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0Rmlyc3RMZXR0ZXJUb1VwcGVyQ2FzZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBzICE9PSAnJ1xuICAgICAgICA/IGAke3Muc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCl9JHtzLnN1YnN0cigxKX1gXG4gICAgICAgIDogcztcbn1cblxuZnVuY3Rpb24gY29udmVydEZpcnN0TGV0dGVyVG9Mb3dlckNhc2Uoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcyAhPT0gJydcbiAgICAgICAgPyBgJHtzLnN1YnN0cigwLCAxKS50b0xvd2VyQ2FzZSgpfSR7cy5zdWJzdHIoMSl9YFxuICAgICAgICA6IHM7XG59XG5cbmZ1bmN0aW9uIHRvUGFzY2FsU3R5bGUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcy5zcGxpdCgnXycpLm1hcChjb252ZXJ0Rmlyc3RMZXR0ZXJUb1VwcGVyQ2FzZSkuam9pbignJyk7XG59XG5cbmZ1bmN0aW9uIHRvQ2FtZWxTdHlsZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBjb252ZXJ0Rmlyc3RMZXR0ZXJUb0xvd2VyQ2FzZSh0b1Bhc2NhbFN0eWxlKHMpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lOiBzdHJpbmcsIGZpZWxkTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dHlwZU5hbWV9JHt0b1Bhc2NhbFN0eWxlKGZpZWxkTmFtZSl9YDtcbn1cbiJdfQ==
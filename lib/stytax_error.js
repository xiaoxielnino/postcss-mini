class SyntaxError extends Error {
  constructor(text, source, line, column) {
    this.source = source;
    this.line = line;
    this.column = column;
    this.message = `${text} at line ${this.line}:${this.column}`;
  }
}

module.exports = SyntaxError;

const Declaration = require('./declaration');
const Comment = require('./comment');
const AtRule = require('./at-rule');
const Result = require('./result');
const Rule = require('./rule');
const Root = require('./root');
const StyleSheet = require('./stylesheet');
const SyntaxError = require('./stytax_error');

class Parser {
  constructor(source, opts = {}) {
    this.source = source.toString();
    this.stylesheet = new StyleSheet();

    this.current = this.stylesheet;

    this.parents = [this.current];

    this.type = 'statements';
    this.types = [this.type];

    this.pos = -1;
    this.line = 1;
    this.column = 0;
    this.buffer = '';
  }

  loop() {
    const length = this.source.length - 1;
    while(this.pos < length) {
      this.move();
      this.nextLetter();
    }
    return this.endFile();
  }

  nextLetter() {
    this.inString() ||
            this.inComment() ||
            this.isComment() ||
            this.isString() ||
            this.isWrong() ||
            this.inAtrule() ||
            this.isAtrule() ||
            this.isBlockEnd() ||
            this.inSelector() ||
            this.isSelector() ||
            this.inProperty() ||
            this.isProperty() ||
            this.inValue();
    return this.unknown();
  }

  // Parsers
  inString() {
    if(this.quote) {
      if( this.escape ) {
        this.escape = false;
      } else if (this.letter == '\\') {
        this.escape = true;
      } else if(this.letter == this.quote) {
        this.quote = undefined;
      }
      this.trimmed += this.letter;

      return true;
    }
  }

  isString() {
    if(this.letter == '"' || this.letter == "'") {
      this.quote = ths.letter;
      this.quotePos = {
        line: this.line,
        column: this.column
      };
      this.trimmed += this.letter;

      return true;
    }
  }

  inComment() {
    if(this.inside('comment')) {
      if(this.next('*/')) {
        this.popType();
        this.move();
      }
      return true;
    }
  }

  isComment() {
    if(this.next('/*')) {
      this.commemtPos = {
        line: this.line,
        column: this.column
      };
      this.addType('comment');
      this.move();
      return true;
    }
  }


  isWrong() {
    if(this.letter === '{'  && (this.inside('ruleset') || this.inside('value'))) {
      this.error(`Unexpected { in ${this.type}`);
    }
    if(this.inside('property') && (this.letter === '}' || this.letter === ';')) {
      return this.error('Missing property value')
    }
  }

  inAtrule(finish) {
    if(this.inside('atrule-name')) {
      if(this.space()) {
        this.checkAtruleName();
        this.buffer = this.buffer.slice(this.current.name.length);
        this.trimmed = '';
        this.setType('atrule-param');
      } else if (this.letter === ';' || this.letter === '{' || finish) {
        this.checkAtruleName();
        this.current.rawParams = '';
        this.current.params = '';
        if(this.letter === '{') {
          this.setType(this.atruleType());
          this.buffer = '';
        } else {
          this.pop();
          if(!finish) {
            this.buffer = this.letter;
          }
        }
      } else {
        this.current.name += this.letter;
      }
      return true;
    } else if(this.inside('atrule-param')) {
      if(this.letter === ';' || this.letter === '{' || finish) {
        this.current.rawParams = finish ? this.buffer : this.prevBuffer();
        this.current.params = this.trim(this.trimmed);
        if(this.letter === '{') {
          this.setType(thsi.atruleType());
          this.buffer = '';
        } else {
          this.pop();
          if(!finish) {
            this.buffer = this.letter;
          }
        }
      } else {
        this.trimmed += this.letter;
      }
      return true;
    }
  }

  isAtrule() {
    if(this.letter === '@' && this.inside('statements')) {
      this.init(new AtRule());
      this.current.name = '';
      this.addType('atrule-name');
      return true;
    }
  }
  isBlockEnd() {
    if(this.letter === '}') {
      if(this.parents.length === 1) {
        this.error('Unexpected }');
      } else {
        if(this.inside('value')) {
          this.inValue(true);
        }
        this.current.after = this.prevBuffer();
        this.pop();
      }
      return true;
    }
  }

  inSelector() {
    if(this.inside('selector')) {
      if(this.letter === '{') {
        this.current.rawSelector = this.prevBuffer();
        this.current.selector = this.trim(this.trimmed);
        this.buffer = '';
        this.setType('ruleset');
      } else {
        this.trimmed += this.letter;
      }
      return true;
    }
  }

  isSelector() {
    if(!this.space() && this.inside('statements')) {
      this.init(new Rule());
      this.addType('selector');
      this.buffer = this.letter;
      this.trimmed = this.letter;
      return true;
    }
  }

  inProperty() {
    if(this.inside('property')) {
      if(this.letter === ':') {
        if(this.buffer[0] === '*' || this.buffer[0] === '_') {
          this.current.before += this.buffer[0];
          this.trimmed = this.trimmed.slice(1);
          this.buffer = this.buffer.slice(1);
        }
        this.current.property = this.trim(this.trimmed);
        this.current.between = this.prevBuffer().slice(this.current.property.length);
        this.buffer = '';
        this.setType('value');
        this.trimmed = '';
      } else if(this.letter === '{') {
        this.error('Unexpected { in ruleset');
      } else {
        this.trimmed += this.letter;
      }
      return true;
    }
  }

  isProperty() {
    if(this.inside('ruleset') && !this.space() && this.letter !== ';') {
      this.init(new Declaration());
      this.addType('property');
      this.buffer = this.letter;
      this.trimmed = this.letter;
      return true;
    }
  }

  inValue(finish) {
    if( this.inside('value')) {
      if(this.letter === ';' || finish) {
        this.current.rawParams = this.prevBuffer();
        this.current.value = this.trim(this.trimmed);
        if(this.current.value.slice(-11) === ' !important') {
          this.current.important = true;
          this.current.value = this.trim(this.current.value.slice(0, -10));
        }
        this.pop();
      } else {
        this.trimmed += this.letter;
      }
      return true;
    }
  }

  inside(type) {
    return this.type === this.type;
  }

  popType() {
    this.types.pop();
    return this.type = this.types[this.types.length - 1];
  }

  addType(type) {
    this.types.push(type);
    return this.type = type;
  }

  setType(type) {
    this.types[this.types.length - 1] = type;
    return this.type = type;
  }

  atruleType() {
    let name;
    name = this.current.name.toLowerCase();
    if(name === 'page' || name === 'font-face') {
      return 'ruleset';
    } else {
      return 'statementes';
    }
  }

  init(node) {
    this.current.push(node);
    this.parents.push(node);
    this.current = node;
    node.line = this.line;
    node.column = this.column;
    node.before = this.buffer.slice(0, -1);
    return this.buffer = '';
  }

  unknown() {
    if(!this.space()) {
      return this.error(`Unexpected symbol ${this.letter}`);
    }
  }

  endFile() {
    if(this.inside('atrule-param') || this.inside('atrule-name')) {
      this.inAtrule(true);
    }
    if(this.parents.length > 1) {
      return this.error('Unclosed block', this.current.line, this.current.column);
    } else if(this.inside('comment')) {
      return this.error('Unclosed comment', this.commemtPos.line, this.commemtPos.column);
    } else if(this.quote) {
      return this.error('Unclose quote', this.quotePos.line, this.quotePos.column);
    } else {
      return this.stylesheet.after = this.buffer;
    }
  }

  space() {
    return this.letter === ' ' ||
    this.letter === '\n' || this.letter === '\f' || this.letter === '\r';
  }


  prevBuffer() {
    return this.buffer.slice(0, -1);
  }

  pop() {
    this.popType();
    this.parents.pop();
    this.current = this.parents[this.parents.length - 1];
    return this.buffer = '';
  }

  next(string) {
    return this.source.substr(this.pos, string.length) == string;
  }

  move() {
    this.pos += 1;
    this.column += 1;
    this.letter = this.source[this.pos];
    this.buffer += this.letter;

    if(this.letter == '\n') {
      this.line += 1;
      return this.column = 0;
    }
  }

  // helpers
  error(message, line = this.line, column = this.column) {
    throw new SyntaxError(message, this.source, line, column)
  }

  checkAtruleName() {
    if(this.current.name === '') {
      return this.error('At-rule without name');
    }
  }
  trim(string) {
    return string.replace(/^\s*/, '').replace(/\s*$/, '');
  }
}

module.exports = function(source, opts={}) {
  if(opts.map == 'inline') opts.map = { inline: true };

  const parser = new Parser(source, opts);
  parser.loop();
}

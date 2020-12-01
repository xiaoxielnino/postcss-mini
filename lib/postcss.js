const Declaration = require('./declaration');
const Comment = require('./comment');
const AtRule = require('./at-rule');
const Result = require('./result');
const Rule = require('./rule');
const Root = require('./root');

class PostCSS {
  constructor(processors = []) {
    this.processors = processors;
  }

  // add another funciton to CSS processors
  use(processor) {
    this.processors.push(processor);
    return this;
  }

  // process CSS throw installed processors
  process(css, opts = { }) {
    if(opts.map == 'inline') opts.map = { inline: true };

    let parsed;
    if(css instanceof Root) {
      parsed = css;
    } else if (css instanceof Result) {
      parsed = css.root;
    } else {
      parsed = postcss.parse(css, opts);
    }

    for( let processor of this.processors) {
      const returned = processor(parsed);
      if( returned instanceof Root) parsed = returned;
    }

    return parsed.toResult(opts);
  }
}

const postcss = function(...processors) {
  return new PostCSS(processors);
}

// compile css to nodes
postcss.parse = require('./parse');

// nodes shortcuts
postcss.comment = function(defaults) {
  return new Comment(defaults);
}

postcss.atRule = function(defaults) {
  return new AtRule(defaults);
}

postcss.decl = function(defaults) {
  return new Declaration(defaults);
}

postcss.rule = function(defaults) {
  return new Rule(defaults);
}

postcss.root = function(defaults) {
  return new Root(defaults);
}

module.exports = postcss;

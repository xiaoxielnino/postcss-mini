class Rule {

  constructor() {
    this.type = 'rule';
    this.decls = [];
  }

  push(decl) {
    return this.decls.push(decl);
  }
}

module.exports = Rule;

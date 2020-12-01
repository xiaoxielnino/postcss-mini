class AtRule {
  constructor() {
    this.type = 'atrule';
  }

  push(obj) {
    if(obj.type === 'decl') {
      this.decls || (this.decls = []);
      return this.decls.push(obj);
    } else {
      this.childs || (this.childs = []);
      return this.childs.push(obj);
    }
  }
}

module.exports = AtRule;

class StyleSheet {
  constructor() {
    this.childs = [];
  }

  // add rule or atrule statement
  push(child) {
    return this.childs.push(child);
  }

  // stringify styles
  toString() {
    return '';
  }
}

module.exports = StyleSheet;

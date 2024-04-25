const {Point, Range} = require('atom');

const {AbcLanguage} =require('./language');
const asciidoctor = require('@asciidoctor/core')();
const HEADING_REGEX = /^(=={0,5}|#\#{0,5})[ \t]+(.+?)(?:[ \t]+\1)?$/gm;

class AdocLanguage extends AbcLanguage {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
    this.sectionLevels = {};
  }

  parse() {
    let text = this.buffer.getText();

    let doc = asciidoctor.load(text);
    let rawHeadings = this.getHeadings(doc);
    return this._stackHeadings(rawHeadings);
  }

  getHeadings(doc) {
    return this._processHeadings(doc);
  }

  getRowCounts(doc) {
    let context = doc.getContent();
    const newlineRegex = /\r?\n/g;
    const matchCount = context.match(newlineRegex)?.length ?? 0;
    const lastCharIsNewline = context.endsWith('\n') || context.endsWith('\r');
    return matchCount + (lastCharIsNewline ? 0 : 1);
  }

  _processDoc(doc, start=1) {
    let level = doc.getLevel() + 1;
    let title = doc.getTitle() || doc.getName() || 'Untitled';
    let row = this.getRowCounts(doc);
    let headingStart = new Point(start, 1);
    let headingEnd = new Point(start+row, 1);
    let heading = {
      level: level,
      headingRange: new Range(headingStart, headingEnd),
      plainText: title,
      children: [],
      row: row,
      range: new Range(headingStart, Point.INFINITY),
      startPosition: headingStart,
      endPosition: Point.INFINITY
    };
    return heading;
  }

  _processHeadings(doc, rawHeadings=[], cur=0) {
    let node = this._processDoc(doc, cur);
    rawHeadings.push(node);
    if (!doc.hasSections()) {
      return rawHeadings;
    }
    let sbcur = cur;
    let sections = doc.getSections();
    let section;
    for (let i = 0; i < sections.length; i++) {
      section = sections[i];
      this._processHeadings(section, rawHeadings, sbcur);
      sbcur = sbcur + this.getRowCounts(section);
      
    }
    
    return rawHeadings;
  }
}

module.exports = {AdocLanguage};

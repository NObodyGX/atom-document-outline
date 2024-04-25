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
    console.log("hahah, enter parse asciidoc")
    let text = this.buffer.getText();

    let doc = asciidoctor.load(text);
    let rawHeadings = this.getHeadings(doc);
    return this._stackHeadings(rawHeadings);
  }

  getHeadings(doc) {
    let rawHeadings = [];
    if (!doc.hasSections()) {
        return rawHeadings;
    }
    let cur = 0;
    let level = 0;
    let heading;
    let headingStart = new Point(0, 0);
    let headingEnd = new Point(1, 0);
    
    let title = doc.getTitle();
    cur += title.length;

    heading = {
      level: level + 1,
      headingRange: new Range(headingStart, headingEnd),
      plainText: title,
      children: [],
      range: new Range(headingStart, Point.INFINITY),
      startPosition: headingStart,
      endPosition: Point.INFINITY
    };
    rawHeadings.push(heading);

    let sections = doc.getSections();
    for (let i = 0; i < sections.length; i++) {
      let sec = sections[i];
      level = sec.getLevel();
      title = sec.getTitle();
      headingStart = new Point(sec.getLineNumber(), 0)
      headingEnd = new Point(sec.getLineNumber(), title.length)
      heading = {
        level: level + 1,
        headingRange: new Range(headingStart, headingEnd),
        plainText: title,
        children: [],
        range: new Range(headingStart, Point.INFINITY),
        startPosition: headingStart,
        endPosition: Point.INFINITY
      };

      rawHeadings.push(heading);
      cur += sec.getContent().length;
    }
    
    return rawHeadings;
  }
}

module.exports = {AdocLanguage};

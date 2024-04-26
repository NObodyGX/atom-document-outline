const {AbcLanguage} =require('./abclanguage');
const HEADING_REGEX = /^(={1,6})[ \t]+(.+?)(?:[ \t]+\1)?$/gm;

class AdocLanguage extends AbcLanguage {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
  }

  parseRegexData(scanResult) {
    return {
      level: scanResult[1].length,
      label: scanResult[2]
    };
  }
}

module.exports = {AdocLanguage};

#!/usr/bin/env node --harmony
const defaults = {
  excludes: ['_windup.scss']
};

// Depends
const FS = require('fs');
const PATH = require('path');
const getFiles = require('./get-files');
const ROOT_PATH = './scss';
const jsonfile = require('jsonfile');

class Tenacity {
  constructor(options) {
    this.options = Object.assign({}, defaults, options);
    this.init();
  }
  removeWhiteSpace(str) {
    return str.replace(/ /g, '');
  }
  removeNewLine(str) {
    return str.replace(/\r?\n|\r/g, '');
  }
  removeComment(str) {
    return this.removeWhiteSpace(
      this.removeNewLine(
        str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
      )
    );
  }
  objectifySass(globalContent) {
    const data = {};
    const contentArray = globalContent.split(';');
    contentArray.forEach(styleProperties => {
      const styleProperty = styleProperties.replace(':', '\x01').split('\x01');
      data[styleProperty[0]] = styleProperty[1];
    });
    return data;
  }
  getSassData(dirData, filename) {
    const [{ content }] = dirData.children.filter(
      child => child.name === filename
    );
    const cleanContent = this.removeComment(content);
    return this.objectifySass(cleanContent);
  }
  writeJsonFile(data) {
    var file = './styleguide.json';
    jsonfile.writeFile(file, data, { spaces: 2 }, function(err) {
      console.error(err);
    });
  }
  init() {
    const dirData = getFiles(ROOT_PATH, this.options);
    console.log(JSON.stringify(dirData, null, 4));
    const globalData = this.getSassData(dirData, '_global.scss');
    const overridesData = this.getSassData(dirData, '_overrides.scss');
    const mergedData = Object.assign({}, globalData, overridesData);
    this.writeJsonFile(mergedData);
  }
}

new Tenacity();
// module.exports = Tenacity;
// module.exports.Options = Tenacity;

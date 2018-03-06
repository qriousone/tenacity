#!/usr/bin/env node --harmony

// Depends
const _ = require('lodash');
const FS = require('fs');
const PATH = require('path');
const getFiles = require('./get-files');
const ROOT_PATH = './scss';
const camelCase = require('camelcase');
const jsonfile = require('jsonfile');

const defaults = {
  scssDir: './scss',
  jsonDir: './',
  excludes: ['_windup.scss']
};

class Tenacity {
  constructor(options) {
    this.options = Object.assign({}, defaults, options);
    //this.init();
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
      if (styleProperty[1]) {
        const styleName = camelCase(styleProperty[0].replace('$', ''));
        data[styleName] = styleProperty[1];
      }
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
    const file = PATH.join(this.options.jsonDir, 'styleguide.json');
    jsonfile.writeFile(file, data, { spaces: 2 }, err => {
      if (err) {
        console.error(err);
      } else {
        console.log('\x1b[1m%s\x1b[0m', 'TENACITY');
        console.log(
          '\x1b[32m%s\x1b[0m',
          `${PATH.basename(this.options.scssDir)} converted to ${PATH.basename(
            file
          )}`
        );
      }
    });
  }
  init() {
    const dirData = getFiles(this.options.scssDir, this.options);
    const globalData = this.getSassData(dirData, '_global.scss');
    const overridesData = this.getSassData(dirData, '_overrides.scss');
    const mergedData = _.merge(globalData, overridesData);
    const file = PATH.join(this.options.jsonDir, 'styleguide.json');
    jsonfile.readFile(file, (err, syleguideJsonData) => {
      if (!_.isEqual(syleguideJsonData, mergedData)) {
        this.writeJsonFile(mergedData);
      }
    });
  }
  apply(compiler) {
    compiler.plugin('done', () => {
      this.init();
    });
  }
}

//new Tenacity();

module.exports = Tenacity;
module.exports.Options = Tenacity;

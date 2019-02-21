/** Loads the yaml tables and sections conf and generates the routes */

const fs = require('fs')
const yaml = require('js-yaml');
const map = require('lodash.map')
const flatten = require('lodash.flatten')
const fromPairs = require('lodash.frompairs')

const {generateTables} = require('./csv')
const resolver = require('./resolver')
const {getTitle} = require('../services/i18n')

async function loadSectionFile(file) {
  const fileName = file.replace('.yaml', '')
  const textContent = fs.readFileSync(`./tables/${file}`, 'utf8')
  const yamlContent = yaml.safeLoad(textContent)
  const resolvedDesc = await resolver.resolveSection(yamlContent)
  return [fileName, resolvedDesc]
}

async function loadParametersTrees() {
  const sectionsFiles = fs.readdirSync('./tables')
  const resolvedFiles = await Promise.all(sectionsFiles.map(loadSectionFile))
  return fromPairs(resolvedFiles)
}

async function loadRoutes() {
  const parametersTrees = await loadParametersTrees()
  const routes = map(parametersTrees, extractRoutes)
  return flatten(routes)
}

function addLeadingSlash(string) {
  return string.startsWith('/') ? string : `/${string}`
}

function buildEnRoute(frRoute) {
  return {
    route: '/en' + frRoute.route,
    page: frRoute.page,
    query: Object.assign({}, frRoute.query, {lang: 'en'})
  }
}

function buildSectionRoutes(path, parameter) {
  const frRoute = {
    route: addLeadingSlash(path),
    page: '/section',
    query: {section: parameter, lang: 'fr'}
  }
  return [frRoute, buildEnRoute(frRoute)]
}

function buildPageRoutes(path, parameter, parents) {
  const frRoute = {
      route: addLeadingSlash(path),
      page: '/table',
      query: {parameter: parameter.table, parents, lang: 'fr'}
      }
  return [frRoute, buildEnRoute(frRoute)]
}

function extractRoutes(parameter, path, parametersTree, parents = []) {
  const isPage = ! parents.length
  if (parameter.table) {
    // generateTables(parameter.table, path)
    return buildPageRoutes(path, parameter, parents)
  }
  if (parameter.subparams) {
    const subRoutes = flatten(map(parameter.subparams, (child, key) => {
      return extractRoutes(
        child,
        `${path}/${key}`,
        parametersTree,
        parents.concat(
          [{path: isPage && path, title: getTitle(parameter)}]
          )
        )
    }))
    return isPage ? buildSectionRoutes(path, parameter).concat(subRoutes) : subRoutes
  }
}

module.exports = {
  extractRoutes,
  loadRoutes,
}

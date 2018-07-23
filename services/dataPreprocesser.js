/** Process a parameterNode so that the data it contains are easily exploitable by React-Table */

import map from 'lodash.map';
import mapValues from 'lodash.mapvalues';
import flatten from 'lodash.flatten';
import flow from 'lodash.flow';
import merge from 'lodash.merge';
import union from 'lodash.union';
import keys from 'lodash.keys'
import last from 'lodash.last'
import fromPairs from 'lodash.frompairs'
import isPlainObject from 'lodash.isplainobject'


export default function extractData(parameterNode) {
  const values = extractValues(parameterNode)
  const dates = union(...map(values, keys)).sort()
  return dates.reduce((data, date) => {
    return data.concat([merge(
      {},
      last(data),
      {date},
      fromPairs(
        map(values, (paramValues, paramKey) => {
          return [paramKey, paramValues[date]]
        })
      )
    )])
  }, []).reverse()
}

export function extractValuesFromScale(scale) {
  const bracketsValues = flow([
    x => map(x, (scaleAtInstant, date) => {
      const thresolds = keys(scaleAtInstant).sort((x, y) => Number(x) - Number(y))
      return thresolds.map((thresold, index) => {
        const prefix = `${scale.id}.${index}`
        const thresoldKey = `${prefix}.thresold`
        const valueKey = `${prefix}.value`
        const data = {}
        data[thresoldKey] = {}
        data[valueKey] = {}
        data[thresoldKey][date] = {value: Number(thresold)}
        data[valueKey][date] = {value: scaleAtInstant[thresold]}
        return data
      })
    }),
    x => flatten(x),
    x => merge({}, ...x),
  ])(scale.brackets)

  const dates = union(...map(bracketsValues, keys))

  return mapValues(bracketsValues, (bracketValues, bracketsName) => {
    for (const date of dates) {
      if (! bracketValues[date]) {
        bracketValues[date] = null
      }
    }
    return bracketValues
  })
}

function getUnitAtDate(units, date) {
  if (! isPlainObject(units)) {
    return units
  }
  const unitChangeDates = keys(units).sort().reverse()
  return units[
    unitChangeDates.find(unitChangeDate => date >= unitChangeDate)
  ]
}

export function extractValues(parameterNode) {
  if (parameterNode.values) {
    const data = {}
    const unit = parameterNode.metadata && parameterNode.metadata.unit
    data[parameterNode.id] = mapValues(parameterNode.values,
      (value, date) => ({value, unit: getUnitAtDate(unit, date)})
    )
    return data
  }
  if (parameterNode.brackets) {
    return extractValuesFromScale(parameterNode)
  }
  return flow([
    x => map(x, extractValues),
    x => merge({}, ...x)
    ])(parameterNode.children || parameterNode)  // parameterNode.children for nodes coming straight for the Web API, parameterNode for custom nodes
}

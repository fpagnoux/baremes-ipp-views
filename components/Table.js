import isPlainObject from 'lodash.isplainobject'
import isArray from 'lodash.isarray'

import {formatNumber, formatDate} from '../services/formatter'

function cellFormatter(value, metadata) {
  if ((! value && value !== 0) || ! metadata || ! metadata.unit) {
    return value
  }
  if (metadata.unit == '/1') {
    return formatNumber(value, { style: 'percent'})
  }
  if (metadata.unit.startsWith('currency')) {
    const currency = metadata.unit.split('-')[1]
    return formatNumber(value, { style: 'currency', currency})
  }
  return value
}

function renderHeader(columns, index) {
  return <tr key={index}>
    {columns.map((column, index2) => (
      <th
        key={index2}
        colSpan={column.colSpan}
        rowSpan={column.rowSpan || 1}
        style={{flex: `${column.width || 1} 0 auto`, 'minWidth': `${(column.width || 1) * 100}px`}}
        >
        {column.source // Add edition link only for leaf columns
          ? <span className="edit-link">{column.Header}<br/><a target="_blank" href={column.source}>Edit</a></span>
          : column.Header
        }
      </th>
    ))}
  </tr>
}

function renderReference(reference) {
  if (isPlainObject(reference)) {
    return <a href={reference.href} target="_blank">{reference.title}</a>
  }
  if (isArray(reference)) {
    return reference.map((item, idx) => <span key={idx}>{renderReference(item)}<br/></span>)
  }
  return reference
}

function renderDatum(datum, column) {
  const value = column.accessor(datum)
  if (column.id == 'date') {
    return formatDate(value)
  }
  if (column.id == 'reference') {
    return renderReference(value)
  }
  if (isPlainObject(value)) {
    return cellFormatter(value.value, value)
  }
  return cellFormatter(value)
}

function renderData(data, dataColumns) {
  return data.map((datum, index) => {
    return <tr key={index}>
        {dataColumns.map((column, index2) => {
          return <td
            key={index2}
            colSpan={column.colSpan}
            style={{flex: `${column.width || 1} 0 auto`, 'width': `100px`}}
            >
            <span>{renderDatum(datum, column)}</span>
          </td>
        })}
      </tr>
  })
}

const Table = ({table}) => {
  const {headers, data, columns} = table
  return <div id="table-container"><table>
    <thead>
      {headers.map(renderHeader)}
    </thead>
    <tbody>
      {renderData(data, columns)}
    </tbody>
  </table></div>
}

export default Table

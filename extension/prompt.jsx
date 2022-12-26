import browser from 'webextension-polyfill'
import {render} from 'react-dom'
import React from 'react'
import kinds from './kinds.json'

import {getAllowedCapabilities} from './common'

function Prompt() {
  let qs = new URLSearchParams(location.search)
  let id = qs.get('id')
  let host = qs.get('host')
  let level = parseInt(qs.get('level'))
  let params
  try {
    params = JSON.parse(qs.get('params'))
  } catch (err) {
    params = null
  }

// console.log('params.event: ', params.event)
// console.log('Kind: ', kinds.list[(JSON.parse(params.event.kind))])

  return (
    <>
    <main className='prompt'>
      <div>
        <b style={{display: 'block', textAlign: 'center', fontSize: '200%'}}>
          {host}
        </b>{' '}
        <p>is requesting your permission to </p>
        <ul>
          {getAllowedCapabilities(level).map(cap => (
            <li key={cap}>
              <i>{cap}</i>
            </li>
          ))}
        </ul>
      </div>
      {params.event ? (
        <>
        <div className='json-fields'>
          <p>Now acting on:</p>
          <div className='params'>
            {Object.entries(params.event).map(([key, value]) => {
              if (key === 'content' && value[0] === '{' && !Array.isArray(value)) {
                return (
                  <>
                  <div>{key}:</div>
                  <table>
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(JSON.parse(value)).map(([k, v]) => {
                            <tr key={k}>
                              <td>{k}</td>
                              <td>{v}</td>
                            </tr>
                          })}
                    </tbody>
                  </table>
                  </>
                );
              } else if (key === 'tags' && Array.isArray(value) && Array.length > 0) {
                return (
                  <p className='tags'>{key}: {value.join(',&nbsp;')}</p>
                );
              } else if (key === 'kind'){
                return (
                  <p>{key}: {value}_{kinds.list[(JSON.parse(params.event.kind))]}</p>
                )
              } else {
                return (
                  <p>{key}: {value}</p>
                );
              }
            })}
          </div>
          </div>
        </>
      ) : null}
      <div className='sign-selection'>
        <button
          className='forever-btn'
          onClick={authorizeHandler('forever')}
        >
          authorize forever
        </button>
        <button
          className='expireable-btn'
          onClick={authorizeHandler('expirable')}
        >
          authorize for 5 minutes
        </button>
        <button className='single-btn' onClick={authorizeHandler('single')}>
          authorize just this
        </button>
        <button className='no-btn' onClick={authorizeHandler('no')}>
          cancel
        </button>
      </div>
    </main>
    </>
  )

  function authorizeHandler(condition) {
    return function (ev) {
      ev.preventDefault()
      browser.runtime.sendMessage({
        prompt: true,
        id,
        host,
        level,
        condition
      })
    }
  }
}

render(<Prompt />, document.getElementById('main'))

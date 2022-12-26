import browser from 'webextension-polyfill'
import React, {useState, useCallback, useEffect} from 'react'
import {render} from 'react-dom'
import {normalizeRelayURL} from 'nostr-tools/relay'
import {generatePrivateKey} from 'nostr-tools/keys'

import {getPermissionsString, readPermissions} from './common'

function Options() {
  let [key, setKey] = useState('')
  let [relays, setRelays] = useState([])
  let [newRelayURL, setNewRelayURL] = useState('')
  let [permissions, setPermissions] = useState()
  let [message, setMessage] = useState('')
  let [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showMessage = useCallback(msg => {
    setMessage(msg)
    setTimeout(setMessage, 3000)
  })

  useEffect(() => {
    browser.storage.local.get(['private_key', 'relays']).then(results => {
      if (results.private_key) setKey(results.private_key)
      if (results.relays) {
        let relaysList = []
        for (let url in results.relays) {
          relaysList.push({
            url,
            policy: results.relays[url]
          })
        }
        setRelays(relaysList)
      }
    })
  }, [])

  useEffect(() => {
    readPermissions().then(permissions => {
      setPermissions(
        Object.entries(permissions).map(
          ([host, {level, condition, created_at}]) => ({
            host,
            level,
            condition,
            created_at
          })
        )
      )
    })
  }, [])

  return (
    <>
    <main className='options'>
      <section className='header'>
      <span className='logo'>
        <img src="./icons/astral.svg"/>
      </span>
      <span className='astral-1'>astral</span><span className='astral-2'>Sign</span>
      </section>
      <p className='astral-desc'>nostr signer extension</p>
      <h2 className='title'>options</h2>
      <label>
        private key:&nbsp;
        <input type={isPasswordVisible ? "text" : "password"} value={key} onChange={handleKeyChange} />
        <button onClick={() => handlePasswordVisibility()}>
        {isPasswordVisible ? "Hide private key" : "Show private key"}
        </button>
      </label>
      {permissions?.length > 0 && (
        <>
          <h2>permissions</h2>
          <table>
            <thead>
              <tr>
                <th>domain</th>
                <th>permissions</th>
                <th>condition</th>
                <th>since</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(({host, level, condition, created_at}) => (
                <tr key={host}>
                  <td>{host}</td>
                  <td>{getPermissionsString(level)}</td>
                  <td>{condition}</td>
                  <td>
                    {new Date(created_at * 1000)
                      .toISOString()
                      .split('.')[0]
                      .split('T')
                      .join(' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <div>{message}</div>
      </main>
    </>
  )

  async function handleKeyChange(e) {
    let key = e.target.value.toLowerCase().trim()
    setKey(key)
  }

  async function generate(e) {
    setKey(generatePrivateKey())
  }

  async function saveKey() {
    await browser.storage.local.set({
      private_key: key
    })
    showMessage('saved private key!')
  }

  function changeRelayURL(i, ev) {
    setRelays([
      ...relays.slice(0, i),
      {url: ev.target.value, policy: relays[i].policy},
      ...relays.slice(i + 1)
    ])
  }

  function toggleRelayPolicy(i, cat) {
    setRelays([
      ...relays.slice(0, i),
      {
        url: relays[i].url,
        policy: {...relays[i].policy, [cat]: !relays[i].policy[cat]}
      },
      ...relays.slice(i + 1)
    ])
  }

  function addNewRelay() {
    relays.push({
      url: normalizeRelayURL(newRelayURL),
      policy: {read: true, write: true}
    })
    setRelays(relays)
    setNewRelayURL('')
  }

  async function saveRelays() {
    await browser.storage.local.set({
      relays: Object.fromEntries(
        relays
          .filter(({url}) => url.trim() !== '')
          .map(({url, policy}) => [url.trim(), policy])
      )
    })
    showMessage('saved relays!')
  }

  function handlePasswordVisibility() {
    setIsPasswordVisible(!isPasswordVisible);
  }
}

render(<Options />, document.getElementById('main'))

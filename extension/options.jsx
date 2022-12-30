import browser from 'webextension-polyfill'
import React, {useState, useCallback, useEffect} from 'react'
import {render} from 'react-dom'
import {normalizeRelayURL} from 'nostr-tools/relay'
import {generatePrivateKey} from 'nostr-tools/keys'
import { generateSeedWords, privateKeyFromSeed, seedFromWords, validateWords } from 'nostr-tools/nip06'

import {getPermissionsString, readPermissions, removePermission, updatePermission} from './common'

function Options() {
  let [key, setKey] = useState('')
  let [relays, setRelays] = useState([])
  let [newRelayURL, setNewRelayURL] = useState('')
  let [permissions, setPermissions] = useState([])
  let [message, setMessage] = useState('')
  let [mnemonic, setMnemonic] = useState('')
  let [mnemonicKey, setMnemonicKey] = useState('')
  let [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const showMessage = useCallback(msg => {
    setMessage(msg)
    setTimeout(setMessage, 3000)
  })

  useEffect(() => {
    browser.storage.local.get(['private_key', 'relays', 'mnemonic']).then(results => {
      if (results.private_key) setKey(results.private_key)
      if (results.mnemonic) setMnemonic(results.mnemonic)
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

  console.log('permissions', permissions)
  console.log('local browser storage', browser.storage.local)

  return (
    <>
    <main className='options'>
      <section className="header">
        <span className="logo">
          <img src="./icons/astral.svg" />
        </span>
        <span className="astral-1">astral</span>
        <span className="astral-2">Sign</span>
      </section>
      <p className="astral-desc">nostr signer extension</p>
      <h2 className="title">options</h2>
      <div style={{marginBottom: '10px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <span>preferred relays:</span>
          <button onClick={saveRelays}>save</button>
        </div>
        <div style={{marginLeft: '10px'}}>
          {relays.map(({url, policy}, i) => (
            <div key={i} style={{display: 'flex'}}>
              <input
                style={{marginRight: '10px', width: '400px'}}
                value={url}
                onChange={changeRelayURL.bind(null, i)}
              />
              <label>
                read
                <input
                  type="checkbox"
                  checked={policy.read}
                  onChange={toggleRelayPolicy.bind(null, i, 'read')}
                />
              </label>
              <label>
                write
                <input
                  type="checkbox"
                  checked={policy.write}
                  onChange={toggleRelayPolicy.bind(null, i, 'write')}
                />
              </label>
            </div>
          ))}
          <div style={{display: 'flex'}}>
            <input
              style={{width: '400px'}}
              value={newRelayURL}
              onChange={e => setNewRelayURL(e.target.value)}
              onBlur={addNewRelay}
            />
          </div>
        </div>
      </div>
      <div>
        <label>
          <div>private key:&nbsp;</div>
          <div style={{marginLeft: '10px'}}>
            <div style={{display: 'flex'}}>
              <input
                style={{width: '500px'}}
                value={key}
                type={isPasswordVisible ? 'text' : 'password'}
                onChange={handleKeyChange}
              />
              {key === '' && <button onClick={generate}>generate</button>}
            </div>
            <button onClick={() => handlePasswordVisibility()}>
              {isPasswordVisible ? 'Hide private key' : 'Show private key'}
            </button>
            <button
              disabled={!(key.match(/^[a-f0-9]{64}$/) || key === '')}
              onClick={saveKey}
            >
              save
            </button>
          </div>
          <button onClick={() => handleMnemonic()}>generate Mnemonic</button>
          <p>{mnemonic}</p>

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
                {permissions.map(({host, level, condition, created_at}, index) => (
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
                    <td>{index}</td>
                    <td>
                      <button onClick={() => handlePermissionRemove(index)}>Remove Permission</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
      <div style={{marginTop: '12px', fontSize: '120%'}}>{message}</div>
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
      private_key: key,
      mnemonic: mnemonic
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
    setIsPasswordVisible(!isPasswordVisible)
  }

  async function handlePermissionRemove(index) {
    try {
      permissions.splice(index, 1);
      await browser.storage.local.set({ permissions });
      window.location.reload()
      console.log(permissions)
    } catch {
      console.log('error removing permission')
    }
  }

  function handleMnemonic() {
    let mnemonic = generateSeedWords()
    setMnemonic(mnemonic)
    if (!!validateWords(mnemonic)) {
      let seed = seedFromWords(mnemonic)
      let seedKey = privateKeyFromSeed(seed)
      setMnemonicKey(seedKey)
      setKey(mnemonicKey)
      console.log(key)
    }
  }
}

render(<Options />, document.getElementById('main'))

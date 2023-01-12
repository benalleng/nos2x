import browser from 'webextension-polyfill'
import {render} from 'react-dom'
import {getPublicKey} from 'nostr-tools'
import {bech32} from 'bech32'
import React, {useState, useRef, useEffect} from 'react'

import logotype from './assets/icons/logotype.png'

function Popup() {
  let [key, setKey] = useState('')
  let keys = useRef([])

  useEffect(() => {
    browser.storage.local.get('private_key').then(results => {
      if (results.private_key) {
<<<<<<< HEAD:extension/popup.jsx
        let hexKey = getPublicKey(results.private_key)
        let npubKey = bech32.encode(
          'npub',
          bech32.toWords(Buffer.from(hexKey, 'hex'))
        )

        setKey(npubKey)

        keys.current.push(hexKey)
        keys.current.push(npubKey)
=======
        setKey(getPublicKey(results.private_key))
>>>>>>> 7a9f73a6cf8fd4b474dbece9f85c1174d9a53200:src/popup.jsx
      } else {
        setKey(null)
      }
    })
  }, [])

  function goToOptionsPage() {
    browser.tabs.create({
      url: browser.runtime.getURL('options.html'),
      active: true
    })
  }

  return (
    <>
      <h1>
        <img src={logotype} alt="nos2x" />
      </h1>
      {key === null ? (
        <p>
          you don't have a private key set. use the{' '}
          <a href="#" onClick={goToOptionsPage}>
            options page
          </a>{' '}
          to set one.
        </p>
      ) : (
        <>
          <p>
            <a onClick={toggleKeyType}>↩️</a> your public key:
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              width: '100px'
            }}
          >
            <code>{key}</code>
          </pre>
          <p>
            <a className="button" href="#" onClick={goToOptionsPage}>
              ⚙️ Options
            </a>
          </p>
        </>
      )}
    </>
  )

  function toggleKeyType(e) {
    e.preventDefault()
    let nextKeyType =
      keys.current[(keys.current.indexOf(key) + 1) % keys.current.length]
    setKey(nextKeyType)
  }
}

render(<Popup />, document.getElementById('main'))

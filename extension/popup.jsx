import browser from 'webextension-polyfill'
import * as clipboard from 'clipboard-polyfill';
import {render} from 'react-dom'
import {getPublicKey} from 'nostr-tools'
import {bech32} from 'bech32'
import React, {useState, useRef, useEffect} from 'react'

function Popup() {
  let [key, setKey] = useState('')
  let keys = useRef([])
  let [tooltipText, setTooltipText] = useState("Click to copy!");

  useEffect(() => {
    browser.storage.local.get('private_key').then(results => {
      if (results.private_key) {
        let hexKey = getPublicKey(results.private_key)
        let npubKey = bech32.encode(
          'npub',
          bech32.toWords(Buffer.from(hexKey, 'hex'))
        )

        setKey(npubKey)

        keys.current.push(hexKey)
        keys.current.push(npubKey)
      } else {
        setKey(null)
      }
    })
  }, [])

  return (
    <>
    <main className='popup'>
    <section className='header'>
        <span className='logo'>
          <img src="./icons/astral.svg"/>
        </span>
      <span className='astral-1'>astral</span><span className='astral-2'>Sign</span>
      </section>
      {key === null ? (
        <p style={{width: '150px'}}>
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
          <b>Your public key:</b>
          <pre className='public-key-field'>
            <code onClick={() => handleCopyText()} id="public-key">{key}</code>
          </pre>
          <span className="tooltip">{tooltipText}</span>
          <p>
            <small>
              Key{' '}
              <a className='options-link' href="#" onClick={goToOptionsPage}>
                options
              </a>
            </small>
          </p>
        </>
      )}
      </main>
    </>
  )

  function toggleKeyType(e) {
    e.preventDefault()
    let nextKeyType =
      keys.current[(keys.current.indexOf(key) + 1) % keys.current.length]
    setKey(nextKeyType)
  function goToOptionsPage() {
    browser.tabs.create({
      url: browser.runtime.getURL('options.html'),
      active: true
    })
  }

  async function handleCopyText() {
    try {
      await clipboard.writeText(key);
      setTooltipText("Copied!");
    } catch (error) {
      setTooltipText("Failed to Copy text")
      console.log(error)
    }
  }
}
}

render(<Popup />, document.getElementById('main'))

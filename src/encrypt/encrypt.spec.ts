import * as Mocha from 'mocha'
import * as Encrypt from './encrypt'
import * as BoxKeyPair from '../ed25519/box_keypair'
import * as BoxKeyPairFixture from '../ed25519/box_keypair.fixture'
import * as RecipientPublicKey from '../header/recipient_public_key'
import * as FS from 'fs'
import * as Path from 'path'
import { strict as assert } from 'assert'

Mocha.describe('Encrypt', () => {
  Mocha.describe('build', () => {
    Mocha.it('should round trip', function (done) {
      this.timeout(5000)

      const path = Path.join(__dirname, '..', '..', 'fixture', 'Big_Buck_Bunny_1080_10s_5MB.mp4')
      const bytes = FS.statSync(path).size
      const input = Buffer.alloc(bytes)
      console.log(bytes)

      const senderKeyPair: BoxKeyPair.Value = BoxKeyPairFixture.alice
      const bob: BoxKeyPair.Value = BoxKeyPair.generate()
      const carol: BoxKeyPair.Value = BoxKeyPair.generate()
      const recipients = [bob, carol]
      const recipientPublicKeys: RecipientPublicKey.Values = [
        bob,
        carol
      ].map(kp => kp.publicKey)
      const visibleRecipients: boolean = false

      const encryptStream = Encrypt.Encrypt(
        senderKeyPair,
        recipientPublicKeys,
        visibleRecipients
      )

      let finished = 0
      for (const recipient of recipients) {
        const decryptStream = Encrypt.Decrypt(
          recipient
        )
        const output = Buffer.alloc(bytes)
        let outputOffset = 0
        decryptStream.on('data', (data:Buffer) => {
          data.copy(output, outputOffset)
          outputOffset += data.length
          assert.ok(outputOffset <= bytes)
        })
        // This should not happen, for debugging the tests only.
        decryptStream.on('error', (error:Error) => console.warn(recipient.publicKey.toString(), error))

        encryptStream.on('data', (data:Buffer) => {
          console.log('encrypt data')
          if (!decryptStream.destroyed) {
            decryptStream.write(data)
          }
        })

        decryptStream.on('end', () => {
          assert.deepEqual(input, output)
          console.log('decrypt end')
          finished++
          if (finished === recipients.length) {
            console.log(input)
            done()
          }
        })
      }

      const badRecipient = BoxKeyPair.generate()
      let badAttempted = false
      const badStream = Encrypt.Decrypt(badRecipient)
      badStream.on('data', (data:Buffer) => assert.ok(false))
      badStream.on('error', (error:Error) => assert.ok(('' + error).includes('error":"no payload key found for our keypair')))
      encryptStream.on('data', (data:Buffer) => {
        if (badAttempted) {
          console.log('bad attempted')
          assert.ok(badStream.destroyed)
        }
        // Decrypt streams are destroyed when there is an error.
        if (!badStream.destroyed) {
          console.log('bad attempted not destroyed')
          badStream.write(data)
          badAttempted = true
        }
      })

      encryptStream.on('end', () => {
        console.log('encrypt end')
      })

      const dataStream = FS.createReadStream(path)
      let inputOffset = 0
      dataStream.on('data', (data:Buffer) => {
        data.copy(input, inputOffset)
        inputOffset += data.length
        encryptStream.write(data)
      })
      // encrypt streams must always end() or they will not flush correctly!
      dataStream.on('end', () => {
        console.log('data end')
        encryptStream.end()
      })

    })
  })
})

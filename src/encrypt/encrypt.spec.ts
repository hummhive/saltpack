import * as Encrypt from './encrypt'
import * as BoxKeyPair from '../ed25519/box_keypair'
import * as BoxKeyPairFixture from '../ed25519/box_keypair.fixture'
import * as RecipientPublicKey from '../header/recipient_public_key'
import { strict as assert } from 'assert'

describe('Encrypt', () => {
 describe('build', () => {

  it('should construct', () => {

   let senderKeyPair: BoxKeyPair.Value = BoxKeyPairFixture.alice
   let bob: BoxKeyPair.Value = BoxKeyPair.generate()
   let carol: BoxKeyPair.Value = BoxKeyPair.generate()
   let recipientPublicKeys: RecipientPublicKey.Values = [
    bob,
    carol,
   ].map(kp => kp.publicKey)
   let visibleRecipients: boolean = false

   let encrypt = new Encrypt.Encrypt(
    senderKeyPair,
    recipientPublicKeys,
    visibleRecipients,
   )

   console.log(encrypt.headerWire().toString())

  })

 })
})

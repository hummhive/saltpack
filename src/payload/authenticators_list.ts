import * as Crypto from 'crypto'
import timingSafeEqual from 'timing-safe-equal'
import * as MacTag from './mac_tag'
import * as Sha512 from '../ed25519/sha512'
import * as FinalFlag from './final_flag'
import * as Mac from '../header/mac'
import * as Nonce from '../nonce/nonce'
import * as PayloadSecretBox from './payload_secretbox'
import * as NaCl from 'tweetnacl'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'
import * as C from 'io-ts/Codec'

// > The authenticators list contains 32-byte HMAC tags, one for each recipient,
// > which authenticate the payload secretbox together with the message header.
// > These are computed with the MAC keys derived from the header. See below.
//
// > Computing the MAC keys is the only step of encrypting a message that
// > requires the sender's private key. Thus it's the authenticators list,
// > generated from those keys, that proves the sender is authentic. We also
// > include the hash of the entire header as an input to the authenticators, to
// > prevent an attacker from modifying the format version or any other header
// > fields.
export type Value = Array<MacTag.Value>

export type Encoded = Array<MacTag.Encoded>

export const decoder: D.Decoder<unknown, Value> = D.array(MacTag.decoder)
export const encoder: E.Encoder<Encoded, Value> = {
  encode: (v: Value) => v.map(MacTag.Codec.encode)
}

export const Codec: C.Codec<unknown, Encoded, Value> = C.make(decoder, encoder)

const buildHash = (
  headerHash:Sha512.Value,
  payloadIndex:number,
  finalFlag:FinalFlag.Value,
  payloadSecretBox:PayloadSecretBox.Value
) => {
  // 1. Concatenate the header hash, the nonce for the payload secretbox, the
  //    final flag byte (0x00 or 0x01), and the payload secretbox itself.
  const bytes = Uint8Array.from([
    ...headerHash,
    ...Nonce.indexed(PayloadSecretBox.NONCE_PREFIX, payloadIndex),
    ...Uint8Array.from([finalFlag]),
    ...Uint8Array.from(payloadSecretBox)
  ])

  // 2. Compute the crypto_hash (SHA512) of the bytes from #1.
  return NaCl.hash(bytes)
}

// We compute the authenticators in three steps:
export const calculate = (
  headerHash:Sha512.Value,
  finalFlag:FinalFlag.Value,
  payloadSecretBox:PayloadSecretBox.Value,
  payloadIndex:number,
  recipientMacKey:Mac.Value
):MacTag.Value => {
  const hash = buildHash(
    headerHash,
    payloadIndex,
    finalFlag,
    payloadSecretBox
  )

  // 3. For each recipient, compute the crypto_auth (HMAC-SHA512, truncated to 32
  //    bytes) of the hash from #2, using that recipient's MAC key.
  const hmac = Crypto
    .createHmac('sha512', recipientMacKey)
    .update(hash)
    .digest()

  return hmac.slice(0, 32)
}

export const verify = (
  headerHash:Sha512.Value,
  finalFlag:FinalFlag.Value,
  payloadSecretBox:PayloadSecretBox.Value,
  payloadIndex:number,
  recipientMacKey:Mac.Value,
  authenticator: Uint8Array
):boolean => {
  // recipients must first verify the authenticator by repeating steps #1 and #2
  // and then calling crypto_auth_verify.
  const hash = buildHash(
    headerHash,
    payloadIndex,
    finalFlag,
    payloadSecretBox
  )

  const hmac = Crypto.createHmac('sha512', recipientMacKey)
  hmac.write(hash)
  hmac.end()
  const signature: Uint8Array = hmac.read()

  // Constant time compare.
  return timingSafeEqual(
    Buffer.from(Array.from(signature.slice(0, 32))),
    Buffer.from(Array.from(authenticator))
  )
}

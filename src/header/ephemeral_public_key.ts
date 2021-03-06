import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'
import * as C from 'io-ts/Codec'
import * as PublicKey from '../ed25519/public_key'

// > The ephemeral public key is a NaCl public encryption key, 32 bytes. The
// > ephemeral keypair is generated at random by the sender and only used for
// > one message.
export type Value = PublicKey.Value
export type Encoded = PublicKey.Encoded

export const Codec = PublicKey.Codec

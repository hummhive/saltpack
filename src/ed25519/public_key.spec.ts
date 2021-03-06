import * as PublicKey from './public_key'
import * as MP from '../messagepack/messagepack'
import 'mocha'
import { strict as assert } from 'assert'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

describe('PublicKey', () => {
 describe('PublicKey', () => {
  const testPackValue = (tests:Array<[PublicKey.Value, PublicKey.Encoded, MP.Value]>) => {
   for (let test of tests) {
    let [value, encoded, packed] = test
    assert.deepEqual(encoded, PublicKey.Codec.encode(value))
    assert.deepEqual(packed, MP.Codec.encode(PublicKey.Codec.encode(value)))
    assert.deepEqual(E.right(encoded), MP.Codec.decode(MP.Codec.encode(PublicKey.Codec.encode(value))))
    assert.deepEqual(E.right(value), pipe(
     MP.Codec.encode(PublicKey.Codec.encode(value)),
     MP.Codec.decode,
     E.chain(PublicKey.Codec.decode),
    ))
   }
  }

  it('each PublicKey has the correct pack value', () => {
   testPackValue([
    [
     Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]),
     Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]),
     Uint8Array.from([196, 32, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]),
    ]
   ])
  })
 })

 it('has some error handling', () => {
  // this error happens when a runtime value is structurally sound according to
  // the typescript type system but doesn't have the right length
  assert.ok(
   E.isLeft(
    PublicKey.Codec.decode(Uint8Array.from([1])),
   )
  )

  // this error happens when a runtime unpack subverts typescript type rails
  assert.ok(
   E.isLeft(
    PublicKey.Codec.decode(MP.Codec.decode(Buffer.from([145, 3])))
   )
  )
 })
})

import { unpack as unpackLib, pack as packLib} from 'msgpackr';

export function pack(value:any):ArrayBuffer {
 return packLib(value)
}

export function unpack(buf:ArrayBuffer):any {
 return unpackLib(Buffer.from(buf))
}
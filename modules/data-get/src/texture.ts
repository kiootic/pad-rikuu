import { chunk, fromPairs, range } from 'lodash';
import Sharp from 'sharp';
import { inflateRawSync } from 'zlib';
import { formatJson, readASCII, readFixed, } from './common';

/* tslint:disable:no-bitwise */

function createLookup(a: number, b: number, g: number, r: number) {
  function decodeChannel(data: number, bits: number) {
    const mask = (1 << bits) - 1;
    return ((data & mask) / mask * 255) >>> 0;
  }
  function decodePix(data: number) {
    let pix = 0;
    pix += decodeChannel(data, a); data >>>= a; pix *= 256;
    pix += decodeChannel(data, b); data >>>= b; pix *= 256;
    pix += decodeChannel(data, g); data >>>= g; pix *= 256;
    pix += decodeChannel(data, r); data >>>= r;
    if (a === 0) pix += 0xff000000;
    return pix;
  }

  const lookup = Buffer.alloc(0x10000 * 4);
  for (const pix of range(0x10000))
    lookup.writeUInt32LE(decodePix(pix), pix * 4);
  return lookup;
}
const decodeTables = {
  '2': createLookup(0, 5, 6, 5), // R5G6B5
  '3': createLookup(4, 4, 4, 4), // R4G4B4A4
  '4': createLookup(1, 5, 5, 5), // R5G5B5A1
};

function decodeCompressedTex(input: Buffer, offset: number, output: Buffer, encoding: number) {
  const numPixs = output.length / 4;
  switch (encoding) {
    case 0: { // R8G8B8A8
      input.copy(output, 0, offset, offset + numPixs * 4);
      break;
    }
    case 2:
    case 3:
    case 4:
      const lookupTable = decodeTables[encoding];
      for (let i = 0; i < numPixs; i++)
        output.writeUInt32LE(lookupTable.readUInt32LE(input.readUInt16LE(offset + i * 2) * 4), i * 4);
      break;
    case 8:
    case 9: { // L8
      for (let i = 0; i < numPixs; i++)
        output.writeUInt32LE(input.readInt8(offset + i * 1) * 0x010101 + 0xff000000, i * 4);
      break;
    }
    default:
      throw new Error(`TEX1: unsupported encoding: ${encoding}`);
  }
}

export interface TexInfo {
  width: number;
  height: number;
  key: string;
}

export function decodeEnvelope(buf: Buffer) {
  const envSig = readFixed(buf, 0, 5);
  if (envSig !== 'IOSCh') {
    throw new Error(`invalid envelope signature: ${envSig}`);
  }

  const key = buf[5];
  buf = buf.slice(12);
  for (let i = 0; i < buf.length; i++)
    buf[i] ^= key;
  buf = inflateRawSync(buf);

  return buf;
}

export async function decodeTex(buf: Buffer, info: TexInfo) {
  return await decodeTexRaw(decodeEnvelope(buf), info);
}

type Decoder = (buf: Buffer, info: TexInfo) => Promise<{ [name: string]: Buffer }>;
const decoders: { [sig: string]: Decoder } = {
  'TEX1': decodeTEX,
  'TEX2': decodeTEX,
  'BFNT': decodeBFNT,
  'BBIN': decodeBBIN,
  'ISC2': decodeISC2,
  'ISA2': decodeISA2,
};

export function isValidTex(buf: Buffer) {
  const texSig = readFixed(buf, 0, 4);
  return !!decoders[texSig];
}

export async function decodeTexRaw(buf: Buffer, info: TexInfo) {
  const texSig = readFixed(buf, 0, 4);
  if (!decoders[texSig]) {
    throw new Error(`invalid tex signature: ${texSig}`);
  }
  return await decoders[texSig](buf, info);
}

async function decodeTEX(buf: Buffer, info: TexInfo) {
  const result: Record<string, Buffer> = {};
  const numTexs = buf.readUInt32LE(4);

  for (let index = 0; index < numTexs; index++) {
    const offset = buf.readInt32LE(16 + index * 32 + 0);
    const flags = buf.readUInt32LE(16 + index * 32 + 4);
    let name = readFixed(buf, 16 + index * 32 + 8, 24);

    const encoding = (flags >> 12) & 0xf;
    const w = (flags & 0x00000fff) >> 0;
    const h = (flags & 0x0fff0000) >> 16;

    if (encoding === 0xd) {
      // raw
      const imgBuf = buf.slice(offset, offset + buf.readUInt32LE(16 + index * 32 + 28));
      name = readFixed(buf, 16 + index * 32 + 8, 20);
      result[name.toLowerCase()] = imgBuf;
    } else {
      const pixBuf = Buffer.alloc(w * h * 4);
      decodeCompressedTex(buf, offset, pixBuf, encoding);

      const img = Sharp(pixBuf, {
        raw: {
          width: w,
          height: h,
          channels: 4
        }
      });
      result[name.toLowerCase()] = await img.png().toBuffer();
    }
  }
  return result;
}

async function decodeBFNT(buf: Buffer, info: TexInfo) {
  const result: Record<string, Buffer> = {};
  const size = buf.readUInt16LE(6);
  const length = buf.readUInt16LE(14);
  const numChars = (buf.length - 0x20020) / length;

  const charMap = range(0x10000)
    .map(i => [String.fromCharCode(i), buf.readUInt16LE(i * 2 + 0x20)])
    .filter(([char, index]) => index !== 0);

  const lookupBuf = Buffer.alloc(0x1000);
  for (const pix of range(0x100)) {
    lookupBuf.writeUInt32LE(((pix >>> 6) & 0x3) * 0x55000000 + 0x00ffffff, pix * 0x10 + 0);
    lookupBuf.writeUInt32LE(((pix >>> 4) & 0x3) * 0x55000000 + 0x00ffffff, pix * 0x10 + 4);
    lookupBuf.writeUInt32LE(((pix >>> 2) & 0x3) * 0x55000000 + 0x00ffffff, pix * 0x10 + 8);
    lookupBuf.writeUInt32LE(((pix >>> 0) & 0x3) * 0x55000000 + 0x00ffffff, pix * 0x10 + 12);
  }

  const pixBuf = Buffer.alloc(size * size * numChars * 4);
  for (const char of range(numChars)) {
    const offset = (0x20020 + char * length) >>> 0;
    const pixOffset = (char * size * size * 4) >>> 0;

    const stride = (size / 4) >>> 0;
    const pixStride = (size * 4) >>> 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < stride; x++) {
        const pix = buf.readUInt8(offset + x + y * stride);
        pixBuf.writeUInt32LE(lookupBuf.readUInt32LE(pix * 0x10 + 0), pixOffset + x * 0x10 + y * pixStride + 0);
        pixBuf.writeUInt32LE(lookupBuf.readUInt32LE(pix * 0x10 + 4), pixOffset + x * 0x10 + y * pixStride + 4);
        pixBuf.writeUInt32LE(lookupBuf.readUInt32LE(pix * 0x10 + 8), pixOffset + x * 0x10 + y * pixStride + 8);
        pixBuf.writeUInt32LE(lookupBuf.readUInt32LE(pix * 0x10 + 12), pixOffset + x * 0x10 + y * pixStride + 12);
      }
    }
  }

  const img = Sharp(pixBuf, {
    raw: {
      width: size,
      height: size * numChars,
      channels: 4
    }
  });
  result[`${info.key}.png`] = await img.png().toBuffer();
  result[`${info.key}.json`] = Buffer.from(formatJson({
    glyphSize: [buf.readUInt16LE(6), buf.readUInt16LE(8)],
    drawSize: [buf.readUInt16LE(10), buf.readUInt16LE(12)],
    charMap: fromPairs(charMap)
  }), 'utf8');
  return result;
}

async function decodeBBIN(buf: Buffer, info: TexInfo) {
  const numChunks = buf.readUInt32LE(4);
  const result: { [name: string]: Buffer } = {};
  for (let i = 0; i < numChunks; i++) {
    const offset = buf.readUInt32LE(16 + i * 8 + 0);
    const size = buf.readUInt32LE(16 + i * 8 + 4);
    const chunkBuf = buf.slice(offset, offset + size);
    Object.assign(result, await decodeTexRaw(chunkBuf, info));
  }
  return result;
}

async function decodeISC2(buf: Buffer, info: TexInfo) {
  const version = readFixed(buf, 4, 4);
  const nameOffset = buf.readUInt32LE(16);
  const name = readASCII(buf, nameOffset);

  const numBones = buf.readUInt32LE(24 + 0 * 8 + 0);
  const offsetBones = buf.readUInt32LE(24 + 0 * 8 + 4);
  const numSlots = buf.readUInt32LE(24 + 1 * 8 + 0);
  const offsetSlots = buf.readUInt32LE(24 + 1 * 8 + 4);
  const numForms = buf.readUInt32LE(24 + 2 * 8 + 0);
  const offsetForms = buf.readUInt32LE(24 + 2 * 8 + 4);
  const numSkins = buf.readUInt32LE(24 + 3 * 8 + 0);
  const offsetSkins = buf.readUInt32LE(24 + 3 * 8 + 4);
  const numMeshs = buf.readUInt32LE(24 + 4 * 8 + 0);
  const offsetMeshs = buf.readUInt32LE(24 + 4 * 8 + 4);
  const result = {
    version,
    name,
    bones: [] as any[],
    slots: [] as any[],
    forms: [] as any[],
    skins: [] as any[],
    meshs: [] as any[]
  };

  for (let i = 0; i < numBones; i++) {
    const type = readFixed(buf, offsetBones + i * 0x40 + 0, 4);
    if (type !== 'BONE')
      throw new Error(`unknown bone type: ${type}`);

    result.bones.push({
      parent: buf.readInt32LE(offsetBones + i * 0x40 + 4),
      name: readFixed(buf, offsetBones + i * 0x40 + 0x30, 0x10),
      transform: [
        buf.readFloatLE(offsetBones + i * 0x40 + 8),
        buf.readFloatLE(offsetBones + i * 0x40 + 12),
        buf.readFloatLE(offsetBones + i * 0x40 + 16),
        buf.readFloatLE(offsetBones + i * 0x40 + 20),
        buf.readFloatLE(offsetBones + i * 0x40 + 24),
        buf.readFloatLE(offsetBones + i * 0x40 + 28)
      ]
    });
  }

  for (let i = 0; i < numSlots; i++) {
    const type = readFixed(buf, offsetSlots + i * 0x80 + 0, 4);
    if (type !== 'SLOT')
      throw new Error(`unknown slot type: ${type}`);

    result.slots.push({
      tint: buf.readUInt32LE(offsetSlots + i * 0x80 + 4),
      boneId: buf.readInt32LE(offsetSlots + i * 0x80 + 8),
      skinId: buf.readInt32LE(offsetSlots + i * 0x80 + 12),
      skinName: readFixed(buf, offsetSlots + i * 0x80 + 0x10, 0x10),
      boneName: readFixed(buf, offsetSlots + i * 0x80 + 0x20, 0x10),
      meshName: readFixed(buf, offsetSlots + i * 0x80 + 0x30, 0x10),
      flags: buf.readUInt32LE(offsetSlots + i * 0x80 + 0x40),
    });
  }

  for (let i = 0; i < numForms; i++) {
    const type = readFixed(buf, offsetForms + i * 0x20 + 0, 4);
    if (type !== 'FORM')
      throw new Error(`unknown form type: ${type}`);

    result.forms.push({
      id: buf.readInt32LE(offsetForms + i * 0x20 + 4),
      name: readFixed(buf, offsetForms + i * 0x20 + 0x10, 0x10),
    });
  }

  for (let i = 0; i < numSkins; i++) {
    const type = readFixed(buf, offsetSkins + i * 0x20 + 0, 4);
    if (type !== 'SKIN')
      throw new Error(`unknown skin type: ${type}`);

    result.skins.push({
      flags: buf.readInt32LE(offsetSkins + i * 0x20 + 4),
      meshId: buf.readInt32LE(offsetSkins + i * 0x20 + 8),
      name: readFixed(buf, offsetSkins + i * 0x20 + 0x10, 0x10),
    });
  }

  for (let i = 0; i < numMeshs; i++) {
    const type = readFixed(buf, offsetMeshs + i * 0x30 + 0, 4);
    if (type !== 'MESH')
      throw new Error(`unknown mesh type: ${type}`);

    const imageId = buf.readInt32LE(offsetMeshs + i * 0x30 + 8);
    const flag = buf.readInt32LE(offsetMeshs + i * 0x30 + 12);

    const ptOffset = buf.readInt32LE(offsetMeshs + i * 0x30 + 16);
    const ptSize = buf.readInt32LE(offsetMeshs + i * 0x30 + 20);
    const vOffset = buf.readInt32LE(offsetMeshs + i * 0x30 + 24);
    const vSize = buf.readInt32LE(offsetMeshs + i * 0x30 + 28);

    let offset = vOffset;
    const isSpring = flag === 1;
    function readVertex() {
      let vertex;
      if (isSpring) {
        const num = buf.readInt32LE(offset + 8);
        vertex = {
          src: [buf.readFloatLE(offset + 0), buf.readFloatLE(offset + 4)],
          dst: range(num).map(j => ({
            boneId: buf.readInt32LE(offset + 0x10 + j * 0x10 + 0),
            v: [
              buf.readFloatLE(offset + 0x10 + j * 0x10 + 4),
              buf.readFloatLE(offset + 0x10 + j * 0x10 + 8),
            ],
            ratio: buf.readFloatLE(offset + 0x10 + j * 0x10 + 12),
          }))
        };
        offset += 0x10 * (num + 1);
      } else {
        vertex = {
          dst: [buf.readFloatLE(offset + 0), buf.readFloatLE(offset + 4)],
          src: [buf.readFloatLE(offset + 8), buf.readFloatLE(offset + 12)],
        };
        offset += 0x10;
      }
      return vertex;
    }

    result.meshs.push({
      type: readFixed(buf, offsetMeshs + i * 0x30 + 4, 4),
      name: readFixed(buf, offsetMeshs + i * 0x30 + 0x20, 0x10),
      imageId,
      isSpring,
      triangles: chunk(range(ptSize).map(j => buf.readInt32LE(ptOffset + j * 4)), 3),
      vertices: range(vSize).map(() => readVertex()),
    });
  }

  return {
    [`${info.key}.isc2.json`]: Buffer.from(formatJson(result), 'utf8'),
    [`${info.key}.isc2`]: buf
  };
}

async function decodeISA2(buf: Buffer, info: TexInfo) {
  const version = readFixed(buf, 4, 4);
  const nameOffset = buf.readUInt32LE(16);
  const name = readASCII(buf, nameOffset);

  const numBones = buf.readUInt32LE(24 + 0 * 8 + 0);
  const offsetBones = buf.readUInt32LE(24 + 0 * 8 + 4);
  const numSlots = buf.readUInt32LE(24 + 1 * 8 + 0);
  const offsetSlots = buf.readUInt32LE(24 + 1 * 8 + 4);
  const numSkins = buf.readUInt32LE(24 + 2 * 8 + 0);
  const offsetSkins = buf.readUInt32LE(24 + 2 * 8 + 4);
  const numMeshs = buf.readUInt32LE(24 + 3 * 8 + 0);
  const offsetMeshs = buf.readUInt32LE(24 + 3 * 8 + 4);
  const result = {
    version,
    name,
    bones: [] as any[],
    slots: [] as any[],
    skins: [] as any[],
    meshs: [] as any[]
  };

  function readTimeline(loc: number) {
    if (loc === 0)
      return null;

    const sig = readFixed(buf, loc + 0, 4);
    if (sig !== 'KEYT')
      throw new Error(`invalid key frames signature: ${sig}`);

    let offset = buf.readInt32LE(loc + 4);
    const numFrames = buf.readInt32LE(loc + 8);
    const length = buf.readFloatLE(loc + 12);
    const timeline = {
      length,
      frames: [] as any[]
    };

    for (let i = 0; i < numFrames; i++) {
      const fsig = readFixed(buf, offset + 0, 4);
      if (fsig.slice(0, 2) !== 'KF')
        throw new Error(`invalid key frame sig: ${fsig}`);

      const type = fsig[2];
      const interpolation = fsig[3];
      let frame;
      switch (type) {
        case 'A':
          frame = {
            time: buf.readFloatLE(offset + 4),
            angle: buf.readFloatLE(offset + 8),
          };
          offset += 0x10;
          break;
        case 'C':
          frame = {
            time: buf.readFloatLE(offset + 4),
            color: buf.readUInt32LE(offset + 8),
          };
          offset += 0x10;
          break;
        case 'V':
          frame = {
            time: buf.readFloatLE(offset + 4),
            v: [buf.readFloatLE(offset + 8), buf.readFloatLE(offset + 12)],
          };
          offset += 0x10;
          break;
        case 'T':
          frame = {
            time: buf.readFloatLE(offset + 4),
            visible: buf.readUInt32LE(offset + 8) === 0,
            name: readFixed(buf, offset + 0x10, 0x10),
          };
          offset += 0x20;
          break;
        case 'P':
          const numPts = buf.readUInt16LE(offset + 10);
          frame = {
            time: buf.readFloatLE(offset + 4),
            points: range(numPts).map(j => [
              buf.readFloatLE(offset + 0x10 + j * 8 + 0),
              buf.readFloatLE(offset + 0x10 + j * 8 + 4)
            ])
          };
          offset += 0x10 + ((numPts + 1) & ~1) * 8;
          break;
        default:
          throw new Error(`unsupported key frame type: ${type}`);
      }
      switch (interpolation) {
        case 'C':
        case 'L':
          break;
        case 'B':
          frame = {
            ...frame,
            b1: buf.readFloatLE(offset + 0),
            b2: buf.readFloatLE(offset + 4),
            b3: buf.readFloatLE(offset + 8),
            b4: buf.readFloatLE(offset + 12),
          };
          offset += 0x10;
          break;
        default:
          throw new Error(`unsupported interpolation type: ${interpolation}`);
      }
      timeline.frames.push({ type, interpolation, ...frame });
    }

    return timeline;
  }

  function readAnims(offset: number) {
    return [
      readTimeline(buf.readInt32LE(offset + 0)),
      readTimeline(buf.readInt32LE(offset + 4)),
      readTimeline(buf.readInt32LE(offset + 8))
    ];
  }

  for (let i = 0; i < numBones; i++) {
    const type = readFixed(buf, offsetBones + i * 0x30 + 0, 4);
    if (type !== 'BONE')
      throw new Error(`unknown bone type: ${type}`);

    result.bones.push({
      name: readFixed(buf, offsetBones + i * 0x30 + 0x20, 0x10),
      anims: readAnims(offsetBones + i * 0x30 + 4),
    });
  }

  for (let i = 0; i < numSlots; i++) {
    const type = readFixed(buf, offsetSlots + i * 0x20 + 0, 4);
    if (type !== 'SLOT')
      throw new Error(`unknown slot type: ${type}`);

    result.slots.push({
      name: readFixed(buf, offsetSlots + i * 0x20 + 0x10, 0x10),
      anims: readAnims(offsetSlots + i * 0x20 + 4),
    });
  }

  for (let i = 0; i < numSkins; i++) {
    const type = readFixed(buf, offsetSkins + i * 0x20 + 0, 4);
    if (type !== 'SKIN')
      throw new Error(`unknown skin type: ${type}`);

    result.skins.push({
      name: readFixed(buf, offsetSkins + i * 0x20 + 0x10, 0x10),
      anims: readAnims(offsetSkins + i * 0x20 + 4),
    });
  }

  for (let i = 0; i < numMeshs; i++) {
    const type = readFixed(buf, offsetMeshs + i * 0x20 + 0, 4);
    if (type !== 'MESH')
      throw new Error(`unknown mesh type: ${type}`);

    result.meshs.push({
      name: readFixed(buf, offsetMeshs + i * 0x20 + 0x10, 0x10),
      anims: readAnims(offsetMeshs + i * 0x20 + 4),
    });
  }

  return {
    [`${info.key}.isa2.json`]: Buffer.from(formatJson(result), 'utf8'),
    [`${info.key}.isa2`]: buf
  };
}

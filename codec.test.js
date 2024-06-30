/** @format */

import { describe, test, it } from 'node:test';
import assert from 'node:assert'

import { encodeValue } from './codec.js';

describe('encodeValue', () => {
  test('encodes a small number', () => {
    const encoded = encodeValue(42);
    assert.equal(encoded, Buffer.from([42]));
  });

  test('encodes a large number', () => {
    const encoded = encodeValue(12345678);
    assert.equal(encoded, Buffer.from([134, 220, 182, 184, 1]));
  });

  test('encodes zero', () => {
    const encoded = encodeValue(0);
    assert.equal(encoded, Buffer.from([]));
  });

  test('encodes maximum safe integer', () => {
    const encoded = encodeValue(Number.MAX_SAFE_INTEGER);
    assert.equal(encoded, Buffer.from([127, 255, 255, 255, 255, 255, 255, 255, 127]));
  });
});

import { decodeValue } from './codec.js';

test('decodeValue', () => {
  it('should decode a single byte value', () => {
    const buffer = Buffer.from([0x42]);
    const [value, offset] = decodeValue(buffer, 0);
    assert.equal(value,0x42);
    assert.equal(offset,1);
  });

  it('should decode a multi-byte value', () => {
    const buffer = Buffer.from([0x81, 0x01]);
    const [value, offset] = decodeValue(buffer, 0);
    assert.equal(value,0x81);
    assert.equal(offset,2);
  });

  it('should handle an empty buffer', () => {
    const buffer = Buffer.from([]);
    const [value, offset] = decodeValue(buffer, 0);
    assert.equal(value,0);
    assert.equal(offset,0);
  });

  it('should handle an offset beyond the buffer length', () => {
    const buffer = Buffer.from([0x42]);
    const [value, offset] = decodeValue(buffer, 1);
    assert.equal(value,0);
    assert.equal(offset,1);
  });
});

import { encodeSection } from './codec.js';

test('encodeSection', () => {
  it('should encode a section with length and different flag', () => {
    const length = 5;
    const different = true;
    const encoded = encodeSection(length, different);
    assert.equal(encoded, 0x0b);
  });

  it('should encode a section with length and no different flag', () => {
    const length = 10;
    const different = false;
    const encoded = encodeSection(length, different);
    assert.equal(encoded, 0x14);
  });

  it('should handle zero length', () => {
    const length = 0;
    const different = true;
    const encoded = encodeSection(length, different);
    assert.equal(encoded, 0x01);
  });

  it('should handle maximum length', () => {
    const length = 0x7fffffff;
    const different = false;
    const encoded = encodeSection(length, different);
    assert.equal(encoded, 0xfffffffe);
  });
});

import { decodeSection } from './codec.js';

test('decodeSection', () => {
  it('should decode a section with a single byte value', () => {
    const buffer = Buffer.from([0x02]);
    const [length, different, offset] = decodeSection(buffer, 0);
    assert.equal(length, 1);
    assert.equal(different, 0);
    assert.equal(offset, 1);
  });

  it('should decode a section with a multi-byte value', () => {
    const buffer = Buffer.from([0x85, 0x01]);
    const [length, different, offset] = decodeSection(buffer, 0);
    assert.equal(length, 2);
    assert.equal(different, 1);
    assert.equal(offset, 2);
  });

  it('should handle an empty buffer', () => {
    const buffer = Buffer.from([]);
    const [length, different, offset] = decodeSection(buffer, 0);
    assert.equal(length, 0);
    assert.equal(different, 0);
    assert.equal(offset, 0);
  });

  it('should handle an offset beyond the buffer length', () => {
    const buffer = Buffer.from([0x42]);
    const [length, different, offset] = decodeSection(buffer, 1);
    assert.equal(length, 0);
    assert.equal(different, 0);
    assert.equal(offset, 1);
  });
});

import { encode } from './codec.js';

test('encode', () => {
  it('should encode a buffer with a single repeated byte', () => {
    const buffer = Buffer.from([0x42, 0x42, 0x42]);
    const encoded = encode(buffer);
    assert.equal(encoded,Buffer.from([0x03, 0x42]));
  });

  it('should encode a buffer with multiple repeated byte sequences', () => {
    const buffer = Buffer.from([0x41, 0x41, 0x42, 0x42, 0x42, 0x43]);
    const encoded = encode(buffer);
    assert.equal(encoded,Buffer.from([0x02, 0x41, 0x03, 0x42, 0x01, 0x43]));
  });

  it('should encode a buffer with no repeated bytes', () => {
    const buffer = Buffer.from([0x41, 0x42, 0x43]);
    const encoded = encode(buffer);
    assert.equal(encoded,Buffer.from([0x01, 0x41, 0x01, 0x42, 0x01, 0x43]));
  });

  it('should encode an empty buffer', () => {
    const buffer = Buffer.from([]);
    const encoded = encode(buffer);
    assert.equal(encoded,Buffer.from([]));
  });
});

import { decode } from './codec.js';

test('decode', () => {
  it('should decode an empty buffer', () => {
    const buffer = Buffer.from([]);
    const decoded = decode(buffer);
    assert.equal(decoded,Buffer.from([]));
  });

  it('should decode a buffer with a single section', () => {
    const buffer = Buffer.from([0x03, 0x61, 0x62, 0x63]);
    const decoded = decode(buffer);
    assert.equal(decoded,Buffer.from([0x61, 0x62, 0x63]));
  });

  it('should decode a buffer with multiple sections', () => {
    const buffer = Buffer.from([0x03, 0x61, 0x62, 0x63, 0x81, 0x01, 0x02, 0x64, 0x64]);
    const decoded = decode(buffer);
    assert.equal(decoded,Buffer.from([0x61, 0x62, 0x63, 0x64, 0x64]));
  });

  it('should decode a buffer with repeated sections', () => {
    const buffer = Buffer.from([0x03, 0x61, 0x62, 0x63, 0x82, 0x01, 0x02, 0x64, 0x64]);
    const decoded = decode(buffer);
    assert.equal(decoded,Buffer.from([0x61, 0x62, 0x63, 0x64, 0x64]));
  });

  it('should throw a RangeError for an invalid buffer', () => {
    const buffer = Buffer.from([0x03, 0x61, 0x62, 0x63, 0x81, 0x01]);
    assert.fail(() => decode(buffer)).toThrow(RangeError);
  });
});

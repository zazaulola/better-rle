/** @format */

/**
 * The `codec.js` file contains a set of functions that deal with encoding and decoding binary data in a compressed format. The purpose of this code is to provide a way to efficiently store or transmit binary data by reducing its size through compression.
 *
 * The main functions in this code are `encode` and `decode`. The `encode` function takes a binary buffer as input and produces a compressed binary buffer as output. The compression is achieved by identifying consecutive repeating characters in the input buffer and replacing them with a compact representation. This compact representation consists of a length value and a flag indicating whether the data is different or a repetition of the same character.
 *
 * The `decode` function takes a compressed binary buffer as input and produces the original binary data as output. It does this by reading the compact representations in the compressed buffer, interpreting the length values and flags, and reconstructing the original data accordingly.
 *
 * The code also includes helper functions like `encodeValue`, `decodeValue`, `encodeSection`, and `decodeSection`. These functions are used to encode and decode numbers and sections of data in a variable-length binary format. This variable-length encoding scheme is used to represent the length values and flags in the compact representations of the compressed data.
 *
 * The logic flow of the `encode` function is as follows:
 *
 *   1. Initialize an offset variable and an empty array to store the compressed sections.
 *   2. Iterate through the input buffer using a regular expression that matches consecutive repeating characters.
 *   3. For each match, if there is non-repeating data before the match, encode the length and a "different" flag, and add the non-repeating data to the sections array.
 *   4. Encode the length of the repeating characters and a "not different" flag, and add the first character of the repeating sequence to the sections array.
 *   5. Update the offset to the end of the repeating sequence.
 *   6. After the loop, if there is remaining non-repeating data at the end, encode its length and a "different" flag, and add it to the sections array.
 *   7. Concatenate all the compressed sections into a single binary buffer and return it.
 * 
 * The logic flow of the `decode` function is as follows:
 *
 *   1. Initialize an offset variable and an empty array to store the decoded sections.
 *   2. While the offset is within the bounds of the compressed buffer, decode the length and "different" flag using the `decodeSection` function.
 *   3. If the "different" flag is set, add the corresponding slice of the compressed buffer to the decoded sections array.
 *   4. If the "different" flag is not set, create a buffer filled with the repeated character and add it to the decoded sections array.
 *   5. Update the offset based on the decoded length and whether the data was different or not.
 *   6. After the loop, concatenate all the decoded sections into a single binary buffer and return it.
 * 
 * The code achieves its purpose by using a combination of variable-length encoding for representing lengths and flags, and a compact representation for consecutive repeating characters in the input data. This approach allows for efficient compression of binary data, especially when there are long sequences of repeating characters.
 */

/**
 * Encodes a number into a compressed binary format.
 *
 * This function takes a number and encodes it into a compressed binary format that can be efficiently stored or transmitted. The compressed format uses a variable-length encoding scheme where the number of bytes used to represent the number depends on its magnitude.
 *
 * @param {number} number - The number to be encoded.
 * @returns {Buffer} The encoded binary buffer.
 */
export function encodeValue(number) {
  let space = Math.ceil(Math.log(number) / Math.log(128));
  let buf = Buffer.alloc(space);
  for (let i = 0; i < space; i++) {
    buf[space - i - 1] = (number & 127) + (i ? 128 : 0);
    number >>= 7;
  }
  return buf;
}

/**
 * Decodes a compressed binary value from the given buffer.
 *
 * This function takes a buffer containing a compressed binary value and the offset within the buffer where the value starts. It decodes the value by reading a variable-length sequence of bytes, where each byte contains 7 bits of the value and the most significant bit indicates whether there are more bytes to read.
 *
 * @param {Buffer} buffer - The buffer containing the compressed binary value.
 * @param {number} offset - The offset within the buffer where the value starts.
 * @returns {[number, number]} An array containing the decoded value and the new offset after the value.
 */
export function decodeValue(buffer, offset) {
  let number = 0;
  do {
    number <<= 7;
    number += buffer[offset++] & 127;
  } while (buffer[offset - 1] & 128);
  return [number, offset];
}

/**
 * Encodes a length and a boolean flag into a compressed binary format.
 *
 * This function takes a length and a boolean flag indicating whether the data is different, and encodes them into a compressed binary format that can be efficiently stored or transmitted. The compressed format uses a variable-length encoding scheme where the number of bytes used to represent the value depends on its magnitude.
 *
 * @param {number} length - The length of the data to be encoded.
 * @param {boolean} different - A flag indicating whether the data is different.
 * @returns {Buffer} The encoded binary buffer.
 */
export function encodeSection(length, different) {
  return encodeValue((length << 1) + different);
}

/**
 * Decodes a length and a boolean flag from a compressed binary format.
 *
 * This function takes a buffer containing a compressed binary value and the offset within the buffer where the value starts. It decodes the length and a boolean flag indicating whether the data is different by reading a variable-length sequence of bytes, where each byte contains 7 bits of the value and the most significant bit indicates whether there are more bytes to read.
 *
 * @param {Buffer} buffer - The buffer containing the compressed binary value.
 * @param {number} offset - The offset within the buffer where the value starts.
 * @returns {[number, boolean, number]} An array containing the decoded length, a boolean flag indicating whether the data is different, and the new offset after the value.
 */
export function decodeSection(buffer, offset) {
  let [number, newOffset] = decodeValue(buffer, offset);
  let different = number & 1;
  let length = number >> 1;
  return [length, different, newOffset];
}

/**
 * Encodes a binary buffer into a compressed format.
 *
 * The encoding process works by identifying consecutive repeating characters in the input buffer and replacing them with a compact representation. This compressed format can be efficiently decoded back to the original buffer.
 *
 * @param {Buffer} buffer - The binary buffer to be encoded.
 * @returns {Buffer} The encoded buffer in the compressed format.
 */
export function encode(buffer) {
  let offset = 0;
  let sections = [];
  for (let m of buffer.toString('latin1').matchAll(/(.)\1+/gsu)) {
    if (m.index > offset) {
      sections.push([encodeSection(m.index - offset, true), buffer.subarray(offset, m.index)]);
    }
    sections.push([encodeSection(m[0].length, false), buffer.subarray(m.index, m.index + 1)]);
    offset = m.index + m[0].length;
  }
  if (offset < buffer.length) {
    sections.push([encodeSection(buffer.length - offset, true), buffer.subarray(offset, buffer.length)]);
  }
  return Buffer.concat([...sections.flat()]);
}

/**
 * Decodes a compressed binary buffer back to its original form.
 *
 * This function takes a compressed buffer that was previously encoded using the `encode` function, and decodes it back to the original binary data.
 *
 * @param {Buffer} buffer - The compressed binary buffer to be decoded.
 * @returns {Buffer} The original binary data.
 */
export function decode(buffer) {
  let offset = 0;
  let sections = [];
  while (offset < buffer.length) {
    let [length, different, newOffset] = decodeSection(buffer, offset);
    if (different) {
      sections.push(buffer.subarray(newOffset, newOffset + length));
      offset = newOffset + length;
    } else {
      sections.push(Buffer.alloc(length, buffer[newOffset]));
      offset = newOffset + 1;
    }
    if (offset > buffer.length) {
      throw new RangeError();
    }
  }
  return Buffer.concat(sections);
}

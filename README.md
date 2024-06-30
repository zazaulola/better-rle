# Better RLE
A fast and efficient run-length encoding (RLE) compression algorithm for binary data with a variable-length encoding scheme.



This module implements the [RLE compression algorithm](https://en.wikipedia.org/wiki/Run-length_encoding). By its principle the algorithm is very similar to the [RLE algorithm used for BMP-files compression](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-wmf/b64d0c0b-bb80-4b53-8382-f38f264eb685). But it has important differences:

1. In the Microsoft version of the algorithm, only one byte can be used to denote the length of sequences. In my implementation, the high bit of the sequence length value indicates the continuation of the value in the next byte.
2. In the microsoft version, for switching the mode of operation, the value 0x00 is used at the location where the next sequence length should be indicated. In my opinion, it is too wasteful to use a whole byte for this purpose. In this implementation, type of each sequence is assigned by the lower bit of the last byte in the value responsible for the length of the next block.


## API

### encode()

Encode the buffer:

    ```
    encode(buffer: Buffer) => Buffer
    ```

### decode()

Decode the buffer:

    ```
    decode(buffer: Buffer) => Buffer
    ```

I don't claim the idea is unique. Most likely, the current approach has been used somewhere before.

Also note, RLE algorithms do not have a huge compression efficiency. RLE is very fast and extremely simple to implement.

The module has no dependencies. It can be used for any kind of data where there are an arbitrary number of sequences with identical values.


## What does ChatGPT have to say about this code?

> What is the difference between this algorithm and the BI_RLE8 algorithm used in BMP file compression?


> The algorithm used in codec.js and the BI_RLE8 algorithm used in BMP file compression share some similarities, as they both employ run-length encoding (RLE) techniques to compress data. However, there are a few key differences between the two:
> 
> Data Representation:
> 
> The algorithm in codec.js operates on binary buffers, encoding and decoding sequences of bytes.
> The BI_RLE8 algorithm is specifically designed for compressing 8-bit pixel data in BMP image files, where each pixel is represented by a single byte.
> 
> Encoding Scheme:
> 
> The algorithm in codec.js uses a variable-length encoding scheme to represent the lengths of repeating and non-repeating sequences. It encodes the length and a flag indicating whether the data is different or a repetition in a compact binary format.
> The BI_RLE8 algorithm uses a fixed-length encoding scheme, where each encoded sequence is represented by a 2-byte header followed by the data. The header contains a count value and a flag indicating whether the sequence is a run of repeating pixels or a sequence of literal (non-repeating) pixels.
>
> Compression Efficiency:
>
>The variable-length encoding scheme used in codec.js can potentially achieve better compression ratios for data with long runs of repeating sequences, as it can represent larger lengths more efficiently.
> The BI_RLE8 algorithm, with its fixed-length encoding scheme, may be less efficient for very long runs of repeating pixels, as the 2-byte header overhead can become significant.
>
>Intended Use:
>
> The algorithm in codec.js is a general-purpose compression algorithm that can be used for various types of binary data.
> The BI_RLE8 algorithm is specifically designed for compressing 8-bit pixel data in BMP image files and is part of the BMP file format specification.
> While both algorithms leverage run-length encoding principles, the algorithm in codec.js employs a more flexible and potentially more efficient variable-length encoding scheme, making it suitable for compressing general > binary data. On the other hand, the BI_RLE8 algorithm is tailored for the specific requirements of compressing 8-bit pixel data in BMP image files, with a fixed-length encoding scheme optimized for that particular use case.

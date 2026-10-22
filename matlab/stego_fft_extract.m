function [recoveredMessage, rawBits] = stego_fft_extract(stegoImg, secretKey, delta)
% STEGO_FFT_EXTRACT Extracts a secret text message from a stego image using
% 8x8 Block 2D Fast Fourier Transform (2D-FFT) and Differential QIM decision.
%
% Syntax:
%   [recoveredMessage, rawBits] = stego_fft_extract(stegoImg, secretKey, delta)
%
% Inputs:
%   stegoImg  - uint8 image matrix (grayscale [H x W] or color RGB [H x W x 3])
%   secretKey - numeric integer key used to seed pseudo-random block selection
%   delta     - (Optional) QIM quantization step size (default: 40.0)
%
% Outputs:
%   recoveredMessage - char vector containing the extracted plaintext
%   rawBits          - 1D array of extracted raw binary bits (0s and 1s)
%
% Digital Signal Processing (DSP) Principles:
%   1. 2D FFT extracts frequency coefficients from the luminance channel.
%   2. Differential magnitude d = |F(3,4)| - |F(4,3)| determines the bit:
%      k = round(d / delta), bit = mod(abs(k), 2).
%   3. Secret-key pseudo-random sequence dictates block visitation order.

    if nargin < 3 || isempty(delta)
        delta = 40.0;
    end
    if nargin < 2 || isempty(secretKey)
        secretKey = 123456789;
    end

    if ~isa(stegoImg, 'uint8')
        error('stegoImg must be uint8.');
    end

    [height, width, channels] = size(stegoImg);

    % Extract luminance channel Y
    if channels == 3
        R = double(stegoImg(:,:,1));
        G = double(stegoImg(:,:,2));
        B = double(stegoImg(:,:,3));
        Y = 0.299000 * R + 0.587000 * G + 0.114000 * B;
    else
        Y = double(stegoImg);
    end

    blockSize = 8;
    totalBlocksH = floor(height / blockSize);
    totalBlocksW = floor(width / blockSize);
    totalBlocks = totalBlocksH * totalBlocksW;

    if totalBlocks < 32
        error('Image too small to contain even a length header.');
    end

    % Reproduce keyed block permutation
    rng(secretKey, 'twister');
    blockPermutation = randperm(totalBlocks);

    % Frequency coefficient pair
    r1 = 3; c1 = 4;
    r2 = 4; c2 = 3;

    % 1. Extract 32-bit length header
    lenBits = zeros(1, 32);
    for bitIdx = 1:32
        blkNum = blockPermutation(bitIdx);
        bRow = floor((blkNum - 1) / totalBlocksW);
        bCol = mod((blkNum - 1), totalBlocksW);

        rStart = bRow * blockSize + 1;
        rEnd   = rStart + blockSize - 1;
        cStart = bCol * blockSize + 1;
        cEnd   = cStart + blockSize - 1;

        block = Y(rStart:rEnd, cStart:cEnd);
        F = fft2(block);

        d = abs(F(r1, c1)) - abs(F(r2, c2));
        k = round(d / delta);
        lenBits(bitIdx) = mod(abs(k), 2);
    end

    % Decode 32-bit big-endian unsigned integer
    msgLen = uint32(0);
    for i = 1:32
        msgLen = bitor(bitshift(msgLen, 1), uint32(lenBits(i)));
    end
    msgLen = double(msgLen);

    % Sanity validation on decoded length
    maxPossibleBytes = floor((totalBlocks - 32) / 8);
    if msgLen <= 0 || msgLen > maxPossibleBytes
        % If key is wrong, length will typically be an absurd number
        recoveredMessage = sprintf('[Extraction Failed: Key is invalid or image was modified (Decoded Len=%d)]', msgLen);
        rawBits = lenBits;
        return;
    end

    % 2. Extract payload bits
    totalBitsToExtract = 32 + msgLen * 8;
    payloadBits = zeros(1, msgLen * 8);

    for bitIdx = 33:totalBitsToExtract
        blkNum = blockPermutation(bitIdx);
        bRow = floor((blkNum - 1) / totalBlocksW);
        bCol = mod((blkNum - 1), totalBlocksW);

        rStart = bRow * blockSize + 1;
        rEnd   = rStart + blockSize - 1;
        cStart = bCol * blockSize + 1;
        cEnd   = cStart + blockSize - 1;

        block = Y(rStart:rEnd, cStart:cEnd);
        F = fft2(block);

        d = abs(F(r1, c1)) - abs(F(r2, c2));
        k = round(d / delta);
        payloadBits(bitIdx - 32) = mod(abs(k), 2);
    end

    % 3. Convert bits back to ASCII characters
    extractedBytes = zeros(1, msgLen, 'uint8');
    for i = 1:msgLen
        byteVal = uint8(0);
        for b = 1:8
            bIndex = (i - 1) * 8 + b;
            byteVal = bitor(bitshift(byteVal, 1), uint8(payloadBits(bIndex)));
        end
        extractedBytes(i) = byteVal;
    end

    recoveredMessage = char(extractedBytes);
    rawBits = [lenBits, payloadBits];
end

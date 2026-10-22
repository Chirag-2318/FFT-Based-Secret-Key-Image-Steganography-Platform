%% =========================================================================
%  DSP PROJECT DEMONSTRATION: FFT-BASED SECRET-KEY IMAGE STEGANOGRAPHY
%  Digital Signal Processing (DSP) & Information Hiding
% =========================================================================
%  This script demonstrates:
%    1. 2D Discrete Fourier Transform (2D-DFT) on 8x8 spatial blocks
%    2. Differential Quantization Index Modulation (QIM) in frequency domain
%    3. Mathematical Conjugate Symmetry Preservation for real spatial image
%    4. Secret-Key pseudo-random frequency block mapping (PRNG)
%    5. Visual comparison, PSNR, SSIM, and 2D-FFT spectral analysis
%    6. Key-sensitivity demonstration (Correct Key vs Wrong Key)
% =========================================================================

clear; clc; close all;

fprintf('===================================================================\n');
fprintf('   FFT-BASED SECRET-KEY IMAGE STEGANOGRAPHY PLATFORM (MATLAB DEMO)\n');
fprintf('===================================================================\n\n');

%% Step 1: Select Built-in Internal MATLAB Image
% MATLAB includes standard test images in its toolbox path:
% Options: 'cameraman.tif', 'peppers.png', 'autumn.tif', 'coins.png', 'rice.png'
selectedImage = 'cameraman.tif'; 

fprintf('[1] Loading internal MATLAB image: "%s" ...\n', selectedImage);
try
    coverImg = imread(selectedImage);
catch ME
    warning('Could not load %s, falling back to cameraman.tif', selectedImage);
    coverImg = imread('cameraman.tif');
    selectedImage = 'cameraman.tif';
end

[imgH, imgW, imgC] = size(coverImg);
fprintf('    Image Dimensions : %d x %d pixels\n', imgW, imgH);
fprintf('    Channels         : %d (%s)\n', imgC, ternary(imgC == 3, 'RGB Color', 'Grayscale'));

%% Step 2: Define Secret Message & Secret Key
secretMessage = 'DSP Project 2026: 2D-FFT Steganography with Conjugate Symmetry!';
secretKey     = 20260422;  % Integer seed for pseudo-random block sequence
qimDelta      = 40.0;      % Quantization step size (trade-off: imperceptibility vs robustness)

fprintf('\n[2] Secret Payload Configuration:\n');
fprintf('    Plaintext Message : "%s"\n', secretMessage);
fprintf('    Message Length    : %d characters (%d bytes / %d bits)\n', ...
        length(secretMessage), length(secretMessage), length(secretMessage)*8);
fprintf('    Secret Key        : %d\n', secretKey);
fprintf('    QIM Delta (Delta) : %.1f\n', qimDelta);

%% Step 3: Embed Secret Message into Cover Image via 2D-FFT
fprintf('\n[3] Executing 2D-FFT Differential QIM Embedding ...\n');
tic;
[stegoImg, metrics] = stego_fft_embed(coverImg, secretMessage, secretKey, qimDelta);
embedTime = toc;
fprintf('    Embedding completed in %.3f seconds.\n', embedTime);

%% Step 4: Extract Message with CORRECT Secret Key
fprintf('\n[4] Extraction with CORRECT Secret Key (%d) ...\n', secretKey);
tic;
[recoveredMsgCorrect, rawBitsCorrect] = stego_fft_extract(stegoImg, secretKey, qimDelta);
extractTime = toc;
fprintf('    Extraction completed in %.3f seconds.\n', extractTime);
fprintf('    Recovered Message : "%s"\n', recoveredMsgCorrect);

% Calculate Bit Error Rate (BER)
origBytes = uint8(secretMessage);
numPayloadBits = length(origBytes) * 8;
extractedPayloadBits = rawBitsCorrect(33 : 32 + numPayloadBits);

origBits = zeros(1, numPayloadBits);
for i = 1:length(origBytes)
    for b = 1:8
        origBits((i-1)*8 + b) = bitand(bitshift(origBytes(i), -(8 - b)), 1);
    end
end

bitErrors = sum(origBits ~= extractedPayloadBits);
ber = (bitErrors / numPayloadBits) * 100.0;
fprintf('    Bit Errors        : %d / %d (BER = %.2f%%)\n', bitErrors, numPayloadBits, ber);

if strcmp(secretMessage, recoveredMsgCorrect)
    fprintf('    Status            : [SUCCESS] Exact 100%% Message Recovery!\n');
else
    fprintf('    Status            : [WARNING] Bit errors detected.\n');
end

%% Step 5: Extract Message with WRONG Secret Key (Security Demonstration)
wrongKey = 99999999;
fprintf('\n[5] Security Check: Extraction with WRONG Key (%d) ...\n', wrongKey);
[recoveredMsgWrong, rawBitsWrong] = stego_fft_extract(stegoImg, wrongKey, qimDelta);
fprintf('    Extracted Text    : "%s"\n', recoveredMsgWrong);

if length(rawBitsWrong) >= 32 + numPayloadBits
    wrongPayloadBits = rawBitsWrong(33 : 32 + numPayloadBits);
    wrongBitErrors = sum(origBits ~= wrongPayloadBits);
    wrongBer = (wrongBitErrors / numPayloadBits) * 100.0;
    fprintf('    Wrong Key BER     : %.2f%% (Approx 50%% random noise, as expected!)\n', wrongBer);
else
    fprintf('    Wrong Key Result  : Header validation rejected unauthorized extraction.\n');
end

%% Step 6: Print Quantitative DSP Quality Metrics
fprintf('\n===================================================================\n');
fprintf('                     QUANTITATIVE DSP METRICS                      \n');
fprintf('===================================================================\n');
fprintf('  Metric                          | Value\n');
fprintf('  --------------------------------+--------------------------------\n');
fprintf('  Peak Signal-to-Noise (PSNR)     | %6.2f dB  (Target: >= 40 dB)\n', metrics.psnr);
fprintf('  Structural Similarity (SSIM)    | %6.4f     (Target: >= 0.99)\n', metrics.ssim);
fprintf('  Mean Squared Error (MSE)        | %6.4f\n', metrics.mse);
fprintf('  Max Absolute Pixel Error (MAE)  | %6d      (Out of 255)\n', metrics.maxAbsError);
fprintf('  Maximum Capacity                | %6d bytes\n', metrics.capacityBytes);
fprintf('  Payload Used                    | %6d bytes (%.1f%% of capacity)\n', ...
        metrics.usedBytes, (metrics.usedBytes / metrics.capacityBytes)*100);
fprintf('  Embedding Density (BPP)         | %6.5f bits/pixel\n', metrics.bpp);
fprintf('  Bit Error Rate (Correct Key)    | %6.2f %%\n', ber);
fprintf('===================================================================\n\n');

%% Step 7: VISUALIZATION 1 - Spatial Domain Imperceptibility & Error Map
fig1 = figure('Name', 'DSP Steganography: Spatial Domain Analysis', ...
              'Color', 'w', 'Position', [100, 100, 1000, 750]);

subplot(2, 2, 1);
imshow(coverImg);
title(sprintf('(a) Original Cover Image (%s)\n%dx%d pixels', selectedImage, imgW, imgH), ...
      'FontSize', 11, 'FontWeight', 'bold');

subplot(2, 2, 2);
imshow(stegoImg);
title(sprintf('(b) Stego Image with Hidden Message\nPSNR: %.2f dB | SSIM: %.4f', ...
      metrics.psnr, metrics.ssim), 'FontSize', 11, 'FontWeight', 'bold');

% Amplified difference map (50x)
if imgC == 3
    diffSpatial = abs(double(coverImg(:,:,1)) - double(stegoImg(:,:,1)));
else
    diffSpatial = abs(double(coverImg) - double(stegoImg));
end
amplifiedDiff = uint8(min(diffSpatial * 50.0, 255));

subplot(2, 2, 3);
imshow(amplifiedDiff);
colormap(subplot(2,2,3), parula);
colorbar;
title('(c) Amplified Spatial Residual (|Cover - Stego| x 50)', ...
      'FontSize', 11, 'FontWeight', 'bold');

subplot(2, 2, 4);
histogram(diffSpatial(:), 'BinMethod', 'integers', 'FaceColor', [0.2, 0.5, 0.8], 'EdgeColor', 'none');
title('(d) Histogram of Absolute Pixel Differences', 'FontSize', 11, 'FontWeight', 'bold');
xlabel('Pixel Difference |Original - Stego|');
ylabel('Pixel Count (Log Scale)');
set(gca, 'YScale', 'log');
grid on;

%% Step 8: VISUALIZATION 2 - 2D-FFT Frequency Domain Spectrum Analysis
fig2 = figure('Name', 'DSP Steganography: 2D-FFT Frequency Domain Analysis', ...
              'Color', 'w', 'Position', [150, 150, 1000, 750]);

% Extract luminance channel for FFT visualization
if imgC == 3
    Y_cov = 0.299*double(coverImg(:,:,1)) + 0.587*double(coverImg(:,:,2)) + 0.114*double(coverImg(:,:,3));
    Y_stg = 0.299*double(stegoImg(:,:,1)) + 0.587*double(stegoImg(:,:,2)) + 0.114*double(stegoImg(:,:,3));
else
    Y_cov = double(coverImg);
    Y_stg = double(stegoImg);
end

% 2D FFT Magnitude Spectrums (centered with fftshift and log-scaled)
F_cov = fftshift(fft2(Y_cov));
mag_cov = log(1 + abs(F_cov));

F_stg = fftshift(fft2(Y_stg));
mag_stg = log(1 + abs(F_stg));

subplot(2, 2, 1);
imagesc(mag_cov);
colormap(gca, jet);
colorbar;
axis image off;
title('(a) Cover Image 2D-FFT Magnitude Spectrum (log|1 + F|)', ...
      'FontSize', 11, 'FontWeight', 'bold');

subplot(2, 2, 2);
imagesc(mag_stg);
colormap(gca, jet);
colorbar;
axis image off;
title('(b) Stego Image 2D-FFT Magnitude Spectrum (log|1 + F|)', ...
      'FontSize', 11, 'FontWeight', 'bold');

% Frequency spectrum difference
specDiff = abs(mag_cov - mag_stg);
subplot(2, 2, 3);
imagesc(specDiff);
colormap(gca, hot);
colorbar;
axis image off;
title('(c) 2D-FFT Spectral Magnitude Difference', ...
      'FontSize', 11, 'FontWeight', 'bold');

% 8x8 DFT Block Frequency Coordinate Diagram
subplot(2, 2, 4);
gridMatrix = zeros(8, 8);
gridMatrix(3, 4) = 1.0;  % Coefficient Pair 1
gridMatrix(4, 3) = 1.0;  % Coefficient Pair 2
gridMatrix(7, 6) = 0.6;  % Conjugate Partner 1
gridMatrix(6, 7) = 0.6;  % Conjugate Partner 2

imagesc(gridMatrix);
colormap(gca, [0.95 0.95 0.95; 0.2 0.6 1.0; 0.9 0.3 0.2]);
axis image;
grid on;
set(gca, 'XTick', 1:8, 'YTick', 1:8);
xlabel('Frequency Column Index (v)');
ylabel('Frequency Row Index (u)');
title('(d) 8x8 DFT Block: Modulated Pairs (Red/Blue)', ...
      'FontSize', 11, 'FontWeight', 'bold');

text(4, 3, 'c2 (4,3)', 'HorizontalAlignment', 'center', 'FontWeight', 'bold', 'Color', 'w');
text(3, 4, 'c1 (3,4)', 'HorizontalAlignment', 'center', 'FontWeight', 'bold', 'Color', 'w');
text(6, 7, 'sym2', 'HorizontalAlignment', 'center', 'FontWeight', 'bold', 'Color', 'k');
text(7, 6, 'sym1', 'HorizontalAlignment', 'center', 'FontWeight', 'bold', 'Color', 'k');

%% Step 9: VISUALIZATION 3 - Secret Key Sensitivity Demonstration
fig3 = figure('Name', 'DSP Steganography: Secret Key Sensitivity', ...
              'Color', 'w', 'Position', [200, 200, 950, 450]);

displayBits = min(64, numPayloadBits);
subplot(1, 2, 1);
stem(1:displayBits, origBits(1:displayBits), 'filled', 'LineWidth', 1.5, 'MarkerSize', 5);
hold on;
plot(1:displayBits, extractedPayloadBits(1:displayBits), 'ro', 'MarkerSize', 7, 'LineWidth', 1.2);
hold off;
legend('Transmitted Bits', 'Recovered Bits', 'Location', 'Best');
title(sprintf('(a) Bitstream with CORRECT Key\nBER = %.2f%% (Exact Match)', ber), ...
      'FontSize', 11, 'FontWeight', 'bold');
xlabel('Bit Index');
ylabel('Bit Value (0 or 1)');
ylim([-0.2, 1.2]);
grid on;

subplot(1, 2, 2);
if length(rawBitsWrong) >= 32 + displayBits
    wrongDisplayBits = rawBitsWrong(33 : 32 + displayBits);
    stem(1:displayBits, origBits(1:displayBits), 'filled', 'LineWidth', 1.5, 'MarkerSize', 5);
    hold on;
    plot(1:displayBits, wrongDisplayBits, 'rx', 'MarkerSize', 8, 'LineWidth', 1.5);
    hold off;
    legend('Transmitted Bits', 'Wrong-Key Extracted Bits', 'Location', 'Best');
    title(sprintf('(b) Bitstream with WRONG Key\nBER = %.2f%% (Random Garbage)', wrongBer), ...
          'FontSize', 11, 'FontWeight', 'bold');
else
    text(0.5, 0.5, {'Unauthorized Key Extraction Rejected', 'Header Framing Check Failed'}, ...
         'HorizontalAlignment', 'center', 'FontSize', 12, 'FontWeight', 'bold');
    title('(b) Unauthorized Extraction Blocked', 'FontSize', 11, 'FontWeight', 'bold');
    axis off;
end
xlabel('Bit Index');
ylabel('Bit Value (0 or 1)');
ylim([-0.2, 1.2]);
grid on;

fprintf('[+] Demonstration complete! 3 presentation figures generated.\n');

%% Helper Function
function out = ternary(cond, valTrue, valFalse)
    if cond
        out = valTrue;
    else
        out = valFalse;
    end
end

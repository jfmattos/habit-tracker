#!/usr/bin/env node

/**
 * Synthesizes the app's feedback sounds into assets/sounds/ as 16-bit mono WAV files.
 * Run with `node scripts/generate-sounds.mjs` after changing a sound below.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SAMPLE_RATE = 44100;
const outDir = join(import.meta.dirname, '..', 'assets', 'sounds');

/** A bell-like tone: a sine with a few inharmonic partials and an exponential decay */
function bell(samples, start, frequency, duration, volume) {
  const partials = [
    [1, 1],
    [2.01, 0.35],
    [3.02, 0.15],
    [4.2, 0.06],
  ];
  const offset = Math.floor(start * SAMPLE_RATE);
  const length = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < length && offset + i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.004);
    const envelope = attack * Math.exp(-t * (4 / duration));
    let value = 0;
    for (const [ratio, gain] of partials) {
      value += gain * Math.sin(2 * Math.PI * frequency * ratio * t);
    }
    samples[offset + i] += value * envelope * volume;
  }
}

function render(duration, notes) {
  const samples = new Float32Array(Math.ceil(duration * SAMPLE_RATE));
  for (const note of notes) {
    bell(samples, ...note);
  }
  return samples;
}

function writeWav(name, samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((sample, i) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  });
  writeFileSync(join(outDir, name), buffer);
}

mkdirSync(outDir, { recursive: true });

// [start seconds, frequency Hz, duration seconds, volume]
writeWav('tick.wav', render(0.15, [[0, 1760, 0.12, 0.25]]));
writeWav(
  'chime.wav',
  render(0.9, [
    [0, 1318.5, 0.7, 0.3],
    [0.09, 1975.5, 0.8, 0.25],
  ])
);
writeWav(
  'fanfare.wav',
  render(1.8, [
    [0, 1046.5, 0.6, 0.25],
    [0.12, 1318.5, 0.6, 0.25],
    [0.24, 1568, 0.6, 0.25],
    [0.36, 2093, 1.4, 0.3],
    [0.36, 1046.5, 1.4, 0.15],
  ])
);

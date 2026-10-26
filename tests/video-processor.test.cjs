const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const binary = require('ffmpeg-static');

const exportsObject = {};
const mocks = {
  'ffmpeg-static': { default: binary }, child_process: require('node:child_process'),
  fs: { default: fs }, path: { default: path }, uuid: { v4: require('node:crypto').randomUUID },
  '@/lib/s3-client': {}, '@aws-sdk/client-s3': {}, '@/lib/db': {}, stream: require('node:stream'),
  'node:stream/promises': require('node:stream/promises'), 'node:os': os,
  '@/lib/storage/asset-keys': {},
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/video/video-processor.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject, console: { log() {}, error() {} }, AbortSignal, Date, process, require: name => {
  if (name in mocks) return mocks[name];
  throw new Error(`Unexpected dependency ${name}`);
} });

for (const [name, size, audio] of [['silent-portrait', '240x320', false], ['audio-landscape', '320x180', true]]) {
  test(`FFmpeg produces playable HLS for ${name} without upscaling`, { timeout: 30000 }, async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'knovest-video-test-'));
    t.after(() => {
      const resolved = path.resolve(dir);
      assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
      assert.ok(path.basename(resolved).startsWith('knovest-video-test-'));
      fs.rmSync(resolved, { recursive: true, force: true });
    });
    const input = path.join(dir, 'input.mp4');
    const output = path.join(dir, 'hls');
    fs.mkdirSync(output);
    const args = ['-nostdin', '-f', 'lavfi', '-i', `color=c=blue:s=${size}:r=24`, ...(audio ? ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000'] : []), '-t', '0.5', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', ...(audio ? ['-c:a', 'aac'] : []), input];
    const fixture = spawnSync(binary, args, { timeout: 10000, windowsHide: true, encoding: 'utf8' });
    assert.equal(fixture.status, 0, fixture.stderr);
    await exportsObject.VideoProcessor.transcodeToHLS(input, output);
    const master = fs.readFileSync(path.join(output, 'master.m3u8'), 'utf8');
    for (let index = 0; index < 3; index++) {
      assert.ok(master.includes(`stream_${index}.m3u8`));
      const playlist = fs.readFileSync(path.join(output, `stream_${index}.m3u8`), 'utf8');
      assert.ok(playlist.includes('#EXT-X-ENDLIST'));
      const segment = playlist.split(/\r?\n/).find(line => line.endsWith('.ts'));
      assert.ok(segment);
      const probe = spawnSync(binary, ['-nostdin', '-i', path.join(output, segment)], { timeout: 5000, windowsHide: true, encoding: 'utf8' });
      assert.ok(probe.stderr.includes('Video: h264'));
      assert.ok(probe.stderr.includes(size.replace('x', 'x')));
      assert.ok(probe.stderr.includes('Audio: aac'));
    }
  });
}

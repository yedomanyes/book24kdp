#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const UID = String(process.getuid?.() ?? '');
const LABEL = 'com.book24.brain-worker';
const PLIST_DIR = path.join(os.homedir(), 'Library', 'LaunchAgents');
const PLIST_PATH = path.join(PLIST_DIR, `${LABEL}.plist`);
const LOG_DIR = path.join(ROOT, 'runtime');
const OUT_LOG = path.join(LOG_DIR, 'brain-worker.log');
const ERR_LOG = path.join(LOG_DIR, 'brain-worker.error.log');
const NPM_PATH = execFileSync('which', ['npm'], { encoding: 'utf8' }).trim();
const NODE_PATH = execFileSync('which', ['node'], { encoding: 'utf8' }).trim();
const NPM_CLI_PATH = fs.realpathSync(NPM_PATH);
const NODE_REAL_PATH = fs.realpathSync(NODE_PATH);
const NODE_BIN_DIR = path.dirname(NODE_REAL_PATH);

fs.mkdirSync(PLIST_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

const command = `export PATH=${JSON.stringify(`${NODE_BIN_DIR}:/usr/bin:/bin:/usr/sbin:/sbin`)}; cd ${JSON.stringify(ROOT)} && ${JSON.stringify(NODE_REAL_PATH)} ${JSON.stringify(NPM_CLI_PATH)} run brain:worker`;
const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${LABEL}</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/zsh</string>
      <string>-lc</string>
      <string>${command}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${ROOT}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${OUT_LOG}</string>
    <key>StandardErrorPath</key>
    <string>${ERR_LOG}</string>
    <key>ProcessType</key>
    <string>Background</string>
  </dict>
</plist>
`;

fs.writeFileSync(PLIST_PATH, plist, 'utf8');

const domain = UID ? `gui/${UID}` : 'gui/501';

try {
  execFileSync('launchctl', ['bootout', domain, PLIST_PATH], { stdio: 'ignore' });
} catch {
  // ignore if not loaded yet
}

execFileSync('launchctl', ['bootstrap', domain, PLIST_PATH], { stdio: 'inherit' });
try {
  execFileSync('launchctl', ['enable', `${domain}/${LABEL}`], { stdio: 'ignore' });
} catch {
  // ignore
}

console.log(`Brain worker installed: ${PLIST_PATH}`);
console.log(`Log: ${OUT_LOG}`);

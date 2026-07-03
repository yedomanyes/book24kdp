#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const UID = String(process.getuid?.() ?? '');
const LABEL = 'com.book24.brain-worker';
const PLIST_PATH = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);
const domain = UID ? `gui/${UID}` : 'gui/501';

if (fs.existsSync(PLIST_PATH)) {
  try {
    execFileSync('launchctl', ['bootout', domain, PLIST_PATH], { stdio: 'ignore' });
  } catch {
    // ignore
  }

  fs.unlinkSync(PLIST_PATH);
  console.log(`Brain worker removed: ${PLIST_PATH}`);
} else {
  console.log(`Brain worker plist not found: ${PLIST_PATH}`);
}

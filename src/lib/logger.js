const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const GRAY = '\x1b[90m';

export function success(msg) {
  console.log(`${GREEN}✅${RESET} ${msg}`);
}

export function warn(msg) {
  console.log(`${YELLOW}⚠️${RESET}  ${msg}`);
}

export function error(msg) {
  console.error(`${RED}❌${RESET} ${msg}`);
}

export function info(msg) {
  console.log(`${BLUE}ℹ${RESET}  ${msg}`);
}

export function skip(msg) {
  console.log(`${GRAY}⏭${RESET}  ${msg}`);
}

export function heading(msg) {
  console.log(`\n${BLUE}===${RESET} ${msg} ${BLUE}===${RESET}`);
}

export function done(msg) {
  console.log(`\n${GREEN}🎉${RESET} ${msg}`);
}

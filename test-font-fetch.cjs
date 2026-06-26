const https = require('https');

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  const css = await fetchUrl('https://fonts.googleapis.com/css?family=Oswald', {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0' // old Firefox to force TTF
  });
  console.log(css);
  const match = css.match(/url\(([^)]+)\)/);
  if (match) {
    console.log("TTF URL:", match[1]);
  } else {
    console.log("No TTF URL found");
  }
}
test();

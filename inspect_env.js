const fs = require('fs');
const data = fs.readFileSync('.env', 'utf8');
console.log('raw \n', data);
console.log('lines and char codes:');
data.split(/\r?\n/).forEach((line,i)=>{
  const codes=line.split('').map(c=>c.charCodeAt(0));
  console.log(`${i+1}: \`${line}\` => [${codes.join(',')}]`);
});

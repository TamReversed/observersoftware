// Require this FIRST in any script that talks to the database.
// "railway run" injects the PRIVATE database address (*.railway.internal), which only works inside Railway's network.
// Railway also provides DATABASE_PUBLIC_URL, which works from your own computer, so switch to it automatically.
if (process.env.DATABASE_PUBLIC_URL && /railway\.internal/.test(process.env.DATABASE_URL || '')) {
  process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
  console.log('(using the public database address)');
}

import sqlite3 from 'sqlite3';

const db: sqlite3.Database = new sqlite3.Database('./db/pos.db', (err) => {
  if (err) {
    console.error(err.message);
  }

  console.log('Connected to the database.');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE global_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_name TEXT,
      setting_name TEXT,
      setting_value TEXT,
      setting_type INTEGER
    );`);

  db.run(`
    CREATE TABLE transactions (
      hash TEXT PRIMARY KEY,
      account TEXT,
      amount INTEGER,
      date INTEGER,
      type INTEGER
    );`);

  db.run(`
    CREATE TABLE items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      barcode TEXT,
      category TEXT,
      price REAL,
      extra TEXT
    );`);

  db.run(`
    CREATE TABLE bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      item_id INTEGER
    );`);

  db.run(`
    CREATE TABLE bills (
      transaction_hash TEXT PRIMARY KEY,
      price REAL,
      date INTEGER
    );`);

  db.run(`
    CREATE TABLE nano_price (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT,
      price REAL,
      date INTEGER
    );`);

  db.run('DELETE FROM global_config;');

  db.run(
    `
    INSERT INTO global_config (
      section_name,
      setting_name,
      setting_value,
      setting_type
    ) VALUES (?, ?, ?, ?);`,
    ['nodes', 'rpcNode', 'https://mynano.ninja/api/node/', 'string']
  );

  db.run(
    `
    INSERT INTO global_config (
      section_name,
      setting_name,
      setting_value,
      setting_type
    ) VALUES (?, ?, ?, ?);`,
    ['nodeRelated', 'wssServer', 'wss://ws.mynano.ninja/', 'string']
  );

  db.run(
    `
    INSERT INTO global_config (
      section_name,
      setting_name,
      setting_value,
      setting_type
    ) VALUES (?, ?, ?, ?);`,
    ['moneyRelated', 'currency', 'usd', 'string']
  );
});

db.close((err) => {
  if (err) {
    console.error(err.message);
    return new Error(err.message);
  }

  console.log('Close the database connection.');
  return null;
});

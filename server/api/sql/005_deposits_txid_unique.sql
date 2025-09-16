-- unicidade de txid de depósito (idempotente)
create unique index if not exists deposits_txid_uk
  on deposits(txid);

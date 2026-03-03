import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '', 
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true, // Azure SQL 사용 시 필수
    trustServerCertificate: true, // 로컬 개발 시 필수
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// 싱글톤 패턴으로 풀 관리
let poolPromise: Promise<sql.ConnectionPool> | null = null;

export const getDbPool = () => {
  if (poolPromise) return poolPromise;

  poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      console.log('✅ Connected to MS SQL Server Pool');
      return pool;
    })
    .catch(err => {
      poolPromise = null;
      console.error('❌ Database Connection Failed!', err);
      throw err;
    });

  return poolPromise;
};
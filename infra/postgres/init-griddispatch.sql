-- Initial database creation script for GridDispatch with PostGIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Permissions grant
GRANT ALL PRIVILEGES ON DATABASE griddispatch_db TO griddispatch_user;

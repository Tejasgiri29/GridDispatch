-- Initial database creation script for AgentGuard
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Flyway will execute the schema migrations, this ensures permissions
GRANT ALL PRIVILEGES ON DATABASE agentguard_db TO agentguard_user;

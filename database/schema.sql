-- Observer Portfolio Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  webauthn_credentials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Capabilities (Products) table
CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT DEFAULT '',
  features JSONB DEFAULT '[]'::jsonb,
  screenshots JSONB DEFAULT '[]'::jsonb,
  external_url VARCHAR(500) DEFAULT '',
  icon JSONB DEFAULT '{"type":"preset","preset":"","svg":"","lottieUrl":"","lottieData":null}'::jsonb,
  "order" INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Work table
CREATE TABLE IF NOT EXISTS work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(255) NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  image VARCHAR(500) DEFAULT '',
  client VARCHAR(255) DEFAULT '',
  date VARCHAR(20) DEFAULT '',
  case_study_url VARCHAR(500) DEFAULT '',
  "order" INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Posts (Blog) table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT DEFAULT '',
  category VARCHAR(50) DEFAULT '',
  content TEXT NOT NULL,
  author VARCHAR(50) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published BOOLEAN DEFAULT false
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_capabilities_published ON capabilities(published);
CREATE INDEX IF NOT EXISTS idx_capabilities_order ON capabilities("order");
CREATE INDEX IF NOT EXISTS idx_work_published ON work(published);
CREATE INDEX IF NOT EXISTS idx_work_order ON work("order");
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_capabilities_updated_at BEFORE UPDATE ON capabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_updated_at BEFORE UPDATE ON work
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


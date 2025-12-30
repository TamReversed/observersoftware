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

-- Messages (Contact form submissions) table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_capabilities_updated_at ON capabilities;
CREATE TRIGGER update_capabilities_updated_at BEFORE UPDATE ON capabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_updated_at ON work;
CREATE TRIGGER update_work_updated_at BEFORE UPDATE ON work
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADMIN PANEL EXPANSION TABLES
-- ============================================

-- Site Settings (key-value store for site-wide configuration)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories (for blog posts and work items)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'blog' or 'work'
  description TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Changelog entries
CREATE TABLE IF NOT EXISTS changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  details TEXT DEFAULT '',
  type VARCHAR(50) DEFAULT 'fix', -- fix, feature, improvement, security
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Homepage content (section-based)
CREATE TABLE IF NOT EXISTS homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(100) UNIQUE NOT NULL, -- 'hero', 'philosophy', 'values', 'about'
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Navigation links
CREATE TABLE IF NOT EXISTS navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location VARCHAR(50) NOT NULL, -- 'header', 'footer_nav', 'footer_links'
  label VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  "order" INTEGER DEFAULT 0,
  is_external BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media library
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text VARCHAR(500) DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  uploaded_by VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_name VARCHAR(200) NOT NULL,
  author_title VARCHAR(200) DEFAULT '',
  author_company VARCHAR(200) DEFAULT '',
  author_image VARCHAR(500) DEFAULT '',
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  "order" INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  "order" INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_changelog_date ON changelog(date DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_type ON changelog(type);
CREATE INDEX IF NOT EXISTS idx_navigation_location ON navigation(location);
CREATE INDEX IF NOT EXISTS idx_navigation_published ON navigation(published);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(published);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials("order");
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(published);

-- Triggers for new tables
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_changelog_updated_at ON changelog;
CREATE TRIGGER update_changelog_updated_at BEFORE UPDATE ON changelog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_homepage_content_updated_at ON homepage_content;
CREATE TRIGGER update_homepage_content_updated_at BEFORE UPDATE ON homepage_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_navigation_updated_at ON navigation;
CREATE TRIGGER update_navigation_updated_at BEFORE UPDATE ON navigation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default site settings
INSERT INTO site_settings (key, value) VALUES
  ('site_name', '"Observer"'),
  ('tagline', '"Purposeful Software"'),
  ('meta_description', '"Observer builds software by watching real workflows, finding friction, and removing steps."'),
  ('contact_email', '"hello@observersoftware.io"'),
  ('footer_cta_title', '"A clearer way through the work"'),
  ('footer_cta_subtitle', '"Send a short note with the workflow, the constraints, and where people get stuck. Observer will respond with a simple next step."'),
  ('social_links', '{"linkedin": "", "github": "", "twitter": ""}'),
  ('copyright_text', '"© 2025 Observer. All rights reserved."')
ON CONFLICT (key) DO NOTHING;

-- Seed default blog categories
INSERT INTO categories (name, slug, type, "order") VALUES
  ('Engineering', 'engineering', 'blog', 1),
  ('Design', 'design', 'blog', 2),
  ('Process', 'process', 'blog', 3),
  ('Insights', 'insights', 'blog', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed default homepage content
INSERT INTO homepage_content (section, content) VALUES
  ('hero', '{"eyebrow": "Software, observed", "title": "Software shaped by real work.", "subtitle": "Observer watches real workflows, finds friction, and removes steps. The result is clear, lightweight systems that stay maintainable."}'),
  ('facts', '[{"label": "Method", "value": "Observe workflows"}, {"label": "Focus", "value": "Remove steps"}, {"label": "Output", "value": "Maintainable systems"}]'),
  ('philosophy', '{"intro": "Observer exists because its founders noticed people working around technology instead of with it.", "body": ["The work starts with watching—sitting with teams, mapping actual steps, and listening for the phrases that reveal friction.", "Many tools fail by treating workflows as diagrams on a whiteboard. Observer treats them as real behavior that changes under pressure."]}'),
  ('values', '[{"icon": "seek", "title": "Seek"}, {"icon": "learn", "title": "Learn"}, {"icon": "integrate", "title": "Integrate"}]'),
  ('about', '{"label": "About", "title": "A small, autonomous team", "lead": "Observer operates as a subsidiary of Techademy LLC, focusing exclusively on workflow software.", "body": ["Engagements are senior-led and deliberate.", "The output is software that feels obvious once in use, and stays maintainable as requirements change."], "established": "2024"}')
ON CONFLICT (section) DO NOTHING;

-- Seed default navigation
INSERT INTO navigation (location, label, url, "order", is_external, published) VALUES
  ('header', 'Work', '/#work', 1, false, true),
  ('header', 'Products', '/#capabilities', 2, false, true),
  ('header', 'Blog', '/blog', 3, false, true),
  ('header', 'About', '/#about', 4, false, true),
  ('header', 'Contact', '/contact', 5, false, true),
  ('footer_nav', 'Work', '/#work', 1, false, true),
  ('footer_nav', 'Products', '/#capabilities', 2, false, true),
  ('footer_nav', 'Blog', '/blog', 3, false, true),
  ('footer_nav', 'About', '/#about', 4, false, true),
  ('footer_links', 'LinkedIn', '', 1, true, false),
  ('footer_links', 'GitHub', '', 2, true, false)
ON CONFLICT DO NOTHING;


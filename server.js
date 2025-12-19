const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && !key.startsWith('#') && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      });
    }
  } catch (e) {
    // Ignore if .env doesn't exist
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Available categories
const CATEGORIES = [
  { slug: 'engineering', name: 'Engineering' },
  { slug: 'design', name: 'Design' },
  { slug: 'process', name: 'Process' },
  { slug: 'insights', name: 'Insights' }
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Validate required env vars in production
if (isProduction && !process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is required in production');
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'observer-dev-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Trust proxy in production (for Railway, Render, etc.)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// Initialize data files
async function initializeData() {
  // Create data directory if needed
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize users file with admin account
  if (!fs.existsSync(USERS_FILE)) {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const users = [{
      id: uuidv4(),
      username: adminUsername,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    }];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`Admin user created: ${adminUsername}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log('WARNING: Using default admin password. Set ADMIN_PASSWORD env var for production!');
    }
  }

  // Initialize posts file
  if (!fs.existsSync(POSTS_FILE)) {
    const samplePosts = [
      {
        id: uuidv4(),
        slug: 'welcome-to-observer',
        title: 'Welcome to Observer',
        excerpt: 'An introduction to our approach: watching real workflows, finding friction, and removing unnecessary steps.',
        category: 'process',
        content: `# Welcome to Observer

We build software by watching how people actually work.

## Our Approach

Most software fails because it treats workflows as diagrams instead of lived routines. We prefer restraint: fewer screens, fewer decisions, fewer moving parts.

### What We Look For

- **Shortcuts people take** — they exist for a reason
- **Shadow notes** — the unofficial records that matter
- **Re-entered data** — signs of broken connections
- **Colleague questions** — gaps the system won't answer

These patterns are the real requirements.

## The Result

Clear, lightweight systems that stay maintainable. Software that feels obvious once in use.`,
        author: 'tamreversed',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        published: true
      },
      {
        id: uuidv4(),
        slug: 'the-cost-of-unnecessary-features',
        title: 'The Cost of Unnecessary Features',
        excerpt: 'Every feature has a maintenance cost. Understanding when to say no is as important as knowing what to build.',
        category: 'engineering',
        content: `# The Cost of Unnecessary Features

Every line of code is a liability. Every feature is a promise to maintain.

## The Hidden Costs

When we add a feature, we're not just writing code. We're committing to:

- **Testing** — every new path needs verification
- **Documentation** — users need to understand it
- **Support** — questions will come
- **Maintenance** — bugs will surface
- **Complexity** — the system becomes harder to reason about

## The Observer Approach

Before building, we ask:
1. Who specifically needs this?
2. How often will they use it?
3. What happens if we don't build it?

Often, the answer to the third question is "nothing bad." That's when we say no.`,
        author: 'tamreversed',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        published: true
      },
      {
        id: uuidv4(),
        slug: 'designing-for-the-real-workflow',
        title: 'Designing for the Real Workflow',
        excerpt: 'The gap between how people say they work and how they actually work is where good software lives.',
        category: 'design',
        content: `# Designing for the Real Workflow

People describe their ideal workflow. They live in their actual workflow.

## The Gap

When you ask someone how they do their job, they'll describe the official process. But watch them work, and you'll see:

- Sticky notes with shortcuts
- Browser tabs left open as reminders
- Spreadsheets that shadow the "real" system
- Workarounds that have become habit

## Designing for Reality

Good design starts with observation. Not interviews, not surveys — watching.

The patterns people create organically are the real requirements. Our job is to formalize what already works, not impose what we think should work.`,
        author: 'tamreversed',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        published: true
      }
    ];
    fs.writeFileSync(POSTS_FILE, JSON.stringify(samplePosts, null, 2));
    console.log('Sample blog posts created');
  }
}

// Helper functions
function readPosts() {
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ success: true, username: user.username });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// Categories endpoint
app.get('/api/categories', (req, res) => {
  res.json(CATEGORIES);
});

// Blog routes (public) with search, category filter, and pagination
app.get('/api/posts', (req, res) => {
  const { search, category, page = 1, limit = 8 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  let posts = readPosts()
    .filter(p => p.published)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Filter by category
  if (category) {
    posts = posts.filter(p => p.category === category);
  }

  // Search filter (title, excerpt, content)
  if (search) {
    const searchLower = search.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(searchLower) ||
      p.excerpt.toLowerCase().includes(searchLower) ||
      p.content.toLowerCase().includes(searchLower)
    );
  }

  // Calculate pagination
  const total = posts.length;
  const totalPages = Math.ceil(total / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  // Paginate
  const paginatedPosts = posts.slice(startIndex, endIndex).map(p => ({
    ...p,
    readTime: calculateReadTime(p.content),
    categoryName: CATEGORIES.find(c => c.slug === p.category)?.name || p.category,
    content: undefined // Don't send full content in list
  }));

  res.json({
    posts: paginatedPosts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  });
});

app.get('/api/posts/:slug', (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.slug === req.params.slug && p.published);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Get related posts (same category, excluding current)
  const relatedPosts = posts
    .filter(p => p.published && p.category === post.category && p.slug !== post.slug)
    .slice(0, 3)
    .map(p => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      readTime: calculateReadTime(p.content),
      publishedAt: p.publishedAt
    }));

  res.json({
    ...post,
    readTime: calculateReadTime(post.content),
    categoryName: CATEGORIES.find(c => c.slug === post.category)?.name || post.category,
    htmlContent: marked(post.content),
    relatedPosts
  });
});

// Admin blog routes
app.get('/api/admin/posts', requireAuth, (req, res) => {
  const posts = readPosts()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map(p => ({
      ...p,
      readTime: calculateReadTime(p.content),
      categoryName: CATEGORIES.find(c => c.slug === p.category)?.name || p.category
    }));
  res.json(posts);
});

app.post('/api/admin/posts', requireAuth, (req, res) => {
  const { title, excerpt, content, category, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const posts = readPosts();
  const slug = slugify(title);

  // Check for duplicate slug
  if (posts.some(p => p.slug === slug)) {
    return res.status(400).json({ error: 'A post with this title already exists' });
  }

  const newPost = {
    id: uuidv4(),
    slug,
    title,
    excerpt: excerpt || title,
    category: category || 'insights',
    content,
    author: req.session.username,
    publishedAt: published ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
    published: !!published
  };

  posts.push(newPost);
  writePosts(posts);
  res.json(newPost);
});

app.put('/api/admin/posts/:slug', requireAuth, (req, res) => {
  const { title, excerpt, content, category, published } = req.body;
  const posts = readPosts();
  const index = posts.findIndex(p => p.slug === req.params.slug);

  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = posts[index];
  const newSlug = title ? slugify(title) : post.slug;

  // Check for duplicate slug (excluding current post)
  if (newSlug !== post.slug && posts.some(p => p.slug === newSlug)) {
    return res.status(400).json({ error: 'A post with this title already exists' });
  }

  posts[index] = {
    ...post,
    slug: newSlug,
    title: title || post.title,
    excerpt: excerpt || post.excerpt,
    category: category !== undefined ? category : post.category,
    content: content || post.content,
    published: published !== undefined ? published : post.published,
    publishedAt: published && !post.publishedAt ? new Date().toISOString() : post.publishedAt,
    updatedAt: new Date().toISOString()
  };

  writePosts(posts);
  res.json(posts[index]);
});

app.delete('/api/admin/posts/:slug', requireAuth, (req, res) => {
  const posts = readPosts();
  const index = posts.findIndex(p => p.slug === req.params.slug);

  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(index, 1);
  writePosts(posts);
  res.json({ success: true });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// SPA-style routing for blog posts
app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'post.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// Start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin/login`);
  });
});

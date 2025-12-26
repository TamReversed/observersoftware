const fs = require('fs');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const DataService = require('./dataService');
const config = require('../config');

async function initializeData() {
  // Create data directory if needed
  if (!fs.existsSync(config.paths.dataDir)) {
    fs.mkdirSync(config.paths.dataDir, { recursive: true });
  }

  // Initialize users file with admin account
  const usersService = new DataService(config.paths.usersFile);
  if (usersService.findAll().length === 0) {
    const adminPassword = config.admin.defaultPassword;
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminUser = {
      id: uuidv4(),
      username: config.admin.defaultUsername,
      password: hashedPassword, // Keep for fallback during transition
      webauthnCredentials: [], // Initialize empty array for passkeys
      createdAt: new Date().toISOString()
    };
    usersService.create(adminUser);
    console.log(`Admin user created: ${config.admin.defaultUsername}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log('WARNING: Using default admin password. Set ADMIN_PASSWORD env var for production!');
    }
  }

  // Initialize posts file
  const postsService = new DataService(config.paths.postsFile);
  if (postsService.findAll().length === 0) {
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
    samplePosts.forEach(post => postsService.create(post));
    console.log('Sample blog posts created');
  }

  // Initialize work file
  const workService = new DataService(config.paths.workFile);
  if (workService.findAll().length === 0) {
    const sampleWork = [
      {
        id: uuidv4(),
        industry: 'Healthcare',
        problem: 'Staff coordinated schedules outside the system to avoid conflicts',
        solution: 'Observer watched the handoffs, removed duplicate entry, and made constraints explicit. Coordination dropped from about 40 minutes a day to under 5.',
        tags: ['Scheduling', 'Fewer handoffs'],
        image: '',
        client: '',
        date: '2024-03',
        caseStudyUrl: '',
        order: 1,
        published: true
      },
      {
        id: uuidv4(),
        industry: 'Logistics',
        problem: 'Managers chased updates across reports, radios, and the floor',
        solution: 'Observer removed the "where is the truth" loop by putting current state and exceptions on one live surface. Fewer checks, faster decisions.',
        tags: ['Visibility', 'Exceptions'],
        image: '',
        client: '',
        date: '2024-02',
        caseStudyUrl: '',
        order: 2,
        published: true
      },
      {
        id: uuidv4(),
        industry: 'Professional Services',
        problem: 'Intake relied on retyping the same details in multiple places',
        solution: 'Observer removed repeated questions and collapsed handoffs into one guided flow. Onboarding time dropped by roughly 60%.',
        tags: ['Intake', 'One flow'],
        image: '',
        client: '',
        date: '2024-01',
        caseStudyUrl: '',
        order: 3,
        published: true
      },
      {
        id: uuidv4(),
        industry: 'Education',
        problem: 'Compliance tracking lived in spreadsheets and last-minute reminders',
        solution: 'Observer replaced scattered lists with a single record of truth and clear status. Admin time shifted from chasing updates to handling exceptions.',
        tags: ['Compliance', 'Clear status'],
        image: '',
        client: '',
        date: '2023-12',
        caseStudyUrl: '',
        order: 4,
        published: true
      }
    ];
    sampleWork.forEach(item => workService.create(item));
    console.log('Sample work items created');
  }

  // Initialize capabilities file
  const capabilitiesService = new DataService(config.paths.capabilitiesFile);
  if (capabilitiesService.findAll().length === 0) {
    const sampleCapabilities = [
      {
        id: uuidv4(),
        title: 'DataDragon',
        description: 'Transform raw data into clear, actionable insights. Built for teams that need answers, not dashboards.',
        order: 1,
        published: true
      },
      {
        id: uuidv4(),
        title: 'TableFlow',
        description: 'Streamline data entry and workflow automation. Reduce manual steps, increase clarity.',
        order: 2,
        published: true
      }
    ];
    sampleCapabilities.forEach(cap => capabilitiesService.create(cap));
    console.log('Sample capabilities created');
  }
}

module.exports = { initializeData };





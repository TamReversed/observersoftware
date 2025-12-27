const { v4: uuidv4 } = require('uuid');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const config = require('../config');

// Use database if available, otherwise fall back to JSON files
const messagesService = config.database.useDatabase
  ? new DbService('messages')
  : new DataService(config.paths.messagesFile);

// Get all messages (admin only)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await messagesService.findAll();
    // Sort by newest first
    const sorted = messages.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
    res.json(sorted);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Get a single message by ID (admin only)
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await messagesService.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
};

// Create a new message (public)
exports.createMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    const newMessage = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : null,
      message: message.trim(),
      read: false
    };
    
    // Add timestamps for JSON file mode (database will use defaults)
    if (!config.database.useDatabase) {
      newMessage.createdAt = new Date().toISOString();
      newMessage.updatedAt = new Date().toISOString();
    }
    
    await messagesService.create(newMessage);
    
    res.status(201).json({ 
      success: true, 
      message: 'Message sent successfully',
      id: newMessage.id
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark message as read (admin only)
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { read: true };
    
    // Add timestamp for JSON file mode (database trigger handles it)
    if (!config.database.useDatabase) {
      updates.updatedAt = new Date().toISOString();
    }
    
    const message = await messagesService.updateById(id, updates);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
};

// Delete a message (admin only)
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await messagesService.deleteById(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Get unread count (admin only)
exports.getUnreadCount = async (req, res) => {
  try {
    const messages = await messagesService.findAll();
    const unreadCount = messages.filter(m => !m.read || m.read === false).length;
    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};


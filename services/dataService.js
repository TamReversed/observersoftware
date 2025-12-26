const fs = require('fs');
const path = require('path');

class DataService {
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureFileExists();
  }

  ensureFileExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading ${this.filePath}:`, error);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${this.filePath}:`, error);
      throw error;
    }
  }

  findAll(filterFn = null) {
    const data = this.read();
    return filterFn ? data.filter(filterFn) : data;
  }

  findOne(predicate) {
    const data = this.read();
    return data.find(predicate);
  }

  findById(id) {
    return this.findOne(item => item.id === id);
  }

  findBySlug(slug) {
    return this.findOne(item => item.slug === slug);
  }

  create(newItem) {
    const data = this.read();
    data.push(newItem);
    this.write(data);
    return newItem;
  }

  update(predicate, updates) {
    const data = this.read();
    const index = data.findIndex(predicate);
    
    if (index === -1) {
      return null;
    }

    data[index] = { ...data[index], ...updates };
    this.write(data);
    return data[index];
  }

  updateById(id, updates) {
    return this.update(item => item.id === id, updates);
  }

  updateBySlug(slug, updates) {
    return this.update(item => item.slug === slug, updates);
  }

  delete(predicate) {
    const data = this.read();
    const index = data.findIndex(predicate);
    
    if (index === -1) {
      return false;
    }

    data.splice(index, 1);
    this.write(data);
    return true;
  }

  deleteById(id) {
    return this.delete(item => item.id === id);
  }

  deleteBySlug(slug) {
    return this.delete(item => item.slug === slug);
  }
}

module.exports = DataService;





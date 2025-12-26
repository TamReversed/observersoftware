const { query } = require('./database');
const { v4: uuidv4 } = require('uuid');

/**
 * Generic database service that replaces DataService
 * Works with any table that has standard CRUD operations
 */
class DbService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Find all records, optionally filtered
   */
  async findAll(filterFn = null) {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params = [];
      
      // If filterFn is provided, we need to fetch all and filter in memory
      // For better performance, consider passing SQL WHERE clauses instead
      const result = await query(sql, params);
      let data = result.rows;
      
      // Convert JSONB fields back to JavaScript objects
      data = data.map(row => this._deserializeRow(row));
      
      if (filterFn) {
        data = data.filter(filterFn);
      }
      
      return data;
    } catch (error) {
      console.error(`Error in findAll for ${this.tableName}:`, error);
      return [];
    }
  }

  /**
   * Find one record by predicate
   */
  async findOne(predicate) {
    const all = await this.findAll();
    return all.find(predicate);
  }

  /**
   * Find by ID
   */
  async findById(id) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this._deserializeRow(result.rows[0]);
    } catch (error) {
      console.error(`Error in findById for ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Find by slug (for posts)
   */
  async findBySlug(slug) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE slug = $1`,
        [slug]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this._deserializeRow(result.rows[0]);
    } catch (error) {
      console.error(`Error in findBySlug for ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Create a new record
   */
  async create(newItem) {
    try {
      // Generate ID if not provided
      if (!newItem.id) {
        newItem.id = uuidv4();
      }
      
      const { columns, values, placeholders } = this._buildInsert(newItem);
      
      const sql = `
        INSERT INTO ${this.tableName} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await query(sql, values);
      return this._deserializeRow(result.rows[0]);
    } catch (error) {
      console.error(`Error in create for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record by predicate
   */
  async update(predicate, updates) {
    const item = await this.findOne(predicate);
    if (!item) {
      return null;
    }
    
    return this.updateById(item.id, updates);
  }

  /**
   * Update a record by ID
   */
  async updateById(id, updates) {
    try {
      const { setClause, values } = this._buildUpdate(updates);
      values.push(id);
      
      const sql = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = $${values.length}
        RETURNING *
      `;
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this._deserializeRow(result.rows[0]);
    } catch (error) {
      console.error(`Error in updateById for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record by slug
   */
  async updateBySlug(slug, updates) {
    try {
      const { setClause, values } = this._buildUpdate(updates);
      values.push(slug);
      
      const sql = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE slug = $${values.length}
        RETURNING *
      `;
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this._deserializeRow(result.rows[0]);
    } catch (error) {
      console.error(`Error in updateBySlug for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record by predicate
   */
  async delete(predicate) {
    const item = await this.findOne(predicate);
    if (!item) {
      return false;
    }
    
    return this.deleteById(item.id);
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id) {
    try {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`,
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error in deleteById for ${this.tableName}:`, error);
      return false;
    }
  }

  /**
   * Delete a record by slug
   */
  async deleteBySlug(slug) {
    try {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE slug = $1 RETURNING id`,
        [slug]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error in deleteBySlug for ${this.tableName}:`, error);
      return false;
    }
  }

  /**
   * Build INSERT statement
   */
  _buildInsert(data) {
    const columns = [];
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      // Convert camelCase to database field name
      let dbKey = this._getDbFieldName(key);
      // Quote reserved words like "order"
      if (dbKey === 'order' || dbKey === 'user' || dbKey === 'group') {
        dbKey = `"${dbKey}"`;
      }
      columns.push(dbKey);
      values.push(this._serializeValue(value));
      placeholders.push(`$${paramIndex}`);
      paramIndex++;
    }

    return {
      columns: columns.join(', '),
      values,
      placeholders: placeholders.join(', ')
    };
  }

  /**
   * Build UPDATE statement
   */
  _buildUpdate(updates) {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      let dbKey = this._getDbFieldName(key);
      // Quote reserved words like "order"
      if (dbKey === 'order' || dbKey === 'user' || dbKey === 'group') {
        dbKey = `"${dbKey}"`;
      }
      setClauses.push(`${dbKey} = $${paramIndex}`);
      values.push(this._serializeValue(value));
      paramIndex++;
    }

    return {
      setClause: setClauses.join(', '),
      values
    };
  }

  /**
   * Serialize value for database (convert objects/arrays to JSONB)
   */
  _serializeValue(value) {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'object' && !(value instanceof Date)) {
      return JSON.stringify(value);
    }
    return value;
  }

  /**
   * Deserialize row from database (convert JSONB back to objects)
   */
  _deserializeRow(row) {
    const deserialized = { ...row };
    
    // Convert database field names back to camelCase
    const result = {};
    for (const [key, value] of Object.entries(deserialized)) {
      const jsKey = this._getJsFieldName(key);
      
      // Parse JSONB fields (PostgreSQL returns JSONB as objects, but check anyway)
      if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
        // If it's already an object (PostgreSQL JSONB), use it directly
        result[jsKey] = value;
      } else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          result[jsKey] = JSON.parse(value);
        } catch (e) {
          result[jsKey] = value;
        }
      } else {
        result[jsKey] = value;
      }
    }
    
    return result;
  }

  /**
   * Convert camelCase to snake_case
   */
  _camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  _snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  
  /**
   * Special field name mappings for database columns
   */
  _getDbFieldName(fieldName) {
    const mappings = {
      'longDescription': 'long_description',
      'externalUrl': 'external_url',
      'caseStudyUrl': 'case_study_url',
      'webauthnCredentials': 'webauthn_credentials',
      'publishedAt': 'published_at',
      'updatedAt': 'updated_at',
      'createdAt': 'created_at'
    };
    return mappings[fieldName] || this._camelToSnake(fieldName);
  }
  
  /**
   * Convert database field name back to camelCase
   */
  _getJsFieldName(dbFieldName) {
    const mappings = {
      'long_description': 'longDescription',
      'external_url': 'externalUrl',
      'case_study_url': 'caseStudyUrl',
      'webauthn_credentials': 'webauthnCredentials',
      'published_at': 'publishedAt',
      'updated_at': 'updatedAt',
      'created_at': 'createdAt'
    };
    return mappings[dbFieldName] || this._snakeToCamel(dbFieldName);
  }
}

module.exports = DbService;


// Class name mapping utility for different education systems
const db = require('../config/database');

class ClassMapping {
  static async getClassNames(educationSystem) {
    try {
      const result = await db.query(
        'SELECT anglophone_name, francophone_name, level_order FROM class_name_mappings ORDER BY level_order'
      );
      
      if (educationSystem === 'francophone') {
        return result.rows.map(row => ({
          level: row.level_order,
          name: row.francophone_name,
          displayName: row.francophone_name
        }));
      } else {
        return result.rows.map(row => ({
          level: row.level_order,
          name: row.anglophone_name,
          displayName: row.anglophone_name
        }));
      }
    } catch (error) {
      console.error('Error getting class names:', error);
      // Fallback to default mappings
      return this.getDefaultClassNames(educationSystem);
    }
  }

  static getDefaultClassNames(educationSystem) {
    const mappings = [
      { level: 1, anglophone: 'Class 1', francophone: 'SIL' },
      { level: 2, anglophone: 'Class 2', francophone: 'CP' },
      { level: 3, anglophone: 'Class 3', francophone: 'CE1' },
      { level: 4, anglophone: 'Class 4', francophone: 'CE2' },
      { level: 5, anglophone: 'Class 5', francophone: 'CM1' },
      { level: 6, anglophone: 'Class 6', francophone: 'CM2' }
    ];

    if (educationSystem === 'francophone') {
      return mappings.map(m => ({
        level: m.level,
        name: m.francophone,
        displayName: m.francophone
      }));
    } else {
      return mappings.map(m => ({
        level: m.level,
        name: m.anglophone,
        displayName: m.anglophone
      }));
    }
  }

  static getClassNameByLevel(level, educationSystem) {
    const mappings = this.getDefaultClassNames(educationSystem);
    const mapping = mappings.find(m => m.level === level);
    return mapping ? mapping.displayName : `Level ${level}`;
  }

  static getLevelByClassName(className, educationSystem) {
    const mappings = this.getDefaultClassNames(educationSystem);
    const mapping = mappings.find(m => m.name === className);
    return mapping ? mapping.level : null;
  }
}

module.exports = ClassMapping;

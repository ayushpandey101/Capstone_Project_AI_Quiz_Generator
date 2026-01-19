// backend/utils/seedLearningResources.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LearningResource from '../models/LearningResource.js';
import User from '../models/User.js';

dotenv.config();

const sampleResources = [
  {
    title: 'Introduction to JavaScript Arrays',
    description: 'Learn the fundamentals of JavaScript arrays including creation, manipulation, and common methods like map, filter, and reduce.',
    category: 'tutorial',
    subject: 'JavaScript',
    topics: ['Arrays', 'Data Structures', 'ES6'],
    difficulty: 'beginner',
    content: `# JavaScript Arrays

Arrays are one of the most fundamental data structures in JavaScript. They allow you to store multiple values in a single variable.

## Creating Arrays
\`\`\`javascript
const fruits = ['apple', 'banana', 'orange'];
const numbers = [1, 2, 3, 4, 5];
\`\`\`

## Common Array Methods
- **push()**: Add elements to the end
- **pop()**: Remove last element
- **map()**: Transform each element
- **filter()**: Select elements based on condition
- **reduce()**: Combine elements into single value

## Practice
Try creating an array and using these methods to manipulate it!`,
    contentType: 'markdown',
    estimatedTime: 15,
    tags: ['javascript', 'programming', 'arrays', 'data-structures'],
  },
  {
    title: 'Python Functions and Scope',
    description: 'Master Python functions, parameters, return values, and variable scope in this comprehensive tutorial.',
    category: 'tutorial',
    subject: 'Python',
    topics: ['Functions', 'Scope', 'Parameters'],
    difficulty: 'intermediate',
    content: `# Python Functions and Scope

Functions are reusable blocks of code that perform specific tasks.

## Defining Functions
\`\`\`python
def greet(name):
    return f"Hello, {name}!"

result = greet("Alice")
print(result)  # Output: Hello, Alice!
\`\`\`

## Scope
Variables defined inside a function are local to that function.

\`\`\`python
x = 10  # Global scope

def my_function():
    x = 5  # Local scope
    print(x)  # Prints 5

my_function()
print(x)  # Prints 10
\`\`\`

## Best Practices
- Use descriptive function names
- Keep functions focused on single tasks
- Document your functions with docstrings`,
    contentType: 'markdown',
    estimatedTime: 20,
    tags: ['python', 'functions', 'scope', 'programming'],
  },
  {
    title: 'SQL Joins Explained',
    description: 'Understand different types of SQL joins (INNER, LEFT, RIGHT, FULL) with practical examples.',
    category: 'article',
    subject: 'Database',
    topics: ['SQL', 'Joins', 'Database Queries'],
    difficulty: 'intermediate',
    content: `# SQL Joins

Joins are used to combine rows from two or more tables based on related columns.

## Types of Joins

### INNER JOIN
Returns records with matching values in both tables.
\`\`\`sql
SELECT orders.id, customers.name
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id;
\`\`\`

### LEFT JOIN
Returns all records from left table, and matched records from right table.
\`\`\`sql
SELECT customers.name, orders.id
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id;
\`\`\`

### RIGHT JOIN
Returns all records from right table, and matched records from left table.

### FULL OUTER JOIN
Returns all records when there is a match in either table.

## When to Use Each Join
- INNER JOIN: Only records with matches
- LEFT JOIN: All from left, matches from right
- RIGHT JOIN: All from right, matches from left
- FULL JOIN: Everything from both tables`,
    contentType: 'markdown',
    estimatedTime: 25,
    tags: ['sql', 'database', 'joins', 'queries'],
  },
  {
    title: 'React Hooks Complete Guide',
    description: 'A comprehensive guide to React Hooks including useState, useEffect, useContext, and custom hooks.',
    category: 'video',
    subject: 'React',
    topics: ['React', 'Hooks', 'State Management'],
    difficulty: 'intermediate',
    content: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
    contentType: 'video-url',
    thumbnailUrl: 'https://i.ytimg.com/vi/O6P86uwfdR0/hqdefault.jpg',
    estimatedTime: 45,
    tags: ['react', 'hooks', 'javascript', 'frontend'],
  },
  {
    title: 'Data Structures: Linked Lists',
    description: 'Learn about linked lists, their implementation, and when to use them over arrays.',
    category: 'tutorial',
    subject: 'Data Structures',
    topics: ['Linked Lists', 'Pointers', 'Memory Management'],
    difficulty: 'intermediate',
    content: `# Linked Lists

A linked list is a linear data structure where elements are stored in nodes. Each node contains data and a reference to the next node.

## Node Structure
\`\`\`javascript
class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}
\`\`\`

## Linked List Implementation
\`\`\`javascript
class LinkedList {
  constructor() {
    this.head = null;
  }
  
  append(data) {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode;
      return;
    }
    
    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = newNode;
  }
}
\`\`\`

## Advantages
- Dynamic size
- Easy insertion/deletion
- Efficient memory usage

## Disadvantages
- No random access
- Extra memory for pointers
- Sequential access only`,
    contentType: 'markdown',
    estimatedTime: 30,
    tags: ['data-structures', 'linked-lists', 'algorithms'],
  },
  {
    title: 'HTTP Methods and REST APIs',
    description: 'Understanding HTTP methods (GET, POST, PUT, DELETE) and RESTful API design principles.',
    category: 'article',
    subject: 'Web Development',
    topics: ['HTTP', 'REST API', 'Web Services'],
    difficulty: 'beginner',
    content: `# HTTP Methods and REST APIs

REST (Representational State Transfer) is an architectural style for web services.

## Common HTTP Methods

### GET
Retrieve data from server
\`\`\`
GET /api/users
GET /api/users/123
\`\`\`

### POST
Create new resources
\`\`\`
POST /api/users
Body: { "name": "John", "email": "john@example.com" }
\`\`\`

### PUT
Update existing resources
\`\`\`
PUT /api/users/123
Body: { "name": "John Updated" }
\`\`\`

### DELETE
Remove resources
\`\`\`
DELETE /api/users/123
\`\`\`

## RESTful Design Principles
1. Use nouns for resources (/users, not /getUsers)
2. Use HTTP methods for actions
3. Return appropriate status codes
4. Stateless communication
5. Consistent URL structure`,
    contentType: 'markdown',
    estimatedTime: 20,
    tags: ['http', 'rest', 'api', 'web-development'],
  },
  {
    title: 'Git Branching Strategies',
    description: 'Learn best practices for Git branching including feature branches, Git Flow, and GitHub Flow.',
    category: 'reference',
    subject: 'Version Control',
    topics: ['Git', 'Branching', 'Collaboration'],
    difficulty: 'intermediate',
    content: `# Git Branching Strategies

Effective branching is crucial for team collaboration.

## Git Flow
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/***: New features
- **release/***: Release preparation
- **hotfix/***: Emergency fixes

## GitHub Flow (Simplified)
1. Create branch from main
2. Make changes and commit
3. Open pull request
4. Review and discuss
5. Merge to main

## Best Practices
- Keep branches short-lived
- Use descriptive branch names
- Commit often with clear messages
- Pull latest changes regularly
- Review before merging

## Common Commands
\`\`\`bash
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
\`\`\``,
    contentType: 'markdown',
    estimatedTime: 25,
    tags: ['git', 'version-control', 'collaboration'],
  },
  {
    title: 'Algorithm Complexity: Big O Notation',
    description: 'Understand time and space complexity analysis using Big O notation with practical examples.',
    category: 'tutorial',
    subject: 'Algorithms',
    topics: ['Big O', 'Complexity', 'Performance'],
    difficulty: 'advanced',
    content: `# Big O Notation

Big O notation describes the performance or complexity of an algorithm.

## Common Complexities

### O(1) - Constant
\`\`\`javascript
function getFirst(arr) {
  return arr[0];  // Always takes same time
}
\`\`\`

### O(n) - Linear
\`\`\`javascript
function findElement(arr, target) {
  for (let item of arr) {
    if (item === target) return true;
  }
  return false;
}
\`\`\`

### O(n²) - Quadratic
\`\`\`javascript
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
}
\`\`\`

### O(log n) - Logarithmic
\`\`\`javascript
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
\`\`\`

## Quick Reference
- O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)`,
    contentType: 'markdown',
    estimatedTime: 35,
    tags: ['algorithms', 'big-o', 'complexity', 'performance'],
  },
];

const seedLearningResources = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/theodoraq');
    console.log('Connected to MongoDB');

    // Find an admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Clear existing resources (optional - comment out if you want to keep existing)
    await LearningResource.deleteMany({});
    console.log('Cleared existing learning resources');

    // Add creator ID to each resource
    const resourcesWithCreator = sampleResources.map(resource => ({
      ...resource,
      createdBy: adminUser._id,
      isPublic: true,
    }));

    // Insert resources
    const result = await LearningResource.insertMany(resourcesWithCreator);
    console.log(`Successfully seeded ${result.length} learning resources`);

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding learning resources:', error);
    process.exit(1);
  }
};

// Run the seed function
seedLearningResources();

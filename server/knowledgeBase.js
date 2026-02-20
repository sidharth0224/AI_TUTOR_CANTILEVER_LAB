// ─── Knowledge Base ── Graph-Structured Placement Topics ───
// In-memory graph with adjacency list. Each node has a name, description,
// and list of subtopics. Supports runtime additions.

const knowledgeBase = {
  topics: {
    "mern-stack": {
      name: "MERN Stack",
      description: "MongoDB, Express.js, React, Node.js full-stack development",
      subtopics: [
        "MongoDB Schema Design",
        "Express.js Middleware",
        "React Hooks & State Management",
        "Node.js Event Loop",
        "REST API Design",
        "Authentication with JWT",
        "Deployment & DevOps"
      ]
    },
    "system-design": {
      name: "System Design",
      description: "Designing scalable, reliable, and efficient software systems",
      subtopics: [
        "Load Balancing",
        "Database Sharding",
        "Caching Strategies",
        "Microservices Architecture",
        "Message Queues",
        "CAP Theorem",
        "API Gateway Design"
      ]
    },
    "aptitude": {
      name: "Aptitude",
      description: "Quantitative aptitude, logical reasoning, and verbal ability for placements",
      subtopics: [
        "Probability & Permutations",
        "Time & Work Problems",
        "Profit & Loss",
        "Number Series",
        "Logical Puzzles",
        "Data Interpretation",
        "Verbal Reasoning"
      ]
    },
    "data-structures": {
      name: "Data Structures",
      description: "Core data structures used in coding interviews",
      subtopics: [
        "Arrays & Strings",
        "Linked Lists",
        "Stacks & Queues",
        "Trees & Binary Search Trees",
        "Graphs & Traversals",
        "Hash Maps",
        "Heaps & Priority Queues"
      ]
    },
    "oop": {
      name: "Object-Oriented Programming",
      description: "OOP principles and design patterns for interviews",
      subtopics: [
        "Encapsulation & Abstraction",
        "Inheritance & Polymorphism",
        "SOLID Principles",
        "Design Patterns (Singleton, Factory, Observer)",
        "UML Diagrams",
        "Composition vs Inheritance"
      ]
    },
    "dbms": {
      name: "Database Management Systems",
      description: "Relational databases, SQL, normalization, and transactions",
      subtopics: [
        "ER Diagrams",
        "Normalization (1NF–BCNF)",
        "SQL Queries & Joins",
        "Transactions & ACID",
        "Indexing & Optimization",
        "NoSQL vs SQL"
      ]
    },
    "os": {
      name: "Operating Systems",
      description: "OS concepts frequently asked in placement interviews",
      subtopics: [
        "Process Scheduling",
        "Memory Management",
        "Deadlocks",
        "Virtual Memory & Paging",
        "File Systems",
        "Threads & Concurrency"
      ]
    },
    "cn": {
      name: "Computer Networks",
      description: "Networking fundamentals and protocols for placements",
      subtopics: [
        "OSI & TCP/IP Models",
        "HTTP/HTTPS Protocol",
        "DNS & DHCP",
        "Subnetting & IP Addressing",
        "TCP vs UDP",
        "Network Security Basics"
      ]
    },
    "ml": {
      name: "Machine Learning & AI",
      description: "Machine learning algorithms, AI concepts, and data science for placements",
      subtopics: [
        "Decision Trees & Random Forest",
        "Linear & Logistic Regression",
        "Support Vector Machines (SVM)",
        "Neural Networks & Deep Learning",
        "K-Means Clustering",
        "K-Nearest Neighbors (KNN)",
        "Natural Language Processing (NLP)",
        "Model Evaluation & Metrics"
      ]
    }
  },

  // ─── Methods ───

  getAllTopics() {
    return Object.entries(this.topics).map(([id, topic]) => ({
      id,
      name: topic.name,
      description: topic.description,
      subtopics: topic.subtopics
    }));
  },

  getTopicNames() {
    return Object.values(this.topics).map(t => t.name);
  },

  getTopicById(id) {
    return this.topics[id] || null;
  },

  findTopicByName(name) {
    const lower = name.toLowerCase();
    return Object.entries(this.topics).find(
      ([, t]) => t.name.toLowerCase().includes(lower)
    )?.[1] || null;
  },

  addTopic(id, name, description, subtopics = []) {
    this.topics[id] = { name, description, subtopics };
    return this.topics[id];
  },

  addSubtopic(topicId, subtopic) {
    if (this.topics[topicId]) {
      this.topics[topicId].subtopics.push(subtopic);
      return true;
    }
    return false;
  },

  // Returns a flat string of all topics + subtopics for agent context
  toContextString() {
    return Object.values(this.topics)
      .map(t => `• ${t.name}: ${t.subtopics.join(", ")}`)
      .join("\n");
  }
};

export default knowledgeBase;

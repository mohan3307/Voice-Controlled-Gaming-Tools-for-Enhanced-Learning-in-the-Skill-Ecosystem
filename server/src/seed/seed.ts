import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Skill } from '../models/Skill';
import { Game } from '../models/Game';
import { Progress } from '../models/Progress';
import { AuditLog } from '../models/AuditLog';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voice-skill-ecosystem';

const getSubjectLevelTopic = (subject: string, level: number): string => {
  const pythonTopics = [
    "Variables & Assignment", "Numbers & Arithmetic", "Strings & Printing", "String Slicing", "User Input",
    "Boolean Expressions", "If Statements", "Else & Elif Logic", "Nested Conditions", "Logical Operators",
    "While Loops", "Infinite Loop safety", "For Loops", "Looping Ranges", "Break Statements",
    "Continue Statements", "Nested Loops", "List declarations", "List Indexing", "List mutations",
    "List slicing", "List operations", "Tuple declarations", "Tuple immutability", "Dictionary basics",
    "Dictionary lookups", "Dictionary mutations", "Set basics", "Set operations", "Function definitions",
    "Function arguments", "Keyword arguments", "Default values", "Return values", "Multiple returns",
    "Global vs Local Scope", "Lambda functions", "Map & Filter", "List Comprehensions", "Recursion basics",
    "Recursion base cases", "File opening", "File reading", "File writing", "File closing",
    "JSON parsing", "CSV handling", "Exception try-except", "Catching specific errors", "Finally blocks",
    "Raising exceptions", "Custom exceptions", "Class declarations", "Class constructors", "Self instance variables",
    "Class methods", "Static methods", "Class variables", "Object instantiation", "Object state changes",
    "String representation __str__", "Single Inheritance", "Multiple Inheritance", "Method overriding", "Super function",
    "Abstract classes", "Polymorphism", "Encapsulation private variables", "Getters & Setters", "Property decorators",
    "Operator overloading", "Iterators __iter__", "Generators & yield", "Decorators basics", "Advanced decorators",
    "Context managers with-statement", "Regular expressions re module", "Regex pattern matches", "Regex groups", "Datetime module",
    "Math module utilities", "Random choice generation", "Module imports", "Creating custom packages", "Namespace details",
    "Virtual environments", "PIP package manager", "Unit testing unittest", "Mocking unittest.mock", "Assert statement checks",
    "Debugging pdb module", "Logging basicConfig", "Logging levels", "File streams StringIO", "List performance deque",
    "Threads threading", "Multiprocessing pool", "Asyncio async-await", "Event loops", "Metaprogramming __new__"
  ];

  const javaTopics = [
    "JVM Architecture", "JDK vs JRE", "Data Types", "Primitive Variables", "Naming Conventions",
    "Operators", "If-Else Statements", "Switch Statements", "While Loops", "For Loops",
    "Do-While Loops", "Arrays", "Multi-dimensional Arrays", "String Pool", "String Methods",
    "StringBuilder & Buffer", "Class Definitions", "Object Creation", "Constructor Basics", "Method Overloading",
    "Encapsulation", "Access Modifiers", "Inheritance Basics", "Super Keyword", "Method Overriding",
    "Polymorphism", "Abstract Classes", "Interfaces", "Multiple Interfaces", "Static Keyword",
    "Final Keyword", "Packages", "Wrapper Classes", "Autoboxing", "Exception Basics",
    "Try-Catch Blocks", "Finally Block", "Throw vs Throws", "Custom Exceptions", "ArrayList",
    "LinkedList", "HashMap", "HashSet", "Iterator", "Generics Basics",
    "Generic Classes", "Comparable Interface", "Comparable Sort", "File Class", "FileReader",
    "FileWriter", "BufferedReader", "BufferedWriter", "Scanner Input", "System.out.format",
    "Stream API", "Lambda Expressions", "Functional Interfaces", "Optional Class", "Thread Class",
    "Runnable Interface", "Thread Synchronization", "Volatile Keyword", "ExecutorService", "Callable & Future",
    "Serialization", "Deserialization", "Transient Keyword", "Reflection API", "Annotations",
    "JDBC Drivers", "DriverManager Connection", "Statement execution", "PreparedStatement", "ResultSet parsing",
    "Maven Basics", "Gradle Basics", "JUnit Testing", "Assertions JUnit", "Mocking Mockito",
    "Garbage Collection", "Heap vs Stack Memory", "StringTokenizer", "Enum Types", "Math Class",
    "Random Class", "Date & Calendar", "LocalDateTime", "DateTimeFormatter", "Locale Class",
    "Vector Class", "Stack Class", "Hashtable", "Properties Class", "BigDecimal Math",
    "BigInteger Math", "Records (Java 16)", "Sealed Classes", "Pattern Matching", "System Properties"
  ];

  const htmlTopics = [
    "HTML5 Doctype", "HTML Document structure", "Head Meta Tags", "Page Titles", "Heading Tags h1-h6",
    "Paragraph tag p", "Div block wrappers", "Span inline wrappers", "Line breaks br", "Horizontal rules hr",
    "Anchor href links", "Absolute vs Relative paths", "Target Blank attributes", "Image src tags", "Image alt parameters",
    "Image width & height", "Audio elements", "Video elements", "Unordered lists ul", "Ordered lists ol",
    "List items li", "Description lists dl", "Tables structure", "Table rows tr", "Table headers th",
    "Table cells td", "Colspan & Rowspan", "Form elements", "Input types text", "Input types password",
    "Input types submit", "Input types email", "Input types number", "Input types date", "Radio buttons",
    "Checkboxes", "Textarea inputs", "Select option lists", "Labels for inputs", "Placeholder parameters",
    "Required validation", "Min & Max parameters", "Pattern regex validations", "Form action attributes", "Form method POST/GET",
    "Fieldset & Legend", "Button elements", "Semantic headers", "Semantic navs", "Semantic main",
    "Semantic footers", "Semantic articles", "Semantic sections", "Semantic asides", "Figure & Figcaption",
    "Iframe embeds", "Details & Summary", "Progress bars", "Meter bars", "Data lists",
    "Embed elements", "Object elements", "HTML Entities symbols", "Comments in HTML", "Blockquotes",
    "Preformatted text pre", "Code snippet codes", "Abbreviation tags", "Strong & Emphasis tags", "Subscript & Superscript",
    "Mark tag highlights", "Time elements", "Address elements", "Canvas drawings", "SVG graphics inline",
    "Map & Area tags", "Script tag imports", "Style tag headers", "Link stylesheet hrefs", "No script fallbacks",
    "Favicon link settings", "Base path configurations", "Responsive meta viewport", "Char set UTF8", "Lang attributes HTML",
    "Custom data attributes", "Autofocus parameters", "Autocomplete settings", "Readonly vs Disabled", "Tabindex order layout"
  ];

  const dsTopics = [
    "Array memory layouts", "Static Arrays", "Dynamic Arrays", "Array Search O(n)", "Binary Search O(log n)",
    "Singly Linked Lists", "Doubly Linked Lists", "Circular Linked Lists", "Linked List insert", "Linked List delete",
    "Stack LIFO structures", "Stack Push/Pop O(1)", "Stack Peek O(1)", "Queue FIFO structures", "Queue Enqueue/Dequeue",
    "Circular Queues", "Double Ended Queues", "Priority Queues", "Hashing Basics", "Hash Functions",
    "Collision Resolution", "Chaining vs Open Addressing", "Hash Map lookups", "Set operations", "Binary Tree definitions",
    "Binary Tree traversals", "Inorder traversal BST", "Preorder traversal BST", "Postorder traversal BST", "Levelorder traversal BFS",
    "Binary Search Trees", "BST node insertion", "BST node deletion", "BST min & max search", "AVL Trees balance",
    "AVL rotations", "Red Black Trees", "B-Trees", "B+ Trees", "Min Heap properties",
    "Max Heap properties", "Heapify algorithms", "Heap Insert/Delete", "Priority Queue Heap", "Trie prefix structures",
    "Trie Node search", "Segment Trees", "Fenwick Trees", "Disjoint Set DS", "Union Find algorithms",
    "Graph definitions", "Adjacency Matrix", "Adjacency List", "Breadth First Search BFS", "Depth First Search DFS",
    "Topological Sorting", "Dijkstra Shortest Path", "Bellman Ford Algorithm", "Floyd Warshall Algorithm", "Kruskal Minimum Spanning",
    "Prim Minimum Spanning", "Tarjan Strongly Connected", "Kosaraju Algorithm", "Eulerian Paths", "Hamiltonian Cycles",
    "Suffix Trees", "Sparse Tables", "Suffix Arrays", "Monotonic Stacks", "Monotonic Queues",
    "Cache LRU structures", "Cache LFU structures", "Skip Lists", "Bloom Filters", "Interval Trees",
    "KD-Trees", "Quad-Trees", "R-Trees", "Fenwick 2D Trees", "Treap structures",
    "Splay Trees", "Ternary Search Trees", "Fenwick Indexing", "Binary Index Trees", "Graph coloring",
    "Maximum Flow Network", "Ford-Fulkerson algorithm", "Edmonds-Karp algorithm", "Bipartite Matching", "A* Search algorithm",
    "Huffman coding trees", "Suffix Automata", "Heavy Light Decomposition", "Centroid Decomposition", "PageRank Algorithm"
  ];

  const mlTopics = [
    "Supervised learning definitions", "Unsupervised learning definitions", "Reinforcement learning basics", "Features vs Labels", "Train Test splitting",
    "Cross Validation kfold", "Overfitting vs Underfitting", "Bias Variance tradeoff", "Linear Regression", "Gradient Descent solver",
    "Cost Function optimization", "Mean Squared Error MSE", "R-squared evaluation", "Logistic Regression", "Sigmoid activation",
    "Binary Classification metrics", "Confusion Matrix precision", "Recall & F1 score", "ROC AUC curves", "Decision Tree classifiers",
    "Entropy information gain", "Gini Impurity metrics", "Random Forest ensembles", "Bagging vs Boosting", "AdaBoost algorithms",
    "Gradient Boosting Machines", "XGBoost classifier", "LightGBM models", "Support Vector Machines", "Kernel Trick SVM",
    "Hyperplane margin boundaries", "K-Nearest Neighbors KNN", "Distance metrics Euclidean", "Naive Bayes classifiers", "Bayes Theorem probability",
    "K-Means clustering", "Elbow Method clustering", "Hierarchical clustering", "Dendrogram analysis", "DBSCAN clustering",
    "Principal Component PCA", "Dimensionality Reduction", "t-SNE visualization", "Anomaly Detection", "Recommender Systems Collaborative",
    "Content-Based filtering", "Matrix Factorization SVD", "Neural Network Perceptron", "Weights & Biases", "Feedforward calculations",
    "Backpropagation algorithms", "Activation function ReLU", "Activation function Softmax", "Loss Function CrossEntropy", "Optimizer Adam",
    "Optimizer SGD", "Learning Rate schedules", "Dropout regularization", "Batch Normalization layers", "Convolutional Neural CNN",
    "Kernel filters padding", "Max Pooling layers", "ResNet architecture", "Recurrent Neural RNN", "LSTM gates memory",
    "GRU neural networks", "Word Embeddings Word2Vec", "Transformer models self-attention", "BERT architecture", "GPT models generative",
    "Generative Adversarial GANs", "Generator vs Discriminator", "Autoencoders", "Variational Autoencoders VAE", "Object Detection YOLO",
    "Bounding box metrics", "Semantic Segmentation U-Net", "Q-Learning basics", "Deep Q-Networks DQN", "Policy Gradient methods",
    "Model Deployment APIs", "Docker containerization ML", "MLflow tracking", "Model Monitoring drift", "Data Augmentation",
    "Transfer Learning", "Feature Engineering scaling", "One-Hot Encoding", "Imputing missing values", "TF-IDF vectorizers"
  ];

  const englishTopics = [
    "Nouns classification", "Pronouns usage", "Verbs action states", "Adjectives descriptive", "Adverbs modifier",
    "Prepositions spatial", "Conjunctions linking", "Interjections expressions", "Subject-Verb agreement", "Present Simple tense",
    "Present Continuous", "Present Perfect", "Present Perfect Continuous", "Past Simple tense", "Past Continuous",
    "Past Perfect", "Past Perfect Continuous", "Future Simple tense", "Future Continuous", "Future Perfect",
    "Future Perfect Continuous", "Active voice structure", "Passive voice structure", "Direct speech reports", "Indirect speech reports",
    "Conditional Type 0", "Conditional Type 1", "Conditional Type 2", "Conditional Type 3", "Mixed Conditionals",
    "Relative Clauses defining", "Relative Clauses nondefining", "Gerunds vs Infinitives", "Modal Verbs permission", "Modal Verbs obligation",
    "Modal Verbs probability", "Determiners & Articles", "Quantifiers much/many", "Comparative Adjectives", "Superlative Adjectives",
    "Adverbial clauses", "Noun clauses", "Prepositional phrases", "Phrasal Verbs idiomatic", "Collocations common", "Question Tags check",
    "Indirect Questions polite", "Embedded Questions", "Passive reporting verbs", "Inversion for emphasis", "Cleft Sentences focus",
    "Subjunctive Mood wish", "Concession clauses although", "Purpose clauses so-that", "Result clauses such-that", "Defining synonyms",
    "Antonyms contrasts", "Homophones sound-alikes", "Homographs write-alikes", "Idiomatic expressions", "Metaphors & Similes",
    "Linking words transitions", "Paragraph structure cohesion", "Formal letter writing", "Email etiquette professional", "Essay writing thesis",
    "Summarizing key details", "Paraphrasing expressions", "Reading skimming tactics", "Reading scanning details", "Listening context clues",
    "Greeting clients politely", "Self-introduction formats", "Asking for directions", "Making polite requests", "Telephonic conversations etiquette",
    "Negotiating terms business", "Presenting sales pitches", "Handling customer complaints", "Intercultural communications", "Giving verbal feedback",
    "Conducting team meetings", "Debating opinions politely", "Expressing agreements", "Expressing respectful disagreement", "Apologizing professionally",
    "Describing charts visuals", "Storytelling frameworks", "Job Interview preparation", "Answering behavior questions", "Making small talk",
    "Expressing future goals", "Describing past experience", "Talking about hobbies", "Giving instructions verbally", "Closing deals business"
  ];

  if (subject === 'Python') return pythonTopics[(level - 1) % pythonTopics.length];
  if (subject === 'Java') return javaTopics[(level - 1) % javaTopics.length];
  if (subject === 'HTML') return htmlTopics[(level - 1) % htmlTopics.length];
  if (subject === 'DataStructures') return dsTopics[(level - 1) % dsTopics.length];
  if (subject === 'MachineLearning') return mlTopics[(level - 1) % mlTopics.length];
  return englishTopics[(level - 1) % englishTopics.length];
};

const getSubjectQuizPrompt = (subject: string, level: number, qNum: number): string => {
  const topic = getSubjectLevelTopic(subject, level);
  if (qNum === 1) return `In ${subject} development, which statement best defines the correct setup for "${topic}"?`;
  if (qNum === 2) return `What is a highly recommended best practice when implementing "${topic}" in ${subject}?`;
  return `Which of the following describes a typical error when utilizing "${topic}" in ${subject}?`;
};

const getSubjectQuizOptions = (subject: string, level: number, qNum: number): string[] => {
  const topic = getSubjectLevelTopic(subject, level);
  if (qNum === 1) {
    return [
      `Standard compliant syntax for ${topic} in ${subject}`,
      `Using incorrect legacy brackets for ${topic}`,
      `Writing loose unformatted code for ${topic}`,
      `Importing outdated third-party script for ${topic}`
    ];
  }
  if (qNum === 2) {
    return [
      `Maintain clean encapsulation boundary for ${topic}`,
      `Expose all internal parameters globally for ${topic}`,
      `Bypass testing steps entirely for ${topic}`,
      `Rely on manual memory leak releases for ${topic}`
    ];
  }
  return [
    `Compilation failure or null reference for ${topic}`,
    `Incorrect background colors when displaying ${topic}`,
    `CSS margins spacing misalignment for ${topic}`,
    `Broken link redirects to remote ports for ${topic}`
  ];
};

const getSubjectBuggyCode = (subject: string, level: number, cNum: number): string => {
  const topic = getSubjectLevelTopic(subject, level);
  return `// ${subject} Level ${level}\n// Topic: ${topic}\nx = 10\n// fix line\nreturn x`;
};

const getSubjectBuggyLine = (subject: string, level: number, cNum: number): string => {
  return '// fix line';
};

const getSubjectCorrectLine = (subject: string, level: number, cNum: number): string => {
  const topic = getSubjectLevelTopic(subject, level);
  return `x = x + ${level} // solved ${topic}`;
};

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected. Cleaning tables...');

    // Clear old data
    await User.deleteMany({});
    await Skill.deleteMany({});
    await Game.deleteMany({});
    await Progress.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Inserting default user seeds...');
    const student = new User({
      username: 'alex_learner',
      email: 'student@skills.edu',
      password: 'password123',
      role: 'Student',
      xp: 0,
      level: 1,
      streakCount: 1,
      consentToVoiceProcess: true
    });

    const instructor = new User({
      username: 'prof_oak',
      email: 'instructor@skills.edu',
      password: 'password123',
      role: 'Instructor',
      consentToVoiceProcess: true
    });

    const admin = new User({
      username: 'sys_admin',
      email: 'admin@skills.edu',
      password: 'password123',
      role: 'Admin',
      consentToVoiceProcess: true
    });

    await student.save();
    await instructor.save();
    await admin.save();

    const subjects = [
      { name: 'Python', category: 'Python' },
      { name: 'Java', category: 'Java' },
      { name: 'HTML', category: 'HTML' },
      { name: 'DataStructures', category: 'DataStructures' },
      { name: 'MachineLearning', category: 'MachineLearning' },
      { name: 'English', category: 'English' }
    ];

    const skillsToInsert: any[] = [];
    const gamesToInsert: any[] = [];

    console.log('Generating 100 levels dynamically for all 6 subjects...');

    for (const sub of subjects) {
      let prevSkillId: mongoose.Types.ObjectId | null = null;
      for (let i = 1; i <= 100; i++) {
        const skillId = new mongoose.Types.ObjectId();
        const quizGameId = new mongoose.Types.ObjectId();
        const combatGameId = new mongoose.Types.ObjectId();
        const topic = getSubjectLevelTopic(sub.name, i);
        const skillName = `${sub.name} Level ${i}: ${topic}`;
        const slug = `${sub.name.toLowerCase()}-level-${i}`;

        skillsToInsert.push({
          _id: skillId,
          name: skillName,
          slug,
          description: `Learn how to implement and optimize ${topic} within ${sub.name} systems.`,
          category: sub.category,
          levelNeeded: Math.ceil(i / 10),
          prerequisites: prevSkillId ? [prevSkillId] : [],
          badgeAwarded: {
            title: `${sub.name} Level ${i} Crest`,
            icon: 'Award',
            description: `Mastered ${topic} at ${sub.name} Level ${i}.`
          }
        });

        // Add Quiz
        gamesToInsert.push({
          _id: quizGameId,
          title: `${sub.name} Level ${i} Concept Quiz`,
          description: `Verify your conceptual understanding of ${topic} at ${sub.name} Level ${i}.`,
          skillAssociated: skillId,
          gameType: 'Quiz',
          questions: [
            {
              prompt: getSubjectQuizPrompt(sub.name, i, 1),
              options: getSubjectQuizOptions(sub.name, i, 1),
              correctAnswer: getSubjectQuizOptions(sub.name, i, 1)[0],
              hint: `Focus on ${topic} syntax.`
            },
            {
              prompt: getSubjectQuizPrompt(sub.name, i, 2),
              options: getSubjectQuizOptions(sub.name, i, 2),
              correctAnswer: getSubjectQuizOptions(sub.name, i, 2)[0],
              hint: `Focus on ${topic} rules.`
            },
            {
              prompt: getSubjectQuizPrompt(sub.name, i, 3),
              options: getSubjectQuizOptions(sub.name, i, 3),
              correctAnswer: getSubjectQuizOptions(sub.name, i, 3)[0],
              hint: `Focus on ${topic} best practices.`
            }
          ]
        });

        // Add CodingBattle or VoiceQuest
        if (sub.name === 'English' || sub.name === 'MachineLearning') {
          gamesToInsert.push({
            _id: combatGameId,
            title: `${sub.name} Level ${i} Adventure Quest`,
            description: `Solve verbal simulation problems for ${topic} at ${sub.name} Level ${i}.`,
            skillAssociated: skillId,
            gameType: 'VoiceQuest',
            questStages: [
              {
                stageId: 'start',
                dialogue: `You are at the ${topic} node. Speak move to left child to confirm setup or move to right child to review.`,
                options: [
                  { commandText: 'move to left child', targetStageId: 'shutdown_db', xpGained: 50 },
                  { commandText: 'move to right child', targetStageId: 'fetch_logs', xpGained: 50 }
                ]
              },
              {
                stageId: 'shutdown_db',
                dialogue: `Configuring ${topic} parameters. Speak engage backup mode to save setup.`,
                options: [{ commandText: 'engage backup mode', targetStageId: 'victory_lock', xpGained: 50 }]
              },
              {
                stageId: 'fetch_logs',
                dialogue: `Inspecting ${topic} records. Speak reboot router ports to proceed.`,
                options: [{ commandText: 'reboot router ports', targetStageId: 'victory_lock', xpGained: 50 }]
              },
              {
                stageId: 'victory_lock',
                dialogue: 'Validation complete! Speak submit quest answer to complete this level.',
                options: [{ commandText: 'submit quest answer', targetStageId: 'finish_quest', xpGained: 50 }]
              }
            ]
          });
        } else {
          gamesToInsert.push({
            _id: combatGameId,
            title: `${sub.name} Level ${i} Practical Battle`,
            description: `Fix logical errors and syntax compiler bugs for ${topic} at ${sub.name} Level ${i}.`,
            skillAssociated: skillId,
            gameType: 'CodingBattle',
            codingChallenges: [
              {
                title: `Challenge 1: ${topic} Setup`,
                instructions: `Fix compiler lines for ${topic}.`,
                buggyCode: getSubjectBuggyCode(sub.name, i, 1),
                correctLineIndex: 3,
                buggyLine: getSubjectBuggyLine(sub.name, i, 1),
                correctLine: getSubjectCorrectLine(sub.name, i, 1),
                language: sub.name.toLowerCase(),
                hints: [`Fix code line at Level ${i}.`]
              },
              {
                title: `Challenge 2: ${topic} Logic`,
                instructions: `Correct logic constraints for ${topic}.`,
                buggyCode: getSubjectBuggyCode(sub.name, i, 2),
                correctLineIndex: 3,
                buggyLine: getSubjectBuggyLine(sub.name, i, 2),
                correctLine: getSubjectCorrectLine(sub.name, i, 2),
                language: sub.name.toLowerCase(),
                hints: [`Fix logic syntax.`]
              },
              {
                title: `Challenge 3: ${topic} Output`,
                instructions: `Verify return parameters for ${topic}.`,
                buggyCode: getSubjectBuggyCode(sub.name, i, 3),
                correctLineIndex: 3,
                buggyLine: getSubjectBuggyLine(sub.name, i, 3),
                correctLine: getSubjectCorrectLine(sub.name, i, 3),
                language: sub.name.toLowerCase(),
                hints: [`Verify return types.`]
              }
            ]
          });
        }

        prevSkillId = skillId;
      }
    }

    console.log(`Bulk inserting ${skillsToInsert.length} Skill nodes...`);
    await Skill.insertMany(skillsToInsert);
    console.log(`Bulk inserting ${gamesToInsert.length} Game modules...`);
    await Game.insertMany(gamesToInsert);

    console.log('Success! Dynamically seeded 100 progressive levels for Python, Java, HTML, DS, ML, and English successfully in bulk.');
    process.exit(0);
  } catch (err) {
    console.error('Error during database seeding:', err);
    process.exit(1);
  }
};

seedData();

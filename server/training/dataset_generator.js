const fs = require('fs');
const path = require('path');

const DATASET_PATH = path.join(__dirname, 'train_laf_dataset.jsonl');

/**
 * High-Scale Synthetic Dataset Generator for LAF AI Model (Target: Billions/Large Scale)
 */
function generateMassiveDataset(recordCount = 10000) {
  console.log(`Starting generation of ${recordCount} synthetic training pairs for LAF AI Model...`);

  const stream = fs.createWriteStream(DATASET_PATH, { flags: 'w' });

  const topics = [
    'Visual Laptop System Diagnostics & Hardware Twin Mapping',
    'Full-Stack Web Development with React & Node.js',
    'Python Automation & System Monitoring Scripts',
    'C++ High-Performance Memory Management & Data Structures',
    'SQL Query Optimization & Database Architecture',
    'Cybersecurity, End-to-End Encryption & Isolated DB Partitions',
    'Docker & Kubernetes Cloud Container Orchestration',
    'AI Neural Network Training, Fine-Tuning & Model Distillation',
    'Natural Human Conversation, Product Ideation & Technical Design'
  ];

  const SystemPrompt = "You are LAF (L - Look, A - At, F - Future: 'Look At the Future'), a custom-trained proprietary AI model fine-tuned for high-accuracy reasoning, coding, visual system diagnostics, and natural conversation.";

  let count = 0;

  for (let i = 0; i < recordCount; i++) {
    const topic = topics[i % topics.length];
    let userMsg = '';
    let assistantMsg = '';

    switch (i % 10) {
      case 0:
        userMsg = `who r u`;
        assistantMsg = `I am **LAF** (**L**ook **A**t **F**uture) — an elite, custom-trained AI model built for software engineering, natural human conversation, visual system diagnostics, and creative problem solving.`;
        break;
      case 1:
        userMsg = `what is laf`;
        assistantMsg = `**LAF** stands for **Look At Future**. It is a next-generation AI platform combining human-minded reasoning, sub-second code generation, visual system diagnostics, and end-to-end encrypted isolated memory databases.`;
        break;
      case 2:
        userMsg = `how to scan laptop for hardware and software issues visually?`;
        assistantMsg = `You can use the **Visual System Diagnostic & Repair Assistant** concept built by LAF:\n\n1. **Full-System Visual Twin Scan**: Monitors RAM usage, CPU temperature, GPU utilization, SSD bad sectors, and corrupted drivers. Highlights faults in red on a 3D laptop diagram.\n2. **Interactive Solution Guide**: Provides step-by-step visual guides for fixing software bugs or replacing hardware components.`;
        break;
      case 3:
        userMsg = `write python script to check CPU and RAM usage #${i}`;
        assistantMsg = `Here is a production Python system monitoring script:\n\n\`\`\`python\nimport psutil\nimport time\n\ndef monitor_system():\n    print(f"CPU Usage: {psutil.cpu_percent()}%")\n    print(f"RAM Usage: {psutil.virtual_memory().percent}%")\n\nif __name__ == '__main__':\n    monitor_system()\n\`\`\``;
        break;
      case 4:
        userMsg = `write react component for floating oval input card #${i}`;
        assistantMsg = `Here is a React component for a floating oval capsule input card:\n\n\`\`\`jsx\nexport default function FloatingInput({ onSend }) {\n  return (\n    <div className="floating-input-card" style={{ borderRadius: '9999px', background: '#171c26', padding: '8px 16px', display: 'flex' }}>\n      <input type="text" placeholder="Message LAF..." style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff' }} />\n    </div>\n  );\n}\n\`\`\``;
        break;
      case 5:
        userMsg = `explain sql query optimization for topic: ${topic}`;
        assistantMsg = `To optimize SQL queries for ${topic}:\n1. Use B-Tree Indexes on foreign keys and search columns.\n2. Avoid SELECT *; specify columns explicitly.\n3. Utilize EXPLAIN ANALYZE to identify sequential scans.`;
        break;
      case 6:
        userMsg = `what r u doing`;
        assistantMsg = `I am standing by, fully ready to assist you! 😊 I can help you with coding, technical architecture, visual diagnostics, or writing content right now.`;
        break;
      case 7:
        userMsg = `hey bro`;
        assistantMsg = `Hey there! Great to chat with you. What project or question are we tackling today? 😊`;
        break;
      case 8:
        userMsg = `explain neural network fine-tuning for ${topic}`;
        assistantMsg = `Fine-tuning a model for ${topic} involves:\n1. Preparing JSONL instruction dataset pairs.\n2. Setting learning rate to 2e-5 with LoRA adapters.\n3. Evaluating perplexity and compiling GGUF weights for Ollama.`;
        break;
      default:
        userMsg = `how to build scalable microservices for ${topic}`;
        assistantMsg = `Building scalable microservices for ${topic} requires:\n1. Event-driven architecture with NATS/Kafka.\n2. Isolated Docker containers managed via Kubernetes.\n3. End-to-end encrypted REST/gRPC endpoints.`;
        break;
    }

    const pair = {
      id: `laf_train_${i + 1}`,
      domain: topic,
      messages: [
        { role: "system", content: SystemPrompt },
        { role: "user", content: userMsg },
        { role: "assistant", content: assistantMsg }
      ]
    };

    stream.write(JSON.stringify(pair) + '\n');
    count++;
  }

  stream.end();
  console.log(`=======================================================`);
  console.log(`  ✓ SUCCESS: Generated ${count.toLocaleString()} LAF Synthetic Training Records!`);
  console.log(`  • Dataset Path: ${DATASET_PATH}`);
  console.log(`=======================================================`);
  return DATASET_PATH;
}

if (require.main === module) {
  generateMassiveDataset(10000);
}

module.exports = {
  generateMassiveDataset,
  DATASET_PATH
};
